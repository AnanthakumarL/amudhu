from datetime import datetime

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.exceptions import DatabaseException, NotFoundException
from app.core.logging import get_logger
from app.models.account import Account, AccountCreate, AccountUpdate
from app.utils.helpers import filter_none_values

logger = get_logger(__name__)


class AccountService:
    """Service for account operations (list/read)."""

    def __init__(self, db: Database):
        self.db = db
        self.collection: Collection = db["accounts"]

    @staticmethod
    def _to_object_id(value: str) -> ObjectId:
        try:
            return ObjectId(value)
        except Exception:
            raise NotFoundException(f"Account with ID {value} not found")

    @staticmethod
    def _doc_to_item(doc: dict) -> Account:
        doc = doc.copy()
        doc["id"] = str(doc.pop("_id"))
        return Account(**doc)

    @staticmethod
    def _now() -> str:
        return datetime.utcnow().isoformat()

    def create(self, item: AccountCreate) -> Account:
        try:
            now = self._now()
            payload = item.model_dump()
            payload["created_at"] = now
            payload["updated_at"] = now

            result = self.collection.insert_one(payload)
            return Account(id=str(result.inserted_id), **payload)
        except Exception as e:
            logger.error(f"Error creating account: {e}")
            raise DatabaseException(f"Failed to create account: {e!s}")

    def get(self, account_id: str) -> Account:
        try:
            doc = self.collection.find_one({"_id": self._to_object_id(account_id)})
            if not doc:
                raise NotFoundException(f"Account with ID {account_id} not found")
            return self._doc_to_item(doc)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error fetching account: {e}")
            raise DatabaseException(f"Failed to fetch account: {e!s}")

    def list(self, page: int = 1, page_size: int = 20, is_active: bool | None = None) -> tuple[list[Account], int]:
        try:
            query_filter: dict = {}
            if is_active is not None:
                query_filter["is_active"] = is_active

            total = self.collection.count_documents(query_filter)
            cursor = (
                self.collection.find(query_filter)
                .sort("created_at", -1)
                .skip((page - 1) * page_size)
                .limit(page_size)
            )
            items = [self._doc_to_item(doc) for doc in cursor]
            return items, total
        except Exception as e:
            logger.error(f"Error listing accounts: {e}")
            raise DatabaseException(f"Failed to list accounts: {e!s}")

    def update(self, account_id: str, update: AccountUpdate) -> Account:
        try:
            oid = self._to_object_id(account_id)
            update_data = filter_none_values(update.model_dump())

            if not update_data:
                return self.get(account_id)

            update_data["updated_at"] = self._now()

            updated = self.collection.find_one_and_update(
                {"_id": oid},
                {"$set": update_data},
                return_document=ReturnDocument.AFTER,
            )
            if not updated:
                raise NotFoundException(f"Account with ID {account_id} not found")
            return self._doc_to_item(updated)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error updating account: {e}")
            raise DatabaseException(f"Failed to update account: {e!s}")

    def delete(self, account_id: str) -> bool:
        try:
            oid = self._to_object_id(account_id)
            result = self.collection.delete_one({"_id": oid})
            if result.deleted_count == 0:
                raise NotFoundException(f"Account with ID {account_id} not found")
            return True
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error deleting account: {e}")
            raise DatabaseException(f"Failed to delete account: {e!s}")
