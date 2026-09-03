import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { LayoutGrid, Table2, Plus } from 'lucide-react'
import { getTasks } from '../api/taskService'
import { getCompanies } from '../api/companyService'
import { TaskFilterDto } from '../types/task.types'
import { useAuth } from '../context/AuthContext'
import TaskFilterPanel from '../components/tasks/TaskFilterPanel'
import TaskCard from '../components/tasks/TaskCard'
import TaskTable from '../components/tasks/TaskTable'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import Pagination from '../components/common/Pagination'

const DEFAULT_FILTERS: TaskFilterDto = { page: 1, pageSize: 20, sortBy: 'duedate', sortDescending: false }

export default function TaskListPage() {
  const { state } = useAuth()
  const isAdmin = state.role === 'Admin'
  const [filters, setFilters] = useState<TaskFilterDto>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')

  // Get total count from response if needed
  const { data: tasksResponse, isLoading, error } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => getTasks(filters),
  })

  // Extract tasks array from response
  const tasks = Array.isArray(tasksResponse) ? tasksResponse : []

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  })

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortDescending: prev.sortBy === field ? !prev.sortDescending : false,
      page: 1,
    }))
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" className="mt-12" />
  }

  if (error) {
    console.error('Error loading tasks:', error)
    return <ErrorMessage message="Failed to load tasks. Please try again." />
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tasks</h1>
          <p className="text-gray-500 text-sm mt-0.5">{tasks.length} tasks found</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Table2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {isAdmin && (
            <Link
              to="/tasks/create"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 shadow-sm shadow-red-600/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Task
            </Link>
          )}
        </div>
      </div>

      <TaskFilterPanel
        filters={filters}
        companies={companies}
        isAdmin={isAdmin}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm">No tasks found</p>
          {isAdmin && (
            <Link
              to="/tasks/create"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700"
            >
              <Plus className="h-4 w-4" />
              Create First Task
            </Link>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <TaskTable
          tasks={tasks}
          sortBy={filters.sortBy || 'duedate'}
          sortDescending={filters.sortDescending || false}
          onSort={handleSort}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map(task => <TaskCard key={task.id} task={task} />)}
        </div>
      )}

      {tasks.length > 0 && (
        <Pagination
          page={filters.page || 1}
          pageSize={filters.pageSize || 20}
          total={tasks.length * (filters.page || 1)}
          onPageChange={p => setFilters(prev => ({ ...prev, page: p }))}
        />
      )}
    </div>
  )
}
