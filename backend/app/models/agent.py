from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class AgentCreate(BaseModel):
    """Model for creating a new AI agent"""
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., description="inquiry|booking|order_status|support|follow_up|sales|general")
    language: str = Field(default="en", description="en|ta")
    system_prompt: str = Field(..., min_length=10)
    first_message: str = Field(..., min_length=5)
    description: Optional[str] = None


class AgentResponse(BaseModel):
    """Response model for an agent"""
    id: str                          # Supabase row id
    vapi_assistant_id: str           # Vapi assistant id
    name: str
    category: str
    language: str
    system_prompt: str
    first_message: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
