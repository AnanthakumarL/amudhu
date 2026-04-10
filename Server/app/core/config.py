from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "E-Commerce Admin Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    PORT: int = 7999

    # Weaviate
    WEAVIATE_ENABLED: bool = True
    WEAVIATE_HOST: str = "localhost"
    WEAVIATE_PORT: int = 8080
    WEAVIATE_SCHEME: str = "http"

    # MongoDB (Atlas)
    # Example: mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "amudhu"

    # CORS - Use string in .env, will be split by comma
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:7999"
    # Optional regex (Starlette) to allow matching origins, useful for Vite dev ports
    CORS_ORIGIN_REGEX: str | None = r"^http://localhost:\d+$"

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Stripe
    STRIPE_SECRET_KEY: str | None = None
    # Webhook signing secret (starts with whsec_...) for /payments/webhook
    STRIPE_WEBHOOK_SECRET: str | None = None
    # Currency used for Stripe Checkout line items
    STRIPE_CURRENCY: str = "inr"
    # Client base URL used to build success/cancel URLs for Stripe Checkout
    CLIENT_URL: str = "http://localhost:5173"

    def get_cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
