from typing import Optional, Dict, Any, List
from supabase import Client
from app.models.lead import LeadCreate, LeadUpdate, LeadResponse


class LeadService:
    """Service for managing lead operations"""

    def __init__(self, supabase: Client):
        self.db = supabase
        self.table_name = "leads"

    async def get_leads(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all leads with optional filtering and pagination"""
        query = self.db.table(self.table_name).select("*")

        # Filter by status if provided
        if status:
            query = query.eq("status", status)

        # Search across name, business_name, and phone
        if search:
            query = query.or_(
                f"name.ilike.%{search}%,"
                f"business_name.ilike.%{search}%,"
                f"phone.ilike.%{search}%"
            )

        # Order and paginate
        query = query.order("created_at", desc=True).range(skip, skip + limit - 1)

        response = query.execute()
        return response.data if response.data else []

    async def get_lead(self, lead_id: str) -> Optional[Dict[str, Any]]:
        """Get a single lead by ID"""
        response = self.db.table(self.table_name).select("*").eq("id", lead_id).execute()
        return response.data[0] if response.data else None

    async def phone_exists(self, phone: str) -> bool:
        """Check if a lead with this phone number already exists"""
        result = self.db.table(self.table_name).select("id").eq("phone", phone).limit(1).execute()
        return bool(result.data)

    async def create_lead(self, lead: LeadCreate) -> Dict[str, Any]:
        """Create a new lead. Raises ValueError if phone already exists."""
        if lead.phone and await self.phone_exists(lead.phone):
            raise ValueError(f"A lead with phone number {lead.phone} already exists")
        lead_data = lead.model_dump()
        response = self.db.table(self.table_name).insert(lead_data).execute()
        return response.data[0]

    async def update_lead(
        self,
        lead_id: str,
        lead: LeadUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update an existing lead"""
        lead_data = lead.model_dump(exclude_unset=True)

        if not lead_data:
            # No fields to update
            return await self.get_lead(lead_id)

        response = self.db.table(self.table_name).update(lead_data).eq("id", lead_id).execute()
        return response.data[0] if response.data else None

    async def delete_lead(self, lead_id: str) -> bool:
        """Delete a lead"""
        response = self.db.table(self.table_name).delete().eq("id", lead_id).execute()
        return len(response.data) > 0 if response.data else False

    async def bulk_create_leads(
        self,
        leads: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Bulk create leads, skipping any that share a phone with an existing lead"""
        # Fetch all existing phones once for efficient dedup
        existing = self.db.table(self.table_name).select("phone").execute()
        existing_phones: set = {r["phone"] for r in (existing.data or []) if r.get("phone")}

        successful = 0
        failed = 0
        skipped = 0
        errors = []

        for lead_data in leads:
            try:
                phone = (lead_data.get("phone") or "").strip()
                if phone and phone in existing_phones:
                    skipped += 1
                    continue

                lead = LeadCreate(**lead_data)
                lead_dict = lead.model_dump()
                self.db.table(self.table_name).insert(lead_dict).execute()
                if phone:
                    existing_phones.add(phone)
                successful += 1
            except Exception as e:
                failed += 1
                errors.append({
                    "data": lead_data,
                    "error": str(e)
                })

        return {
            "successful": successful,
            "failed": failed,
            "skipped": skipped,
            "errors": errors
        }

    async def get_leads_by_source(self, source: str) -> List[Dict[str, Any]]:
        """Get all leads from a specific source"""
        response = self.db.table(self.table_name).select("*").eq("source", source).execute()
        return response.data if response.data else []

    async def update_lead_status(
        self,
        lead_id: str,
        status: str
    ) -> Optional[Dict[str, Any]]:
        """Update lead status"""
        response = self.db.table(self.table_name).update({"status": status}).eq("id", lead_id).execute()
        return response.data[0] if response.data else None
