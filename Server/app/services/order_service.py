import random
import string
from datetime import datetime

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.exceptions import DatabaseException, NotFoundException
from app.core.logging import get_logger
from app.models.order import (
    Order,
    OrderCreate,
    OrderStatistics,
    OrderStatus,
    OrderUpdate,
)

logger = get_logger(__name__)


class OrderService:
    """Service for order operations"""

    def __init__(self, db: Database):
        self.db = db
        self.collection: Collection = db["orders"]

    @staticmethod
    def _to_object_id(value: str) -> ObjectId:
        try:
            return ObjectId(value)
        except Exception:
            raise NotFoundException(f"Order with ID {value} not found")

    @staticmethod
    def _now() -> str:
        return datetime.utcnow().isoformat()

    @staticmethod
    def _doc_to_order(doc: dict) -> Order:
        doc = doc.copy()
        doc["id"] = str(doc.pop("_id"))
        return Order(**doc)

    def _generate_order_number(self) -> str:
        """Generate unique order number"""
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        random_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"ORD-{timestamp}-{random_str}"

    def create_order(self, order: OrderCreate) -> Order:
        """Create a new order"""
        try:
            now = self._now()
            order_dict = order.model_dump()

            # Store items as list of dicts
            order_dict["items"] = [item.model_dump() for item in order.items]

            # Ensure enum stored as string
            status = order_dict.get("status")
            if hasattr(status, "value"):
                order_dict["status"] = status.value

            production_status = order_dict.get("production_status")
            if hasattr(production_status, "value"):
                order_dict["production_status"] = production_status.value

            order_dict["order_number"] = self._generate_order_number()
            order_dict["created_at"] = now
            order_dict["updated_at"] = now

            result = self.collection.insert_one(order_dict)
            return Order(id=str(result.inserted_id), **order_dict)
        except Exception as e:
            logger.error(f"Error creating order: {e}")
            raise DatabaseException(f"Failed to create order: {e!s}")

    def get_order(self, order_id: str) -> Order:
        """Get order by ID"""
        try:
            doc = self.collection.find_one({"_id": self._to_object_id(order_id)})
            if not doc:
                raise NotFoundException(f"Order with ID {order_id} not found")
            return self._doc_to_order(doc)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error fetching order: {e}")
            raise DatabaseException(f"Failed to fetch order: {e!s}")

    def get_order_by_number(self, order_number: str) -> Order:
        """Get order by order number"""
        try:
            doc = self.collection.find_one({"order_number": order_number})
            if not doc:
                raise NotFoundException(f"Order with number {order_number} not found")
            return self._doc_to_order(doc)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error fetching order by number: {e}")
            raise DatabaseException(f"Failed to fetch order: {e!s}")

    def list_orders(
        self,
        page: int = 1,
        page_size: int = 20,
        status: OrderStatus | None = None,
        customer_email: str | None = None,
        customer_identifier: str | None = None,
        production_identifier: str | None = None,
        production_assigned: bool | None = None,
    ) -> tuple:
        """List orders with pagination and filters"""
        try:
            query_filter = {}
            if status:
                query_filter["status"] = status.value
            if customer_email:
                query_filter["customer_email"] = customer_email
            if customer_identifier:
                query_filter["customer_identifier"] = customer_identifier

            if production_identifier:
                query_filter["production_identifier"] = production_identifier.strip().lower()
            elif production_assigned is True:
                query_filter["production_identifier"] = {"$exists": True, "$nin": [None, ""]}

            total = self.collection.count_documents(query_filter)
            cursor = (
                self.collection.find(query_filter)
                .sort("created_at", -1)
                .skip((page - 1) * page_size)
                .limit(page_size)
            )
            orders = [self._doc_to_order(doc) for doc in cursor]
            return orders, total
        except Exception as e:
            logger.error(f"Error listing orders: {e}")
            raise DatabaseException(f"Failed to list orders: {e!s}")

    def update_order(self, order_id: str, order_update: OrderUpdate) -> Order:
        """Update order"""
        try:
            oid = self._to_object_id(order_id)
            update_data = {k: v for k, v in order_update.model_dump().items() if v is not None}

            requested_production_status = update_data.get("production_status")
            if hasattr(requested_production_status, "value"):
                requested_production_status = requested_production_status.value

            if not update_data:
                doc = self.collection.find_one({"_id": oid})
                if not doc:
                    raise NotFoundException(f"Order with ID {order_id} not found")
                return self._doc_to_order(doc)

            if "status" in update_data and hasattr(update_data["status"], "value"):
                update_data["status"] = update_data["status"].value

            if "production_status" in update_data and hasattr(update_data["production_status"], "value"):
                update_data["production_status"] = update_data["production_status"].value

            if "production_identifier" in update_data:
                normalized = str(update_data["production_identifier"]).strip().lower()
                update_data["production_identifier"] = normalized or None
                if normalized:
                    update_data["production_assigned_at"] = self._now()
                    if "status" not in update_data:
                        update_data["status"] = OrderStatus.ASSIGNED.value
                else:
                    update_data["production_assigned_at"] = None

            update_data["updated_at"] = self._now()

            updated = self.collection.find_one_and_update(
                {"_id": oid},
                {"$set": update_data},
                return_document=ReturnDocument.AFTER,
            )
            if not updated:
                raise NotFoundException(f"Order with ID {order_id} not found")

            # If production marks ready_to_dispatch, ensure a delivery entry exists
            if requested_production_status == "ready_to_dispatch":
                try:
                    deliveries = self.db["delivery_managements"]
                    existing = deliveries.find_one({"order_id": order_id})
                    if not existing:
                        now = self._now()
                        deliveries.insert_one(
                            {
                                "order_id": order_id,
                                "tracking_number": None,
                                "delivery_date": None,
                                "status": "pending",
                                "contact_name": updated.get("customer_name"),
                                "contact_phone": updated.get("customer_phone"),
                                "address": updated.get("shipping_address"),
                                "notes": "Auto-created when order marked ready_to_dispatch",
                                "attributes": {},
                                "created_at": now,
                                "updated_at": now,
                            }
                        )
                except Exception as e:
                    logger.warning(f"Failed to auto-create delivery entry for order {order_id}: {e}")

            return self._doc_to_order(updated)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error updating order: {e}")
            raise DatabaseException(f"Failed to update order: {e!s}")

    def delete_order(self, order_id: str) -> bool:
        """Delete order"""
        try:
            oid = self._to_object_id(order_id)
            result = self.collection.delete_one({"_id": oid})
            if result.deleted_count == 0:
                raise NotFoundException(f"Order with ID {order_id} not found")
            return True
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error deleting order: {e}")
            raise DatabaseException(f"Failed to delete order: {e!s}")

    def get_statistics(self) -> OrderStatistics:
        """Get order statistics"""
        try:
            stats = {
                "total_orders": 0,
                "pending_orders": 0,
                "processing_orders": 0,
                "shipped_orders": 0,
                "delivered_orders": 0,
                "cancelled_orders": 0,
                "total_revenue": 0.0,
            }

            for doc in self.collection.find({}):
                stats["total_orders"] += 1
                status = doc.get("status", "")
                if status == OrderStatus.PENDING.value:
                    stats["pending_orders"] += 1
                elif status == OrderStatus.PROCESSING.value:
                    stats["processing_orders"] += 1
                elif status == OrderStatus.SHIPPED.value:
                    stats["shipped_orders"] += 1
                elif status == OrderStatus.DELIVERED.value:
                    stats["delivered_orders"] += 1
                    stats["total_revenue"] += float(doc.get("total", 0) or 0)
                elif status == OrderStatus.CANCELLED.value:
                    stats["cancelled_orders"] += 1

            return OrderStatistics(**stats)
        except Exception as e:
            logger.error(f"Error getting order statistics: {e}")
            raise DatabaseException(f"Failed to get order statistics: {e!s}")
