// components/comments/CommentItem.tsx
import { Trash2, User } from 'lucide-react'
import { CommentDto } from '../../types/task.types'
import { useAuth } from '../../context/AuthContext'
import { formatDateTime } from '../../utils/dateHelpers'

interface Props {
  comment: CommentDto
  onDelete: (id: number) => void
  deleting?: boolean
}

export default function CommentItem({ comment, onDelete, deleting }: Props) {
  const { state } = useAuth()
  const canDelete = state.role === 'Admin' || state.userId === comment.userId

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-gray-500" />
        </div>
      </div>
      <div className="flex-1">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-900">
              {comment.userName}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {formatDateTime(comment.createdAt)}
              </span>
              {canDelete && (
                <button
                  onClick={() => onDelete(comment.id)}
                  disabled={deleting}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete comment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {comment.commentText}
          </p>
        </div>
      </div>
    </div>
  )
}