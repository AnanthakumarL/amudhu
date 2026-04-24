/**
 * AI agent module.
 * - Text messages  → DeepSeek (primary, with tool calling)
 * - Image / voice  → Gemini multimodal (with tool calling)
 * - Gemini fallback chain: try all keys per model, then next model
 * - Quota notifications sent inline to the user
 * - Token / cost footer appended to every reply
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  fetchProducts,
  fetchOrdersByPhone,
  fetchOrderById,
  createOrder,
  fetchAccountByPhone,
  fetchAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  updateOrder,
  deleteOrder,
  fetchOrderStatistics,
  fetchOrderByNumber,
} from "./api.js";

const __envDir = path.dirname(fileURLToPath(import.meta.url));
const __envFile = path.join(__envDir, "..", ".env");
if (existsSync(__envFile)) {
  for (const line of readFileSync(__envFile, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── Keys & models ─────────────────────────────────────────────────────────────
const GEMINI_KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
  .split(",").map((k) => k.trim()).filter(Boolean);

const GEMINI_MODELS = (process.env.GEMINI_FALLBACK_MODELS || process.env.GEMINI_MODEL || "gemini-2.5-flash-lite")
  .split(",").map((m) => m.trim()).filter(Boolean);

const DEEPSEEK_KEY   = process.env.DEEPSEEK_API_KEY  || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

if (!GEMINI_KEYS.length && !DEEPSEEK_KEY) {
  throw new Error("No AI API keys found. Set GEMINI_API_KEYS or DEEPSEEK_API_KEY in .env");
}

// ── Pricing table (USD per 1M tokens) ────────────────────────────────────────
const PRICING = {
  "gemini-2.5-flash-lite": { input: 0.075,  output: 0.30  },
  "gemini-2.5-flash":      { input: 0.15,   output: 0.60  },
  "gemini-2.0-flash":      { input: 0.10,   output: 0.40  },
  "gemini-1.5-flash":      { input: 0.075,  output: 0.30  },
  "deepseek-chat":         { input: 0.27,   output: 1.10  },
};
const DEFAULT_GEMINI_PRICE = { input: 0.10, output: 0.40 };
const USD_TO_INR = 84.0;

// ── Key rotation — exhausted keys per session ─────────────────────────────────
const exhaustedKeys = new Set(); // keys permanently skipped this session

function* keysForModel() {
  // Yields keys that are not yet exhausted; wraps around once if needed
  let yielded = 0;
  const available = GEMINI_KEYS.filter((k) => !exhaustedKeys.has(k));
  for (const k of available) {
    yield k;
    yielded++;
  }
  if (yielded === 0 && GEMINI_KEYS.length > 0) {
    // All exhausted — reset and retry once
    exhaustedKeys.clear();
    for (const k of GEMINI_KEYS) yield k;
  }
}

// ── DeepSeek client ───────────────────────────────────────────────────────────
const deepseek = DEEPSEEK_KEY
  ? new OpenAI({ baseURL: "https://api.deepseek.com", apiKey: DEEPSEEK_KEY })
  : null;

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the WhatsApp assistant for Amudhu Ice Creams, Chennai.

LANGUAGE: Always reply in the same language the customer uses. If they mix languages (e.g. Tamil + English), match their style.

PERSONALITY: Warm, helpful, natural. Never use templated or robotic messages. Write like a friendly shop assistant texting on WhatsApp — short, clear, with emojis where appropriate.

YOU HAVE TOOLS — use them proactively:
- get_products: Call this EVERY TIME you need to show any product or price. NEVER mention, list, or describe any product from memory or imagination — only use what get_products returns. If you have not called get_products yet, call it immediately before responding about products.
- user_management: Use this for anything related to the customer's own account — view profile, update name/address/email, delete account, verify their info.
- order_management: Use this for creating, viewing, updating, or cancelling orders. Always call get_products first to resolve product IDs before creating an order.

CRITICAL: You do NOT know what products exist. You MUST call get_products before mentioning any flavour, price, or item. Never guess or invent product names.

CONVERSATION STYLE (IMPORTANT):
- Never force the customer to reply in a specific format.
- If you ask the customer to pick from a list and they ask a question instead, answer their question naturally, then gently continue where you left off.
- Accept product choices in ANY form: number ("1", "one"), name ("chocolate"), partial name ("choco"), emoji, etc. Use get_products to resolve to the actual product ID.
- If they say something ambiguous, make your best guess and confirm: "I'm adding Chocolate Fudge — that right? 😊"

ORDER FLOW (handle naturally in conversation — no fixed steps):
1. Understand what they want (call get_products to match IDs and prices).
2. Collect name + delivery address (check user_management for saved profile first — skip if already known).
3. Ask for the exact delivery date AND time (e.g. "When should we deliver? Please give a date and time like 'tomorrow at 3pm' or '25 April, 6:30pm'"). This is REQUIRED — do not skip it or make it optional.
4. Show a natural order summary including the delivery date/time and ask them to confirm.
5. On confirmation, call order_management with action "create_order" and pass the delivery_datetime field.

STOCK: If inventory_quantity is 0, tell the customer and suggest alternatives.

MEDIA: You can see images and hear voice messages the customer sends. If a customer sends a voice message, understand what they said and reply naturally — NEVER show timestamps, VTT formatting (00:00:03.120 --> 00:00:07.930), or any transcript formatting. Just respond to what they meant, as if it was a normal text message. If a customer sends a photo, describe what you see and respond helpfully. If the media is unclear, politely ask them to clarify.

NEVER:
- Say "I'll fetch", "let me check", "I'll arrange" or imply a background task.
- Show raw JSON or technical data.
- Give rigid templated messages. Be conversational.
- Ask the customer to type specific keywords or numbers unless it genuinely helps clarity.`;

// ── Tool declarations (shared between Gemini and DeepSeek) ────────────────────
const TOOL_DECLARATIONS = [
  {
    name: "get_products",
    description: "Fetch the current product menu from the database. Returns a list of products with IDs, names, prices, descriptions, and inventory_quantity. Call this to resolve a product name or number the customer mentioned into an actual product_id.",
    parameters: { type: "object", properties: {}, required: [] },
  },

  {
    name: "user_management",
    description: `Manage customer accounts. Supports the following actions:
- get_profile: Look up the customer's saved profile by phone. Call this at the start of conversations to pre-fill order details.
- create_user: Register a new customer account with name, email, phone. Auto-called when a new customer places their first order.
- update_user: Update one or more profile fields (name, email, address, is_active). Pass only the fields you want to change.
- delete_user: Permanently delete the customer's account. Ask for confirmation before doing this.
- verify_user: Check whether a customer's phone is already registered.
- get_user_by_id: Fetch full account details by account ID.
- list_orders_for_user: Get all recent orders for this customer.`,
    parameters: {
      type: "object",
      required: ["action"],
      properties: {
        action: {
          type: "string",
          enum: ["get_profile", "create_user", "update_user", "delete_user", "verify_user", "get_user_by_id", "list_orders_for_user"],
        },
        phone:      { type: "string" },
        account_id: { type: "string" },
        name:       { type: "string" },
        email:      { type: "string" },
        address:    { type: "string" },
        is_active:  { type: "boolean" },
        role:       { type: "string" },
      },
    },
  },

  {
    name: "order_management",
    description: `Manage orders. Supports the following actions:
- create_order: Create a new order. Requires customer_name, shipping_address, items (with product_id from get_products), subtotal, total. Always confirm order summary with customer before calling this.
- get_order: Fetch a single order by order_id.
- get_order_by_number: Fetch a single order by human-readable order_number (e.g. "ORD-0042").
- list_orders: Get recent orders for this customer by phone.
- update_order_status: Change the status of an order (pending → processing → shipped → delivered, or cancelled).
- update_order_notes: Add or update the notes/special instructions on an order.
- update_shipping_address: Change the delivery address on an existing order.
- cancel_order: Cancel an order. Ask the customer to confirm before calling this.
- delete_order: Permanently delete an order record (admin use — confirm before calling).
- get_order_statistics: Get summary statistics (total orders, revenue, status breakdown) for this customer.`,
    parameters: {
      type: "object",
      required: ["action"],
      properties: {
        action: {
          type: "string",
          enum: [
            "create_order", "get_order", "get_order_by_number", "list_orders",
            "update_order_status", "update_order_notes", "update_shipping_address",
            "cancel_order", "delete_order", "get_order_statistics",
          ],
        },
        phone:        { type: "string" },
        order_id:     { type: "string" },
        order_number: { type: "string" },
        customer_name:     { type: "string" },
        customer_phone:    { type: "string" },
        customer_email:    { type: "string" },
        shipping_address:  { type: "string" },
        billing_address:   { type: "string" },
        delivery_datetime: { type: "string" },
        notes:             { type: "string" },
        subtotal:          { type: "number" },
        total:             { type: "number" },
        items: {
          type: "array",
          items: {
            type: "object",
            required: ["product_id", "product_name", "quantity", "price", "subtotal"],
            properties: {
              product_id:   { type: "string" },
              product_name: { type: "string" },
              quantity:     { type: "number" },
              price:        { type: "number" },
              subtotal:     { type: "number" },
            },
          },
        },
        status: {
          type: "string",
          enum: ["pending", "assigned", "processing", "shipped", "delivered", "cancelled"],
        },
        new_notes:            { type: "string" },
        new_shipping_address: { type: "string" },
      },
    },
  },
];

// OpenAI-style tools for DeepSeek
const OPENAI_TOOLS = TOOL_DECLARATIONS.map((t) => ({
  type: "function",
  function: { name: t.name, description: t.description, parameters: t.parameters },
}));

// ── Tool executor ─────────────────────────────────────────────────────────────
async function executeTool(name, args, phone) {
  console.error(`[Tool] ${name}(${JSON.stringify(args)})`);
  try {
    switch (name) {
      case "get_products": {
        const products = await fetchProducts();
        return { products };
      }
      case "user_management":  return await handleUserManagement(args, phone);
      case "order_management": return await handleOrderManagement(args, phone);
      default: return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    console.error(`[Tool] ${name} error: ${err.message}`);
    return { error: err.message };
  }
}

// ── User Management handler ───────────────────────────────────────────────────
async function handleUserManagement(args, callerPhone) {
  const p = args.phone || callerPhone;

  switch (args.action) {
    case "get_profile": {
      const account = await fetchAccountByPhone(p);
      if (!account) return { found: false };
      return {
        found: true, id: account.id, name: account.name,
        email:   account.email?.endsWith("@wa.local") ? null : account.email,
        address: account.attributes?.address || null,
        phone:   account.attributes?.phone   || p,
        role:    account.role, is_active: account.is_active,
      };
    }
    case "verify_user": {
      const account = await fetchAccountByPhone(p);
      return { registered: !!account, phone: p };
    }
    case "create_user": {
      const existing = await fetchAccountByPhone(p);
      if (existing) return { success: false, reason: "already_exists", id: existing.id };
      const created = await createAccount({
        name: args.name || "WhatsApp Customer",
        email: args.email || `${p}@wa.local`,
        role: args.role || "customer",
        is_active: true,
        attributes: { phone: p, address: args.address || null },
      });
      return { success: true, id: created.id };
    }
    case "update_user": {
      let accountId = args.account_id;
      let existing  = null;
      if (accountId) {
        existing = await fetchAccountById(accountId);
      } else {
        existing = await fetchAccountByPhone(p);
        if (!existing) return { success: false, reason: "not_found" };
        accountId = existing.id;
      }
      const payload = {};
      if (args.name      != null) payload.name      = args.name;
      if (args.email     != null) payload.email     = args.email;
      if (args.is_active != null) payload.is_active = args.is_active;
      if (args.role      != null) payload.role      = args.role;
      if (args.address   != null || args.phone != null) {
        payload.attributes = {
          ...(existing?.attributes || {}),
          ...(args.address != null ? { address: args.address } : {}),
          ...(args.phone   != null ? { phone:   args.phone   } : {}),
        };
      }
      await updateAccount(accountId, payload);
      return { success: true };
    }
    case "delete_user": {
      let accountId = args.account_id;
      if (!accountId) {
        const account = await fetchAccountByPhone(p);
        if (!account) return { success: false, reason: "not_found" };
        accountId = account.id;
      }
      await deleteAccount(accountId);
      return { success: true };
    }
    case "get_user_by_id": {
      const account = await fetchAccountById(args.account_id);
      return {
        id: account.id, name: account.name,
        email:    account.email?.endsWith("@wa.local") ? null : account.email,
        address:  account.attributes?.address || null,
        phone:    account.attributes?.phone   || null,
        role:     account.role, is_active: account.is_active,
        created_at: account.created_at,
      };
    }
    case "list_orders_for_user": {
      const orders = await fetchOrdersByPhone(p);
      return { orders };
    }
    default:
      return { error: `Unknown user_management action: ${args.action}` };
  }
}

// ── Order Management handler ──────────────────────────────────────────────────
async function handleOrderManagement(args, callerPhone) {
  const phone = args.customer_phone || args.phone || callerPhone;

  switch (args.action) {
    case "create_order": {
      const order = await createOrder({
        customer_name: args.customer_name, customer_phone: phone,
        customer_email: args.customer_email,
        customer_identifier: phone.replace(/\D/g, "").slice(-10),
        shipping_address: args.shipping_address, billing_address: args.billing_address,
        delivery_datetime: args.delivery_datetime, notes: args.notes,
        items: args.items, subtotal: args.subtotal,
        tax: 0, shipping_cost: 0, total: args.total,
        source: "whatsapp", status: "pending",
      });
      return { success: true, order_number: order.order_number || order.id, id: order.id, total: order.total };
    }
    case "get_order":          return { order: await fetchOrderById(args.order_id) };
    case "get_order_by_number": return { order: await fetchOrderByNumber(args.order_number) };
    case "list_orders":        return { orders: await fetchOrdersByPhone(phone) };
    case "update_order_status": {
      const u = await updateOrder(args.order_id, { status: args.status });
      return { success: true, order_number: u.order_number, status: u.status };
    }
    case "update_order_notes": {
      const u = await updateOrder(args.order_id, { notes: args.new_notes });
      return { success: true, order_number: u.order_number };
    }
    case "update_shipping_address": {
      const u = await updateOrder(args.order_id, { shipping_address: args.new_shipping_address });
      return { success: true, order_number: u.order_number };
    }
    case "cancel_order": {
      const u = await updateOrder(args.order_id, { status: "cancelled" });
      return { success: true, order_number: u.order_number, status: "cancelled" };
    }
    case "delete_order": {
      await deleteOrder(args.order_id);
      return { success: true };
    }
    case "get_order_statistics": {
      const stats = await fetchOrderStatistics();
      return { stats };
    }
    default:
      return { error: `Unknown order_management action: ${args.action}` };
  }
}

// ── Per-user conversation history (Gemini format) ─────────────────────────────
const histories = new Map();

function getHistory(from) {
  if (!histories.has(from)) histories.set(from, []);
  return histories.get(from);
}

function trimHistory(from) {
  const h = histories.get(from) || [];
  if (h.length > 30) h.splice(0, h.length - 30);
}

// Convert Gemini-format history to OpenAI messages (text turns only)
function historyToOpenAI(history) {
  const result = [];
  for (const h of history) {
    const textParts = (h.parts || []).filter((p) => p.text != null);
    if (!textParts.length) continue;
    result.push({
      role:    h.role === "model" ? "assistant" : "user",
      content: textParts.map((p) => p.text).join(""),
    });
  }
  return result;
}

// ── Token usage tracking ──────────────────────────────────────────────────────
const chatLogs = new Map();

export function getChatLog(phone) {
  const key = phone.replace(/[^0-9]/g, "");
  return chatLogs.get(key) || [];
}

export function getAllChatSummaries() {
  const result = [];
  for (const [phone, logs] of chatLogs.entries()) {
    const totalInput   = logs.reduce((s, l) => s + (l.inputTokens  || 0), 0);
    const totalOutput  = logs.reduce((s, l) => s + (l.outputTokens || 0), 0);
    const totalCostINR = logs.reduce((s, l) => s + (l.costINR       || 0), 0);
    result.push({
      phone, messageCount: logs.length,
      lastMessage: logs[logs.length - 1]?.timestamp || null,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalCostINR: +totalCostINR.toFixed(4),
    });
  }
  return result.sort((a, b) => (b.lastMessage || "") > (a.lastMessage || "") ? 1 : -1);
}

function calcCost(provider, model, inputTokens, outputTokens) {
  let price;
  if (provider === "gemini") {
    price = PRICING[model] || DEFAULT_GEMINI_PRICE;
  } else {
    price = PRICING[model] || PRICING["deepseek-chat"];
  }
  const costUSD = (inputTokens / 1_000_000) * price.input
                + (outputTokens / 1_000_000) * price.output;
  return { costUSD: +costUSD.toFixed(6), costINR: +(costUSD * USD_TO_INR).toFixed(4) };
}

function recordUsage(from, { userText, reply, provider, model, inputTokens, outputTokens }) {
  const phone = from.replace(/[^0-9]/g, "");
  if (!chatLogs.has(phone)) chatLogs.set(phone, []);
  const logs = chatLogs.get(phone);
  const { costUSD, costINR } = calcCost(provider, model, inputTokens, outputTokens);
  logs.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    userText, reply, provider, model,
    inputTokens, outputTokens,
    costUSD, costINR,
  });
  if (logs.length > 500) logs.splice(0, logs.length - 500);
}

// ── Token footer appended to every reply ─────────────────────────────────────
function formatFooter(provider, model, inputTokens, outputTokens, switchNote = "") {
  const { costINR } = calcCost(provider, model, inputTokens, outputTokens);
  const lines = [
    "",
    "─────────────────────",
    `🤖 *${model}*`,
    `📊 In: ${inputTokens.toLocaleString()} | Out: ${outputTokens.toLocaleString()} tokens`,
    `💰 Cost: ₹${costINR.toFixed(4)}`,
  ];
  if (switchNote) lines.push(`⚠️ ${switchNote}`);
  return lines.join("\n");
}

// ── DeepSeek agentic loop (text — primary for text messages) ──────────────────
async function runDeepSeekAgent(from, phone, userText) {
  if (!deepseek) throw new Error("DeepSeek not configured");

  const history   = getHistory(from);
  const messages  = [
    { role: "system", content: SYSTEM_PROMPT },
    ...historyToOpenAI(history),
    { role: "user", content: userText },
  ];

  let MAX_ROUNDS = 6;
  let totalInput  = 0;
  let totalOutput = 0;

  while (MAX_ROUNDS-- > 0) {
    const res = await deepseek.chat.completions.create({
      model: DEEPSEEK_MODEL,
      messages,
      tools: OPENAI_TOOLS,
      max_tokens: 2048,
    });

    const msg = res.choices[0].message;
    totalInput  += res.usage?.prompt_tokens     || 0;
    totalOutput += res.usage?.completion_tokens || 0;

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      const reply = msg.content || "";
      history.push({ role: "user",  parts: [{ text: userText }] });
      history.push({ role: "model", parts: [{ text: reply    }] });
      trimHistory(from);

      recordUsage(from, {
        userText, reply, provider: "deepseek", model: DEEPSEEK_MODEL,
        inputTokens: totalInput, outputTokens: totalOutput,
      });

      return reply;
    }

    // Execute tool calls
    messages.push({ role: "assistant", content: msg.content || null, tool_calls: msg.tool_calls });

    const toolResults = await Promise.all(
      msg.tool_calls.map((tc) => {
        let args = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
        console.error(`[DeepSeek tool] ${tc.function.name}(${JSON.stringify(args)})`);
        return executeTool(tc.function.name, args, phone);
      })
    );

    for (let i = 0; i < msg.tool_calls.length; i++) {
      messages.push({
        role: "tool",
        tool_call_id: msg.tool_calls[i].id,
        content: JSON.stringify(toolResults[i]),
      });
    }
  }

  throw new Error("DeepSeek: max tool call rounds exceeded");
}

// ── Gemini agentic loop (media — images and voice) ────────────────────────────
async function runGeminiAgent(from, phone, userText, media = null) {
  const history = getHistory(from);

  const userParts = [];
  if (media?.data && media?.mimeType) {
    userParts.push({ inlineData: { mimeType: media.mimeType, data: media.data } });
  }
  userParts.push({ text: userText || (media ? "[media message]" : "") });
  history.push({ role: "user", parts: userParts });

  const switchNotes = []; // quota/switch events to surface to user

  for (let mi = 0; mi < GEMINI_MODELS.length; mi++) {
    const model   = GEMINI_MODELS[mi];
    const allKeys = GEMINI_KEYS.filter((k) => !exhaustedKeys.has(k));
    if (!allKeys.length) {
      // Reset and try again with all keys
      exhaustedKeys.clear();
      allKeys.push(...GEMINI_KEYS);
    }

    let modelSucceeded = false;

    for (const apiKey of allKeys) {
      try {
        const genAI        = new GoogleGenerativeAI(apiKey);
        const geminiModel  = genAI.getGenerativeModel({
          model,
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        });

        let MAX_ROUNDS = 6;
        // Work on a snapshot of history (excluding last user message we just pushed)
        const baseHistory = history.slice(0, -1);

        while (MAX_ROUNDS-- > 0) {
          const chat    = geminiModel.startChat({ history: baseHistory });
          const result  = await chat.sendMessage(history[history.length - 1].parts);
          const response = result.response;
          const functionCalls = response.functionCalls();

          if (!functionCalls || functionCalls.length === 0) {
            const reply = response.text();
            history.push({ role: "model", parts: [{ text: reply }] });
            trimHistory(from);

            const usage = response.usageMetadata || {};
            const inputTokens  = usage.promptTokenCount     || 0;
            const outputTokens = usage.candidatesTokenCount || 0;

            recordUsage(from, {
              userText: userText || (media ? `[${media.mimeType?.split("/")[0] || "media"}]` : ""),
              reply, provider: "gemini", model, inputTokens, outputTokens,
            });

            const switchNote = switchNotes.length
              ? `Switched models: ${switchNotes.join(" → ")}`
              : "";

            modelSucceeded = true;
            return reply;
          }

          // Execute tool calls
          const toolResults = await Promise.all(
            functionCalls.map((fc) => executeTool(fc.name, fc.args || {}, phone))
          );
          history.push({
            role: "model",
            parts: functionCalls.map((fc) => ({ functionCall: { name: fc.name, args: fc.args || {} } })),
          });
          history.push({
            role: "user",
            parts: functionCalls.map((fc, i) => ({
              functionResponse: { name: fc.name, response: toolResults[i] },
            })),
          });
        }

        throw new Error("Max tool call rounds exceeded");

      } catch (err) {
        const msg = err.message || "";
        console.error(`[Gemini] ${model} / …${apiKey.slice(-6)}: ${msg}`);

        if (msg.includes("429") || msg.includes("quota") || msg.includes("rate limit")) {
          exhaustedKeys.add(apiKey);
          console.error(`[Gemini] Key …${apiKey.slice(-6)} quota exhausted — trying next key`);
          continue; // next key
        }

        if (msg.includes("503") || msg.includes("overloaded") || msg.includes("unavailable")) {
          break; // model overloaded — skip to next model
        }

        if (msg.includes("404") || msg.includes("not found")) {
          break; // model doesn't exist — skip
        }

        throw err; // unexpected error — propagate
      }
    } // end key loop

    if (modelSucceeded) break;

    // All keys exhausted for this model — record switch and try next
    const nextModel = GEMINI_MODELS[mi + 1];
    if (nextModel) {
      const note = `${model} quota reached`;
      switchNotes.push(note);
      console.error(`[Gemini] All keys exhausted for ${model} — switching to ${nextModel}`);
    }
  }

  // If we get here, all models failed
  // Pop the user message we pushed so history stays clean
  const h = getHistory(from);
  if (h.length && h[h.length - 1].role === "user") h.pop();

  throw new Error("All Gemini models and keys exhausted");
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Main entry point.
 * - Text-only  → DeepSeek (with tool calling), fallback to Gemini
 * - Media      → Gemini only
 */
export async function agentReply(from, phone, userText, media = null) {
  const isMediaMessage = !!media;

  // ── Media path: Gemini only ───────────────────────────────────────────────
  if (isMediaMessage) {
    if (!GEMINI_KEYS.length) {
      throw new Error("No Gemini keys configured — cannot process media messages");
    }
    try {
      const reply = await runGeminiAgent(from, phone, userText, media);
      console.error(`[AI:gemini] ${from}: replied (${reply.length} chars)`);
      return reply;
    } catch (err) {
      console.error(`[AI] Gemini failed for media: ${err.message}`);
      // Return quota-exceeded message to user instead of crashing
      if (err.message.includes("exhausted") || err.message.includes("quota")) {
        return "⚠️ *AI Quota Exceeded*\n\nAll Gemini API keys have reached their quota limit. Media messages (images/voice) can't be processed right now.\n\nPlease try again later or send a text message! 🙏";
      }
      throw err;
    }
  }

  // ── Text path: DeepSeek first, Gemini fallback ────────────────────────────
  if (deepseek) {
    try {
      const reply = await runDeepSeekAgent(from, phone, userText);
      console.error(`[AI:deepseek] ${from}: replied (${reply.length} chars)`);
      return reply;
    } catch (err) {
      console.error(`[AI] DeepSeek failed: ${err.message} — falling back to Gemini`);
    }
  }

  if (GEMINI_KEYS.length) {
    try {
      const reply = await runGeminiAgent(from, phone, userText, null);
      console.error(`[AI:gemini-fallback] ${from}: replied (${reply.length} chars)`);
      return reply;
    } catch (err) {
      console.error(`[AI] Gemini fallback failed: ${err.message}`);
      if (err.message.includes("exhausted") || err.message.includes("quota")) {
        return "⚠️ *AI Quota Exceeded*\n\nAll AI models have reached their quota limit. Please try again in a few minutes! 🙏";
      }
      throw err;
    }
  }

  throw new Error("No AI provider available");
}

export function clearHistory(phone) {
  const digits = phone.replace(/[^0-9]/g, "");
  // Clear chat logs (keyed by digits-only)
  chatLogs.delete(digits);
  // Clear conversation history (keyed by full JID — find by matching digits)
  for (const key of histories.keys()) {
    if (key.replace(/[^0-9]/g, "") === digits) histories.delete(key);
  }
}

export function getProviderStatus() {
  return {
    gemini: {
      keys: GEMINI_KEYS.length,
      activeKeys: GEMINI_KEYS.length - exhaustedKeys.size,
      exhaustedKeys: exhaustedKeys.size,
      models: GEMINI_MODELS,
    },
    deepseek: { available: !!deepseek, model: DEEPSEEK_MODEL },
  };
}
