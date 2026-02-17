export interface Lead {
  id: string
  name: string
  business_name?: string
  phone: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  rating?: number
  google_place_id?: string
  source: 'manual' | 'google_maps' | 'file_import'
  metadata?: Record<string, unknown>
  tags?: string[]
  notes?: string
  status: 'active' | 'contacted' | 'converted' | 'archived'
  created_at: string
  updated_at: string
}

export interface LeadCreate {
  name: string
  business_name?: string
  phone: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  rating?: number
  google_place_id?: string
  source?: string
  metadata?: Record<string, unknown>
  tags?: string[]
  notes?: string
  status?: string
}

export interface LeadUpdate {
  name?: string
  business_name?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  rating?: number
  google_place_id?: string
  source?: string
  metadata?: Record<string, unknown>
  tags?: string[]
  notes?: string
  status?: string
}
