import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText, RotateCcw } from 'lucide-react'
import { getAllTasks } from '../api/taskService'
import { getCompanies } from '../api/companyService'
import { getUsers } from '../api/userService'
import { TaskDto, TaskFilterDto, TaskPriority } from '../types/task.types'
import { formatDate } from '../utils/dateHelpers'
import { getPlatformLabel, getStatusLabel, platformLabels, priorityLabels, statusOptions } from '../utils/enumHelpers'
import { formatTaskNumber } from '../utils/taskNumber'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import SelectField from '../components/common/SelectField'

const DEFAULT_FILTERS: TaskFilterDto = {
  page: 1,
  pageSize: 200,
  sortBy: 'dueDate',
  sortDescending: false,
}

const csvColumns = [
  'Task Number',
  'Task ID',
  'Title',
  'Description',
  'Company',
  'Assigned To',
  'Platform',
  'Priority',
  'Status',
  'Due Date',
  'Created At',
  'Updated At',
  'Approved By',
  'Approved At',
  'Published By',
  'Published At',
  'Rejection Reason',
]

const getPriorityLabel = (priority: TaskPriority | string | number | null | undefined) => {
  const numericPriority = Number(priority)
  return !Number.isNaN(numericPriority) && numericPriority in priorityLabels
    ? priorityLabels[numericPriority as TaskPriority]
    : String(priority || 'Unknown')
}

const formatReportDate = (value?: string) => {
  if (!value) return '-'
  return formatDate(value)
}

const escapeCsvValue = (value: string | number | null | undefined) => {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

const buildCsv = (tasks: TaskDto[]) => {
  const rows = tasks.map(task => [
    formatTaskNumber(task.id),
    task.id,
    task.title,
    task.description,
    task.companyName,
    task.assignedUserName,
    getPlatformLabel(task.platform),
    getPriorityLabel(task.priority),
    getStatusLabel(task.status),
    formatReportDate(task.dueDate),
    formatReportDate(task.createdAt),
    formatReportDate(task.updatedAt),
    task.approvedByUserName || '',
    formatReportDate(task.approvedAt),
    task.publishedByUserName || '',
    formatReportDate(task.publishedAt),
    task.rejectionReason || '',
  ])

  return [csvColumns, ...rows]
    .map(row => row.map(escapeCsvValue).join(','))
    .join('\n')
}

export default function TaskReportPage() {
  const [filters, setFilters] = useState<TaskFilterDto>(DEFAULT_FILTERS)

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['task-report', filters],
    queryFn: () => getAllTasks(filters),
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const setFilter = (key: keyof TaskFilterDto, value: string | number | boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value === '' ? undefined : value, page: 1 }))
  }

  const handleDownload = () => {
    const csv = buildCsv(tasks)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `task-report-${date}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" className="mt-12" />
  }

  if (error) {
    return <ErrorMessage message="Failed to load the task report. Please try again." />
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Report</h1>
          <p className="mt-0.5 text-sm text-gray-500">Preview and download all tasks using the filters below.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={tasks.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-red-600/20 transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">Report Filters</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Company</label>
            <SelectField
              value={filters.companyId === undefined ? '' : String(filters.companyId)}
              options={[
                { value: '', label: 'All Companies' },
                ...companies.map(company => ({ value: String(company.id), label: company.name })),
              ]}
              onChange={value => setFilter('companyId', value ? Number(value) : undefined)}
              buttonClassName="rounded-lg px-3 py-2 shadow-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Assigned User</label>
            <SelectField
              value={filters.assignedUserId === undefined ? '' : String(filters.assignedUserId)}
              options={[
                { value: '', label: 'All Users' },
                ...users.map(user => ({ value: String(user.id), label: user.username })),
              ]}
              onChange={value => setFilter('assignedUserId', value ? Number(value) : undefined)}
              buttonClassName="rounded-lg px-3 py-2 shadow-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
            <SelectField
              value={filters.status === undefined ? '' : String(filters.status)}
              options={[
                { value: '', label: 'All Statuses' },
                ...statusOptions.map(option => ({ value: String(option.value), label: option.label })),
              ]}
              onChange={value => setFilter('status', value !== '' ? Number(value) : undefined)}
              buttonClassName="rounded-lg px-3 py-2 shadow-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Priority</label>
            <SelectField
              value={filters.priority === undefined ? '' : String(filters.priority)}
              options={[
                { value: '', label: 'All Priorities' },
                ...Object.entries(priorityLabels).map(([value, label]) => ({ value, label })),
              ]}
              onChange={value => setFilter('priority', value !== '' ? Number(value) : undefined)}
              buttonClassName="rounded-lg px-3 py-2 shadow-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Platform</label>
            <SelectField
              value={filters.platform === undefined ? '' : String(filters.platform)}
              options={[
                { value: '', label: 'All Platforms' },
                ...Object.entries(platformLabels).map(([value, label]) => ({ value, label })),
              ]}
              onChange={value => setFilter('platform', value !== '' ? Number(value) : undefined)}
              buttonClassName="rounded-lg px-3 py-2 shadow-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Due From</label>
            <input
              type="date"
              value={filters.dueDateFrom ?? ''}
              onChange={event => setFilter('dueDateFrom', event.target.value || undefined)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Due To</label>
            <input
              type="date"
              value={filters.dueDateTo ?? ''}
              onChange={event => setFilter('dueDateTo', event.target.value || undefined)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Sort By</label>
            <SelectField
              value={filters.sortBy ?? 'dueDate'}
              options={[
                { value: 'dueDate', label: 'Due Date' },
                { value: 'createdAt', label: 'Created Date' },
                { value: 'title', label: 'Title' },
                { value: 'companyName', label: 'Company' },
                { value: 'assignedUserName', label: 'Assigned User' },
              ]}
              onChange={value => setFilter('sortBy', value)}
              buttonClassName="rounded-lg px-3 py-2 shadow-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Sort Direction</label>
            <SelectField
              value={filters.sortDescending ? 'desc' : 'asc'}
              options={[
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' },
              ]}
              onChange={value => setFilter('sortDescending', value === 'desc')}
              buttonClassName="rounded-lg px-3 py-2 shadow-none"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
          <p className="text-xs text-gray-500">Showing all matching tasks</p>
        </div>

        {tasks.length === 0 ? (
          <div className="py-14 text-center text-sm text-gray-400">No tasks match the selected filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {csvColumns.slice(0, 11).map(column => (
                    <th key={column} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {tasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-red-700">{formatTaskNumber(task.id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.id}</td>
                    <td className="min-w-56 px-4 py-3 text-sm font-medium text-gray-900">{task.title}</td>
                    <td className="min-w-72 px-4 py-3 text-sm text-gray-600">{task.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.companyName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.assignedUserName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getPlatformLabel(task.platform)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getPriorityLabel(task.priority)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getStatusLabel(task.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatReportDate(task.dueDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatReportDate(task.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
