from __future__ import annotations

import hashlib
import re
import secrets
from datetime import datetime, timedelta

from bson import ObjectId
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.exceptions import BadRequestException, ConflictException, DatabaseException, NotFoundException
from app.core.logging import get_logger
from app.core.config import get_settings
from app.core.security import hash_password, verify_password
from app.models.auth import AuthUserOut, LoginIn, LoginOtpRequestIn, LoginOtpVerifyIn, OtpRequestIn, OtpRequestOut, SignupVerifyIn

logger = get_logger(__name__)
settings = get_settings()


def _now() -> str:
    return datetime.utcnow().isoformat()


def _normalize_identifier(identifier: str) -> str:
    return identifier.strip().lower()


def _normalize_phone(phone: str) -> str:
    # Keep digits and leading + (if any), remove spaces/dashes
    phone = phone.strip()
    phone = re.sub(r"[\s-]", "", phone)
    return phone


def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, db: Database):
        self.db = db
        self.users: Collection = db["users"]
        self.otp_requests: Collection = db["otp_requests"]

    @staticmethod
    def _doc_to_user(doc: dict) -> AuthUserOut:
        doc = doc.copy()
        doc["id"] = str(doc.pop("_id"))
        doc.pop("password_hash", None)
        return AuthUserOut(**doc)

    def request_signup_otp(self, item: OtpRequestIn) -> OtpRequestOut:
        try:
            identifier = _normalize_identifier(item.identifier)
            otp = "000000" if settings.DEBUG else f"{secrets.randbelow(1_000_000):06d}"

            now_dt = datetime.utcnow()
            expires_dt = now_dt + timedelta(minutes=5)

            payload = {
                "purpose": "signup",
                "identifier": identifier,
                "otp_hash": _sha256(otp),
                "attempts": 0,
                "is_used": False,
                "created_at": now_dt.isoformat(),
                "expires_at": expires_dt.isoformat(),
                "updated_at": now_dt.isoformat(),
            }

            result = self.otp_requests.insert_one(payload)

            resp = OtpRequestOut(request_id=str(result.inserted_id), expires_in_seconds=5 * 60)
            if settings.DEBUG:
                resp.dev_otp = otp
            return resp
        except Exception as e:
            logger.error(f"Error requesting OTP: {e}")
            raise DatabaseException(f"Failed to request OTP: {e!s}")

    def _ensure_phone_user(self, phone: str) -> dict:
        doc = self.users.find_one({"identifier": phone})
        if doc:
            return doc

        now = _now()
        user_payload = {
            "name": "Delivery User",
            "identifier": phone,
            # Create a random password hash so password login can't be guessed.
            "password_hash": hash_password(secrets.token_urlsafe(16)),
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        result = self.users.insert_one(user_payload)
        user_payload["_id"] = result.inserted_id
        return user_payload

    def request_login_otp(self, item: LoginOtpRequestIn) -> OtpRequestOut:
        try:
            phone = _normalize_phone(item.phone)
            self._ensure_phone_user(phone)

            # Dummy OTP for now
            otp = "0000" if settings.DEBUG else f"{secrets.randbelow(10_000):04d}"

            now_dt = datetime.utcnow()
            expires_dt = now_dt + timedelta(minutes=5)

            payload = {
                "purpose": "login",
                "identifier": phone,
                "otp_hash": _sha256(otp),
                "attempts": 0,
                "is_used": False,
                "created_at": now_dt.isoformat(),
                "expires_at": expires_dt.isoformat(),
                "updated_at": now_dt.isoformat(),
            }

            result = self.otp_requests.insert_one(payload)

            resp = OtpRequestOut(request_id=str(result.inserted_id), expires_in_seconds=5 * 60)
            if settings.DEBUG:
                resp.dev_otp = otp
            return resp
        except Exception as e:
            logger.error(f"Error requesting login OTP: {e}")
            raise DatabaseException(f"Failed to request OTP: {e!s}")

    def verify_login_otp(self, item: LoginOtpVerifyIn) -> AuthUserOut:
        phone = _normalize_phone(item.phone)

        try:
            request_oid = ObjectId(item.request_id)
        except Exception:
            raise NotFoundException("OTP request not found")

        try:
            req = self.otp_requests.find_one({"_id": request_oid, "purpose": "login"})
            if not req:
                raise NotFoundException("OTP request not found")

            if req.get("is_used"):
                raise BadRequestException("OTP already used")

            expires_at = req.get("expires_at")
            if expires_at:
                try:
                    if datetime.fromisoformat(expires_at) < datetime.utcnow():
                        raise BadRequestException("OTP expired")
                except ValueError:
                    pass

            if _normalize_phone(req.get("identifier", "")) != phone:
                raise BadRequestException("OTP request does not match phone")

            if _sha256(item.otp.strip()) != req.get("otp_hash"):
                self.otp_requests.update_one(
                    {"_id": request_oid},
                    {"$inc": {"attempts": 1}, "$set": {"updated_at": _now()}},
                )
                raise BadRequestException("Invalid OTP")

            self.otp_requests.update_one(
                {"_id": request_oid},
                {"$set": {"is_used": True, "verified_at": _now(), "updated_at": _now()}},
            )

            user_doc = self._ensure_phone_user(phone)
            return self._doc_to_user(user_doc)
        except (BadRequestException, NotFoundException):
            raise
        except Exception as e:
            logger.error(f"Error verifying login OTP: {e}")
            raise DatabaseException(f"Failed to verify OTP: {e!s}")

    def verify_signup_otp(self, item: SignupVerifyIn) -> AuthUserOut:
        identifier = _normalize_identifier(item.identifier)

        if identifier != _normalize_identifier(identifier):
            identifier = _normalize_identifier(identifier)

        try:
            request_oid = ObjectId(item.request_id)
        except Exception:
            raise NotFoundException("OTP request not found")

        try:
            req = self.otp_requests.find_one({"_id": request_oid, "purpose": "signup"})
            if not req:
                raise NotFoundException("OTP request not found")

            if req.get("is_used"):
                raise BadRequestException("OTP already used")

            expires_at = req.get("expires_at")
            if expires_at:
                try:
                    if datetime.fromisoformat(expires_at) < datetime.utcnow():
                        raise BadRequestException("OTP expired")
                except ValueError:
                    pass

            if _normalize_identifier(req.get("identifier", "")) != identifier:
                raise BadRequestException("OTP request does not match identifier")

            if _sha256(item.otp.strip()) != req.get("otp_hash"):
                self.otp_requests.update_one({"_id": request_oid}, {"$inc": {"attempts": 1}, "$set": {"updated_at": _now()}})
                raise BadRequestException("Invalid OTP")

            existing = self.users.find_one({"identifier": identifier})
            if existing:
                raise ConflictException("User already exists")

            now = _now()
            user_payload = {
                "name": item.name.strip(),
                "identifier": identifier,
                "password_hash": hash_password(item.password),
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }

            user_result = self.users.insert_one(user_payload)

            self.otp_requests.update_one(
                {"_id": request_oid},
                {"$set": {"is_used": True, "verified_at": now, "updated_at": now}},
            )

            return AuthUserOut(id=str(user_result.inserted_id), **{k: v for k, v in user_payload.items() if k != "password_hash"})
        except (BadRequestException, ConflictException, NotFoundException):
            raise
        except Exception as e:
            logger.error(f"Error verifying signup OTP: {e}")
            raise DatabaseException(f"Failed to verify OTP: {e!s}")

    def login(self, item: LoginIn) -> AuthUserOut:
        try:
            identifier = _normalize_identifier(item.identifier)
            doc = self.users.find_one({"identifier": identifier})
            if not doc:
                raise BadRequestException("Invalid credentials")

            if not doc.get("is_active", True):
                raise BadRequestException("Account is disabled")

            password_hash = doc.get("password_hash")
            if not password_hash or not isinstance(password_hash, str):
                raise BadRequestException("Invalid credentials")

            try:
                is_valid = verify_password(item.password, password_hash)
            except Exception:
                # e.g. UnknownHashError if stored hash is invalid
                raise BadRequestException("Invalid credentials")

            if not is_valid:
                raise BadRequestException("Invalid credentials")

            return self._doc_to_user(doc)
        except BadRequestException:
            raise
        except Exception as e:
            logger.error(f"Error logging in: {e}")
            raise DatabaseException(f"Failed to login: {e!s}")
