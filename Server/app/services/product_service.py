from datetime import datetime

from bson import ObjectId
from bson.binary import Binary
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo import ReturnDocument

from app.core.exceptions import DatabaseException, NotFoundException
from app.core.logging import get_logger
from app.models.product import Product, ProductCreate, ProductUpdate
from app.utils.helpers import filter_none_values, generate_slug

logger = get_logger(__name__)


class ProductService:
    """Service for product operations"""

    def __init__(self, db: Database):
        self.db = db
        self.collection: Collection = db["products"]

    @staticmethod
    def _to_object_id(value: str) -> ObjectId:
        try:
            return ObjectId(value)
        except Exception:
            raise NotFoundException(f"Product with ID {value} not found")

    @staticmethod
    def _now() -> str:
        return datetime.utcnow().isoformat()

    @staticmethod
    def _doc_to_product(doc: dict) -> Product:
        doc = doc.copy()
        doc["id"] = str(doc.pop("_id"))
        # Never expose raw image bytes in API responses
        doc.pop("image_data", None)
        doc.pop("image_mime_type", None)
        doc.pop("image_filename", None)
        return Product(**doc)

    def set_product_image(
        self,
        product_id: str,
        image_bytes: bytes,
        mime_type: str,
        filename: str | None = None,
        image_url: str | None = None,
    ) -> Product:
        """Attach/replace a product image stored in MongoDB."""
        try:
            oid = self._to_object_id(product_id)

            update_data: dict = {
                "image_data": Binary(image_bytes),
                "image_mime_type": mime_type,
                "image_filename": filename,
                "updated_at": self._now(),
            }
            if image_url:
                update_data["image_url"] = image_url

            updated = self.collection.find_one_and_update(
                {"_id": oid},
                {"$set": update_data},
                return_document=ReturnDocument.AFTER,
            )
            if not updated:
                raise NotFoundException(f"Product with ID {product_id} not found")
            return self._doc_to_product(updated)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error setting product image: {e}")
            raise DatabaseException(f"Failed to set product image: {e!s}")

    def get_product_image(self, product_id: str) -> tuple[bytes, str]:
        """Fetch raw image bytes and mime type for a product."""
        try:
            oid = self._to_object_id(product_id)
            doc = self.collection.find_one({"_id": oid}, {"image_data": 1, "image_mime_type": 1})
            if not doc:
                raise NotFoundException(f"Product with ID {product_id} not found")

            image_data = doc.get("image_data")
            mime_type = doc.get("image_mime_type") or "application/octet-stream"
            if not image_data:
                raise NotFoundException(f"Product with ID {product_id} has no image")

            # bson.binary.Binary is bytes-like
            return bytes(image_data), mime_type
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error fetching product image: {e}")
            raise DatabaseException(f"Failed to fetch product image: {e!s}")

    def create_product(self, product: ProductCreate) -> Product:
        """Create a new product"""
        try:
            now = self._now()
            product_dict = product.model_dump()

            # Generate slug if not provided
            if not product_dict.get("slug"):
                product_dict["slug"] = generate_slug(product_dict["name"])

            product_dict["created_at"] = now
            product_dict["updated_at"] = now

            result = self.collection.insert_one(product_dict)
            return Product(id=str(result.inserted_id), **product_dict)
        except Exception as e:
            logger.error(f"Error creating product: {e}")
            raise DatabaseException(f"Failed to create product: {e!s}")

    def get_product(self, product_id: str) -> Product:
        """Get product by ID"""
        try:
            doc = self.collection.find_one({"_id": self._to_object_id(product_id)})
            if not doc:
                raise NotFoundException(f"Product with ID {product_id} not found")
            return self._doc_to_product(doc)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error fetching product: {e}")
            raise DatabaseException(f"Failed to fetch product: {e!s}")

    def list_products(
        self,
        page: int = 1,
        page_size: int = 20,
        category_id: str | None = None,
        section_id: str | None = None,
        is_active: bool | None = None,
        featured: bool | None = None,
    ) -> tuple:
        """List products with pagination and filters"""
        try:
            query_filter = {}
            if category_id:
                query_filter["category_id"] = category_id
            if section_id:
                query_filter["section_id"] = section_id
            if is_active is not None:
                query_filter["is_active"] = is_active
            if featured is not None:
                query_filter["featured"] = featured

            total = self.collection.count_documents(query_filter)
            cursor = (
                self.collection.find(query_filter)
                .skip((page - 1) * page_size)
                .limit(page_size)
            )
            products = [self._doc_to_product(doc) for doc in cursor]
            return products, total
        except Exception as e:
            logger.error(f"Error listing products: {e}")
            raise DatabaseException(f"Failed to list products: {e!s}")

    def update_product(self, product_id: str, product_update: ProductUpdate) -> Product:
        """Update product"""
        try:
            oid = self._to_object_id(product_id)
            update_data = filter_none_values(product_update.model_dump())

            if "name" in update_data and not update_data.get("slug"):
                update_data["slug"] = generate_slug(update_data["name"])

            if not update_data:
                doc = self.collection.find_one({"_id": oid})
                if not doc:
                    raise NotFoundException(f"Product with ID {product_id} not found")
                return self._doc_to_product(doc)

            update_data["updated_at"] = self._now()

            updated = self.collection.find_one_and_update(
                {"_id": oid},
                {"$set": update_data},
                return_document=ReturnDocument.AFTER,
            )
            if not updated:
                raise NotFoundException(f"Product with ID {product_id} not found")
            return self._doc_to_product(updated)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error updating product: {e}")
            raise DatabaseException(f"Failed to update product: {e!s}")

    def delete_product(self, product_id: str) -> bool:
        """Delete product"""
        try:
            oid = self._to_object_id(product_id)
            result = self.collection.delete_one({"_id": oid})
            if result.deleted_count == 0:
                raise NotFoundException(f"Product with ID {product_id} not found")
            return True
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error deleting product: {e}")
            raise DatabaseException(f"Failed to delete product: {e!s}")

    def search_products(self, query: str, limit: int = 10) -> list[Product]:
        """Search products (simple text search for MongoDB)."""
        try:
            regex = {"$regex": query, "$options": "i"}
            cursor = self.collection.find(
                {"$or": [{"name": regex}, {"description": regex}, {"slug": regex}]}
            ).limit(limit)
            return [self._doc_to_product(doc) for doc in cursor]
        except Exception as e:
            logger.error(f"Error searching products: {e}")
            raise DatabaseException(f"Failed to search products: {e!s}")
