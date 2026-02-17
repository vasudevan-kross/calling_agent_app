import httpx
from typing import List, Optional
from app.config import settings
from app.models.place import PlaceSearchResponse


class SearchService:
    """Service for Google Places API (New) search"""

    def __init__(self):
        self.api_key = settings.google_maps_api_key
        self.base_url = "https://places.googleapis.com/v1"

    async def search_places(
        self,
        query: str,
        location: Optional[str] = None
    ) -> List[PlaceSearchResponse]:
        """Search for places using Google Places API (New) Text Search"""
        async with httpx.AsyncClient() as client:
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": self.api_key,
                "X-Goog-FieldMask": (
                    "places.id,"
                    "places.displayName,"
                    "places.formattedAddress,"
                    "places.internationalPhoneNumber,"
                    "places.rating,"
                    "places.types"
                )
            }

            payload = {
                "textQuery": query,
                "languageCode": "en"
            }

            if location:
                payload["textQuery"] = f"{query} in {location}"

            response = await client.post(
                f"{self.base_url}/places:searchText",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for place in data.get("places", []):
                results.append(PlaceSearchResponse(
                    place_id=place.get("id", ""),
                    name=place.get("displayName", {}).get("text", ""),
                    address=place.get("formattedAddress", ""),
                    phone=place.get("internationalPhoneNumber"),
                    rating=place.get("rating"),
                    types=place.get("types", [])
                ))

            return results

    async def get_place_details(self, place_id: str) -> PlaceSearchResponse:
        """Get detailed information about a specific place"""
        async with httpx.AsyncClient() as client:
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": self.api_key,
                "X-Goog-FieldMask": (
                    "id,"
                    "displayName,"
                    "formattedAddress,"
                    "internationalPhoneNumber,"
                    "rating,"
                    "types,"
                    "websiteUri"
                )
            }

            response = await client.get(
                f"{self.base_url}/places/{place_id}",
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
            place = response.json()

            return PlaceSearchResponse(
                place_id=place.get("id", ""),
                name=place.get("displayName", {}).get("text", ""),
                address=place.get("formattedAddress", ""),
                phone=place.get("internationalPhoneNumber"),
                rating=place.get("rating"),
                types=place.get("types", []),
                website=place.get("websiteUri")
            )
