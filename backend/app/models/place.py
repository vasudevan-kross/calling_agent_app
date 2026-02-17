from pydantic import BaseModel
from typing import Optional


class PlaceSearchResponse(BaseModel):
    """Model for Google Places search results"""
    place_id: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    rating: Optional[float] = None
    types: Optional[list[str]] = None
    website: Optional[str] = None


class PlaceDetails(PlaceSearchResponse):
    """Extended place details model"""
    formatted_address: Optional[str] = None
    international_phone_number: Optional[str] = None
    opening_hours: Optional[dict] = None
    photos: Optional[list[str]] = None
    reviews: Optional[list[dict]] = None
    user_ratings_total: Optional[int] = None
