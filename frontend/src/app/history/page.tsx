'use client'

import { useState } from 'react'
import { RefreshCw, Download, Play, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react'
import { useCalls } from '@/lib/hooks/use-calls'
import { CallLogDetails } from '@/components/calls/call-log-details'
import { Skeleton } from '@/components/ui/skeleton'
import { useQueryClient } from '@tanstack/react-query'
import type { Call } from '@/types/call'

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDuration(s?: number) {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}m ${sec}s`
}

function computeScore(call: Call): number {
  if (call.metadata?.ai_score) return Number(call.metadata.ai_score)
  const done = call.status === 'completed' || call.status === 'ended'
  if (!done) return 0
  const hasConv = (call.transcript || []).filter(m => m.role !== 'system').length > 2
  if (hasConv && (call.duration_seconds || 0) > 60) return 75
  if (hasConv) return 50
  return 20
}

// ── status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed:   { label: 'CONTACT SUCCESSFUL', cls: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' },
    ended:       { label: 'CONTACT SUCCESSFUL', cls: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' },
    failed:      { label: 'CALL FAILED',         cls: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30' },
    no_answer:   { label: 'NO ANSWER',           cls: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' },
    in_progress: { label: 'IN PROGRESS',         cls: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30' },
    initiated:   { label: 'INITIATED',           cls: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600' },
  }
  const cfg = map[status] || { label: status.toUpperCase(), cls: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide whitespace-nowrap ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ── ai score cell ──────────────────────────────────────────────────────────

function AiScoreCell({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-600 dark:text-emerald-400'
    : score >= 40 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-500 dark:text-red-400'
  const label = score >= 70 ? 'QUALIFIED' : 'UNQUALIFIED'

  return (
    <div>
      <div className={`text-sm font-black ${color}`}>{score}%</div>
      <div className={`text-[9px] font-bold ${color}`}>{label}</div>
    </div>
  )
}

// ── recording cell ─────────────────────────────────────────────────────────

function RecordingCell({ url, onFetch, fetching }: { url?: string; onFetch?: () => void; fetching?: boolean }) {
  if (!url) return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-400 dark:text-gray-500 italic">Not available</span>
      {onFetch && (
        <button
          onClick={e => { e.stopPropagation(); onFetch() }}
          disabled={fetching}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all"
        >
          {fetching ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Fetch
        </button>
      )}
    </div>
  )
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={e => { e.stopPropagation(); window.open(url, '_blank') }}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-80 transition-opacity flex-shrink-0"
      >
        <Play className="h-3 w-3 ml-0.5" />
      </button>
      <audio src={url} className="h-6 max-w-[120px]" controls preload="none" onClick={e => e.stopPropagation()} />
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { data: calls, isLoading, refetch } = useCalls({ limit: 100 })
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [fetchingRecording, setFetchingRecording] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()

  async function handleFetchRecording(callId: string) {
    setFetchingRecording(prev => new Set(prev).add(callId))
    try {
      await fetch(`/api/calls/${callId}/recording`)
      queryClient.invalidateQueries({ queryKey: ['calls'] })
    } catch (e) {
      console.error('Failed to fetch recording', e)
    } finally {
      setFetchingRecording(prev => { const s = new Set(prev); s.delete(callId); return s })
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4 sm:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Call Logs</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Comprehensive history of all AI telephonic interactions.
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
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800">
                  {['Lead', 'Context / Agent', 'Date & Time', 'Duration', 'Status', 'AI Score', 'Call Recording', 'Action'].map(col => (
                    <th
                      key={col}
                      className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : calls && calls.length > 0 ? (
                  calls.map(call => {
                    const score = computeScore(call)
                    const leadName = call.leads?.name || 'Unknown Lead'
                    const leadPhone = call.leads?.phone || '—'

                    return (
                      <tr
                        key={call.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Lead */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-gray-900 dark:text-white">{leadName}</span>
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                              call.direction === 'inbound'
                                ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {call.direction === 'inbound'
                                ? <ArrowDownLeft className="h-2.5 w-2.5" />
                                : <ArrowUpRight className="h-2.5 w-2.5" />}
                              {call.direction}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{leadPhone}</div>
                        </td>

                        {/* Context / Agent */}
                        <td className="px-4 py-4 max-w-[220px]">
                          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest truncate">
                            {call.metadata?.call_type === 'web_call' ? 'WEB CALL' : 'ONE-OFF CALL'}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-gray-400 dark:text-gray-500 text-xs">⚙</span>
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate" title={call.purpose || ''}>
                              {call.purpose
                                ? call.purpose.length > 40 ? call.purpose.slice(0, 40) + '…' : call.purpose
                                : 'AI Voice Agent'}
                            </span>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-gray-900 dark:text-white">{formatDate(call.start_time || call.created_at)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{formatTime(call.start_time || call.created_at)}</div>
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {formatDuration(call.duration_seconds)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <StatusBadge status={call.status} />
                        </td>

                        {/* AI Score */}
                        <td className="px-4 py-4">
                          <AiScoreCell score={score} />
                        </td>

                        {/* Recording */}
                        <td className="px-4 py-4">
                          <RecordingCell
                            url={call.recording_url}
                            onFetch={call.provider_call_id ? () => handleFetchRecording(call.id) : undefined}
                            fetching={fetchingRecording.has(call.id)}
                          />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-4">
                          <button
                            onClick={() => setSelectedCall(call)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600 transition-all flex items-center gap-1"
                          >
                            <span className="w-3 h-3 rounded-sm border border-current opacity-60 inline-block" />
                            Details
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-gray-500 dark:text-gray-400">
                      No calls yet. Start calling to see your history here!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      {selectedCall && (
        <CallLogDetails
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </div>
  )
}
