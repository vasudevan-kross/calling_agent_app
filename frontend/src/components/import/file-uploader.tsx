'use client'

import { useCallback, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useImportFile } from '@/lib/hooks/use-import'
import { cn } from '@/lib/utils/cn'

export function FileUploader() {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const importFile = useImportFile()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      await importFile.mutateAsync(selectedFile)
      setSelectedFile(null)
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'glass-card border-2 border-dashed transition-all',
          dragActive ? 'border-primary bg-primary/10' : 'border-white/20',
          'hover:border-primary/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
          <Upload
            className={cn(
              'h-12 w-12 mb-4 transition-colors',
              dragActive ? 'text-primary' : 'text-tertiary'
            )}
          />
          <p className="text-lg font-medium mb-2">
            Drop your file here, or{' '}
            <span className="text-primary">browse</span>
          </p>
          <p className="text-sm text-secondary">
            Supports PDF, Excel, Word, and CSV files
          </p>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.xlsx,.xls,.csv,.docx,.doc"
            onChange={handleChange}
          />
        </label>
      </div>

      {selectedFile && (
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-secondary">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={importFile.isPending}
            >
              {importFile.isPending ? 'Uploading...' : 'Upload'}
            </Button>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-secondary hover:text-white"
              disabled={importFile.isPending}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
