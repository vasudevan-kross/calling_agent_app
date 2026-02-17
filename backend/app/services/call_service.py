from typing import Optional, Dict, Any, List
from datetime import datetime
from supabase import Client
from app.adapters.base import VoiceProviderAdapter, CallRequest
from app.models.call import CallInitiate


class CallService:
    """Service for managing call operations"""

    def __init__(self, supabase: Client, provider: VoiceProviderAdapter):
        self.db = supabase
        self.provider = provider
        self.table_name = "calls"

    async def initiate_call(self, call_data: CallInitiate) -> Dict[str, Any]:
        """Initiate a new AI call to a lead"""
        # Verify lead exists and get phone number
        lead = self.db.table("leads").select("*").eq("id", call_data.lead_id).execute()

        if not lead.data:
            raise ValueError(f"Lead not found: {call_data.lead_id}")

        lead_data = lead.data[0]

        # Create call request
        request = CallRequest(
            to_number=lead_data["phone"],
            purpose=call_data.purpose,
            lead_id=call_data.lead_id,
            metadata=call_data.metadata
        )

        # Initiate call via provider
        response = await self.provider.start_call(request)

        # Store call record in database
        call_record = {
            "lead_id": call_data.lead_id,
            "provider": response.provider,
            "provider_call_id": response.call_id,
            "status": response.status,
            "purpose": call_data.purpose,
            "start_time": datetime.utcnow().isoformat(),
            "metadata": call_data.metadata or {}
        }

        db_response = self.db.table(self.table_name).insert(call_record).execute()

        return {
            "id": db_response.data[0]["id"],
            "call_id": response.call_id,
            "status": response.status,
            "provider": response.provider,
            "message": response.message
        }

    async def get_call(self, call_id: str) -> Optional[Dict[str, Any]]:
        """Get call details by ID"""
        response = self.db.table(self.table_name).select(
            "*, leads(*)"
        ).eq("id", call_id).execute()

        return response.data[0] if response.data else None

    async def get_lead_calls(self, lead_id: str) -> List[Dict[str, Any]]:
        """Get all calls for a specific lead"""
        response = self.db.table(self.table_name).select("*").eq(
            "lead_id", lead_id
        ).order("start_time", desc=True).execute()

        return response.data if response.data else []

    async def get_all_calls(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all calls with optional filtering"""
        query = self.db.table(self.table_name).select("*, leads(*)")

        if status:
            query = query.eq("status", status)

        query = query.order("start_time", desc=True).range(skip, skip + limit - 1)

        response = query.execute()
        return response.data if response.data else []

    async def end_call(self, call_id: str) -> bool:
        """End an active call"""
        # Get call from database
        call = await self.get_call(call_id)

        if not call:
            return False

        # End call via provider
        success = await self.provider.end_call(call["provider_call_id"])

        if success:
            # Update database
            self.db.table(self.table_name).update({
                "status": "ended",
                "end_time": datetime.utcnow().isoformat()
            }).eq("id", call_id).execute()

        return success

    async def update_call_from_webhook(
        self,
        provider_call_id: str,
        updates: Dict[str, Any]
    ) -> bool:
        """Update call record from webhook event"""
        # Add updated_at timestamp
        updates["updated_at"] = datetime.utcnow().isoformat()

        response = self.db.table(self.table_name).update(updates).eq(
            "provider_call_id", provider_call_id
        ).execute()

        return len(response.data) > 0 if response.data else False

    async def get_call_by_provider_id(
        self,
        provider_call_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get call by provider call ID"""
        response = self.db.table(self.table_name).select("*").eq(
            "provider_call_id", provider_call_id
        ).execute()

        return response.data[0] if response.data else None

    async def log_web_call(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a completed browser-based web call to the database"""
        call_record = {
            "lead_id": data["lead_id"],
            "provider": "vapi",
            "provider_call_id": data.get("provider_call_id"),
            "direction": "outbound",
            "status": data.get("status", "completed"),
            "purpose": data.get("purpose"),
            "transcript": data.get("transcript", []),
            "recording_url": data.get("recording_url"),
            "start_time": data.get("start_time"),
            "end_time": data.get("end_time"),
            "duration_seconds": data.get("duration_seconds"),
            "metadata": {"language": data.get("language", "en"), "call_type": "web_call"}
        }

        response = self.db.table(self.table_name).insert(call_record).execute()
        return response.data[0]

    async def update_call_transcript(
        self,
        provider_call_id: str,
        transcript_entry: Dict[str, Any]
    ) -> bool:
        """Append to call transcript"""
        # Get current call
        call = await self.get_call_by_provider_id(provider_call_id)

        if not call:
            return False

        # Get current transcript or initialize empty list
        current_transcript = call.get("transcript", [])

        # Append new entry
        if isinstance(current_transcript, list):
            current_transcript.append(transcript_entry)
        else:
            current_transcript = [transcript_entry]

        # Update database
        response = self.db.table(self.table_name).update({
            "transcript": current_transcript
        }).eq("provider_call_id", provider_call_id).execute()

        return len(response.data) > 0 if response.data else False
