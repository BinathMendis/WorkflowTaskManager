import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Platform, TaskPriority } from '../../types/task.types'
import { platformLabels, priorityLabels } from '../../utils/enumHelpers'
import SelectField from '../common/SelectField'

export interface TaskQueueFilterValues {
  search: string
  company: string
  assignedUser: string
  platform: string
  priority: string
  dueFrom: string
  dueTo: string
}

interface Option {
  value: string
  label: string
}

interface Props {
  filters: TaskQueueFilterValues
  onChange: (filters: TaskQueueFilterValues) => void
  onClear: () => void
  companyOptions: Option[]
  assignedUserOptions: Option[]
  totalCount: number
  filteredCount: number
}

const inputClass = 'h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100'
const selectButtonClass = 'h-10 rounded-lg px-3 py-0 shadow-none'

export const emptyTaskQueueFilters: TaskQueueFilterValues = {
  search: '',
  company: '',
  assignedUser: '',
  platform: '',
  priority: '',
  dueFrom: '',
  dueTo: '',
}

export default function TaskQueueFilters({
  filters,
  onChange,
  onClear,
  companyOptions,
  assignedUserOptions,
  totalCount,
  filteredCount,
}: Props) {
  const hasFilters = Object.values(filters).some(Boolean)

  const updateFilter = (key: keyof TaskQueueFilterValues, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          Filters
          <span className="text-xs font-medium text-gray-400">
            {filteredCount} of {totalCount}
          </span>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search title, description, task ID"
            className={`${inputClass} w-full pl-9`}
          />
        </div>

        <SelectField
          value={filters.company}
          options={[{ value: '', label: 'All companies' }, ...companyOptions]}
          onChange={value => updateFilter('company', value)}
          buttonClassName={selectButtonClass}
        />

        <SelectField
          value={filters.assignedUser}
          options={[{ value: '', label: 'All assignees' }, ...assignedUserOptions]}
          onChange={value => updateFilter('assignedUser', value)}
          buttonClassName={selectButtonClass}
        />

        <SelectField
          value={filters.platform}
          options={[
            { value: '', label: 'All platforms' },
            ...Object.entries(platformLabels).map(([value, label]) => ({ value, label })),
          ]}
          onChange={value => updateFilter('platform', value)}
          buttonClassName={selectButtonClass}
        />

        <SelectField
          value={filters.priority}
          options={[
            { value: '', label: 'All priorities' },
            ...Object.entries(priorityLabels).map(([value, label]) => ({ value, label })),
          ]}
          onChange={value => updateFilter('priority', value)}
          buttonClassName={selectButtonClass}
        />

        <input
          type="date"
          value={filters.dueFrom}
          onChange={(event) => updateFilter('dueFrom', event.target.value)}
          className={inputClass}
          aria-label="Due from"
        />

        <input
          type="date"
          value={filters.dueTo}
          onChange={(event) => updateFilter('dueTo', event.target.value)}
          className={inputClass}
          aria-label="Due to"
        />
      </div>
    </div>
  )
}

export const getTaskPlatformFilterValue = (platform: Platform | string | number | null | undefined) => String(Number(platform))
export const getTaskPriorityFilterValue = (priority: TaskPriority | string | number | null | undefined) => String(Number(priority))
