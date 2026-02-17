export interface Place {
  place_id: string
  name: string
  address?: string
  phone?: string
  rating?: number
  types?: string[]
  website?: string
}

export interface PlaceSearchParams {
  query: string
  location?: string
}
