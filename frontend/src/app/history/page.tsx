'use client'

import { useState, useRef, useEffect } from 'react'
import { RefreshCw, Download, Play, Pause, ArrowUpRight, ArrowDownLeft, Loader2, CloudDownload, Brain } from 'lucide-react'
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

// ── mini audio player ──────────────────────────────────────────────────────

const BAR_HEIGHTS = [35, 55, 75, 90, 65, 80, 45, 70, 55, 85, 60, 40, 70, 50, 65]

function MiniAudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime  = () => {
      setCurrentTime(audio.currentTime)
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    }
    const onMeta  = () => setDuration(audio.duration || 0)
    const onEnd   = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnd)
    }
  }, [])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) { audio.pause(); setIsPlaying(false) }
    else           { audio.play();  setIsPlaying(true)  }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * audio.duration
  }

  return (
    <div
      onClick={e => e.stopPropagation()}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl
        bg-gradient-to-r from-slate-100 to-gray-100
        dark:from-slate-800/80 dark:to-slate-700/60
        border border-gray-200/80 dark:border-slate-600/50
        backdrop-blur-sm shadow-sm
        w-[200px] group"
    >
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Play / Pause button */}
      <button
        onClick={toggle}
        className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full
          bg-gradient-to-br from-violet-500 to-indigo-600
          dark:from-violet-400 dark:to-indigo-500
          text-white shadow-md shadow-violet-500/30
          hover:shadow-violet-500/50 hover:scale-105
          active:scale-95 transition-all duration-150 cursor-pointer"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying
          ? <Pause  className="h-3 w-3 fill-current" />
          : <Play   className="h-3 w-3 fill-current ml-0.5" />}
      </button>

      {/* Waveform + progress */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {/* Animated waveform bars */}
        <div className="flex items-end gap-[2px] h-5">
          {BAR_HEIGHTS.map((h, i) => {
            const isPast = i / BAR_HEIGHTS.length < progress / 100
            return (
              <div
                key={i}
                className={`flex-1 rounded-full ${isPlaying ? 'wave-bar-playing' : ''}`}
                style={{
                  height: `${Math.max(20, h * (isPlaying ? 1 : 0.35))}%`,
                  backgroundImage: isPast
                    ? 'linear-gradient(to top, #7c3aed, #6366f1)'
                    : 'linear-gradient(to top, #d1d5db, #9ca3af)',
                  ['--bar-duration' as string]: `${0.55 + (i % 5) * 0.12}s`,
                  animationDelay: `${(i % 7) * 0.07}s`,
                  transition: 'height 0.2s ease',
                }}
              />
            )
          })}
        </div>

        {/* Seek bar */}
        <div
          className="relative h-1 rounded-full bg-gray-200 dark:bg-slate-600 cursor-pointer overflow-hidden"
          onClick={seek}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Time */}
      <span className="flex-shrink-0 text-[9px] font-mono font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
        {isPlaying || currentTime > 0
          ? fmt(currentTime)
          : duration > 0 ? fmt(duration) : '--:--'}
      </span>
    </div>
  )
}

// ── recording cell ─────────────────────────────────────────────────────────

function RecordingCell({ url, onFetch, fetching }: { url?: string; onFetch?: () => void; fetching?: boolean }) {
  if (!url) return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
        border border-dashed border-gray-200 dark:border-slate-700
        bg-gray-50 dark:bg-slate-800/40 w-[200px]">
        <div className="flex items-end gap-[2px] h-4 flex-1">
          {[30,45,25,55,35,50,30,40,45,28,50,35,45,30,40].map((h, i) => (
            <div key={i} className="flex-1 rounded-full bg-gray-200 dark:bg-slate-700"
              style={{ height: `${h}%` }} />
          ))}
        </div>
        <span className="text-[9px] font-medium text-gray-400 dark:text-gray-600 whitespace-nowrap">No audio</span>
      </div>
      {onFetch && (
        <button
          onClick={e => { e.stopPropagation(); onFetch() }}
          disabled={fetching}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold
            border border-violet-200 dark:border-violet-700/50
            text-violet-600 dark:text-violet-400
            hover:bg-violet-50 dark:hover:bg-violet-900/20
            disabled:opacity-50 transition-all cursor-pointer"
        >
          {fetching ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Fetch
        </button>
      )}
    </div>
  )
  return <MiniAudioPlayer url={url} />
}

// ── main page ──────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { data: calls, isLoading, refetch } = useCalls({ limit: 100 })
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [fetchingRecording, setFetchingRecording] = useState<Set<string>>(new Set())
  const [syncingRecordings, setSyncingRecordings] = useState(false)
  const [syncResult, setSyncResult] = useState<{ updated: number } | null>(null)
  const [analyzingAll, setAnalyzingAll] = useState(false)
  const [analyzeResult, setAnalyzeResult] = useState<{ done: number } | null>(null)
  const queryClient = useQueryClient()

  async function handleSyncRecordings() {
    setSyncingRecordings(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/calls/sync-recordings', { method: 'POST' })
      const data = await res.json()
      setSyncResult({ updated: data.updated ?? 0 })
      if ((data.updated ?? 0) > 0) queryClient.invalidateQueries({ queryKey: ['calls'] })
      setTimeout(() => setSyncResult(null), 5000)
    } catch {
      setSyncResult({ updated: 0 })
    } finally {
      setSyncingRecordings(false)
    }
  }

  async function handleAnalyzeAll() {
    if (!calls || calls.length === 0) return
    setAnalyzingAll(true)
    setAnalyzeResult(null)
    // Only analyze completed calls that don't have a real AI score yet
    const toAnalyze = calls.filter(c =>
      (c.status === 'completed' || c.status === 'ended') &&
      !c.metadata?.ai_score &&
      (c.transcript || []).filter((m: { role: string }) => m.role !== 'system').length >= 2
    )
    let done = 0
    for (const call of toAnalyze) {
      try {
        await fetch(`/api/calls/${call.id}/analyze`, { method: 'POST' })
        done++
      } catch { /* skip */ }
    }
    setAnalyzeResult({ done })
    if (done > 0) queryClient.invalidateQueries({ queryKey: ['calls'] })
    setTimeout(() => setAnalyzeResult(null), 6000)
    setAnalyzingAll(false)
  }

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
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 animate-slide-up stagger-1">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Call Logs</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Comprehensive history of all AI telephonic interactions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAnalyzeAll}
              disabled={analyzingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-700 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50 transition-all"
            >
              {analyzingAll
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Brain className="h-4 w-4" />}
              {analyzeResult !== null
                ? `${analyzeResult.done} analysed`
                : 'AI Score All'}
            </button>
            <button
              onClick={handleSyncRecordings}
              disabled={syncingRecordings}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-700 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 transition-all"
            >
              {syncingRecordings
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CloudDownload className="h-4 w-4" />}
              {syncResult !== null
                ? `${syncResult.updated} updated`
                : 'Sync Recordings'}
            </button>
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
        <div className="rounded-xl border border-white/60 dark:border-slate-700/50 bg-white/75 dark:bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-lg animate-slide-up stagger-2">
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
