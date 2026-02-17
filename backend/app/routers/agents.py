from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.models.agent import AgentCreate
from app.config import settings
from app.database import supabase
from datetime import datetime

router = APIRouter()


class AgentSave(BaseModel):
    """Payload from Next.js after Vapi assistant is already created"""
    vapi_assistant_id: str
    name: str
    category: str
    language: str = "en"
    system_prompt: str
    first_message: str
    description: Optional[str] = None


@router.get("/")
async def list_agents():
    """List all saved agents from Supabase"""
    try:
        response = supabase.table("agents").select("*").order("created_at", desc=True).execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list agents: {str(e)}")


@router.post("/save")
async def save_agent(data: AgentSave):
    """Save an already-created Vapi assistant to Supabase (called by Next.js API route)"""
    now = datetime.utcnow().isoformat()
    record = {
        "vapi_assistant_id": data.vapi_assistant_id,
        "name": data.name,
        "category": data.category,
        "language": data.language,
        "system_prompt": data.system_prompt,
        "first_message": data.first_message,
        "description": data.description,
        "created_at": now,
        "updated_at": now,
    }
    try:
        db_resp = supabase.table("agents").insert(record).execute()
        return db_resp.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB save failed: {str(e)}")


@router.get("/{agent_id}/info")
async def get_agent_info(agent_id: str):
    """Get a single agent's info (used by Next.js delete route to find vapi_assistant_id)"""
    row = supabase.table("agents").select("*").eq("id", agent_id).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Agent not found")
    return row.data[0]


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    system_prompt: Optional[str] = None
    first_message: Optional[str] = None


@router.patch("/{agent_id}")
async def update_agent(agent_id: str, data: AgentUpdate):
    """Update agent in Supabase (Vapi update handled by Next.js route)"""
    row = supabase.table("agents").select("id").eq("id", agent_id).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Agent not found")
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items() if k in ("name", "description", "category", "language", "system_prompt", "first_message")}
    updates["updated_at"] = datetime.utcnow().isoformat()
    db_resp = supabase.table("agents").update(updates).eq("id", agent_id).execute()
    return db_resp.data[0]


@router.delete("/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete agent from Supabase only (Vapi deletion handled by Next.js route)"""
    row = supabase.table("agents").select("id").eq("id", agent_id).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Agent not found")
    supabase.table("agents").delete().eq("id", agent_id).execute()
    return {"message": "Agent deleted"}
