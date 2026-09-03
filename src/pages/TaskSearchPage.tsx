import { FormEvent, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Building2, Calendar, Clock, ClipboardList, Download, File,
  FileText, Image, Loader2, MessageSquare, Search, User, X,
} from 'lucide-react'
import { getApprovedForPublishTasks, getTaskById } from '../api/taskService'
import { downloadAttachment, getTaskAttachments } from '../api/attachmentService'
import { AttachmentDto, TaskDto } from '../types/task.types'
import { formatDate, formatDateTime, formatFileSize } from '../utils/dateHelpers'
import { getPlatformLabel, getStatusLabel } from '../utils/enumHelpers'
import { formatTaskNumber, parseTaskNumber } from '../utils/taskNumber'
import TaskPriorityBadge from '../components/tasks/TaskPriorityBadge'
import TaskStatusBadge from '../components/tasks/TaskStatusBadge'
import { toast } from 'react-toastify'

const getAttachmentIcon = (fileType: string) => {
  if (fileType?.startsWith('image/')) return <Image className="h-5 w-5 text-red-500" />
  if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />
  return <File className="h-5 w-5 text-gray-500" />
}

export default function TaskSearchPage() {
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [task, setTask] = useState<TaskDto | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const searchMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const foundTask = await getTaskById(taskId)

      try {
        const approvedForPublishTasks = await getApprovedForPublishTasks()
        const workflowTask = approvedForPublishTasks.find(item => item.id === taskId)
        return workflowTask ? { ...foundTask, ...workflowTask } : foundTask
      } catch (workflowError) {
        console.warn('Could not enrich task with approval workflow fields:', workflowError)
        return foundTask
      }
    },
    onSuccess: foundTask => {
      setTask(foundTask)
      setError('')
      setDetailsOpen(false)
    },
    onError: (err: any) => {
      setTask(null)
      if (err?.response?.status === 404) {
        setError('No task found for that task number.')
        return
      }
      if (err?.response?.status === 403) {
        setError("You don't have permission to view that task.")
        return
      }
      setError('Could not load the task. Please try again.')
    },
  })

  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery({
    queryKey: ['search-task-attachments', task?.id],
    queryFn: () => getTaskAttachments(task!.id),
    enabled: !!task?.id,
  })

  const sortedAttachments = [...attachments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const taskId = parseTaskNumber(query)

    if (!taskId) {
      setTask(null)
      setError('Enter a valid task number, like T000001.')
      return
    }

    searchMutation.mutate(taskId)
  }

  const handleDownload = async (attachment: AttachmentDto) => {
    if (!task) return

    try {
      await downloadAttachment(task.id, attachment.id, attachment.fileName)
      toast.success('Download started')
    } catch (downloadError) {
      console.error('Download error:', downloadError)
      toast.error('Failed to download attachment')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <ClipboardList className="h-6 w-6 text-red-500" />
          Search Task
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">Find a task by task number and open its details.</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setError('')
              }}
              placeholder="T000001"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-11 text-sm uppercase tracking-wide focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={searchMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-red-600/20 transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {task && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-700">{formatTaskNumber(task.id)}</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">{task.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-gray-500">{task.description || 'No description'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-gray-400">Company</p>
              <p className="font-medium text-gray-900">{task.companyName || 'No company'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Assigned To</p>
              <p className="font-medium text-gray-900">{task.assignedUserName || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Platform</p>
              <p className="font-medium text-gray-900">{getPlatformLabel(task.platform)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <p className="font-medium text-gray-900">{getStatusLabel(task.status)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Due Date</p>
                <p className="font-medium text-gray-900">{formatDate(task.dueDate)}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Open Details
              <ClipboardList className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {task && detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailsOpen(false)} />
          <div className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-700">{formatTaskNumber(task.id)}</p>
                <h2 className="truncate text-xl font-bold text-gray-900">{task.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{task.companyName || 'No company'}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close task details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-5">
              <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-5">
                  <div className="rounded-xl border border-gray-100 p-5">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <TaskStatusBadge status={task.status} />
                      <TaskPriorityBadge priority={task.priority} />
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        {getPlatformLabel(task.platform)}
                      </span>
                    </div>

                    <div className="mb-5">
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Description</h3>
                      <p className="whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                        {task.description || 'No description'}
                      </p>
                    </div>

                    <div className="grid gap-4 text-sm sm:grid-cols-2">
                      <div className="flex items-start gap-2">
                        <Building2 className="mt-0.5 h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Company</p>
                          <p className="font-medium text-gray-900">{task.companyName || 'No company'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="mt-0.5 h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Assigned To</p>
                          <p className="font-medium text-gray-900">{task.assignedUserName || 'Unassigned'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="mt-0.5 h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Due Date</p>
                          <p className="font-medium text-gray-900">{formatDateTime(task.dueDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Last Updated</p>
                          <p className="font-medium text-gray-900">{formatDateTime(task.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-5">
                    <h3 className="mb-4 font-semibold text-gray-900">Approval And Publishing</h3>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-400">Approved Date</p>
                        <p className="font-medium text-gray-900">{task.approvedAt ? formatDateTime(task.approvedAt) : 'Not approved'}</p>
                        <p className="mt-1 text-xs text-gray-500">By {task.approvedByUserName || 'Not set'}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-400">Published Date</p>
                        <p className="font-medium text-gray-900">{task.publishedAt ? formatDateTime(task.publishedAt) : 'Not published'}</p>
                        <p className="mt-1 text-xs text-gray-500">By {task.publishedByUserName || 'Not set'}</p>
                      </div>
                      {task.rejectionReason && (
                        <div className="rounded-xl bg-red-50 p-3 sm:col-span-2">
                          <p className="text-xs text-red-500">Rejection Reason</p>
                          <p className="font-medium text-red-800">{task.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                      <MessageSquare className="h-5 w-5 text-red-500" />
                      Comments
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {task.comments?.length || 0}
                      </span>
                    </h3>
                    <div className="max-h-80 space-y-4 overflow-y-auto">
                      {!task.comments?.length ? (
                        <p className="py-6 text-center text-sm text-gray-400">No comments yet.</p>
                      ) : (
                        task.comments.map(comment => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="min-w-0 flex-1 rounded-lg bg-gray-50 p-3">
                              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm font-medium text-gray-900">{comment.userName}</span>
                                <span className="text-xs text-gray-400">{formatDateTime(comment.createdAt)}</span>
                              </div>
                              <p className="whitespace-pre-wrap text-sm text-gray-700">{comment.commentText}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-xl border border-gray-100 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Attachments</h3>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {sortedAttachments.length}
                      </span>
                    </div>

                    {attachmentsLoading ? (
                      <div className="space-y-2">
                        <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
                        <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
                      </div>
                    ) : sortedAttachments.length === 0 ? (
                      <p className="py-6 text-center text-sm text-gray-400">No attachments available.</p>
                    ) : (
                      <div className="max-h-96 space-y-3 overflow-y-auto">
                        {sortedAttachments.map(attachment => (
                          <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
                            <div className="flex min-w-0 items-center gap-3">
                              {getAttachmentIcon(attachment.fileType)}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900" title={attachment.fileName}>
                                  {attachment.fileName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatFileSize(attachment.fileSize)} · {formatDateTime(attachment.createdAt)}
                                </p>
                                <p className="text-xs text-gray-400">Uploaded by {attachment.uploadedByUserName || 'Unknown'}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownload(attachment)}
                              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white hover:text-red-600"
                              aria-label={`Download ${attachment.fileName}`}
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
