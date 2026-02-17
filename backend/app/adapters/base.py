from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime


class CallRequest(BaseModel):
    """Request model for initiating a call"""
    to_number: str
    purpose: str
    lead_id: str
    metadata: Optional[Dict[str, Any]] = None


class CallResponse(BaseModel):
    """Response model after initiating a call"""
    call_id: str
    status: str
    provider: str
    message: Optional[str] = None


class WebhookEvent(BaseModel):
    """Normalized webhook event model"""
    event_type: str  # 'call_started', 'transcript', 'call_ended'
    call_id: str
    data: Dict[str, Any]
    timestamp: str


class VoiceProviderAdapter(ABC):
    """Abstract base class for voice provider adapters

    This adapter pattern allows seamless switching between different
    voice AI providers (Vapi.ai, Retell AI, etc.) by implementing
    a common interface for all voice operations.
    """

    @abstractmethod
    async def start_call(self, request: CallRequest) -> CallResponse:
        """Initiate an outbound call

        Args:
            request: CallRequest containing phone number, purpose, and metadata

        Returns:
            CallResponse with call ID and status
        """
        pass

    @abstractmethod
    async def get_call_status(self, call_id: str) -> Dict[str, Any]:
        """Get current status of an active or completed call

        Args:
            call_id: Provider-specific call identifier

        Returns:
            Dict containing call status and details
        """
        pass

    @abstractmethod
    async def end_call(self, call_id: str) -> bool:
        """Terminate an active call

        Args:
            call_id: Provider-specific call identifier

        Returns:
            True if call was successfully ended, False otherwise
        """
        pass

    @abstractmethod
    def normalize_webhook(self, raw_data: Dict[str, Any]) -> WebhookEvent:
        """Normalize provider-specific webhook data to standard format

        Each provider sends webhooks in their own format. This method
        converts them to a common WebhookEvent format for consistent
        processing across all providers.

        Args:
            raw_data: Raw webhook payload from provider

        Returns:
            WebhookEvent with normalized event data
        """
        pass

    @abstractmethod
    async def get_transcript(self, call_id: str) -> Dict[str, Any]:
        """Retrieve call transcript

        Args:
            call_id: Provider-specific call identifier

        Returns:
            Dict containing transcript data (format may vary by provider)
        """
        pass

    @abstractmethod
    async def get_recording(self, call_id: str) -> Optional[str]:
        """Get recording URL for a completed call

        Args:
            call_id: Provider-specific call identifier

        Returns:
            Recording URL if available, None otherwise
        """
        pass
