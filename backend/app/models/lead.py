from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class LeadBase(BaseModel):
    """Base lead model with common fields"""
    name: str = Field(..., min_length=1, max_length=255)
    business_name: Optional[str] = Field(None, max_length=255)
    phone: str = Field(..., min_length=1, max_length=50)
    email: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    rating: Optional[float] = Field(None, ge=0, le=5)
    google_place_id: Optional[str] = Field(None, max_length=255)
    source: str = Field(default="manual", max_length=50)
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    status: str = Field(default="active", max_length=50)


class LeadCreate(LeadBase):
    """Model for creating a new lead"""
    pass


class LeadUpdate(BaseModel):
    """Model for updating an existing lead"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    business_name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    rating: Optional[float] = Field(None, ge=0, le=5)
    google_place_id: Optional[str] = Field(None, max_length=255)
    source: Optional[str] = Field(None, max_length=50)
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)


class LeadResponse(LeadBase):
    """Model for lead responses from API"""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
