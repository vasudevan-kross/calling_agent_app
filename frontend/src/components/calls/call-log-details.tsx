'use client'

import { useState } from 'react'
import { X, Calendar, Clock, Timer, Brain, Bot, User } from 'lucide-react'
import type { Call } from '@/types/call'

interface CallLogDetailsProps {
  call: Call
  onClose: () => void
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function computeAiScore(call: Call): number {
  if (call.metadata?.ai_score) return Number(call.metadata.ai_score)
  if (call.status === 'completed' || call.status === 'ended') {
    const hasTranscript = call.transcript && call.transcript.length > 2
    const duration = call.duration_seconds || 0
    if (hasTranscript && duration > 60) return 75
    if (hasTranscript) return 50
    return 20
  }
  return 0
}

function getQualificationLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'QUALIFIED', color: 'text-emerald-600 dark:text-emerald-400' }
  if (score >= 40) return { label: 'PARTIAL', color: 'text-amber-600 dark:text-amber-400' }
  return { label: 'UNQUALIFIED', color: 'text-red-500 dark:text-red-400' }
}

export function CallLogDetails({ call, onClose }: CallLogDetailsProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary')
  const score = computeAiScore(call)
  const qualification = getQualificationLabel(score)
  const shortId = call.provider_call_id?.slice(-7).toUpperCase() || call.id.slice(-7).toUpperCase()
  const language = (call.metadata?.language as string) || 'en'

  const conversationMessages = (call.transcript || []).filter(m => m.role !== 'system')

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Call Log Details</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              In-depth analysis and complete conversation history.
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600">
              {shortId}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 px-6">
          {(['summary', 'transcript'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'summary' ? (
            <div className="p-6 space-y-6">
              {/* Date / Time / Duration Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                  <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 mb-1" />
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Date</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white text-center leading-tight">
                    {formatDate(call.start_time || call.created_at)}
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                  <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500 mb-1" />
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Time</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {formatTime(call.start_time || call.created_at)}
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                  <Timer className="h-4 w-4 text-gray-400 dark:text-gray-500 mb-1" />
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Duration</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {call.duration_seconds ? `${call.duration_seconds}s` : '—'}
                  </span>
                </div>
              </div>

              {/* AI Intelligence */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">AI Intelligence</span>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-4 space-y-4">
                  {/* Score */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">
                        Conversation Summary
                      </span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {call.summary || (conversationMessages.length > 0
                          ? `Call completed with ${conversationMessages.length} exchanges. Purpose: "${call.purpose}"`
                          : `AI call regarding: "${call.purpose || 'General inquiry'}"`)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-xs font-bold ${qualification.color} mb-0.5`}>
                        ✓ {qualification.label}
                      </div>
                      <div className={`text-2xl font-black ${qualification.color}`}>
                        {score}%
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">AI SCORE</div>
                    </div>
                  </div>

                  <div className="h-px bg-gray-200 dark:bg-slate-700" />

                  {/* Language */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">
                        Language
                      </span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {language === 'ta' ? 'தமிழ் (Tamil)' : 'English'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">
                        Provider
                      </span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
                        {call.provider}
                      </span>
                    </div>
                  </div>

                  {call.summary && (
                    <>
                      <div className="h-px bg-gray-200 dark:bg-slate-700" />
                      <div>
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">
                          Logic & Reasoning
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed">
                          "{call.summary}"
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recording */}
              {call.recording_url && (
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                    Call Recording
                  </span>
                  <audio
                    controls
                    src={call.recording_url}
                    className="w-full rounded-lg"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Transcript Tab */
            <div className="p-6">
              {conversationMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
                  No transcript available for this call.
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationMessages.map((msg, i) => {
                    const isAgent = msg.role === 'assistant'
                    return (
                      <div key={i} className={`flex flex-col gap-1 ${isAgent ? '' : 'items-end'}`}>
                        <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 ${isAgent ? '' : 'justify-end'}`}>
                          {isAgent ? (
                            <><Bot className="h-3 w-3" /> AI Agent</>
                          ) : (
                            <>{call.leads?.name?.toUpperCase() || 'USER'} <User className="h-3 w-3" /></>
                          )}
                        </div>
                        <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          isAgent
                            ? 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-tr-sm self-end'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
