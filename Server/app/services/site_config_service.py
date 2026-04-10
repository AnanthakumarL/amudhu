from datetime import datetime

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.exceptions import DatabaseException, NotFoundException
from app.core.logging import get_logger
from app.models.site_config import SiteConfig, SiteConfigCreate, SiteConfigUpdate
from app.utils.helpers import filter_none_values

logger = get_logger(__name__)


class SiteConfigService:
    """Service for site configuration operations"""

    def __init__(self, db: Database):
        self.db = db
        self.collection: Collection = db["site_config"]

    @staticmethod
    def _now() -> str:
        return datetime.utcnow().isoformat()

    @staticmethod
    def _doc_to_config(doc: dict) -> SiteConfig:
        doc = doc.copy()
        doc["id"] = str(doc.pop("_id"))
        return SiteConfig(**doc)

    def get_config(self) -> SiteConfig:
        """Get site configuration (only one should exist)"""
        try:
            doc = self.collection.find_one({})
            if not doc:
                raise NotFoundException("Site configuration not found")
            return self._doc_to_config(doc)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error fetching site config: {e}")
            raise DatabaseException(f"Failed to fetch site configuration: {e!s}")

    def create_config(self, config: SiteConfigCreate) -> SiteConfig:
        """Create site configuration"""
        try:
            # Check if config already exists
            existing = self.collection.find_one({})
            if existing is not None:
                raise DatabaseException("Site configuration already exists. Use update instead.")

            now = self._now()
            config_dict = config.model_dump()
            config_dict["created_at"] = now
            config_dict["updated_at"] = now

            result = self.collection.insert_one(config_dict)
            return SiteConfig(id=str(result.inserted_id), **config_dict)
        except Exception as e:
            logger.error(f"Error creating site config: {e}")
            raise DatabaseException(f"Failed to create site configuration: {e!s}")

    def update_config(self, config_update: SiteConfigUpdate) -> SiteConfig:
        """Update site configuration"""
        try:
            # Get existing config
            existing = self.collection.find_one({})

            if existing is None:
                raise NotFoundException("Site configuration not found")

            config_id = str(existing.get("_id"))

            # Prepare update data
            update_data = filter_none_values(config_update.model_dump())

            if not update_data:
                return self._doc_to_config(existing)

            update_data["updated_at"] = self._now()
            updated = self.collection.find_one_and_update(
                {"_id": ObjectId(config_id)},
                {"$set": update_data},
                return_document=ReturnDocument.AFTER,
            )
            if updated is None:
                raise NotFoundException("Site configuration not found")
            return self._doc_to_config(updated)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error updating site config: {e}")
            raise DatabaseException(f"Failed to update site configuration: {e!s}")
