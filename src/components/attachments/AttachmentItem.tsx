import { Download, Trash2, FileText, Image, FileSpreadsheet, File } from 'lucide-react'
import { AttachmentDto } from '../../types/task.types'
import { useAuth } from '../../context/AuthContext'
import { formatRelative, formatFileSize } from '../../utils/dateHelpers'

interface Props {
  attachment: AttachmentDto
  taskId: number
  onDownload: (a: AttachmentDto) => void
  onDelete: (id: number) => void
  deleting: boolean
}

function FileIcon({ fileType }: { fileType: string }) {
  if (fileType.includes('image')) return <Image className="h-5 w-5 text-red-500" />
  if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
  if (fileType.includes('sheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-500" />
  return <File className="h-5 w-5 text-gray-400" />
}

export default function AttachmentItem({ attachment, onDownload, onDelete, deleting }: Props) {
  const { state } = useAuth()
  const canDelete = state.role === 'Admin' || state.userId === attachment.uploadedBy

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 group hover:bg-red-50/40 transition-colors">
      <FileIcon fileType={attachment.fileType} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{attachment.fileName}</p>
        <p className="text-xs text-gray-400">
          {formatFileSize(attachment.fileSize)} · {attachment.uploadedByUserName} · {formatRelative(attachment.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onDownload(attachment)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </button>
        {canDelete && (
          <button
            onClick={() => onDelete(attachment.id)}
            disabled={deleting}
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
