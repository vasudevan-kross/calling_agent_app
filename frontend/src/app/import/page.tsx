'use client'

import { FileUploader } from '@/components/import/file-uploader'

export default function ImportPage() {
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Import Leads</h1>
          <p className="text-secondary mt-1">
            Upload files to import contacts in bulk
          </p>
        </div>

        <FileUploader />

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Supported File Formats</h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-white/80">
            <li>• <strong>Excel</strong> (.xlsx, .xls) - Structured data with columns</li>
            <li>• <strong>CSV</strong> (.csv) - Comma-separated values</li>
            <li>• <strong>PDF</strong> (.pdf) - Extracts text and tables</li>
            <li>• <strong>Word</strong> (.docx, .doc) - Extracts tables and text</li>
          </ul>

          <div className="mt-6">
            <h3 className="font-medium mb-2">Expected Columns</h3>
            <p className="text-sm text-secondary">
              The system will automatically detect columns named: name, phone, email,
              address, city, state, business, company, etc.
            </p>
            <p className="text-sm text-secondary mt-2">
              <strong>Note:</strong> Phone number column is required.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
