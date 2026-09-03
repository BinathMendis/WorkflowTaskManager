import { Link } from 'react-router-dom'
import { Calendar, Hash, MessageSquare, User, Building2 } from 'lucide-react'
import { TaskDto } from '../../types/task.types'
import TaskStatusBadge from './TaskStatusBadge'
import TaskPriorityBadge from './TaskPriorityBadge'
import { getPlatformBadge, getPlatformLabel } from '../../utils/enumHelpers'
import { getDueDateLabel } from '../../utils/dateHelpers'
import { formatTaskNumber } from '../../utils/taskNumber'

interface Props {
  task: TaskDto
}

export default function TaskCard({ task }: Props) {
  const due = getDueDateLabel(task.dueDate, task.status)
  const platformBadge = getPlatformBadge(task.platform)
  const platformLabel = getPlatformLabel(task.platform)
  const taskNumber = formatTaskNumber(task.id)

  return (
    <Link 
      to={`/tasks/${task.id}`} 
      className="block group"
    >
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-red-200 transition-all duration-200">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
              <Hash className="h-3 w-3" />
              {taskNumber}
            </span>
            <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2">
              {task.title}
            </h3>
          </div>
          <TaskStatusBadge status={task.status} />
        </div>

        {task.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <TaskPriorityBadge priority={task.priority} />
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {platformBadge} {platformLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 border-t border-gray-50 pt-3">
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            {task.companyName}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {task.assignedUserName}
          </span>
          <span className={`flex items-center gap-1 ${due.className}`}>
            <Calendar className="h-3.5 w-3.5" />
            {due.label}
          </span>
          {task.comments?.length > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {task.comments.length}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
