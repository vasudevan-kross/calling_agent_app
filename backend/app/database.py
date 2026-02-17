from supabase import create_client, Client
from app.config import settings

def get_supabase_client() -> Client:
    """Create and return a Supabase client instance"""
    if not settings.supabase_url or not settings.supabase_key:
        raise ValueError(
            "Supabase credentials not configured. "
            "Please set SUPABASE_URL and SUPABASE_KEY environment variables."
        )
    return create_client(settings.supabase_url, settings.supabase_key)

# Singleton instance
# Will raise an error if credentials are not set
try:
    supabase: Client = get_supabase_client()
except ValueError as e:
    # Allow app to start without Supabase in development
    if settings.debug:
        print(f"Warning: {e}")
        supabase = None  # type: ignore
    else:
        raise
