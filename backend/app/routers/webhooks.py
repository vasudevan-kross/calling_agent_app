from fastapi import APIRouter, Request, HTTPException
from app.adapters.factory import VoiceProviderFactory
from app.services.webhook_service import WebhookService
from app.database import supabase


router = APIRouter()


@router.post("/voice")
async def voice_webhook(request: Request):
    """Unified webhook endpoint for all voice providers

    This endpoint automatically detects the provider and normalizes the webhook event.
    """
    try:
        # Get raw webhook data
        raw_data = await request.json()

        # Get current provider and normalize webhook
        provider = VoiceProviderFactory.get_provider()
        normalized_event = provider.normalize_webhook(raw_data)

        # Process event
        webhook_service = WebhookService(supabase)
        await webhook_service.process_event(normalized_event)

        return {"status": "received", "event_type": normalized_event.event_type}

    except Exception as e:
        print(f"Webhook processing error: {e}")
        # Return 200 even on error to prevent provider retries
        return {"status": "error", "message": str(e)}


@router.post("/vapi")
async def vapi_webhook(request: Request):
    """Vapi-specific webhook endpoint (optional fallback)"""
    try:
        raw_data = await request.json()

        # Get Vapi adapter specifically
        provider = VoiceProviderFactory.get_specific_provider("vapi")
        normalized_event = provider.normalize_webhook(raw_data)

        # Process event
        webhook_service = WebhookService(supabase)
        await webhook_service.process_event(normalized_event)

        return {"status": "received", "provider": "vapi"}

    except Exception as e:
        print(f"Vapi webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/retell")
async def retell_webhook(request: Request):
    """Retell-specific webhook endpoint (optional fallback)"""
    try:
        raw_data = await request.json()

        # Get Retell adapter specifically
        provider = VoiceProviderFactory.get_specific_provider("retell")
        normalized_event = provider.normalize_webhook(raw_data)

        # Process event
        webhook_service = WebhookService(supabase)
        await webhook_service.process_event(normalized_event)

        return {"status": "received", "provider": "retell"}

    except Exception as e:
        print(f"Retell webhook error: {e}")
        return {"status": "error", "message": str(e)}
