from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.models.call import CallInitiate, CallHistoryResponse, WebCallLog
from app.services.call_service import CallService
from app.adapters.factory import VoiceProviderFactory
from app.database import supabase


router = APIRouter()


def get_call_service() -> CallService:
    """Dependency to get call service instance"""
    provider = VoiceProviderFactory.get_provider()
    return CallService(supabase, provider)


@router.post("/initiate")
async def initiate_call(
    call_data: CallInitiate,
    service: CallService = Depends(get_call_service)
):
    """Initiate an AI call to a lead"""
    try:
        result = await service.initiate_call(call_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate call: {str(e)}")


@router.post("/log-web-call")
async def log_web_call(
    log_data: WebCallLog,
    service: CallService = Depends(get_call_service)
):
    """Log a completed browser-based web call with its transcript"""
    try:
        result = await service.log_web_call(log_data.model_dump())
        return {"id": result["id"], "status": "logged", "message": "Call logged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log call: {str(e)}")


@router.get("/count")
async def count_calls(
    status: Optional[str] = Query(None),
):
    """Return total call count"""
    try:
        from app.database import supabase as db
        query = db.table("calls").select("id", count="exact")
        if status:
            query = query.eq("status", status)
        result = query.execute()
        return {"count": result.count or 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to count calls: {str(e)}")


@router.get("/{call_id}", response_model=CallHistoryResponse)
async def get_call(
    call_id: str,
    service: CallService = Depends(get_call_service)
):
    """Get call details by ID"""
    call = await service.get_call(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call


class RecordingUrlUpdate(BaseModel):
    recording_url: str

@router.patch("/{call_id}/recording")
async def update_recording_url(call_id: str, body: RecordingUrlUpdate):
    """Save recording URL to a call record (called by Next.js after fetching from Vapi)"""
    from app.database import supabase as db
    db.table("calls").update({"recording_url": body.recording_url}).eq("id", call_id).execute()
    return {"recording_url": body.recording_url}


class CallAnalysisUpdate(BaseModel):
    summary: str
    ai_score: int
    qualification: str  # "qualified" | "partial" | "unqualified"

@router.patch("/{call_id}/analysis")
async def update_call_analysis(call_id: str, body: CallAnalysisUpdate):
    """Save AI-generated score and summary to a call record"""
    from app.database import supabase as db
    # Merge ai_score + qualification into the existing metadata JSON
    existing = db.table("calls").select("metadata").eq("id", call_id).execute()
    meta = (existing.data[0].get("metadata") or {}) if existing.data else {}
    meta["ai_score"]      = body.ai_score
    meta["qualification"] = body.qualification
    db.table("calls").update({
        "summary":  body.summary,
        "metadata": meta,
    }).eq("id", call_id).execute()
    return {"ai_score": body.ai_score, "summary": body.summary, "qualification": body.qualification}


@router.get("/lead/{lead_id}")
async def get_lead_calls(
    lead_id: str,
    service: CallService = Depends(get_call_service)
):
    """Get all calls for a specific lead"""
    calls = await service.get_lead_calls(lead_id)
    return calls


@router.get("/")
async def get_all_calls(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    service: CallService = Depends(get_call_service)
):
    """Get all calls with optional filtering"""
    calls = await service.get_all_calls(skip, limit, status)
    return calls


@router.post("/{call_id}/end")
async def end_call(
    call_id: str,
    service: CallService = Depends(get_call_service)
):
    """End an active call"""
    success = await service.end_call(call_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to end call")
    return {"message": "Call ended successfully"}


@router.get("/{call_id}/transcript")
async def get_call_transcript(
    call_id: str,
    service: CallService = Depends(get_call_service)
):
    """Get call transcript"""
    call = await service.get_call(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")

    return {
        "call_id": call_id,
        "transcript": call.get("transcript", []),
        "recording_url": call.get("recording_url")
    }


@router.post("/web-call")
async def create_web_call(
    purpose: str = Query(..., min_length=1, description="Purpose of the call")
):
    """Create a web call for browser-based testing (no phone number required)"""
    try:
        from app.adapters.vapi_adapter import VapiAdapter
        adapter = VapiAdapter()
        result = await adapter.start_web_call(purpose)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create web call: {str(e)}")
