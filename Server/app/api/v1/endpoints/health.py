from fastapi import APIRouter

from app.core.config import get_settings
from app.db.mongo_client import mongo_client
from app.models.common import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint"""
    settings = get_settings()

    try:
        mongo_client.client.admin.command("ping")
        mongo_connected = True
    except Exception:
        mongo_connected = False

    return HealthResponse(
        status="healthy" if mongo_connected else "degraded",
        version=settings.APP_VERSION,
        weaviate_connected=mongo_connected,
    )
