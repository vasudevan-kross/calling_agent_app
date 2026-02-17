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


class VapiAdapter(VoiceProviderAdapter):
    """Vapi.ai voice provider implementation"""

    def __init__(self):
        self.api_key = settings.vapi_api_key
        self.phone_number = settings.vapi_phone_number
        self.base_url = "https://api.vapi.ai"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def _build_assistant_config(self, purpose: str) -> Dict[str, Any]:
        """Build assistant configuration for calls"""
        return {
            "firstMessage": f"Hello, I'm calling regarding: {purpose}. Is this a good time to speak?",
            "model": {
                "provider": "google",
                "model": "gemini-2.0-flash",
                "messages": [
                    {
                        "role": "system",
                        "content": f"You are a professional assistant making a business call. Your purpose: {purpose}. Be polite, professional, and concise. If they're not interested, thank them and end the call gracefully."
                    }
                ]
            },
            "voice": {
                "provider": "playht",
                "voiceId": "jennifer"
            }
        }

    async def start_call(self, request: CallRequest) -> CallResponse:
        """Initiate outbound call via Vapi.ai"""
        async with httpx.AsyncClient() as client:
            payload = {
                "phoneNumberId": self.phone_number,
                "customer": {
                    "number": request.to_number
                },
                "assistant": self._build_assistant_config(request.purpose)
            }

            response = await client.post(
                f"{self.base_url}/call/phone",
                json=payload,
                headers=self.headers,
                timeout=30.0
            )

            # Get detailed error message if request fails
            if response.status_code >= 400:
                error_detail = response.text
                raise Exception(f"Vapi API error ({response.status_code}): {error_detail}")

            data = response.json()

            return CallResponse(
                call_id=data["id"],
                status="initiated",
                provider="vapi",
                message="Call initiated successfully via Vapi.ai"
            )

    async def start_web_call(self, purpose: str) -> Dict[str, Any]:
        """Create a web call session for browser-based testing (no phone needed)"""
        async with httpx.AsyncClient() as client:
            payload = {
                "assistant": self._build_assistant_config(purpose)
            }

            response = await client.post(
                f"{self.base_url}/call/web",
                json=payload,
                headers=self.headers,
                timeout=30.0
            )

            if response.status_code >= 400:
                error_detail = response.text
                raise Exception(f"Vapi API error ({response.status_code}): {error_detail}")

            data = response.json()

            return {
                "call_id": data.get("id"),
                "web_call_url": data.get("webCallUrl"),
                "status": "created",
                "provider": "vapi",
                "message": "Web call created. Use the Vapi Web SDK to connect."
            }

    async def get_call_status(self, call_id: str) -> Dict[str, Any]:
        """Get call status from Vapi.ai"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/call/{call_id}",
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def end_call(self, call_id: str) -> bool:
        """End active call on Vapi.ai"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/call/{call_id}",
                    headers=self.headers,
                    timeout=30.0
                )
                return response.status_code == 200
        except Exception:
            return False

    def normalize_webhook(self, raw_data: Dict[str, Any]) -> WebhookEvent:
        """Normalize Vapi.ai webhook to standard format.

        Vapi sends two different shapes:
          1. Top-level keys: { "type": "call.ended", "call": {...}, ... }
          2. Wrapped in "message": { "message": { "type": "end-of-call-report", "call": {...}, ... } }
        We unwrap shape 2 first, then process uniformly.
        """
        # Unwrap the optional "message" envelope
        payload = raw_data.get("message", raw_data)

        event_type_map = {
            "call.started": "call_started",
            "call.ended": "call_ended",
            # end-of-call-report is Vapi's detailed post-call webhook that includes
            # the recording URL, transcript summary, etc.
            "end-of-call-report": "call_ended",
            "transcript": "transcript",
            "status-update": "status_update"
        }

        vapi_event_type = payload.get("type", "")
        normalized_type = event_type_map.get(vapi_event_type, vapi_event_type)

        call_id = payload.get("call", {}).get("id", "")
        timestamp = payload.get("timestamp", datetime.utcnow().isoformat())

        return WebhookEvent(
            event_type=normalized_type,
            call_id=call_id,
            data=payload,   # always store the unwrapped payload
            timestamp=timestamp
        )

    async def get_transcript(self, call_id: str) -> Dict[str, Any]:
        """Retrieve transcript from Vapi.ai"""
        call_data = await self.get_call_status(call_id)
        return {
            "transcript": call_data.get("transcript", []),
            "messages": call_data.get("messages", []),
            "format": "vapi"
        }

    async def get_recording(self, call_id: str) -> Optional[str]:
        """Get recording URL from Vapi.ai"""
        call_data = await self.get_call_status(call_id)
        return call_data.get("recordingUrl")
