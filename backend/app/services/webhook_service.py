from datetime import datetime
from supabase import Client
from app.adapters.base import WebhookEvent


class WebhookService:
    """Service for processing voice provider webhooks"""

    def __init__(self, supabase: Client):
        self.db = supabase
        self.calls_table = "calls"

    async def process_event(self, event: WebhookEvent) -> None:
        """Process normalized webhook event"""
        if event.event_type == "call_started":
            await self._handle_call_started(event)
        elif event.event_type == "transcript":
            await self._handle_transcript(event)
        elif event.event_type == "call_ended":
            await self._handle_call_ended(event)
        elif event.event_type == "status_update":
            await self._handle_status_update(event)

    async def _handle_call_started(self, event: WebhookEvent) -> None:
        """Handle call started event"""
        updates = {
            "status": "in_progress",
            "start_time": event.timestamp or datetime.utcnow().isoformat()
        }

        self.db.table(self.calls_table).update(updates).eq(
            "provider_call_id", event.call_id
        ).execute()

    async def _handle_transcript(self, event: WebhookEvent) -> None:
        """Handle transcript update event"""
        # Get current call
        call_response = self.db.table(self.calls_table).select("transcript").eq(
            "provider_call_id", event.call_id
        ).execute()

        if not call_response.data:
            return

        call = call_response.data[0]
        current_transcript = call.get("transcript", [])

        # Append new transcript entry
        if isinstance(current_transcript, list):
            current_transcript.append({
                "timestamp": event.timestamp,
                "data": event.data
            })
        else:
            current_transcript = [{
                "timestamp": event.timestamp,
                "data": event.data
            }]

        # Update database
        self.db.table(self.calls_table).update({
            "transcript": current_transcript
        }).eq("provider_call_id", event.call_id).execute()

    async def _handle_call_ended(self, event: WebhookEvent) -> None:
        """Handle call ended / end-of-call-report event.

        Vapi puts the recording URL inside event.data["call"]["recordingUrl"],
        not at the top level of the payload.
        """
        call_obj = event.data.get("call", {})

        # Prefer nested call object; fall back to top-level variants
        end_time = (
            call_obj.get("endedAt")
            or event.data.get("end_time")
            or event.timestamp
        )
        duration = call_obj.get("duration") or event.data.get("duration") or 0

        # Recording URL lives in call_obj for both "call.ended" and "end-of-call-report"
        recording_url = (
            call_obj.get("recordingUrl")
            or call_obj.get("recording_url")
            or event.data.get("recordingUrl")
            or event.data.get("recording_url")
        )

        summary = event.data.get("summary") or call_obj.get("summary") or ""

        updates: dict = {
            "status": "completed",
            "end_time": end_time,
            "duration_seconds": duration,
            "summary": summary,
        }
        # Only set recording_url when present — don't overwrite an existing URL
        # with None when the initial call.ended fires before recording is ready
        if recording_url:
            updates["recording_url"] = recording_url

        self.db.table(self.calls_table).update(updates).eq(
            "provider_call_id", event.call_id
        ).execute()

    async def _handle_status_update(self, event: WebhookEvent) -> None:
        """Handle status update event"""
        status = event.data.get("status", "unknown")

        self.db.table(self.calls_table).update({
            "status": status
        }).eq("provider_call_id", event.call_id).execute()
