from datetime import datetime

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.exceptions import DatabaseException, NotFoundException
from app.core.logging import get_logger
from app.models.delivery_management import (
    DeliveryManagement,
    DeliveryManagementCreate,
    DeliveryManagementUpdate,
)
from app.utils.helpers import filter_none_values

logger = get_logger(__name__)


class DeliveryManagementService:
    """Service for delivery management operations."""

    def __init__(self, db: Database):
        self.db = db
        self.collection: Collection = db["delivery_managements"]

    @staticmethod
    def _to_object_id(value: str) -> ObjectId:
        try:
            return ObjectId(value)
        except Exception:
            raise NotFoundException(f"Delivery with ID {value} not found")

    @staticmethod
    def _now() -> str:
        return datetime.utcnow().isoformat()

    @staticmethod
    def _doc_to_item(doc: dict) -> DeliveryManagement:
        doc = doc.copy()
        doc["id"] = str(doc.pop("_id"))
        return DeliveryManagement(**doc)

    def create(self, item: DeliveryManagementCreate) -> DeliveryManagement:
        try:
            now = self._now()
            payload = item.model_dump()
            payload["created_at"] = now
            payload["updated_at"] = now

            result = self.collection.insert_one(payload)
            return DeliveryManagement(id=str(result.inserted_id), **payload)
        except Exception as e:
            logger.error(f"Error creating delivery: {e}")
            raise DatabaseException(f"Failed to create delivery: {e!s}")

    def get(self, item_id: str) -> DeliveryManagement:
        try:
            doc = self.collection.find_one({"_id": self._to_object_id(item_id)})
            if not doc:
                raise NotFoundException(f"Delivery with ID {item_id} not found")
            return self._doc_to_item(doc)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error fetching delivery: {e}")
            raise DatabaseException(f"Failed to fetch delivery: {e!s}")

    def list(
        self,
        page: int = 1,
        page_size: int = 20,
        status: str | None = None,
        order_id: str | None = None,
    ) -> tuple[list[DeliveryManagement], int]:
        try:
            query_filter: dict = {}
            if status:
                query_filter["status"] = status
            if order_id:
                query_filter["order_id"] = order_id

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
            logger.error(f"Error listing deliveries: {e}")
            raise DatabaseException(f"Failed to list deliveries: {e!s}")

    def update(self, item_id: str, update: DeliveryManagementUpdate) -> DeliveryManagement:
        try:
            oid = self._to_object_id(item_id)
            update_data = filter_none_values(update.model_dump())

            if not update_data:
                return self.get(item_id)

            update_data["updated_at"] = self._now()

            updated = self.collection.find_one_and_update(
                {"_id": oid},
                {"$set": update_data},
                return_document=ReturnDocument.AFTER,
            )
            if not updated:
                raise NotFoundException(f"Delivery with ID {item_id} not found")
            return self._doc_to_item(updated)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error updating delivery: {e}")
            raise DatabaseException(f"Failed to update delivery: {e!s}")

    def delete(self, item_id: str) -> bool:
        try:
            oid = self._to_object_id(item_id)
            result = self.collection.delete_one({"_id": oid})
            if result.deleted_count == 0:
                raise NotFoundException(f"Delivery with ID {item_id} not found")
            return True
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error deleting delivery: {e}")
            raise DatabaseException(f"Failed to delete delivery: {e!s}")
