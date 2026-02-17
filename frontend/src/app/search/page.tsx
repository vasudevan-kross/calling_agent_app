'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchResults } from '@/components/search/search-results'
import { useSearchPlaces } from '@/lib/hooks/use-search'
import { useCreateLead, useLeads } from '@/lib/hooks/use-leads'
import type { Place } from '@/types/place'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: places, isLoading } = useSearchPlaces(searchQuery)
  const createLead = useCreateLead()
  const { data: existingLeads } = useLeads({ limit: 100 })

  const existingPhones = useMemo(
    () => new Set((existingLeads ?? []).map(l => l.phone).filter(Boolean) as string[]),
    [existingLeads]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(query)
  }

  const handleAddLead = async (place: Place) => {
    await createLead.mutateAsync({
      name: place.name,
      phone: place.phone!,
      address: place.address,
      rating: place.rating,
      google_place_id: place.place_id,
      source: 'google_maps',
    })
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Search Businesses</h1>
          <p className="text-secondary mt-1">
            Find businesses using Google Maps and add them as leads
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 dark:text-blue-400/80 pointer-events-none z-10" />
            <Input
              placeholder="e.g., Dentists in New York"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={!query.trim()}>
            Search
          </Button>
        </form>

        {searchQuery && (
          <SearchResults
            places={places || []}
            loading={isLoading}
            onAddLead={handleAddLead}
            existingPhones={existingPhones}
          />
        )}
      </div>
    </div>
  )
}
