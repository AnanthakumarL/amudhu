from datetime import datetime

from pymongo.collection import Collection
from pymongo.database import Database

from app.core.exceptions import DatabaseException
from app.core.logging import get_logger
from app.models.auth import AuthUserOut

logger = get_logger(__name__)


class UserService:
    """Service for auth users (list-only for admin UI)."""

    def __init__(self, db: Database):
        self.db = db
        self.users: Collection = db["users"]
        self.orders: Collection = db["orders"]

    @staticmethod
    def _doc_to_user(doc: dict) -> AuthUserOut:
        doc = doc.copy()
        doc["id"] = str(doc.pop("_id"))
        doc.pop("password_hash", None)
        return AuthUserOut(**doc)

    @staticmethod
    def _normalize_identifier(value: str) -> str:
        return value.strip().lower()

    @staticmethod
    def _now() -> str:
        return datetime.utcnow().isoformat()

    def list(
        self,
        page: int = 1,
        page_size: int = 20,
        is_active: bool | None = None,
        production_only: bool = False,
    ) -> tuple[list[AuthUserOut], int]:
        try:
            query_filter: dict = {}
            if is_active is not None:
                query_filter["is_active"] = is_active

            if production_only:
                identifiers = self.orders.distinct(
                    "production_identifier",
                    {"production_identifier": {"$nin": [None, ""]}},
                )
                normalized = [self._normalize_identifier(str(x)) for x in identifiers if str(x).strip()]
                normalized = list(dict.fromkeys(normalized))
                query_filter["identifier"] = {"$in": normalized} if normalized else {"$in": ["__none__"]}

            total = self.users.count_documents(query_filter)
            cursor = (
                self.users.find(query_filter)
                .sort("created_at", -1)
                .skip((page - 1) * page_size)
                .limit(page_size)
            )
            items = [self._doc_to_user(doc) for doc in cursor]
            return items, total
        except Exception as e:
            logger.error(f"Error listing users: {e}")
            raise DatabaseException(f"Failed to list users: {e!s}")
