'use client'

import { useState } from 'react'
import { X, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useInitiateCall } from '@/lib/hooks/use-calls'
import type { Lead } from '@/types/lead'

interface CallDialogProps {
  lead: Lead
  onClose: () => void
}

export function CallDialog({ lead, onClose }: CallDialogProps) {
  const [purpose, setPurpose] = useState('')
  const initiateCall = useInitiateCall()

  const handleCall = async () => {
    if (!purpose.trim()) {
      return
    }

    try {
      await initiateCall.mutateAsync({
        lead_id: lead.id,
        purpose: purpose.trim(),
      })
      onClose()
    } catch (error) {
      console.error('Failed to initiate call:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Call</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Lead Info */}
          <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 border border-green-100 dark:border-slate-600">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">Calling</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-lg">{lead.name}</p>
                {lead.business_name && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{lead.business_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-green-200 dark:border-slate-600 text-sm text-gray-600 dark:text-gray-400">
              <Phone className="h-4 w-4" />
              <span>{lead.phone}</span>
            </div>
          </div>

          {/* Purpose Input */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Call Purpose <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Inquire about services, Schedule appointment, Follow up on previous conversation..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {purpose.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 text-base font-medium border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800"
              disabled={initiateCall.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCall}
              disabled={initiateCall.isPending || !purpose.trim()}
              className="flex-1 h-12 text-base font-medium bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:shadow-none"
            >
              {initiateCall.isPending ? (
                'Calling...'
              ) : (
                <>
                  <Phone className="h-5 w-5 mr-2" />
                  Start Call
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
