'use client'

import { useState, useEffect } from 'react'
import { X, Bot, Loader2, Mic, Brain, Volume2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { agentsApi } from '@/lib/api/agents'
import { CATEGORY_LIST, LANGUAGE_LIST } from '@/lib/call-utils'
import type { Agent, AgentCategory, AgentLanguage, AgentVoice, AgentTranscriber, AgentModel } from '@/types/agent'
import type { VapiOptionsResponse } from '@/app/api/vapi/options/route'

interface EditAgentDialogProps {
  agent: Agent
  onClose: () => void
  onUpdated: () => void
}

const ACTIVE_STYLES: Record<string, string> = {
  blue:   'border-blue-500 bg-blue-50 dark:bg-blue-500/10',
  purple: 'border-purple-500 bg-purple-50 dark:bg-purple-500/10',
  amber:  'border-amber-500 bg-amber-50 dark:bg-amber-500/10',
}
const CHECK_COLOR: Record<string, string> = {
  blue: 'text-blue-500', purple: 'text-purple-500', amber: 'text-amber-500',
}
const PROVIDER_COLOR: Record<string, string> = {
  openai:      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  azure:       'bg-blue-100  dark:bg-blue-900/30  text-blue-700  dark:text-blue-300',
  google:      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  deepgram:    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  talkscriber: 'bg-pink-100   dark:bg-pink-900/30   text-pink-700   dark:text-pink-300',
}
const GENDER_ICON: Record<string, string> = { female: '♀', male: '♂', neutral: '◈' }

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-gray-400">{icon}</span>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  )
}

function OptionCard({
  label, badge, description, provider, recommended, active, activeColor, onClick,
}: {
  label: string
  badge?: string
  description: string
  provider: string
  recommended?: boolean
  active: boolean
  activeColor: 'blue' | 'purple' | 'amber'
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-start gap-2 p-2.5 rounded-lg border-2 text-left transition-all cursor-pointer ${
        active
          ? ACTIVE_STYLES[activeColor]
          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-500'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{label}</span>
          {badge && <span className="text-[10px] text-gray-400">{badge}</span>}
          {recommended && (
            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              ★ Best
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight line-clamp-2">{description}</p>
        <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded mt-1 ${PROVIDER_COLOR[provider] ?? 'bg-gray-100 text-gray-600'}`}>
          {provider}
        </span>
      </div>
      {active && <CheckCircle2 className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${CHECK_COLOR[activeColor]}`} />}
    </button>
  )
}

export function EditAgentDialog({ agent, onClose, onUpdated }: EditAgentDialogProps) {
  const [name, setName] = useState(agent.name)
  const [description, setDescription] = useState(agent.description || '')
  const [category, setCategory] = useState<AgentCategory>(agent.category)
  const [language, setLanguage] = useState<AgentLanguage>(agent.language)
  const [systemPrompt, setSystemPrompt] = useState(agent.system_prompt)
  const [firstMessage, setFirstMessage] = useState(agent.first_message)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [options, setOptions] = useState<VapiOptionsResponse | null>(null)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<AgentVoice | null>(null)
  const [selectedTranscriber, setSelectedTranscriber] = useState<AgentTranscriber | null>(null)
  const [selectedModel, setSelectedModel] = useState<AgentModel | null>(null)

  useEffect(() => {
    setOptionsLoading(true)
    setOptions(null)
    fetch(`/api/vapi/options?language=${language}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data: VapiOptionsResponse) => {
        setOptions(data)
        const rec = <T extends { recommended?: boolean }>(arr: T[]) => arr.find(o => o.recommended) ?? arr[0]
        const rv = rec(data.voices)
        const rt = rec(data.transcribers)
        const rm = rec(data.models)
        setSelectedVoice({ provider: rv.provider, voiceId: rv.voiceId })
        setSelectedTranscriber({ provider: rt.provider, language: rt.language, model: rt.model })
        setSelectedModel({ provider: rm.provider, model: rm.model })
      })
      .catch(() => {/* options are optional */})
      .finally(() => setOptionsLoading(false))
  }, [language])

  const handleSave = async () => {
    if (!name.trim() || !systemPrompt.trim() || !firstMessage.trim()) return
    setIsSaving(true)
    setError(null)
    try {
      await agentsApi.update(agent.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        language,
        system_prompt: systemPrompt.trim(),
        first_message: firstMessage.trim(),
        vapi_assistant_id: agent.vapi_assistant_id,
        voice:       selectedVoice       ?? undefined,
        transcriber: selectedTranscriber ?? undefined,
        llm:         selectedModel       ?? undefined,
      })
      onUpdated()
    } catch (err: any) {
      setError(err.message || 'Failed to update agent')
    } finally {
      setIsSaving(false)
    }
  }

  const isValid = name.trim() && systemPrompt.trim() && firstMessage.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Agent</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Changes applied to Vapi and saved locally</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Agent Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Category + Language */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORY_LIST.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id as AgentCategory)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                      category === cat.id
                        ? 'bg-amber-500 border-amber-400 text-white'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Language</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                {LANGUAGE_LIST.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as AgentLanguage)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border-2 text-xs font-medium transition-all text-left ${
                      language === lang.code
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400 text-white shadow-lg'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="truncate">{lang.nativeLabel}</span>
                    {lang.code !== 'en' && (
                      <span className={`text-[10px] shrink-0 ${language === lang.code ? 'text-amber-200' : 'text-gray-400'}`}>{lang.label}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── AI Configuration ── */}
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
              <Brain className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Configuration</span>
              {optionsLoading && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
                  <Loader2 className="h-3 w-3 animate-spin" /> Connecting to Vapi…
                </span>
              )}
            </div>

            <div className="p-4 space-y-4 bg-white dark:bg-slate-900">
              {optionsLoading && (
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 rounded-lg bg-gray-100 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
              )}

              {options && (
                <>
                  <Section icon={<Volume2 className="h-3.5 w-3.5" />} label="Voice">
                    <div className="grid grid-cols-2 gap-1.5">
                      {options.voices.map(v => {
                        const active = selectedVoice?.provider === v.provider && selectedVoice?.voiceId === v.voiceId
                        return (
                          <OptionCard
                            key={`${v.provider}-${v.voiceId}`}
                            label={v.label}
                            badge={GENDER_ICON[v.gender ?? 'neutral']}
                            description={v.description}
                            provider={v.provider}
                            recommended={v.recommended}
                            active={active}
                            activeColor="blue"
                            onClick={() => setSelectedVoice({ provider: v.provider, voiceId: v.voiceId })}
                          />
                        )
                      })}
                    </div>
                  </Section>

                  <Section icon={<Mic className="h-3.5 w-3.5" />} label="Speech Recognition">
                    <div className="grid grid-cols-2 gap-1.5">
                      {options.transcribers.map(t => {
                        const key = `${t.provider}-${t.language}-${t.model ?? ''}`
                        const active =
                          selectedTranscriber?.provider === t.provider &&
                          selectedTranscriber?.language === t.language &&
                          (selectedTranscriber?.model ?? '') === (t.model ?? '')
                        return (
                          <OptionCard
                            key={key}
                            label={t.label}
                            description={t.description}
                            provider={t.provider}
                            recommended={t.recommended}
                            active={active}
                            activeColor="purple"
                            onClick={() => setSelectedTranscriber({ provider: t.provider, language: t.language, model: t.model })}
                          />
                        )
                      })}
                    </div>
                  </Section>

                  <Section icon={<Brain className="h-3.5 w-3.5" />} label="Language Model (LLM)">
                    <div className="grid grid-cols-2 gap-1.5">
                      {options.models.map(m => {
                        const key = `${m.provider}-${m.model}`
                        const active = selectedModel?.provider === m.provider && selectedModel?.model === m.model
                        return (
                          <OptionCard
                            key={key}
                            label={m.label}
                            description={m.description}
                            provider={m.provider}
                            recommended={m.recommended}
                            active={active}
                            activeColor="amber"
                            onClick={() => setSelectedModel({ provider: m.provider, model: m.model })}
                          />
                        )
                      })}
                    </div>
                  </Section>
                </>
              )}
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              System Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={5}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Opening Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Opening Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={firstMessage}
              onChange={e => setFirstMessage(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            {isSaving
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
              : <><Bot className="h-4 w-4 mr-2" />Save Changes</>}
          </Button>
        </div>
      </div>
    </div>
  )
}
