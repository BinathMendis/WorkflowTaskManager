// components/comments/CommentList.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'
import { CommentDto } from '../../types/task.types'
import { addComment, deleteComment } from '../../api/commentService'
import { toast } from 'react-toastify'
import CommentItem from './CommentItem'
import CommentForm from './CommentForm'

interface Props {
  taskId: number
  comments: CommentDto[]
}

export default function CommentList({ taskId, comments }: Props) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['task', taskId] })

  const add = useMutation({
    mutationFn: (text: string) => addComment(taskId, text),
    onSuccess: () => { toast.success('Comment added'); refresh() },
    onError: () => toast.error('Failed to add comment'),
  })

  const del = useMutation({
    mutationFn: (id: number) => deleteComment(id),
    onSuccess: () => { toast.success('Comment deleted'); refresh() },
    onError: () => toast.error('Failed to delete comment'),
  })

  const handleAddComment = async (text: string) => {
    await add.mutateAsync(text)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-5">
        <MessageSquare className="h-5 w-5 text-red-500" />
        Comments
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{comments.length}</span>
      </h2>

      <div className="space-y-5 mb-6 max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No comments yet. Be the first to comment.</p>
        ) : (
          comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              onDelete={(id) => del.mutate(id)}
              deleting={del.isPending}
            />
          ))
        )}
      </div>

      <div className="border-t border-gray-100 pt-5">
        <CommentForm onSubmit={handleAddComment} submitting={add.isPending} />
      </div>
    </div>
  )
}