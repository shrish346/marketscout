from functools import lru_cache

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[2]
ENV_FILES = [ROOT_DIR / ".env", Path(__file__).parent / ".env"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[str(p) for p in ENV_FILES if p.exists()] or ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ebay_client_id: str = ""
    ebay_client_secret: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    api_port: int = 8000
    cache_ttl_seconds: int = 300
    rate_limit_seconds: int = 10
    adapter_timeout_seconds: float = 15.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
