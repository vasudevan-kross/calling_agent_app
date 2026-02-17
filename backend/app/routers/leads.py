from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from app.models.lead import LeadCreate, LeadUpdate, LeadResponse
from app.services.lead_service import LeadService
from app.database import supabase


router = APIRouter()


def get_lead_service() -> LeadService:
    """Dependency to get lead service instance"""
    return LeadService(supabase)


@router.get("/count")
async def count_leads(
    status: Optional[str] = Query(None),
    service: LeadService = Depends(get_lead_service)
):
    """Return total lead counts"""
    try:
        query = supabase.table("leads").select("id", count="exact")
        if status:
            query = query.eq("status", status)
        result = query.execute()
        return {"count": result.count or 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to count leads: {str(e)}")


@router.get("/", response_model=List[LeadResponse])
async def get_leads(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by name, business, or phone"),
    service: LeadService = Depends(get_lead_service)
):
    """Get all leads with optional filtering and pagination"""
    try:
        leads = await service.get_leads(skip, limit, status, search)
        return leads
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch leads: {str(e)}")


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: str,
    service: LeadService = Depends(get_lead_service)
):
    """Get a single lead by ID"""
    lead = await service.get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/", response_model=LeadResponse, status_code=201)
async def create_lead(
    lead: LeadCreate,
    service: LeadService = Depends(get_lead_service)
):
    """Create a new lead"""
    try:
        created_lead = await service.create_lead(lead)
        return created_lead
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create lead: {str(e)}")


@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    lead: LeadUpdate,
    service: LeadService = Depends(get_lead_service)
):
    """Update an existing lead"""
    updated_lead = await service.update_lead(lead_id, lead)
    if not updated_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return updated_lead


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: str,
    service: LeadService = Depends(get_lead_service)
):
    """Delete a lead"""
    success = await service.delete_lead(lead_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lead not found")


@router.patch("/{lead_id}/status")
async def update_lead_status(
    lead_id: str,
    status: str,
    service: LeadService = Depends(get_lead_service)
):
    """Update lead status"""
    updated_lead = await service.update_lead_status(lead_id, status)
    if not updated_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return updated_lead


@router.get("/source/{source}")
async def get_leads_by_source(
    source: str,
    service: LeadService = Depends(get_lead_service)
):
    """Get all leads from a specific source"""
    leads = await service.get_leads_by_source(source)
    return leads
