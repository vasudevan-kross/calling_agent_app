from pydantic import BaseModel
from typing import Dict, Any


class WebhookPayload(BaseModel):
    """Generic webhook payload model"""
    event_type: str
    call_id: str
    data: Dict[str, Any]
    provider: str


class VapiWebhook(BaseModel):
    """Vapi-specific webhook model"""
    type: str
    call: Dict[str, Any]
    timestamp: str


class RetellWebhook(BaseModel):
    """Retell-specific webhook model"""
    event: str
    call_id: str
    timestamp: str
    data: Dict[str, Any]
