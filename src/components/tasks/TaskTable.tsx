import { TaskDto } from '../../types/task.types'
import { formatDate } from '../../utils/dateHelpers'
import { getPlatformBadge, getPlatformLabel, priorityLabels, priorityColors } from '../../utils/enumHelpers'
import TaskStatusBadge from './TaskStatusBadge'
import { Link, useNavigate } from 'react-router-dom'
import { formatTaskNumber } from '../../utils/taskNumber'

interface Props {
  tasks: TaskDto[]
  sortBy: string
  sortDescending: boolean
  onSort: (field: string) => void
}

const getPriorityValue = (priority: string | number): number => {
  if (typeof priority === 'number') return priority

  const priorityMap: Record<string, number> = {
    Low: 0,
    Medium: 1,
    High: 2,
    Urgent: 3,
  }

  return priorityMap[priority] ?? 1
}

export default function TaskTable({ tasks, sortBy, sortDescending, onSort }: Props) {
  const navigate = useNavigate()

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="ml-1 text-gray-300">sort</span>
    return <span className="ml-1">{sortDescending ? 'desc' : 'asc'}</span>
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => onSort('title')}>
                Title <SortIndicator field="title" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => onSort('companyName')}>
                Company <SortIndicator field="companyName" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => onSort('assignedUserName')}>
                Assigned To <SortIndicator field="assignedUserName" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => onSort('dueDate')}>
                Due Date <SortIndicator field="dueDate" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {tasks.map((task) => {
              const platformLabel = getPlatformLabel(task.platform)
              const platformBadge = getPlatformBadge(task.platform)
              const priorityValue = getPriorityValue(task.priority)
              const priorityLabel = priorityLabels[priorityValue as keyof typeof priorityLabels] || task.priority
              const priorityColor = priorityColors[priorityValue as keyof typeof priorityColors] || 'bg-gray-100 text-gray-600'

              return (
                <tr
                  key={task.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-red-700">{formatTaskNumber(task.id)}</td>
                  <td className="px-6 py-4">
                    <Link to={`/tasks/${task.id}`} className="text-sm font-medium text-gray-900 hover:text-red-600">
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{task.companyName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{task.assignedUserName}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      <span>{platformBadge}</span>
                      <span>{platformLabel}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColor}`}>
                      {priorityLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(task.dueDate)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
