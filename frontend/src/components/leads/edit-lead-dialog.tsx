'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateLead } from '@/lib/hooks/use-leads'
import type { Lead, LeadUpdate } from '@/types/lead'

interface EditLeadDialogProps {
  lead: Lead
  onClose: () => void
}

export function EditLeadDialog({ lead, onClose }: EditLeadDialogProps) {
  const updateLead = useUpdateLead()

  const [formData, setFormData] = useState<LeadUpdate>({
    name: lead.name,
    business_name: lead.business_name || '',
    phone: lead.phone,
    email: lead.email || '',
    address: lead.address || '',
    city: lead.city || '',
    state: lead.state || '',
    country: lead.country || '',
    postal_code: lead.postal_code || '',
    notes: lead.notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.name && !formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (formData.phone && !formData.phone.trim()) {
      newErrors.phone = 'Phone is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await updateLead.mutateAsync({ id: lead.id, lead: formData })
      onClose()
    } catch (error) {
      console.error('Failed to update lead:', error)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl my-8 border border-gray-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
              <Save className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Lead</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name - Required */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className={errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Business Name
            </label>
            <Input
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="Acme Corporation"
            />
          </div>

          {/* Phone - Required */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              className={errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className={errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main Street"
            />
          </div>

          {/* City, State, Country in one row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <Input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                State
              </label>
              <Input
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="NY"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Country
              </label>
              <Input
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="USA"
              />
            </div>
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Postal Code
            </label>
            <Input
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              placeholder="10001"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 text-base font-medium border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800"
              disabled={updateLead.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateLead.isPending}
              className="flex-1 h-12 text-base font-medium bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
            >
              {updateLead.isPending ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
