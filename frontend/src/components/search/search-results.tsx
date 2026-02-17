'use client'

import { Star, Phone, MapPin, Plus, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Place } from '@/types/place'

interface SearchResultsProps {
  places: Place[]
  loading?: boolean
  onAddLead: (place: Place) => void
  existingPhones?: Set<string>
}

export function SearchResults({ places, loading, onAddLead, existingPhones }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (places.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary">No results found. Try a different search.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {places.map((place) => {
        const alreadyAdded = !!(place.phone && existingPhones?.has(place.phone))

        return (
          <Card key={place.place_id} hover className="animate-fade-in">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">{place.name}</h3>
                {place.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{place.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {place.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-tertiary mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-white/80">{place.address}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-tertiary" />
                  {place.phone ? (
                    <span className="text-gray-700 dark:text-white/80">{place.phone}</span>
                  ) : (
                    <span className="text-gray-400 dark:text-white/40 italic">No phone available</span>
                  )}
                </div>
              </div>

              {alreadyAdded ? (
                <div className="flex items-center justify-center gap-2 w-full h-9 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 text-sm font-medium">
                  <Check className="h-4 w-4" />
                  Already in Leads
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="glass"
                  className="w-full"
                  onClick={() => onAddLead(place)}
                  disabled={!place.phone}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {place.phone ? 'Add to Leads' : 'No Phone - Cannot Add'}
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
