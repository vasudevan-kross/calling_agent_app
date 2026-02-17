"""
Quick test script for Google Places API (New)
Run with: uv run python test-places-api.py
"""
import httpx
import asyncio
from app.config import settings


async def test_places_api():
    """Test if Places API is working"""
    api_key = settings.google_maps_api_key

    print(f"Testing with API key: {api_key[:20]}...")
    print(f"Full key: {api_key}")
    print()

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress"
    }

    payload = {
        "textQuery": "dentist in New York",
        "languageCode": "en"
    }

    async with httpx.AsyncClient() as client:
        try:
            print("Sending request to Google Places API (New)...")
            response = await client.post(
                "https://places.googleapis.com/v1/places:searchText",
                json=payload,
                headers=headers,
                timeout=30.0
            )

            print(f"Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            print()

            if response.status_code == 200:
                data = response.json()
                print("[SUCCESS] API is working!")
                print(f"Found {len(data.get('places', []))} places")
                for place in data.get("places", [])[:3]:
                    print(f"  - {place.get('displayName', {}).get('text', 'N/A')}")
            else:
                print("[FAILED]")
                print(f"Response: {response.text}")

        except httpx.HTTPStatusError as e:
            print(f"[HTTP Error]: {e}")
            print(f"Response: {e.response.text}")
        except Exception as e:
            print(f"[Error]: {e}")


if __name__ == "__main__":
    asyncio.run(test_places_api())
