from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.models.place import PlaceSearchResponse
from app.services.search_service import SearchService


router = APIRouter()


@router.get("/places", response_model=List[PlaceSearchResponse])
async def search_places(
    query: str = Query(..., min_length=1, description="Search query"),
    location: str = Query(None, description="Location to search near")
):
    """Search for businesses using Google Places API"""
    try:
        service = SearchService()
        results = await service.search_places(query, location)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search places: {str(e)}"
        )


@router.get("/places/{place_id}", response_model=PlaceSearchResponse)
async def get_place_details(place_id: str):
    """Get detailed information about a specific place"""
    try:
        service = SearchService()
        place = await service.get_place_details(place_id)
        return place
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get place details: {str(e)}"
        )
