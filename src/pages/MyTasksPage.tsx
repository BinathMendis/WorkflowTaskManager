import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMyTasks } from '../api/taskService'
import { TaskDto, TaskStatus } from '../types/task.types'
import { getStatusValue, statusLabels } from '../utils/enumHelpers'
import TaskCard from '../components/tasks/TaskCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'

const TABS: { key: TaskStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: TaskStatus.Pending, label: statusLabels[TaskStatus.Pending] },
  { key: TaskStatus.Accepted, label: statusLabels[TaskStatus.Accepted] },
  { key: TaskStatus.InProgress, label: statusLabels[TaskStatus.InProgress] },
  { key: TaskStatus.Completed, label: statusLabels[TaskStatus.Completed] },
  { key: TaskStatus.Rejected, label: statusLabels[TaskStatus.Rejected] },
]

export default function MyTasksPage() {
  const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all')

  const { data: tasks = [], isLoading, error, isError, refetch } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: getMyTasks,
    retry: 1,
    staleTime: 0,
  })

  // Ensure tasks is an array
  const tasksArray = (Array.isArray(tasks) ? tasks : []).filter(
    (task: TaskDto) => getStatusValue(task.status) !== TaskStatus.Published
  )
  
  // Filter tasks based on active tab (convert both to numbers for comparison)
  const filtered = activeTab === 'all' 
    ? tasksArray 
    : tasksArray.filter((t: TaskDto) => {
        const taskStatusValue = getStatusValue(t.status)
        return taskStatusValue === activeTab
      })

  const countForTab = (key: TaskStatus | 'all') => {
    if (key === 'all') {
      return tasksArray.length
    }
    return tasksArray.filter((t: TaskDto) => {
      const taskStatusValue = getStatusValue(t.status)
      return taskStatusValue === key
    }).length
  }

  // Auto-refetch when tab changes to get updated counts
  const handleTabChange = (tab: TaskStatus | 'all') => {
    setActiveTab(tab)
    refetch()
  }

  if (isLoading) {
    return <LoadingSpinner size="lg" className="mt-12" />
  }

  if (isError) {
    console.error('Error details:', error)
    return (
      <ErrorMessage 
        message={error?.message || "Failed to load your tasks. Please try again."} 
      />
    )
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {tasksArray.length} tasks assigned to you
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1 shadow-sm overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={String(tab.key)}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${
              activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {countForTab(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm">No tasks in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((task: TaskDto) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}
