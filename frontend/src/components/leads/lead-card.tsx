'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Phone, Mail, MapPin, Star, MoreVertical, PhoneCall, Mic } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LeadActionsMenu } from './lead-actions-menu'
import type { Lead } from '@/types/lead'

interface LeadCardProps {
  lead: Lead
  onCall?: (lead: Lead) => void
  onWebCall?: (lead: Lead) => void
  onEdit?: (lead: Lead) => void
  onViewDetails?: (lead: Lead) => void
}

const statusVariants: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  active: 'success',
  contacted: 'info',
  converted: 'success',
  archived: 'default',
}

export function LeadCard({ lead, onCall, onWebCall, onEdit, onViewDetails }: LeadCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleOpenMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuWidth = 160

      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - menuWidth,
      })

      setShowActions(true)
    }
  }

  const handleDirectCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.location.href = `tel:${lead.phone}`
  }

  return (
    <Card
      hover
      className="group animate-fade-in"
      onClick={() => onViewDetails?.(lead)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{lead.name}</h3>
            {lead.business_name && (
              <p className="text-sm text-secondary">{lead.business_name}</p>
            )}
          </div>
          <Badge variant={statusVariants[lead.status] || 'default'}>
            {lead.status}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          {lead.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-tertiary" />
              <span>{lead.phone}</span>
            </div>
          )}

          {lead.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-tertiary" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}

          {lead.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-tertiary" />
              <span className="truncate">{lead.address}</span>
            </div>
          )}

          {lead.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{lead.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-[80px]"
            onClick={handleDirectCall}
            title="Call directly using your phone"
          >
            <PhoneCall className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Call</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1 min-w-[80px]"
            onClick={(e) => {
              e.stopPropagation()
              onCall?.(lead)
            }}
            title="AI phone call (requires phone number)"
          >
            <Phone className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">AI Call</span>
          </Button>
          <Button
            variant="glass"
            size="sm"
            className="flex-1 min-w-[80px] bg-green-500/20 hover:bg-green-500/30 border-green-500/30"
            onClick={(e) => {
              e.stopPropagation()
              onWebCall?.(lead)
            }}
            title="Test AI call in browser (no phone needed)"
          >
            <Mic className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Test</span>
          </Button>
          <Button
            ref={buttonRef}
            variant="outline"
            size="sm"
            onClick={handleOpenMenu}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      {showActions && mounted && createPortal(
        <div style={{ '--menu-top': `${menuPosition.top}px`, '--menu-left': `${menuPosition.left}px` } as React.CSSProperties}>
          <LeadActionsMenu
            lead={lead}
            onEdit={onEdit}
            onClose={() => setShowActions(false)}
          />
        </div>,
        document.body
      )}
    </Card>
  )
}
