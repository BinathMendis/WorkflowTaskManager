import { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { TaskFilterDto } from '../../types/task.types'
import { CompanyDto } from '../../types/company.types'
import { priorityLabels, platformLabels, statusOptions } from '../../utils/enumHelpers'
import SelectField from '../common/SelectField'

interface Props {
  filters: TaskFilterDto
  companies: CompanyDto[]
  isAdmin: boolean
  onChange: (filters: TaskFilterDto) => void
  onReset: () => void
}

export default function TaskFilterPanel({ filters, companies, isAdmin, onChange, onReset }: Props) {
  const [open, setOpen] = useState(false)

  const set = (key: keyof TaskFilterDto, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value === '' ? undefined : value, page: 1 })
  }

  const activeCount = [filters.companyId, filters.status, filters.platform, filters.priority, filters.dueDateFrom, filters.dueDateTo, filters.assignedUserId].filter(v => v !== undefined && v !== '').length

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700"
      >
        <span className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-red-600 text-white text-xs px-2 py-0.5">{activeCount}</span>
          )}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
              <SelectField
                value={filters.companyId === undefined ? '' : String(filters.companyId)}
                options={[
                  { value: '', label: 'All Companies' },
                  ...companies.map(company => ({ value: String(company.id), label: company.name })),
                ]}
                onChange={value => set('companyId', value ? Number(value) : undefined)}
                buttonClassName="rounded-lg px-3 py-2 shadow-none"
              />
            </div>

            {isAdmin && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Assigned User ID</label>
                <input
                  type="number"
                  value={filters.assignedUserId ?? ''}
                  onChange={e => set('assignedUserId', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="User ID..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <SelectField
                value={filters.status === undefined ? '' : String(filters.status)}
                options={[
                  { value: '', label: 'All Statuses' },
                  ...statusOptions.map(option => ({ value: String(option.value), label: option.label })),
                ]}
                onChange={value => set('status', value !== '' ? Number(value) : undefined)}
                buttonClassName="rounded-lg px-3 py-2 shadow-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
              <SelectField
                value={filters.priority === undefined ? '' : String(filters.priority)}
                options={[
                  { value: '', label: 'All Priorities' },
                  ...Object.entries(priorityLabels).map(([value, label]) => ({ value, label })),
                ]}
                onChange={value => set('priority', value !== '' ? Number(value) : undefined)}
                buttonClassName="rounded-lg px-3 py-2 shadow-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Platform</label>
              <SelectField
                value={filters.platform === undefined ? '' : String(filters.platform)}
                options={[
                  { value: '', label: 'All Platforms' },
                  ...Object.entries(platformLabels).map(([value, label]) => ({ value, label })),
                ]}
                onChange={value => set('platform', value !== '' ? Number(value) : undefined)}
                buttonClassName="rounded-lg px-3 py-2 shadow-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Due From</label>
              <input
                type="date"
                value={filters.dueDateFrom ?? ''}
                onChange={e => set('dueDateFrom', e.target.value || undefined)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Due To</label>
              <input
                type="date"
                value={filters.dueDateTo ?? ''}
                onChange={e => set('dueDateTo', e.target.value || undefined)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          {activeCount > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
