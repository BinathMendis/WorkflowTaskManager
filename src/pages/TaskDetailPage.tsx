import { useParams, Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Building2, User, Calendar, Clock, Download, FileText, Image, File, HardDrive
} from 'lucide-react'
import { getTaskById } from '../api/taskService'
import { getTaskAttachments, downloadAttachment } from '../api/attachmentService'
import { getPlatformBadge, getPlatformLabel } from '../utils/enumHelpers'
import { formatDateTime, formatDate } from '../utils/dateHelpers'
import { formatTaskNumber } from '../utils/taskNumber'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import TaskStatusBadge from '../components/tasks/TaskStatusBadge'
import TaskPriorityBadge from '../components/tasks/TaskPriorityBadge'
import TaskActionButtons from '../components/tasks/TaskActionButtons'
import CommentList from '../components/comments/CommentList'
import AttachmentUpload from '../components/attachments/AttachmentUpload'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const taskId = Number(id)
  const { logout } = useAuth()

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTaskById(taskId),
    enabled: !!taskId && !isNaN(taskId),
    retry: 1,
  })

  const { data: attachments = [], isLoading: attachmentsLoading, refetch: refetchAttachments } = useQuery({
    queryKey: ['attachments', taskId],
    queryFn: () => getTaskAttachments(taskId),
    enabled: !!taskId && !isNaN(taskId),
  })

  const handleDownload = async (attachmentId: number, fileName: string) => {
    try {
      await downloadAttachment(taskId, attachmentId, fileName)
      toast.success('Download started')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download attachment')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith('image/')) return <Image className="h-5 w-5 text-red-500" />
    if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />
    return <File className="h-5 w-5 text-gray-500" />
  }

  // Handle error - especially 401
  if (error) {
    console.error('TaskDetailPage - Error:', error)
    const axiosError = error as any
    
    if (axiosError?.response?.status === 401) {
      console.error('401 Unauthorized - Token may be expired')
      toast.error('Session expired. Please login again.')
      // Clear storage and redirect
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      logout()
      return <Navigate to="/login" replace />
    }
    
    if (axiosError?.response?.status === 403) {
      return <ErrorMessage message="You don't have permission to view this task." className="mt-8" />
    }
    
    if (axiosError?.response?.status === 404) {
      return <ErrorMessage message="Task not found." className="mt-8" />
    }
    
    return <ErrorMessage message="Failed to load task. Please try again." className="mt-8" />
  }

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />
  
  if (!task) {
    return <ErrorMessage message="Task not found." className="mt-8" />
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        to="/tasks"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tasks
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <p className="mb-1 text-sm font-semibold text-red-700">{formatTaskNumber(task.id)}</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{task.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {getPlatformBadge(task.platform)} {getPlatformLabel(task.platform)}
              </span>
            </div>
          </div>
          <TaskActionButtons task={task} />
        </div>

        {task.description && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Company</p>
              <p className="text-sm font-medium text-gray-900">{task.companyName}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Assigned To</p>
              <p className="text-sm font-medium text-gray-900">{task.assignedUserName}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Due Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(task.dueDate)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Last Updated</p>
              <p className="text-sm font-medium text-gray-900">{formatDateTime(task.updatedAt)}</p>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Created {formatDateTime(task.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CommentList taskId={taskId} comments={task.comments || []} />
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="mb-5 rounded-xl border border-red-100 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Image className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-gray-900">Upload Images</h3>
            </div>
            <AttachmentUpload taskId={taskId} onUploaded={refetchAttachments} imageOnly />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Attachments</h3>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
              {attachments.length} file(s)
            </span>
          </div>

          {attachmentsLoading ? (
            <div className="space-y-2">
              <div className="animate-pulse">
                <div className="h-16 bg-gray-100 rounded"></div>
              </div>
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No attachments available</p>
              <p className="text-xs text-gray-300 mt-1">Attachments will appear here when added by admin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attachments.map((attachment: any) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      {getFileIcon(attachment.fileType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate" title={attachment.fileName}>
                        {attachment.fileName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">
                          {formatFileSize(attachment.fileSize)}
                        </span>
                        {attachment.uploadedByUserName && (
                          <>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-400">
                              by {attachment.uploadedByUserName}
                            </span>
                          </>
                        )}
                        {attachment.createdAt && (
                          <>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-400">
                              {formatDateTime(attachment.createdAt)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(attachment.id, attachment.fileName)}
                    className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
