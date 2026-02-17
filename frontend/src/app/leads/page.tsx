'use client'

import { useState } from 'react'
import { Plus, Search, LayoutGrid, List, Download } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LeadCard } from '@/components/leads/lead-card'
import { LeadRow } from '@/components/leads/lead-row'
import { CallDialog } from '@/components/calling/call-dialog'
import { WebCallDialog } from '@/components/calling/web-call-dialog'
import { AddLeadDialog } from '@/components/leads/add-lead-dialog'
import { EditLeadDialog } from '@/components/leads/edit-lead-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useLeads } from '@/lib/hooks/use-leads'
import type { Lead } from '@/types/lead'

type ViewMode = 'grid' | 'list'

function exportLeadsCSV(leads: Lead[]) {
  const headers = ['Name', 'Business', 'Phone', 'Email', 'Address', 'Rating', 'Status', 'Source']
  const rows = leads.map(l => [
    l.name,
    l.business_name || '',
    l.phone || '',
    l.email || '',
    l.address || '',
    l.rating?.toString() || '',
    l.status,
    l.source,
  ])
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function LeadsPage() {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [webCallLead, setWebCallLead] = useState<Lead | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const { data: leads, isLoading } = useLeads({ search, limit: 100 })

  const sharedProps = {
    onCall: setSelectedLead,
    onEdit: setEditingLead,
    onWebCall: setWebCallLead,
    onViewDetails: (lead: Lead) => console.log('View', lead),
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Leads</h1>
            <p className="text-secondary mt-1">
              Manage your contacts and initiate AI calls
            </p>
          </div>
          <div className="flex items-center gap-2">
            {leads && leads.length > 0 && (
              <Button
                variant="outline"
                onClick={() => exportLeadsCSV(leads)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Search + View Toggle */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 dark:text-blue-400/80 pointer-events-none z-10" />
            <Input
              placeholder="Search by name, business, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Leads */}
        {isLoading ? (
          viewMode === 'grid' ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          )
        ) : leads && leads.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} {...sharedProps} />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* List header */}
              <div className="flex items-center gap-4 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                <span className="w-44 shrink-0">Name</span>
                <span className="w-36 shrink-0">Phone</span>
                <span className="flex-1 hidden md:block">Email</span>
                <span className="w-40 hidden lg:block">Address</span>
                <span className="w-14 hidden sm:block">Rating</span>
                <span className="w-24">Status</span>
                <span className="ml-auto">Actions</span>
              </div>
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} {...sharedProps} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-secondary">
              {search ? 'No leads found matching your search.' : 'No leads yet. Add your first lead to get started!'}
            </p>
          </div>
        )}

        {/* Dialogs */}
        {showAddDialog && <AddLeadDialog onClose={() => setShowAddDialog(false)} />}
        {editingLead && <EditLeadDialog lead={editingLead} onClose={() => setEditingLead(null)} />}
        {selectedLead && <CallDialog lead={selectedLead} onClose={() => setSelectedLead(null)} />}
        {webCallLead && <WebCallDialog lead={webCallLead} onClose={() => setWebCallLead(null)} />}
      </div>
    </div>
  )
}
