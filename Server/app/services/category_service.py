from datetime import datetime

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.exceptions import DatabaseException, NotFoundException
from app.core.logging import get_logger
from app.models.category import Category, CategoryCreate, CategoryUpdate
from app.utils.helpers import filter_none_values, generate_slug

logger = get_logger(__name__)


class CategoryService:
    """Service for category operations"""

    def __init__(self, db: Database):
        self.db = db
        self.collection: Collection = db["categories"]

    @staticmethod
    def _to_object_id(value: str) -> ObjectId:
        try:
            return ObjectId(value)
        except Exception:
            raise NotFoundException(f"Category with ID {value} not found")

    @staticmethod
    def _now() -> str:
        return datetime.utcnow().isoformat()

    @staticmethod
    def _doc_to_category(doc: dict) -> Category:
        doc = doc.copy()
        doc["id"] = str(doc.pop("_id"))
        return Category(**doc)

    def create_category(self, category: CategoryCreate) -> Category:
        """Create a new category"""
        try:
            now = self._now()
            category_dict = category.model_dump()

            # Generate slug if not provided
            if not category_dict.get("slug"):
                category_dict["slug"] = generate_slug(category_dict["name"])

            category_dict["created_at"] = now
            category_dict["updated_at"] = now

            result = self.collection.insert_one(category_dict)
            return Category(id=str(result.inserted_id), **category_dict)
        except Exception as e:
            logger.error(f"Error creating category: {e}")
            raise DatabaseException(f"Failed to create category: {e!s}")

    def get_category(self, category_id: str) -> Category:
        """Get category by ID"""
        try:
            doc = self.collection.find_one({"_id": self._to_object_id(category_id)})
            if not doc:
                raise NotFoundException(f"Category with ID {category_id} not found")
            return self._doc_to_category(doc)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error fetching category: {e}")
            raise DatabaseException(f"Failed to fetch category: {e!s}")

    def list_categories(self, page: int = 1, page_size: int = 20, parent_id: str | None = None) -> tuple:
        """List all categories with pagination"""
        try:
            query_filter = {}
            if parent_id is not None:
                query_filter["parent_category_id"] = parent_id

            total = self.collection.count_documents(query_filter)
            cursor = (
                self.collection.find(query_filter)
                .skip((page - 1) * page_size)
                .limit(page_size)
            )

            categories = [self._doc_to_category(doc) for doc in cursor]
            return categories, total
        except Exception as e:
            logger.error(f"Error listing categories: {e}")
            raise DatabaseException(f"Failed to list categories: {e!s}")

    def update_category(self, category_id: str, category_update: CategoryUpdate) -> Category:
        """Update category"""
        try:
            oid = self._to_object_id(category_id)
            update_data = filter_none_values(category_update.model_dump())

            if "name" in update_data and not update_data.get("slug"):
                update_data["slug"] = generate_slug(update_data["name"])

            if not update_data:
                doc = self.collection.find_one({"_id": oid})
                if not doc:
                    raise NotFoundException(f"Category with ID {category_id} not found")
                return self._doc_to_category(doc)

            update_data["updated_at"] = self._now()
            updated = self.collection.find_one_and_update(
                {"_id": oid},
                {"$set": update_data},
                return_document=ReturnDocument.AFTER,
            )
            if not updated:
                raise NotFoundException(f"Category with ID {category_id} not found")
            return self._doc_to_category(updated)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error updating category: {e}")
            raise DatabaseException(f"Failed to update category: {e!s}")

    def delete_category(self, category_id: str) -> bool:
        """Delete category"""
        try:
            oid = self._to_object_id(category_id)
            result = self.collection.delete_one({"_id": oid})
            if result.deleted_count == 0:
                raise NotFoundException(f"Category with ID {category_id} not found")
            return True
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error deleting category: {e}")
            raise DatabaseException(f"Failed to delete category: {e!s}")
