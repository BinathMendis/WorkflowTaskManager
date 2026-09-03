import { TaskDto } from '../../types/task.types'
import { formatDateTime } from '../../utils/dateHelpers'

interface Props {
  task: TaskDto
}

export default function ApprovalBadges({ task }: Props) {
  return (
    <div className="space-y-2">
      {/* Approved by info */}
      {task.approvedByUserName && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Approved by:</span>
          <span className="font-medium text-green-600">{task.approvedByUserName}</span>
          {task.approvedAt && (
            <span className="text-xs text-gray-400">{formatDateTime(task.approvedAt)}</span>
          )}
        </div>
      )}

      {/* Published by info */}
      {task.publishedByUserName && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Published by:</span>
          <span className="font-medium text-blue-600">{task.publishedByUserName}</span>
          {task.publishedAt && (
            <span className="text-xs text-gray-400">{formatDateTime(task.publishedAt)}</span>
          )}
        </div>
      )}

      {/* Rejection reason */}
      {task.rejectionReason && (
        <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-100">
          <p className="text-xs font-medium text-red-600 uppercase mb-1">Rejection Reason</p>
          <p className="text-sm text-red-700">{task.rejectionReason}</p>
        </div>
      )}
    </div>
  )
}