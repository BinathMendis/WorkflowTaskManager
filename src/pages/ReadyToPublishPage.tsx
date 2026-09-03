import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Send, Globe, Loader2, Building2, User, Calendar, Clock, Paperclip,
  MessageSquare, Hash, CheckCircle, Download, FileText, Image, File, XCircle,
} from 'lucide-react'
import { getApprovedForPublishTasks, publishTask } from '../api/taskService'
import { downloadAttachment, getTaskAttachments } from '../api/attachmentService'
import { AttachmentDto, TaskDto } from '../types/task.types'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import TaskStatusBadge from '../components/tasks/TaskStatusBadge'
import TaskPriorityBadge from '../components/tasks/TaskPriorityBadge'
import TaskQueueFilters, { emptyTaskQueueFilters, TaskQueueFilterValues } from '../components/tasks/TaskQueueFilters'
import { formatDate, formatDateTime, formatFileSize } from '../utils/dateHelpers'
import { getPlatformBadge, getPlatformLabel, getPlatformValue } from '../utils/enumHelpers'
import { formatTaskNumber } from '../utils/taskNumber'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'

function getLatestAttachment(attachments?: AttachmentDto[]) {
  if (!attachments?.length) return null
  return [...attachments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
}

function AttachmentIcon({ fileType }: { fileType: string }) {
  if (fileType?.startsWith('image/')) return <Image className="h-5 w-5 text-red-500" />
  if (fileType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />
  return <File className="h-5 w-5 text-gray-500" />
}

const getPriorityValue = (priority: TaskDto['priority']) => {
  const numericPriority = Number(priority)
  if (!Number.isNaN(numericPriority)) return numericPriority

  const priorityMap: Record<string, number> = {
    low: 0,
    medium: 1,
    high: 2,
    urgent: 3,
  }
  return priorityMap[String(priority || '').trim().toLowerCase()]
}

const getDateInputValue = (date?: string) => date ? date.slice(0, 10) : ''

const buildOptions = (tasks: TaskDto[], key: 'companyName' | 'assignedUserName') => {
  return Array.from(new Set(tasks.map(task => task[key]).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b))
    .map(value => ({ value, label: value }))
}

const filterTasks = (tasks: TaskDto[], filters: TaskQueueFilterValues) => {
  const search = filters.search.trim().toLowerCase()

  return tasks.filter(task => {
    const searchable = [
      task.id,
      task.title,
      task.description,
      task.companyName,
      task.assignedUserName,
      task.approvedByUserName,
    ].join(' ').toLowerCase()

    if (search && !searchable.includes(search)) return false
    if (filters.company && task.companyName !== filters.company) return false
    if (filters.assignedUser && task.assignedUserName !== filters.assignedUser) return false
    if (filters.platform && String(getPlatformValue(task.platform)) !== filters.platform) return false
    if (filters.priority && String(getPriorityValue(task.priority)) !== filters.priority) return false

    const dueDate = getDateInputValue(task.dueDate)
    if (filters.dueFrom && (!dueDate || dueDate < filters.dueFrom)) return false
    if (filters.dueTo && (!dueDate || dueDate > filters.dueTo)) return false

    return true
  })
}

export default function ReadyToPublishPage() {
  const { state, refreshRoles, hasRole } = useAuth()
  const queryClient = useQueryClient()
  const [publishComment, setPublishComment] = useState('')
  const [showPublishModal, setShowPublishModal] = useState<number | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null)
  const [filters, setFilters] = useState<TaskQueueFilterValues>(emptyTaskQueueFilters)
  const isPrimaryAdmin = state.role === 'Admin'
  const hasPublisherRole = hasRole('Publisher')
  const isAuthorized = isPrimaryAdmin || hasPublisherRole

  useEffect(() => {
    refreshRoles()
  }, [refreshRoles])

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['approved-publish-tasks'],
    queryFn: getApprovedForPublishTasks,
    enabled: isAuthorized,
  })

  const attachmentQueries = useQueries({
    queries: tasks.map((task: TaskDto) => ({
      queryKey: ['attachments', task.id],
      queryFn: () => getTaskAttachments(task.id),
      enabled: isAuthorized,
      staleTime: 30_000,
    })),
  })

  const companyOptions = useMemo(() => buildOptions(tasks, 'companyName'), [tasks])
  const assignedUserOptions = useMemo(() => buildOptions(tasks, 'assignedUserName'), [tasks])
  const filteredTasks = useMemo(() => filterTasks(tasks, filters), [tasks, filters])

  const publishMutation = useMutation({
    mutationFn: ({ taskId, comment }: { taskId: number; comment?: string }) =>
      publishTask(taskId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approved-publish-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task published successfully!')
      setShowPublishModal(null)
      setPublishComment('')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to publish task')
    },
  })

  const handleDownload = async (taskId: number, attachment: AttachmentDto) => {
    try {
      await downloadAttachment(taskId, attachment.id, attachment.fileName)
      toast.success('Download started')
    } catch {
      toast.error('Failed to download attachment')
    }
  }

  if (!isAuthorized) {
    return (
      <div className="text-center py-12">
        <Send className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-medium text-gray-900">Access Denied</h2>
        <p className="text-gray-500">You don't have Publisher permissions.</p>
      </div>
    )
  }

  if (isLoading) return <LoadingSpinner size="lg" className="mt-12" />
  if (error) return <ErrorMessage message="Failed to load approved tasks" />

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Send className="h-6 w-6 text-blue-600" />
            Ready to Publish
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Tasks approved and ready for publishing ({filteredTasks.length} of {tasks.length} ready)
          </p>
        </div>
      </div>

      {tasks.length > 0 && (
        <TaskQueueFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(emptyTaskQueueFilters)}
          companyOptions={companyOptions}
          assignedUserOptions={assignedUserOptions}
          totalCount={tasks.length}
          filteredCount={filteredTasks.length}
        />
      )}

      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tasks ready for publishing</p>
          <p className="text-sm text-gray-400">Approved tasks will appear here</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <Globe className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No publish tasks match the current filters</p>
          <p className="text-sm text-gray-400">Clear or adjust filters to widen the queue</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task: TaskDto) => {
            const taskIndex = tasks.findIndex((item: TaskDto) => item.id === task.id)
            const fetchedAttachments = taskIndex >= 0 ? attachmentQueries[taskIndex]?.data : undefined
            const attachments = task.attachments?.length ? task.attachments : fetchedAttachments
            const latestAttachment = getLatestAttachment(attachments)
            const attachmentsLoading = taskIndex >= 0 && attachmentQueries[taskIndex]?.isLoading

            return (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="text-left hover:text-blue-600"
                    >
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">{task.title}</h3>
                    </button>
                    <p className="text-gray-600 text-sm mb-4 whitespace-pre-wrap">
                      {task.description || 'No description provided.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <TaskStatusBadge status={task.status} />
                      <TaskPriorityBadge priority={task.priority} />
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                        {getPlatformBadge(task.platform)} {getPlatformLabel(task.platform)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-start gap-2 text-gray-600">
                        <Hash className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span><span className="font-medium text-gray-900">Task No:</span> {formatTaskNumber(task.id)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span><span className="font-medium text-gray-900">Company:</span> {task.companyName || 'Not set'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <User className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span><span className="font-medium text-gray-900">Assigned:</span> {task.assignedUserName || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span><span className="font-medium text-gray-900">Due:</span> {task.dueDate ? formatDate(task.dueDate) : 'Not set'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span><span className="font-medium text-gray-900">Created:</span> {task.createdAt ? formatDateTime(task.createdAt) : 'Not set'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <CheckCircle className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span><span className="font-medium text-gray-900">Approved by:</span> {task.approvedByUserName || 'Not set'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span><span className="font-medium text-gray-900">Approved:</span> {task.approvedAt ? formatDateTime(task.approvedAt) : 'Not set'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span><span className="font-medium text-gray-900">Comments:</span> {task.comments?.length ?? 0}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600 sm:col-span-2">
                        <Paperclip className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span className="min-w-0 break-words">
                          <span className="font-medium text-gray-900">Last attachment:</span>{' '}
                          {attachmentsLoading
                            ? 'Loading attachments...'
                            : latestAttachment
                            ? `${latestAttachment.fileName} (${formatFileSize(latestAttachment.fileSize)}, ${formatDateTime(latestAttachment.createdAt)})`
                            : 'No attachments'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPublishModal(task.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Publish
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedTask && (() => {
        const taskIndex = tasks.findIndex((task: TaskDto) => task.id === selectedTask.id)
        const fetchedAttachments = taskIndex >= 0 ? attachmentQueries[taskIndex]?.data : undefined
        const attachments = selectedTask.attachments?.length ? selectedTask.attachments : fetchedAttachments || []
        const attachmentsLoading = taskIndex >= 0 && attachmentQueries[taskIndex]?.isLoading

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="font-semibold text-gray-900 text-xl">{selectedTask.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{formatTaskNumber(selectedTask.id)}</p>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close task details"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-5">
                <TaskStatusBadge status={selectedTask.status} />
                <TaskPriorityBadge priority={selectedTask.priority} />
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {getPlatformBadge(selectedTask.platform)} {getPlatformLabel(selectedTask.platform)}
                </span>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">
                  {selectedTask.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-6 rounded-xl bg-gray-50 p-4">
                <div><span className="font-medium text-gray-900">Company:</span> {selectedTask.companyName || 'Not set'}</div>
                <div><span className="font-medium text-gray-900">Assigned:</span> {selectedTask.assignedUserName || 'Unassigned'}</div>
                <div><span className="font-medium text-gray-900">Due:</span> {selectedTask.dueDate ? formatDate(selectedTask.dueDate) : 'Not set'}</div>
                <div><span className="font-medium text-gray-900">Created:</span> {selectedTask.createdAt ? formatDateTime(selectedTask.createdAt) : 'Not set'}</div>
                <div><span className="font-medium text-gray-900">Approved by:</span> {selectedTask.approvedByUserName || 'Not set'}</div>
                <div><span className="font-medium text-gray-900">Approved:</span> {selectedTask.approvedAt ? formatDateTime(selectedTask.approvedAt) : 'Not set'}</div>
                <div><span className="font-medium text-gray-900">Comments:</span> {selectedTask.comments?.length ?? 0}</div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Attachments</h4>
                {attachmentsLoading ? (
                  <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">Loading attachments...</div>
                ) : attachments.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">No attachments available.</div>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <AttachmentIcon fileType={attachment.fileType} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">{attachment.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.fileSize)} · {attachment.uploadedByUserName || 'Unknown'} · {formatDateTime(attachment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(selectedTask.id, attachment)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                          title="Download attachment"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedTask.comments?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Comments</h4>
                  <div className="space-y-2">
                    {selectedTask.comments.map((comment) => (
                      <div key={comment.id} className="rounded-lg bg-gray-50 px-4 py-3">
                        <div className="mb-1 flex items-center justify-between gap-3 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">{comment.userName}</span>
                          <span>{formatDateTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.commentText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="font-semibold text-gray-900 text-lg mb-3">Publish Task</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Publish Notes (optional)</label>
            <textarea
              value={publishComment}
              onChange={(e) => setPublishComment(e.target.value)}
              rows={3}
              placeholder="Add publication notes..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowPublishModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => publishMutation.mutate({ taskId: showPublishModal, comment: publishComment })}
                disabled={publishMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60"
              >
                {publishMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publish Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
