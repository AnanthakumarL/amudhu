from __future__ import annotations

from datetime import datetime

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from app.core.exceptions import ConflictException, DatabaseException, NotFoundException
from app.core.logging import get_logger
from app.models.production_user import ProductionUser, ProductionUserCreate, ProductionUserUpdate
from app.utils.helpers import filter_none_values

logger = get_logger(__name__)


class ProductionUserService:
    """Service for production user operations."""

    def __init__(self, db: Database):
        self.db = db
        self.collection: Collection = db["production_users"]

    @staticmethod
    def _to_object_id(value: str) -> ObjectId:
        try:
            return ObjectId(value)
        except Exception:
            raise NotFoundException(f"Production user with ID {value} not found")

    @staticmethod
    def _now() -> str:
        return datetime.utcnow().isoformat()

    @staticmethod
    def _normalize_identifier(value: str) -> str:
        return value.strip().lower()

    @staticmethod
    def _doc_to_item(doc: dict) -> ProductionUser:
        doc = doc.copy()
        doc["id"] = str(doc.pop("_id"))
        return ProductionUser(**doc)

    def create(self, item: ProductionUserCreate) -> ProductionUser:
        try:
            now = self._now()
            payload = item.model_dump()
            payload["identifier"] = self._normalize_identifier(payload["identifier"])
            payload["created_at"] = now
            payload["updated_at"] = now

            try:
                result = self.collection.insert_one(payload)
            except DuplicateKeyError:
                raise ConflictException("Production user already exists")

            return ProductionUser(id=str(result.inserted_id), **payload)
        except ConflictException:
            raise
        except Exception as e:
            logger.error(f"Error creating production user: {e}")
            raise DatabaseException(f"Failed to create production user: {e!s}")

    def get(self, user_id: str) -> ProductionUser:
        try:
            doc = self.collection.find_one({"_id": self._to_object_id(user_id)})
            if not doc:
                raise NotFoundException(f"Production user with ID {user_id} not found")
            return self._doc_to_item(doc)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error fetching production user: {e}")
            raise DatabaseException(f"Failed to fetch production user: {e!s}")

    def list(
        self,
        page: int = 1,
        page_size: int = 20,
        is_active: bool | None = None,
    ) -> tuple[list[ProductionUser], int]:
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
            logger.error(f"Error listing production users: {e}")
            raise DatabaseException(f"Failed to list production users: {e!s}")

    def update(self, user_id: str, update: ProductionUserUpdate) -> ProductionUser:
        try:
            oid = self._to_object_id(user_id)
            update_data = filter_none_values(update.model_dump())

            if "identifier" in update_data:
                update_data["identifier"] = self._normalize_identifier(str(update_data["identifier"]))

            if not update_data:
                return self.get(user_id)

            update_data["updated_at"] = self._now()

            try:
                updated = self.collection.find_one_and_update(
                    {"_id": oid},
                    {"$set": update_data},
                    return_document=ReturnDocument.AFTER,
                )
            except DuplicateKeyError:
                raise ConflictException("Production user identifier already exists")

            if not updated:
                raise NotFoundException(f"Production user with ID {user_id} not found")
            return self._doc_to_item(updated)
        except (ConflictException, NotFoundException):
            raise
        except Exception as e:
            logger.error(f"Error updating production user: {e}")
            raise DatabaseException(f"Failed to update production user: {e!s}")

    def delete(self, user_id: str) -> bool:
        try:
            oid = self._to_object_id(user_id)
            result = self.collection.delete_one({"_id": oid})
            if result.deleted_count == 0:
                raise NotFoundException(f"Production user with ID {user_id} not found")
            return True
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error deleting production user: {e}")
            raise DatabaseException(f"Failed to delete production user: {e!s}")
