from __future__ import annotations

import base64
import json
import os
import socket
import threading
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from html import escape

from dotenv import load_dotenv
from flask import Flask, Response, request

try:
    from pymongo import MongoClient
except Exception:
    MongoClient = None

# Load environment variables from .env file.
# By default python-dotenv looks in the current working directory, which can be
# different depending on how the script is launched. Prefer the .env sitting next
# to this file if present.
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_DOTENV_PATH = os.path.join(_SCRIPT_DIR, ".env")
if os.path.exists(_DOTENV_PATH):
    load_dotenv(dotenv_path=_DOTENV_PATH, override=False)
else:
    load_dotenv(override=False)

API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
TWILIO_MESSAGES_API = "https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
DEFAULT_MODEL = "gemini-2.5-flash"
DEFAULT_FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]
MODEL_ALIASES = {
    "gemini 3 flash live": "gemini-3-flash-live",
    "gemma 4 31b": "gemma-4-31b-it",
    "gemma-4-31b": "gemma-4-31b-it",
}
DEPRECATED_MODEL_MAP = {
    "gemini-1.5-pro": "gemini-1.5-flash",
}
MAX_BINARY_ATTACHMENT_BYTES = 12 * 1024 * 1024
MAX_HISTORY_MESSAGES = 12
MAX_TEXT_ATTACHMENT_CHARS = 20000
MAX_TWILIO_MESSAGE_CHARS = 1500

# Twilio expects a webhook response within ~15 seconds.
try:
    WEBHOOK_AI_TIMEOUT_SECONDS = int(os.getenv("WEBHOOK_AI_TIMEOUT_SECONDS", "12"))
except ValueError:
    WEBHOOK_AI_TIMEOUT_SECONDS = 12

app = Flask(__name__)
CHAT_HISTORY: dict[str, list[dict]] = defaultdict(list)
HISTORY_LOCK = threading.Lock()
MENU_SHOWN: set[str] = set()
MENU_LOCK = threading.Lock()


def fetch_products_from_db(limit: int = 10) -> tuple[bool, str]:
    if MongoClient is None:
        return False, "Database client is not available (pymongo not installed)."

    mongo_uri = os.getenv("MONGODB_URI", "").strip()
    mongo_db = os.getenv("MONGODB_DB", "").strip()
    if not mongo_uri or not mongo_db:
        return False, "Database is not configured. Set MONGODB_URI and MONGODB_DB."

    # Access is restricted to this collection only.
    collection_name = "products"

    client = None
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=8000)
        db = client[mongo_db]
        collection = db[collection_name]

        docs = list(
            collection.find(
                {},
                {
                    "_id": 0,
                    "name": 1,
                    "title": 1,
                    "product_name": 1,
                    "price": 1,
                    "mrp": 1,
                    "size": 1,
                    "flavour": 1,
                    "flavor": 1,
                    "description": 1,
                    "stock": 1,
                    "available": 1,
                    "isActive": 1,
                },
            ).limit(max(1, min(limit, 20)))
        )

        if not docs:
            return True, "No products found in database."

        lines: list[str] = ["Available products:"]
        for idx, item in enumerate(docs, start=1):
            name = (
                item.get("name")
                or item.get("title")
                or item.get("product_name")
                or f"Product {idx}"
            )

            price = item.get("price")
            mrp = item.get("mrp")
            size = item.get("size")
            flavor = item.get("flavour") or item.get("flavor")

            parts = [str(name)]
            if flavor:
                parts.append(f"flavour: {flavor}")
            if size:
                parts.append(f"size: {size}")
            if price is not None:
                parts.append(f"price: {price}")
            elif mrp is not None:
                parts.append(f"price: {mrp}")

            lines.append(f"{idx}. " + " | ".join(parts))

        if len(docs) >= 10:
            lines.append("Reply with the product name for more details.")

        return True, "\n".join(lines)
    except Exception as exc:
        return False, f"Database error while reading products: {type(exc).__name__}"
    finally:
        if client is not None:
            try:
                client.close()
            except Exception:
                pass


def build_empty_twiml_response() -> Response:
    xml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
    return Response(xml, mimetype="text/xml")


def build_twiml_message(text: str) -> Response:
    safe_text = escape(clamp_message(text))
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<Response><Message>{safe_text}</Message></Response>"
    )
    # Twilio's docs refer to "text/xml"; some integrations can be picky.
    return Response(xml, mimetype="text/xml")


def clamp_message(text: str) -> str:
    clean = (text or "").strip()
    if not clean:
        return "[Empty response from AI.]"
    if len(clean) <= MAX_TWILIO_MESSAGE_CHARS:
        return clean
    return clean[: MAX_TWILIO_MESSAGE_CHARS - 25] + "\n\n[Response truncated]"


def normalize_whatsapp_address(value: str) -> str:
    clean = (value or "").strip()
    if not clean:
        return ""
    if clean.startswith("whatsapp:"):
        return clean
    # Allow users to configure +E164 numbers without the whatsapp: prefix.
    if clean.startswith("+") or clean[:1].isdigit():
        return f"whatsapp:{clean}"
    return clean


def extract_text(response_json: dict) -> str:
    candidates = response_json.get("candidates", [])
    if not candidates:
        feedback = response_json.get("promptFeedback", {})
        reason = feedback.get("blockReason")
        if reason:
            return f"[No response: blocked by API policy ({reason}).]"
        return "[No response received from model.]"

    content = candidates[0].get("content", {})
    parts = content.get("parts", [])
    texts = [part.get("text", "") for part in parts if part.get("text")]
    return "\n".join(texts).strip() or "[Empty response from model.]"


def normalize_mime_type(media_content_type: str) -> str:
    return (media_content_type or "application/octet-stream").split(";")[0].strip().lower()


def choose_default_prompt(media_types: list[str]) -> str:
    if any(t.startswith("audio/") for t in media_types):
        return (
            "You received a voice note. Transcribe it silently, then reply as a chat assistant. "
            "Do NOT include the transcription, analysis, headings, or bullet points unless the user explicitly asks. "
            "Never use placeholders like [Your Name]; answer directly. "
            "Reply in the same language as the speaker and keep it concise."
        )
    if any(t.startswith("image/") for t in media_types):
        return (
            "You received an image. If it contains text, read it. Reply as a chat assistant with the useful answer. "
            "Do NOT describe your step-by-step analysis. "
            "If the user didn't ask a question, give a one-sentence summary and ask what they want to know."
        )
    if any(t == "application/pdf" for t in media_types):
        return (
            "You received a PDF. Read it and answer as a chat assistant. "
            "Do NOT include long analysis; provide the final answer and ask a brief follow-up question if needed."
        )
    return (
        "You received an attachment. Reply as a chat assistant with the useful answer. "
        "Avoid long analysis; provide the final response."
    )


def normalize_model_name(model_name: str) -> str:
    raw = (model_name or "").strip()
    if not raw:
        return ""

    key = raw.lower()
    if key in MODEL_ALIASES:
        return MODEL_ALIASES[key]

    # Normalize common user-entered formatting variants.
    normalized = key.replace("_", "-").replace(" ", "-")
    if normalized in DEPRECATED_MODEL_MAP:
        replacement = DEPRECATED_MODEL_MAP[normalized]
        print(f"Model {raw} is deprecated; using {replacement}.")
        return replacement

    return normalized


def get_model_candidates(primary_model: str) -> list[str]:
    env_models_raw = os.getenv("GEMINI_FALLBACK_MODELS", "")
    env_models = [m.strip() for m in env_models_raw.split(",") if m.strip()]
    ordered: list[str] = []
    for candidate in [primary_model, *env_models, *DEFAULT_FALLBACK_MODELS]:
        normalized = normalize_model_name(candidate)
        if normalized and normalized not in ordered:
            ordered.append(normalized)
    return ordered


def is_rate_limit_error(status_code: int, body_text: str) -> bool:
    if status_code == 429:
        return True
    lowered = (body_text or "").lower()
    markers = ("rate", "quota", "resource_exhausted", "too many requests")
    return any(marker in lowered for marker in markers)


def should_fallback_to_next_model(status_code: int, body_text: str) -> bool:
    if is_rate_limit_error(status_code, body_text):
        return True

    lowered = (body_text or "").lower()
    if any(marker in lowered for marker in ("api key not valid", "permission denied", "unauthorized")):
        return False

    # Some models may not support certain modalities (audio/video/image) or mime
    # types. In those cases, trying a compatible model often resolves it.
    if status_code in (400, 404, 409, 415, 422, 501):
        markers = (
            "does not support",
            "not supported",
            "unsupported",
            "mime",
            "mimetype",
            "inline",
            "invalid argument",
            "model",
            "not found",
        )
        return any(marker in lowered for marker in markers)

    # Transient server failures: try next model.
    if status_code in (500, 503):
        return True

    return False


def call_gemini_once(history: list[dict], api_key: str, model: str, timeout: int) -> tuple[bool, str, bool]:
    url = API_BASE.format(model=model, api_key=api_key)
    payload = {
        "contents": history,
        "generationConfig": {
            "temperature": 0.6,
            "maxOutputTokens": 1024,
        },
    }

    req = urllib.request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
        return True, extract_text(data), False
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return False, f"HTTP {exc.code}: {body}", should_fallback_to_next_model(exc.code, body)
    except urllib.error.URLError as exc:
        # urllib sometimes wraps socket timeouts in URLError.
        reason = exc.reason
        if isinstance(reason, TimeoutError):
            return False, "Network timeout contacting Gemini API.", False
        return False, "Network error contacting Gemini API.", False
    except TimeoutError:
        return False, "Network timeout contacting Gemini API.", False
    except socket.timeout:
        return False, "Network timeout contacting Gemini API.", False
    except json.JSONDecodeError:
        return False, "Failed to parse Gemini response as JSON.", False
    except Exception:
        # Avoid leaking request URLs (which contain the API key).
        return False, "Unexpected error calling Gemini API.", False


def call_gemini(history: list[dict], api_key: str, model: str, timeout: int = 60) -> tuple[bool, str]:
    models = get_model_candidates(model)
    last_error = "Unknown Gemini error."

    for index, candidate in enumerate(models):
        ok, message, retry_next_model = call_gemini_once(
            history=history, api_key=api_key, model=candidate, timeout=timeout
        )
        if ok:
            return True, message

        last_error = f"{candidate}: {message}"
        if retry_next_model and index < len(models) - 1:
            print(f"Model {candidate} failed; trying {models[index + 1]}...")
            continue

        return False, last_error

    return False, last_error


def send_twilio_message(to_number: str, body: str, sid: str, token: str, from_number: str) -> tuple[bool, str]:
    to_number = normalize_whatsapp_address(to_number)
    messaging_service_sid = os.getenv("TWILIO_MESSAGING_SERVICE_SID", "").strip()
    from_number = normalize_whatsapp_address(from_number)

    # WhatsApp messages are most reliable when sent with an explicit WhatsApp
    # From address (and many accounts don't have WhatsApp-enabled messaging
    # services configured). Prefer From for WhatsApp.
    if to_number.startswith("whatsapp:") or from_number.startswith("whatsapp:"):
        messaging_service_sid = ""

    auth = base64.b64encode(f"{sid}:{token}".encode("utf-8")).decode("ascii")
    def _try_send(payload_dict: dict[str, str]) -> tuple[bool, str]:
        payload = urllib.parse.urlencode(payload_dict).encode("utf-8")
        req = urllib.request.Request(
            TWILIO_MESSAGES_API.format(sid=sid),
            data=payload,
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=30):
                return True, "ok"
        except urllib.error.HTTPError as exc:
            body_text = exc.read().decode("utf-8", errors="replace")
            return False, f"Twilio send failed: HTTP {exc.code} {body_text}"
        except urllib.error.URLError as exc:
            return False, f"Twilio send failed: {exc.reason}"
        except TimeoutError:
            return False, "Twilio send failed: request timed out"
        except socket.timeout:
            return False, "Twilio send failed: request timed out"

    base_payload: dict[str, str] = {
        "To": to_number,
        "Body": clamp_message(body),
    }

    # Prefer Messaging Service if configured, but fall back to explicit WhatsApp From.
    if messaging_service_sid:
        ok, message = _try_send({**base_payload, "MessagingServiceSid": messaging_service_sid})
        if ok:
            return True, message

        if from_number:
            ok2, message2 = _try_send({**base_payload, "From": from_number})
            if ok2:
                return True, message2
        return False, message

    return _try_send({**base_payload, "From": from_number})


def send_twilio_content_message(
    to_number: str,
    sid: str,
    token: str,
    from_number: str,
    content_sid: str,
    content_variables: str | None = None,
) -> tuple[bool, str]:
    to_number = normalize_whatsapp_address(to_number)
    from_number = normalize_whatsapp_address(from_number)
    messaging_service_sid = os.getenv("TWILIO_MESSAGING_SERVICE_SID", "").strip()

    # WhatsApp messages are most reliable when sent with an explicit WhatsApp
    # From address (and many accounts don't have WhatsApp-enabled messaging
    # services configured). Prefer From for WhatsApp.
    if to_number.startswith("whatsapp:") or from_number.startswith("whatsapp:"):
        messaging_service_sid = ""

    content_sid = (content_sid or "").strip()
    if not content_sid:
        return False, "ContentSid is empty."

    content_vars_clean = (content_variables or "").strip()
    if content_vars_clean:
        try:
            json.loads(content_vars_clean)
        except json.JSONDecodeError:
            return False, "ContentVariables must be valid JSON."

    auth = base64.b64encode(f"{sid}:{token}".encode("utf-8")).decode("ascii")

    def _try_send(payload_dict: dict[str, str]) -> tuple[bool, str]:
        payload = urllib.parse.urlencode(payload_dict).encode("utf-8")
        req = urllib.request.Request(
            TWILIO_MESSAGES_API.format(sid=sid),
            data=payload,
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=30):
                return True, "ok"
        except urllib.error.HTTPError as exc:
            body_text = exc.read().decode("utf-8", errors="replace")
            return False, f"Twilio send failed: HTTP {exc.code} {body_text}"
        except urllib.error.URLError as exc:
            return False, f"Twilio send failed: {exc.reason}"
        except TimeoutError:
            return False, "Twilio send failed: request timed out"
        except socket.timeout:
            return False, "Twilio send failed: request timed out"

    base_payload: dict[str, str] = {
        "To": to_number,
        "ContentSid": content_sid,
    }
    if content_vars_clean:
        base_payload["ContentVariables"] = content_vars_clean

    # Some Twilio docs/tools refer to these parameters using lower-camel case.
    # If Twilio rejects the PascalCase version in a particular account/API
    # environment, retry with lower-camel keys.
    alt_base_payload: dict[str, str] = {
        "To": to_number,
        "contentSid": content_sid,
    }
    if content_vars_clean:
        alt_base_payload["contentVariables"] = content_vars_clean

    if messaging_service_sid:
        ok, message = _try_send({**base_payload, "MessagingServiceSid": messaging_service_sid})
        if ok:
            return True, message

        ok_alt, message_alt = _try_send({**alt_base_payload, "MessagingServiceSid": messaging_service_sid})
        if ok_alt:
            return True, message_alt

        if from_number:
            ok2, message2 = _try_send({**base_payload, "From": from_number})
            if ok2:
                return True, message2

            ok2_alt, message2_alt = _try_send({**alt_base_payload, "From": from_number})
            if ok2_alt:
                return True, message2_alt
        return False, message

    ok3, message3 = _try_send({**base_payload, "From": from_number})
    if ok3:
        return True, message3
    return _try_send({**alt_base_payload, "From": from_number})


def should_show_menu(body: str, sender: str) -> bool:
    text = (body or "").strip().lower()
    if text in {"menu", "options", "start", "hi", "hello", "hey", "hii", "hai"}:
        return True

    # Default to showing menu once per sender.
    with MENU_LOCK:
        return sender not in MENU_SHOWN


def route_menu_selection(selection: str) -> str | None:
    pick = (selection or "").strip().lower()
    if not pick:
        return None
    if pick in {"1", "about", "about business", "business", "info", "information"}:
        return "about"
    if pick in {"2", "products", "product", "flavours", "flavors", "menu", "catalog", "catalogue"}:
        return "products"
    if pick in {"3", "links", "link", "website", "site", "contact", "support"}:
        return "links"

    if "product" in pick or "flavour" in pick or "flavor" in pick:
        return "products"
    if "link" in pick or "web" in pick or "site" in pick:
        return "links"
    if "about" in pick or "business" in pick or "info" in pick:
        return "about"
    return None


def build_menu_response(action: str) -> str:
    business_info = os.getenv("BUSINESS_INFO_TEXT", "").strip()
    website_url = os.getenv("WEBSITE_URL", "").strip()
    products_url = os.getenv("PRODUCTS_URL", "").strip()
    links_text = os.getenv("LINKS_TEXT", "").strip()

    default_business_info = (
        "Amudhu Ice Creams\n"
        "From large-scale events to retail distribution, we deliver quality flavors in bulk—on time, every time.\n\n"
        "Address: No.5/8, Thiruvalluvar saval, Michael Garden, Ramapuram, Chennai-600089\n"
        "Phone: +91 99627 15627 / +91 94442 32777\n"
        "Email: amudhuicecreams@gmail.com"
    )

    if action == "about":
        return business_info or default_business_info

    if action == "products":
        ok_db, db_text = fetch_products_from_db(limit=10)
        if ok_db:
            return db_text
        if products_url:
            return f"Browse our products/flavours here:\n{products_url}"
        if website_url:
            return f"Browse our products/flavours here:\n{website_url.rstrip('/')}/flavours"
        return "Products page isn't configured yet."

    if action == "links":
        if links_text:
            return links_text
        if website_url:
            return f"Website:\n{website_url}"
        return default_business_info

    return "Please choose an option from the menu."


def send_main_menu(to_number: str, sid: str, token: str, from_number: str) -> tuple[bool, str]:
    content_sid = os.getenv("TWILIO_MENU_CONTENT_SID", "").strip()
    content_vars = os.getenv("TWILIO_MENU_CONTENT_VARIABLES", "").strip() or None
    if not content_sid:
        return False, "Menu is not configured. Set TWILIO_MENU_CONTENT_SID to your Twilio Content Template SID."

    ok, message = send_twilio_content_message(
        to_number=to_number,
        sid=sid,
        token=token,
        from_number=from_number,
        content_sid=content_sid,
        content_variables=content_vars,
    )

    if ok:
        with MENU_LOCK:
            MENU_SHOWN.add(normalize_whatsapp_address(to_number))
    return ok, message


def fetch_media_part(media_url: str, media_content_type: str, sid: str, token: str) -> tuple[bool, dict, str]:
    auth = base64.b64encode(f"{sid}:{token}".encode("utf-8")).decode("ascii")
    req = urllib.request.Request(media_url, headers={"Authorization": f"Basic {auth}"})

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            binary_content = response.read()
    except urllib.error.HTTPError as exc:
        return False, {}, f"Media fetch failed: HTTP {exc.code}"
    except urllib.error.URLError as exc:
        return False, {}, f"Media fetch failed: {exc.reason}"
    except TimeoutError:
        return False, {}, "Media fetch failed: request timed out"
    except socket.timeout:
        return False, {}, "Media fetch failed: request timed out"

    if not binary_content:
        return False, {}, "Attachment is empty."

    if len(binary_content) > MAX_BINARY_ATTACHMENT_BYTES:
        size_mb = round(len(binary_content) / (1024 * 1024), 2)
        limit_mb = MAX_BINARY_ATTACHMENT_BYTES // (1024 * 1024)
        return False, {}, f"Attachment too large ({size_mb} MB). Limit is {limit_mb} MB."

    mime_type = normalize_mime_type(media_content_type)

    if mime_type.startswith("text/"):
        decoded = binary_content.decode("utf-8", errors="replace")
        if len(decoded) > MAX_TEXT_ATTACHMENT_CHARS:
            decoded = decoded[:MAX_TEXT_ATTACHMENT_CHARS] + "\n\n[Text attachment truncated]"
        return True, {"text": f"\n\nAttached file ({mime_type}):\n{decoded}"}, "ok"

    supports_inline_data = (
        mime_type.startswith("image/")
        or mime_type.startswith("audio/")
        or mime_type.startswith("video/")
        or mime_type == "application/pdf"
    )
    if not supports_inline_data:
        return False, {}, f"Unsupported attachment type: {mime_type}"

    encoded = base64.b64encode(binary_content).decode("ascii")
    part = {
        "inlineData": {
            "mimeType": mime_type,
            "data": encoded,
        }
    }
    return True, part, mime_type


def get_config() -> tuple[str, str, str, str, str, list[str]]:
    model = normalize_model_name(os.getenv("GEMINI_MODEL", DEFAULT_MODEL)) or DEFAULT_MODEL
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    twilio_from = normalize_whatsapp_address(
        os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886").strip()
    )

    missing: list[str] = []
    if not api_key:
        missing.append("GEMINI_API_KEY")
    if not twilio_sid:
        missing.append("TWILIO_ACCOUNT_SID")
    if not twilio_token:
        missing.append("TWILIO_AUTH_TOKEN")
    if not twilio_from:
        missing.append("TWILIO_WHATSAPP_FROM")

    return model, api_key, twilio_sid, twilio_token, twilio_from, missing


def trim_history(history: list[dict]) -> list[dict]:
    if len(history) <= MAX_HISTORY_MESSAGES:
        return history
    return history[-MAX_HISTORY_MESSAGES:]


def generate_reply(
    sender: str,
    user_parts: list[dict],
    persisted_user_text: str,
    api_key: str,
    model: str,
    timeout: int = 60,
) -> tuple[bool, str]:
    with HISTORY_LOCK:
        base_history = list(CHAT_HISTORY[sender])

    request_history = base_history + [{"role": "user", "parts": user_parts}]
    ok, reply = call_gemini(history=request_history, api_key=api_key, model=model, timeout=timeout)
    if not ok:
        return False, reply

    stored_user = {"role": "user", "parts": [{"text": persisted_user_text}]}
    stored_model = {"role": "model", "parts": [{"text": reply}]}

    with HISTORY_LOCK:
        CHAT_HISTORY[sender] = trim_history(base_history + [stored_user, stored_model])

    return True, reply


def process_text_message_async(
    sender: str,
    body: str,
    model: str,
    api_key: str,
    twilio_sid: str,
    twilio_token: str,
    twilio_from: str,
) -> None:
    ok, reply = generate_reply(
        sender=sender,
        user_parts=[{"text": body}],
        persisted_user_text=body,
        api_key=api_key,
        model=model,
        timeout=60,
    )
    if not ok:
        reply = f"AI error: {reply}"

    # Log failures so they show up in the server console.
    ok_send, msg_send = send_twilio_message(
        to_number=sender,
        body=reply,
        sid=twilio_sid,
        token=twilio_token,
        from_number=twilio_from,
    )
    if not ok_send:
        print(f"Twilio send error (text async): {msg_send}")


def process_media_message_async(
    sender: str,
    body: str,
    media_items: list[tuple[str, str]],
    model: str,
    api_key: str,
    twilio_sid: str,
    twilio_token: str,
    twilio_from: str,
) -> None:
    try:
        user_parts: list[dict] = [{"text": body}]
        seen_types: list[str] = []

        for index, (media_url, media_type) in enumerate(media_items):
            ok, part, result = fetch_media_part(media_url, media_type, twilio_sid, twilio_token)
            if not ok:
                ok_send, msg_send = send_twilio_message(
                    to_number=sender,
                    body=f"Attachment {index + 1} error: {result}",
                    sid=twilio_sid,
                    token=twilio_token,
                    from_number=twilio_from,
                )
                if not ok_send:
                    print(f"Twilio send error (attachment failure): {msg_send}")
                return
            user_parts.append(part)
            seen_types.append(result)

        media_list = ", ".join(t for t in seen_types if t != "ok") or "unknown"
        persisted_user_text = f"{body}\n\n[Attachments: {media_list}]"

        ok, reply = generate_reply(
            sender=sender,
            user_parts=user_parts,
            persisted_user_text=persisted_user_text,
            api_key=api_key,
            model=model,
        )
        if not ok:
            ok_send, msg_send = send_twilio_message(
                to_number=sender,
                body=f"AI error: {reply}",
                sid=twilio_sid,
                token=twilio_token,
                from_number=twilio_from,
            )
            if not ok_send:
                print(f"Twilio send error (media ai failure): {msg_send}")
            return

        ok_send, msg_send = send_twilio_message(
            to_number=sender,
            body=reply,
            sid=twilio_sid,
            token=twilio_token,
            from_number=twilio_from,
        )
        if not ok_send:
            print(f"Twilio send error (media reply): {msg_send}")
    except Exception as exc:
        print(f"process_media_message_async error: {type(exc).__name__}: {exc}")


def process_media_parts_async(
    sender: str,
    user_parts: list[dict],
    persisted_user_text: str,
    model: str,
    api_key: str,
    twilio_sid: str,
    twilio_token: str,
    twilio_from: str,
) -> None:
    try:
        ok, reply = generate_reply(
            sender=sender,
            user_parts=user_parts,
            persisted_user_text=persisted_user_text,
            api_key=api_key,
            model=model,
            timeout=60,
        )
        if not ok:
            reply = f"AI error: {reply}"

        ok_send, msg_send = send_twilio_message(
            to_number=sender,
            body=reply,
            sid=twilio_sid,
            token=twilio_token,
            from_number=twilio_from,
        )
        if not ok_send:
            print(f"Twilio send error (media parts async): {msg_send}")
    except Exception as exc:
        print(f"process_media_parts_async error: {type(exc).__name__}: {exc}")


@app.get("/")
def health() -> tuple[dict, int]:
    return {"status": "ok", "service": "whatsapp-ai-bot"}, 200


@app.route("/whatsapp", methods=["GET", "POST"])
def whatsapp_webhook() -> Response:
    try:
        model, api_key, twilio_sid, twilio_token, twilio_from, missing = get_config()

        if missing:
            return build_twiml_message(f"Server config missing: {', '.join(missing)}")

        # Twilio can be configured to use either POST (form-encoded) or GET (query string).
        payload = request.form if request.method == "POST" else request.args

        sender = normalize_whatsapp_address((payload.get("From") or "unknown").strip())
        inbound_to = normalize_whatsapp_address((payload.get("To") or "").strip())
        effective_twilio_from = inbound_to or twilio_from
        body = (payload.get("Body") or "").strip()

        button_text = (payload.get("ButtonText") or "").strip()
        button_payload = (payload.get("ButtonPayload") or "").strip()

        try:
            num_media = int((payload.get("NumMedia") or "0").strip())
        except ValueError:
            num_media = 0

        if body.lower() in {"/reset", "reset"}:
            with HISTORY_LOCK:
                CHAT_HISTORY[sender] = []
            with MENU_LOCK:
                MENU_SHOWN.discard(sender)
            return build_twiml_message("Conversation history cleared.")

        media_items: list[tuple[str, str]] = []
        media_types: list[str] = []
        for index in range(num_media):
            media_url = (payload.get(f"MediaUrl{index}") or "").strip()
            media_type = normalize_mime_type(
                (payload.get(f"MediaContentType{index}") or "application/octet-stream").strip()
            )
            if not media_url:
                continue
            media_items.append((media_url, media_type))
            media_types.append(media_type)

        if not body and not media_items and not button_text and not button_payload:
            return build_twiml_message("Send text or media to chat with the bot.")

        # Handle interactive menu selections (WhatsApp quick replies / list items).
        if not media_items and (button_text or button_payload):
            # Prefer the label the user actually tapped. Payloads can be
            # misconfigured/swapped in template builders, which can invert intent.
            action = route_menu_selection(button_text) or route_menu_selection(button_payload or body)
            if not action:
                ok_menu, _ = send_main_menu(
                    to_number=sender,
                    sid=twilio_sid,
                    token=twilio_token,
                    from_number=effective_twilio_from,
                )
                if ok_menu:
                    return build_empty_twiml_response()
                return build_twiml_message("Sorry, I didn't understand that option.")

            response_text = build_menu_response(action)

            def _send_menu_again() -> None:
                ok_menu2, msg_menu2 = send_main_menu(
                    to_number=sender,
                    sid=twilio_sid,
                    token=twilio_token,
                    from_number=effective_twilio_from,
                )
                if not ok_menu2:
                    print(f"Menu resend failed: {msg_menu2}")

            threading.Thread(target=_send_menu_again, daemon=True).start()
            return build_twiml_message(response_text)

        # Show menu on greeting / first message (text-only).
        if not media_items and should_show_menu(body=body, sender=sender):
            ok_menu, msg_menu = send_main_menu(
                to_number=sender,
                sid=twilio_sid,
                token=twilio_token,
                from_number=effective_twilio_from,
            )
            if ok_menu:
                return build_empty_twiml_response()
            return build_twiml_message(msg_menu)

        if media_items:
            body_for_media = body or choose_default_prompt(media_types)

            # Prefer a synchronous reply for media so users immediately receive
            # the AI answer via TwiML. If it times out, fall back to async.
            user_parts: list[dict] = [{"text": body_for_media}]
            seen_types: list[str] = []
            for index, (media_url, media_type) in enumerate(media_items):
                ok_fetch, part, result = fetch_media_part(media_url, media_type, twilio_sid, twilio_token)
                if not ok_fetch:
                    return build_twiml_message(f"Attachment {index + 1} error: {result}")
                user_parts.append(part)
                seen_types.append(result)

            media_list = ", ".join(t for t in seen_types if t != "ok") or "unknown"
            persisted_user_text = f"{body_for_media}\n\n[Attachments: {media_list}]"

            ok, reply = generate_reply(
                sender=sender,
                user_parts=user_parts,
                persisted_user_text=persisted_user_text,
                api_key=api_key,
                model=model,
                timeout=WEBHOOK_AI_TIMEOUT_SECONDS,
            )
            if ok:
                return build_twiml_message(reply)

            lowered = (reply or "").lower()
            if "timeout" in lowered or "timed out" in lowered:
                worker = threading.Thread(
                    target=process_media_parts_async,
                    args=(
                        sender,
                        user_parts,
                        persisted_user_text,
                        model,
                        api_key,
                        twilio_sid,
                        twilio_token,
                        effective_twilio_from,
                    ),
                    daemon=True,
                )
                worker.start()
                return build_twiml_message(
                    "Received your media. Processing now, I will reply shortly."
                )

            return build_twiml_message(f"AI error: {reply}")

        # Text-only message. Try a quick response path first; if Gemini is slow,
        # don't let Twilio time out the webhook.
        ok, reply = generate_reply(
            sender=sender,
            user_parts=[{"text": body}],
            persisted_user_text=body,
            api_key=api_key,
            model=model,
            timeout=WEBHOOK_AI_TIMEOUT_SECONDS,
        )
        if ok:
            return build_twiml_message(reply)

        lowered = (reply or "").lower()
        if "timeout" in lowered or "timed out" in lowered:
            worker = threading.Thread(
                target=process_text_message_async,
                args=(
                    sender,
                    body,
                    model,
                    api_key,
                    twilio_sid,
                    twilio_token,
                    effective_twilio_from,
                ),
                daemon=True,
            )
            worker.start()
            return build_twiml_message(
                "Received your message. Processing now, I will reply shortly."
            )

        return build_twiml_message(f"AI error: {reply}")
    except Exception as exc:
        # Keep Twilio happy with a valid TwiML response even if something unexpected happens.
        print(f"/whatsapp webhook error: {type(exc).__name__}: {exc}")
        return build_twiml_message("Server error while processing your message.")


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=False)
