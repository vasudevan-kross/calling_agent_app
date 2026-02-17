'use client'

import { useState } from 'react'
import { Trash2, Edit, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDeleteLead } from '@/lib/hooks/use-leads'
import type { Lead } from '@/types/lead'

interface LeadActionsMenuProps {
  lead: Lead
  onEdit?: (lead: Lead) => void
  onClose: () => void
}

export function LeadActionsMenu({ lead, onEdit, onClose }: LeadActionsMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const deleteLead = useDeleteLead()

  const handleDelete = async () => {
    try {
      await deleteLead.mutateAsync(lead.id)
      onClose()
    } catch (error) {
      console.error('Failed to delete lead:', error)
    }
  }

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="glass-card w-full max-w-md p-6 m-4 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Delete Lead</h2>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <p className="text-white/80 mb-6">
            Are you sure you want to delete <strong>{lead.name}</strong>?
            {lead.business_name && ` from ${lead.business_name}`}
            <br />
            <span className="text-red-400 text-sm mt-2 block">
              This action cannot be undone.
            </span>
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
              disabled={deleteLead.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteLead.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              {deleteLead.isPending ? (
                'Deleting...'
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 animate-fade-in" onClick={onClose}>
      <div
        className="absolute glass-card p-2 min-w-[160px] shadow-xl animate-slide-up"
        style={{
          top: 'var(--menu-top)',
          left: 'var(--menu-left)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            onEdit?.(lead)
            onClose()
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
        >
          <Edit className="h-4 w-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-left"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  )
}
