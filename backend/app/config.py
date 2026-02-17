from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal, Union

class Settings(BaseSettings):
    """Application configuration settings"""

    # Application
    app_name: str = "AI Calling Application"
    debug: bool = False
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""

    # Voice Providers
    active_voice_provider: Literal["vapi", "retell"] = "vapi"
    vapi_api_key: str = ""
    vapi_phone_number: str = ""
    retell_api_key: str = ""
    retell_agent_id: str = ""

    # Google Maps
    google_maps_api_key: str = ""

    # CORS
    cors_origins: Union[str, list[str]] = "http://localhost:3000"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, list[str]]) -> list[str]:
        """Parse comma-separated CORS origins into a list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

settings = Settings()
