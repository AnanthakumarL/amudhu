from datetime import datetime

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.exceptions import DatabaseException, NotFoundException
from app.core.logging import get_logger
from app.models.job import Job, JobCreate, JobUpdate
from app.utils.helpers import filter_none_values

logger = get_logger(__name__)


class JobService:
    """Service for job operations (list/read)."""

    def __init__(self, db: Database):
        self.db = db
        self.collection: Collection = db["jobs"]

    @staticmethod
    def _to_object_id(value: str) -> ObjectId:
        try:
            return ObjectId(value)
        except Exception:
            raise NotFoundException(f"Job with ID {value} not found")

    @staticmethod
    def _now() -> str:
        return datetime.utcnow().isoformat()

    @staticmethod
    def _doc_to_item(doc: dict) -> Job:
        doc = doc.copy()
        doc["id"] = str(doc.pop("_id"))
        return Job(**doc)

    def get(self, job_id: str) -> Job:
        try:
            doc = self.collection.find_one({"_id": self._to_object_id(job_id)})
            if not doc:
                raise NotFoundException(f"Job with ID {job_id} not found")
            return self._doc_to_item(doc)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error fetching job: {e}")
            raise DatabaseException(f"Failed to fetch job: {e!s}")

    def create(self, item: JobCreate) -> Job:
        try:
            now = self._now()
            payload = item.model_dump()
            payload["created_at"] = now
            payload["updated_at"] = now

            result = self.collection.insert_one(payload)
            return Job(id=str(result.inserted_id), **payload)
        except Exception as e:
            logger.error(f"Error creating job: {e}")
            raise DatabaseException(f"Failed to create job: {e!s}")

    def list(self, page: int = 1, page_size: int = 20, status: str | None = None) -> tuple[list[Job], int]:
        try:
            query_filter: dict = {}
            if status:
                query_filter["status"] = status

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
            logger.error(f"Error listing jobs: {e}")
            raise DatabaseException(f"Failed to list jobs: {e!s}")

    def update(self, job_id: str, update: JobUpdate) -> Job:
        try:
            oid = self._to_object_id(job_id)
            update_data = filter_none_values(update.model_dump())

            if not update_data:
                return self.get(job_id)

            update_data["updated_at"] = self._now()

            updated = self.collection.find_one_and_update(
                {"_id": oid},
                {"$set": update_data},
                return_document=ReturnDocument.AFTER,
            )
            if not updated:
                raise NotFoundException(f"Job with ID {job_id} not found")
            return self._doc_to_item(updated)
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error updating job: {e}")
            raise DatabaseException(f"Failed to update job: {e!s}")

    def delete(self, job_id: str) -> bool:
        try:
            oid = self._to_object_id(job_id)
            result = self.collection.delete_one({"_id": oid})
            if result.deleted_count == 0:
                raise NotFoundException(f"Job with ID {job_id} not found")
            return True
        except NotFoundException:
            raise
        except Exception as e:
            logger.error(f"Error deleting job: {e}")
            raise DatabaseException(f"Failed to delete job: {e!s}")
