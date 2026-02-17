import httpx
from typing import Dict, Any, Optional
from datetime import datetime
from app.adapters.base import (
    VoiceProviderAdapter,
    CallRequest,
    CallResponse,
    WebhookEvent
)
from app.config import settings


class RetellAdapter(VoiceProviderAdapter):
    """Retell AI voice provider implementation"""

    def __init__(self):
        self.api_key = settings.retell_api_key
        self.agent_id = settings.retell_agent_id
        self.base_url = "https://api.retellai.com"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def start_call(self, request: CallRequest) -> CallResponse:
        """Initiate outbound call via Retell AI"""
        async with httpx.AsyncClient() as client:
            # Retell AI API expects specific format
            payload = {
                "agent_id": self.agent_id,
                "to_number": request.to_number,
                "override_agent_prompt": f"You are a professional sales assistant making a cold call. Your purpose for this call is: {request.purpose}. Be polite, professional, and concise.",
                "metadata": {
                    "lead_id": request.lead_id,
                    "purpose": request.purpose,
                }
            }
            
            # Remove None values
            payload = {k: v for k, v in payload.items() if v is not None}

            response = await client.post(
                f"{self.base_url}/create-web-call",
                json=payload,
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()

            return CallResponse(
                call_id=data.get("call_id", ""),
                status="initiated",
                provider="retell",
                message="Call initiated successfully via Retell AI"
            )

    async def get_call_status(self, call_id: str) -> Dict[str, Any]:
        """Get call status from Retell AI"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/get-call/{call_id}",
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def end_call(self, call_id: str) -> bool:
        """End active call on Retell AI"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/end-call/{call_id}",
                    headers=self.headers,
                    timeout=30.0
                )
                return response.status_code == 200
        except Exception:
            return False

    def normalize_webhook(self, raw_data: Dict[str, Any]) -> WebhookEvent:
        """Normalize Retell AI webhook to standard format"""
        event_type = raw_data.get("event", "")

        # Map Retell events to standard format
        event_map = {
            "call_started": "call_started",
            "call_ended": "call_ended",
            "call_analyzed": "call_ended",
            "transcript": "transcript"
        }

        normalized_type = event_map.get(event_type, event_type)
        call_id = raw_data.get("call_id", "")
        timestamp = raw_data.get("timestamp", datetime.utcnow().isoformat())

        return WebhookEvent(
            event_type=normalized_type,
            call_id=call_id,
            data=raw_data,
            timestamp=timestamp
        )

    async def get_transcript(self, call_id: str) -> Dict[str, Any]:
        """Retrieve transcript from Retell AI"""
        call_data = await self.get_call_status(call_id)
        return {
            "transcript": call_data.get("transcript", ""),
            "transcript_object": call_data.get("transcript_object", []),
            "format": "retell"
        }

    async def get_recording(self, call_id: str) -> Optional[str]:
        """Get recording URL from Retell AI"""
        call_data = await self.get_call_status(call_id)
        return call_data.get("recording_url")
