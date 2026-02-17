'use client'

import { useState } from 'react'
import { Plus, Trash2, Bot, Globe, Tag, RefreshCw, Download, Pencil, RotateCw } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agentsApi } from '@/lib/api/agents'
import { CreateAgentDialog } from '@/components/agents/create-agent-dialog'
import { EditAgentDialog } from '@/components/agents/edit-agent-dialog'
import { SyncVapiDialog } from '@/components/agents/sync-vapi-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { Agent } from '@/types/agent'

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  inquiry:      { label: 'Inquiry',      icon: '❓', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' },
  booking:      { label: 'Booking',      icon: '📅', color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300' },
  order_status: { label: 'Order Status', icon: '📦', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' },
  support:      { label: 'Support',      icon: '🛠', color: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' },
  follow_up:    { label: 'Follow-up',   icon: '🔄', color: 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300' },
  sales:        { label: 'Sales',        icon: '💰', color: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' },
  general:      { label: 'General',      icon: '💬', color: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300' },
}

export default function AgentsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [showSync, setShowSync] = useState(false)
  const [editAgent, setEditAgent] = useState<Agent | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<{ id: string; fields: string[] } | null>(null)
  const queryClient = useQueryClient()

  const { data: agents, isLoading, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['agents'] })

  const handleSyncFromVapi = async (agentId: string) => {
    setSyncingId(agentId)
    setSyncResult(null)
    try {
      const { synced } = await agentsApi.syncFromVapi(agentId)
      setSyncResult({ id: agentId, fields: synced })
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      // Clear the result badge after 4 s
      setTimeout(() => setSyncResult(r => r?.id === agentId ? null : r), 4000)
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`)
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bot className="h-6 w-6 text-blue-500" />
              AI Agents
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Create reusable AI agents for specific call purposes. Select an agent before making a call.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowSync(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-200 dark:border-green-700/50 text-sm font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all"
            >
              <Download className="h-4 w-4" />
              Import from Vapi
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-md shadow-blue-500/20"
            >
              <Plus className="h-4 w-4" />
              Create Agent
            </button>
          </div>
        </div>

        {/* Agents Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : agents && agents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent: Agent) => {
              const cat = CATEGORY_LABELS[agent.category] || CATEGORY_LABELS.general
              return (
                <div
                  key={agent.id}
                  className="group relative bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-lg dark:hover:shadow-blue-500/10 transition-all"
                >
                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleSyncFromVapi(agent.id)}
                      disabled={syncingId === agent.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all disabled:opacity-50"
                      title="Sync latest changes from Vapi dashboard"
                    >
                      <RotateCw className={`h-4 w-4 ${syncingId === agent.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => setEditAgent(agent)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all"
                      title="Edit agent"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete agent "${agent.name}"?`)) {
                          deleteMutation.mutate(agent.id)
                        }
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                      title="Delete agent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Sync success badge */}
                  {syncResult?.id === agent.id && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500 text-white text-[10px] font-semibold shadow-lg animate-fade-in">
                      <RotateCw className="h-3 w-3" />
                      Synced: {syncResult.fields.join(', ')}
                    </div>
                  )}

                  {/* Icon + Name */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25 flex-shrink-0">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{agent.name}</h3>
                      {agent.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{agent.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cat.color}`}>
                      <Tag className="h-3 w-3" />
                      {cat.icon} {cat.label}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                      <Globe className="h-3 w-3" />
                      {agent.language === 'ta' ? 'தமிழ்' : 'English'}
                    </span>
                  </div>

                  {/* First message preview */}
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Opening Message</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 italic">"{agent.first_message}"</p>
                  </div>

                  {/* Vapi ID */}
                  <p className="mt-3 text-[10px] font-mono text-gray-400 dark:text-gray-600 truncate">
                    ID: {agent.vapi_assistant_id}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
            <div className="p-4 rounded-2xl bg-blue-100 dark:bg-blue-500/20 mb-4">
              <Bot className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No agents yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
              Create your first AI agent or import existing ones from your Vapi account.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSync(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-400 font-medium text-sm hover:bg-green-50 dark:hover:bg-green-500/10 transition-all"
              >
                <Download className="h-4 w-4" />
                Import from Vapi
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
              >
                <Plus className="h-4 w-4" />
                Create Agent
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateAgentDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => { refresh(); setShowCreate(false) }}
        />
      )}

      {editAgent && (
        <EditAgentDialog
          agent={editAgent}
          onClose={() => setEditAgent(null)}
          onUpdated={() => { refresh(); setEditAgent(null) }}
        />
      )}

      {showSync && (
        <SyncVapiDialog
          onClose={() => setShowSync(false)}
          onImported={refresh}
        />
      )}
    </div>
  )
}
