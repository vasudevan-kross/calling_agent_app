from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class CallInitiate(BaseModel):
    """Model for initiating a new call"""
    lead_id: str
    purpose: str = Field(..., min_length=1)
    metadata: Optional[Dict[str, Any]] = None


class CallResponse(BaseModel):
    """Response model after initiating a call"""
    id: str
    call_id: str  # Provider-specific call ID
    status: str
    provider: str
    message: Optional[str] = None


class TranscriptMessage(BaseModel):
    """Individual message in a transcript"""
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: str


class CallBase(BaseModel):
    """Base call model"""
    lead_id: str
    provider: str = Field(..., max_length=20)
    provider_call_id: Optional[str] = Field(None, max_length=255)
    direction: str = Field(default="outbound", max_length=20)
    status: str = Field(default="initiated", max_length=50)
    purpose: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    transcript: Optional[List[Dict[str, Any]]] = None
    recording_url: Optional[str] = None
    summary: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    cost: Optional[float] = None


class CallCreate(CallBase):
    """Model for creating a call record"""
    pass


class CallUpdate(BaseModel):
    """Model for updating a call record"""
    provider_call_id: Optional[str] = None
    status: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    transcript: Optional[List[Dict[str, Any]]] = None
    recording_url: Optional[str] = None
    summary: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    cost: Optional[float] = None


class CallHistoryResponse(CallBase):
    """Model for call history responses"""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WebCallLog(BaseModel):
    """Model for logging a browser-based web call"""
    lead_id: str
    purpose: str
    language: str = "en"
    transcript: List[Dict[str, Any]] = []
    provider_call_id: Optional[str] = None
    recording_url: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_seconds: Optional[int] = None
    status: str = "completed"
