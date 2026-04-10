from datetime import datetime

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.exceptions import DatabaseException, NotFoundException
from app.core.logging import get_logger
from app.models.section import Section, SectionCreate, SectionUpdate
from app.utils.helpers import filter_none_values

logger = get_logger(__name__)


class SectionService:
    """Service for section operations"""

    def __init__(self, db: Database):
        self.db = db
        self.collection: Collection = db["sections"]

    @staticmethod
    def _to_object_id(value: str) -> ObjectId:
        try:
            return ObjectId(value)
        except Exception:
            raise NotFoundException(f"Section with ID {value} not found")

    @staticmethod
    def _now() -> str:
        return datetime.utcnow().isoformat()

    @staticmethod
    def _doc_to_section(doc: dict) -> Section:
        doc = doc.copy()
        doc["id"] = str(doc.pop("_id"))
        return Section(**doc)

    def create_section(self, section: SectionCreate) -> Section:
        """Create a new section"""
        try:
            now = self._now()
            section_dict = section.model_dump()
            section_dict["created_at"] = now
            section_dict["updated_at"] = now

            result = self.collection.insert_one(section_dict)
            return Section(id=str(result.inserted_id), **section_dict)
        except Exception as e:
            logger.error(f"Error creating section: {e}")
            raise DatabaseException(f"Failed to create section: {e!s}")

    def get_section(self, section_id: str) -> Section:
        """Get section by ID"""
        try:
            doc = self.collection.find_one({"_id": self._to_object_id(section_id)})
            if not doc:
                raise NotFoundException(f"Section with ID {section_id} not found")
            return self._doc_to_section(doc)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error fetching section: {e}")
            raise DatabaseException(f"Failed to fetch section: {e!s}")

    def list_sections(self, page: int = 1, page_size: int = 20, parent_id: str | None = None) -> tuple:
        """List all sections with pagination"""
        try:
            query_filter = {}
            if parent_id:
                query_filter["parent_section_id"] = parent_id

            total = self.collection.count_documents(query_filter)
            cursor = (
                self.collection.find(query_filter)
                .skip((page - 1) * page_size)
                .limit(page_size)
            )
            sections = [self._doc_to_section(doc) for doc in cursor]
            return sections, total
        except Exception as e:
            logger.error(f"Error listing sections: {e}")
            raise DatabaseException(f"Failed to list sections: {e!s}")

    def update_section(self, section_id: str, section_update: SectionUpdate) -> Section:
        """Update section"""
        try:
            oid = self._to_object_id(section_id)
            update_data = filter_none_values(section_update.model_dump())

            if not update_data:
                doc = self.collection.find_one({"_id": oid})
                if not doc:
                    raise NotFoundException(f"Section with ID {section_id} not found")
                return self._doc_to_section(doc)

            update_data["updated_at"] = self._now()
            updated = self.collection.find_one_and_update(
                {"_id": oid},
                {"$set": update_data},
                return_document=ReturnDocument.AFTER,
            )
            if not updated:
                raise NotFoundException(f"Section with ID {section_id} not found")
            return self._doc_to_section(updated)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error updating section: {e}")
            raise DatabaseException(f"Failed to update section: {e!s}")

    def delete_section(self, section_id: str) -> bool:
        """Delete section"""
        try:
            oid = self._to_object_id(section_id)
            result = self.collection.delete_one({"_id": oid})
            if result.deleted_count == 0:
                raise NotFoundException(f"Section with ID {section_id} not found")
            return True
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error deleting section: {e}")
            raise DatabaseException(f"Failed to delete section: {e!s}")
