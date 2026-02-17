'use client'

import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Phone, Mail, MapPin, Star, MoreVertical, PhoneCall, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LeadActionsMenu } from './lead-actions-menu'
import type { Lead } from '@/types/lead'

interface LeadRowProps {
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

export function LeadRow({ lead, onCall, onWebCall, onEdit, onViewDetails }: LeadRowProps) {
  const [showActions, setShowActions] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const handleOpenMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({ top: rect.bottom + 8, left: rect.right - 160 })
      setShowActions(true)
    }
  }

  return (
    <div
      onClick={() => onViewDetails?.(lead)}
      className="group flex items-center gap-4 px-4 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-sm transition-all cursor-pointer"
    >
      {/* Name + business */}
      <div className="min-w-0 w-44 shrink-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{lead.name}</p>
        {lead.business_name && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.business_name}</p>
        )}
      </div>

      {/* Phone */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 w-36 shrink-0">
        <Phone className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
        <span className="truncate">{lead.phone || '—'}</span>
      </div>

      {/* Email */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 flex-1 min-w-0 hidden md:flex">
        <Mail className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
        <span className="truncate">{lead.email || '—'}</span>
      </div>

      {/* Address */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 w-40 shrink-0 hidden lg:flex">
        <MapPin className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
        <span className="truncate">{lead.address || '—'}</span>
      </div>

      {/* Rating */}
      <div className="w-14 shrink-0 hidden sm:flex items-center gap-1">
        {lead.rating ? (
          <>
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{lead.rating.toFixed(1)}</span>
          </>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>

      {/* Status */}
      <div className="w-24 shrink-0">
        <Badge variant={statusVariants[lead.status] || 'default'} className="text-[10px] px-2 py-0.5">
          {lead.status}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.phone}` }}
          title="Direct call"
        >
          <PhoneCall className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="default"
          size="sm"
          className="h-7 px-2"
          onClick={(e) => { e.stopPropagation(); onCall?.(lead) }}
          title="AI Call"
        >
          <Phone className="h-3.5 w-3.5" />
          <span className="ml-1 text-xs hidden sm:inline">AI</span>
        </Button>
        <Button
          variant="glass"
          size="sm"
          className="h-7 px-2 bg-green-500/20 hover:bg-green-500/30 border-green-500/30"
          onClick={(e) => { e.stopPropagation(); onWebCall?.(lead) }}
          title="Browser test"
        >
          <Mic className="h-3.5 w-3.5" />
        </Button>
        <Button
          ref={buttonRef}
          variant="outline"
          size="sm"
          className="h-7 px-2"
          onClick={handleOpenMenu}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </div>

      {showActions && mounted && createPortal(
        <div style={{ '--menu-top': `${menuPosition.top}px`, '--menu-left': `${menuPosition.left}px` } as React.CSSProperties}>
          <LeadActionsMenu lead={lead} onEdit={onEdit} onClose={() => setShowActions(false)} />
        </div>,
        document.body
      )}
    </div>
  )
}
