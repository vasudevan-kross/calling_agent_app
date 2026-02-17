'use client'

import { useState } from 'react'
import { X, Download, Bot, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { agentsApi } from '@/lib/api/agents'
import { CATEGORY_LIST, LANGUAGE_LIST } from '@/lib/call-utils'

interface SyncVapiDialogProps {
  onClose: () => void
  onImported: () => void
}

export function SyncVapiDialog({ onClose, onImported }: SyncVapiDialogProps) {
  const [vapiAssistants, setVapiAssistants] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)
  const [imported, setImported] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  // Selected meta per assistant (category + language for import)
  const [meta, setMeta] = useState<Record<string, { category: string; language: string }>>({})

  const fetchUnimported = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await agentsApi.getUnimported()
      setVapiAssistants(data)
      // Initialize default meta
      const defaults: Record<string, { category: string; language: string }> = {}
      data.forEach((a: any) => { defaults[a.id] = { category: 'general', language: 'en' } })
      setMeta(defaults)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Vapi assistants')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async (assistant: any) => {
    setImporting(assistant.id)
    try {
      await agentsApi.importFromVapi(assistant, meta[assistant.id] || { category: 'general', language: 'en' })
      setImported(prev => new Set([...prev, assistant.id]))
      onImported()
    } catch (err: any) {
      setError(err.message || 'Failed to import agent')
    } finally {
      setImporting(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 shadow-lg">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Import from Vapi</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Import existing Vapi assistants into your app</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {vapiAssistants === null ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Fetch all assistants from your Vapi account that haven't been imported yet.
              </p>
              <Button
                onClick={fetchUnimported}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Fetching...</> : <><Download className="h-4 w-4 mr-2" />Fetch from Vapi</>}
              </Button>
              {error && <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>}
            </div>
          ) : vapiAssistants.length === 0 ? (
            <div className="text-center py-12">
              <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-700 dark:text-gray-300 font-medium">All Vapi assistants are already imported!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {vapiAssistants.length} assistant{vapiAssistants.length !== 1 ? 's' : ''} found. Set category and language before importing.
              </p>
              {vapiAssistants.map(assistant => {
                const isImported = imported.has(assistant.id)
                const isImporting = importing === assistant.id
                const assistantMeta = meta[assistant.id] || { category: 'general', language: 'en' }
                return (
                  <div key={assistant.id} className={`p-4 rounded-xl border-2 transition-all ${isImported ? 'border-green-400 dark:border-green-500/50 bg-green-50 dark:bg-green-500/10' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{assistant.name}</p>
                        {assistant.firstMessage && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate italic">"{assistant.firstMessage}"</p>
                        )}
                        <p className="text-[10px] font-mono text-gray-400 dark:text-gray-600 mt-1">{assistant.id}</p>
                      </div>
                      {isImported ? (
                        <span className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                          <Check className="h-4 w-4" /> Imported
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleImport(assistant)}
                          disabled={isImporting}
                          className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          {isImporting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Import'}
                        </Button>
                      )}
                    </div>

                    {!isImported && (
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                          <select
                            value={assistantMeta.category}
                            onChange={e => setMeta(prev => ({ ...prev, [assistant.id]: { ...prev[assistant.id], category: e.target.value } }))}
                            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                          >
                            {CATEGORY_LIST.map(c => (
                              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Language</label>
                          <select
                            value={assistantMeta.language}
                            onChange={e => setMeta(prev => ({ ...prev, [assistant.id]: { ...prev[assistant.id], language: e.target.value } }))}
                            className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                          >
                            {LANGUAGE_LIST.map(l => (
                              <option key={l.code} value={l.code}>{l.nativeLabel}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {error && <p className="text-sm text-red-500 dark:text-red-400 mt-2">{error}</p>}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-slate-700">
          <Button variant="outline" onClick={onClose} className="w-full h-11">Close</Button>
        </div>
      </div>
    </div>
  )
}
