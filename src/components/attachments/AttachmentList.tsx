import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Paperclip } from 'lucide-react'
import { AttachmentDto } from '../../types/task.types'
import { downloadAttachment, deleteAttachment } from '../../api/attachmentService'
import { toast } from 'react-toastify'
import AttachmentItem from './AttachmentItem'
import AttachmentUpload from './AttachmentUpload'

interface Props {
  taskId: number
  attachments: AttachmentDto[]
}

export default function AttachmentList({ taskId, attachments }: Props) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['task', taskId] })

  const del = useMutation({
    mutationFn: (id: number) => deleteAttachment(id),
    onSuccess: () => { toast.success('Attachment deleted'); refresh() },
    onError: () => toast.error('Failed to delete attachment'),
  })

  const handleDownload = async (a: AttachmentDto) => {
    try {
      await downloadAttachment(taskId, a.id, a.fileName)
    } catch {
      toast.error('Failed to download file')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-5">
        <Paperclip className="h-5 w-5 text-red-500" />
        Attachments
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{attachments.length}</span>
      </h2>

      <div className="space-y-2 mb-5">
        {attachments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No attachments yet.</p>
        ) : (
          attachments.map(a => (
            <AttachmentItem
              key={a.id}
              attachment={a}
              taskId={taskId}
              onDownload={handleDownload}
              onDelete={id => del.mutate(id)}
              deleting={del.isPending}
            />
          ))
        )}
      </div>

      <div className="border-t border-gray-100 pt-5">
        <AttachmentUpload taskId={taskId} onUploaded={refresh} />
      </div>
    </div>
  )
}
