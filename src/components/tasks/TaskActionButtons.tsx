import { useState } from 'react'
import { CheckCircle, XCircle, Play, Lock, Trash2, Loader2, CheckSquare, Send } from 'lucide-react'
import { TaskDto, TaskStatus } from '../../types/task.types'
import { useAuth } from '../../context/AuthContext'
import ConfirmDialog from '../common/ConfirmDialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { acceptTask, rejectTask, completeTask, updateTaskStatus, deleteTask, approveTask, rejectTaskByApprover, publishTask } from '../../api/taskService'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { getStatusValue } from '../../utils/enumHelpers'

interface Props {
  task: TaskDto
}

export default function TaskActionButtons({ task }: Props) {
  const { state, hasRole } = useAuth()
  const isAdmin = state.role === 'Admin'
  const isApprover = isAdmin || hasRole('Approver')
  const isPublisher = isAdmin || hasRole('Publisher')
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [rejectReason, setRejectReason] = useState('')
  const [approveComment, setApproveComment] = useState('')
  const [publishComment, setPublishComment] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const assignedUserId = Number(task.assignedUserId ?? (task as any).assignedToUserId)
  const currentUserId = Number(state.userId)
  const isAssignedUser = Number.isFinite(currentUserId) && currentUserId === assignedUserId
  const canAct = isAdmin || isAssignedUser
  const currentStatus = getStatusValue(task.status)

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['task', task.id] })
    qc.invalidateQueries({ queryKey: ['tasks'] })
    qc.invalidateQueries({ queryKey: ['my-tasks'] })
    qc.invalidateQueries({ queryKey: ['pending-approval'] })
    qc.invalidateQueries({ queryKey: ['approved-publish'] })
  }

  // Existing mutations
  const accept = useMutation({
    mutationFn: () => acceptTask(task.id),
    onSuccess: () => { toast.success('Task accepted'); refresh() },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to accept task'),
  })

  const reject = useMutation({
    mutationFn: () => rejectTask(task.id, rejectReason),
    onSuccess: () => { toast.success('Task rejected'); setShowRejectModal(false); setRejectReason(''); refresh() },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to reject task'),
  })

  const complete = useMutation({
    mutationFn: () => completeTask(task.id),
    onSuccess: () => { toast.success('Task marked as complete'); refresh() },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to complete task'),
  })

  const moveToInProgress = useMutation({
    mutationFn: () => updateTaskStatus(task.id, { status: 'InProgress' }),
    onSuccess: () => { toast.success('Task moved to In Progress'); refresh() },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to update task'),
  })

  const closeTask = useMutation({
    mutationFn: () => updateTaskStatus(task.id, { status: 'Closed' }),
    onSuccess: () => { toast.success('Task closed'); refresh() },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to close task'),
  })

  const reopenTask = useMutation({
    mutationFn: () => updateTaskStatus(task.id, { status: 'Pending' }),
    onSuccess: () => { toast.success('Task reopened'); refresh() },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to reopen task'),
  })

  const del = useMutation({
    mutationFn: () => deleteTask(task.id),
    onSuccess: () => { toast.success('Task deleted'); navigate('/tasks') },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to delete task'),
  })

  // NEW: Approval mutations
  const approve = useMutation({
    mutationFn: () => approveTask(task.id, approveComment),
    onSuccess: () => { toast.success('Task approved! Publishers have been notified.'); setShowApproveModal(false); setApproveComment(''); refresh() },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to approve task'),
  })

  const rejectByApprover = useMutation({
    mutationFn: () => rejectTaskByApprover(task.id, rejectReason),
    onSuccess: () => { toast.success('Task rejected. User has been notified to rework.'); setShowRejectModal(false); setRejectReason(''); refresh() },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to reject task'),
  })

  const publish = useMutation({
    mutationFn: () => publishTask(task.id, publishComment),
    onSuccess: () => { toast.success('Task published successfully!'); setShowPublishModal(false); setPublishComment(''); refresh() },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Failed to publish task'),
  })

  const btn = (onClick: () => void, icon: React.ReactNode, label: string, variant: 'primary' | 'success' | 'danger' | 'warning' | 'secondary', loading?: boolean) => {
    const variants = {
      primary: 'bg-red-600 hover:bg-red-700 text-white',
      success: 'bg-green-600 hover:bg-green-700 text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      warning: 'bg-amber-500 hover:bg-amber-600 text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    }
    return (
      <button
        onClick={onClick}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variants[variant]} disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {label}
      </button>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Existing buttons for User */}
        {currentStatus === TaskStatus.Pending && canAct && (
          <>
            {btn(() => accept.mutate(), <CheckCircle className="h-4 w-4" />, 'Accept', 'success', accept.isPending)}
            {btn(() => setShowRejectModal(true), <XCircle className="h-4 w-4" />, 'Reject', 'danger')}
          </>
        )}
        
        {currentStatus === TaskStatus.Accepted && canAct && (
          btn(() => moveToInProgress.mutate(), <Play className="h-4 w-4" />, 'Start Progress', 'primary', moveToInProgress.isPending)
        )}
        
        {currentStatus === TaskStatus.InProgress && canAct && (
          btn(() => complete.mutate(), <CheckCircle className="h-4 w-4" />, 'Mark Complete', 'success', complete.isPending)
        )}

        {currentStatus === TaskStatus.Rejected && isAssignedUser && (
          <>
            {btn(() => moveToInProgress.mutate(), <Play className="h-4 w-4" />, 'Redo Task', 'primary', moveToInProgress.isPending)}
            {btn(() => complete.mutate(), <CheckCircle className="h-4 w-4" />, 'Submit Again', 'success', complete.isPending)}
          </>
        )}

        {/* NEW: Approver buttons - Show when task is Completed */}
        {currentStatus === TaskStatus.Completed && isApprover && (
          <>
            {btn(() => setShowApproveModal(true), <CheckSquare className="h-4 w-4" />, 'Approve Task', 'success')}
            {btn(() => setShowRejectModal(true), <XCircle className="h-4 w-4" />, 'Reject Task', 'danger')}
          </>
        )}

        {/* NEW: Publisher button - Show when task is Approved */}
        {currentStatus === TaskStatus.Approved && isPublisher && (
          btn(() => setShowPublishModal(true), <Send className="h-4 w-4" />, 'Publish Task', 'primary', publish.isPending)
        )}

        {/* Admin close button - Show when task is Published */}
        {currentStatus === TaskStatus.Published && isAdmin && (
          btn(() => closeTask.mutate(), <Lock className="h-4 w-4" />, 'Close Task', 'secondary', closeTask.isPending)
        )}

        {/* Rejected status - Admin can reopen */}
        {currentStatus === TaskStatus.Rejected && isAdmin && (
          btn(() => reopenTask.mutate(), <Play className="h-4 w-4" />, 'Reopen Task', 'primary', reopenTask.isPending)
        )}

        {/* Closed status - Admin can reopen */}
        {currentStatus === TaskStatus.Closed && isAdmin && (
          btn(() => reopenTask.mutate(), <Play className="h-4 w-4" />, 'Reopen Task', 'primary', reopenTask.isPending)
        )}

        {/* Admin delete button */}
        {isAdmin && currentStatus !== TaskStatus.Closed && currentStatus !== TaskStatus.Completed && currentStatus !== TaskStatus.Published && (
          btn(() => setShowDeleteConfirm(true), <Trash2 className="h-4 w-4" />, 'Delete', 'danger')
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowApproveModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="font-semibold text-gray-900 text-lg mb-3">Approve Task</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
            <textarea
              value={approveComment}
              onChange={e => setApproveComment(e.target.value)}
              rows={3}
              placeholder="Add any notes about this approval..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setShowApproveModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => approve.mutate()}
                disabled={approve.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-60"
              >
                {approve.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Approve Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPublishModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="font-semibold text-gray-900 text-lg mb-3">Publish Task</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Publish Notes (optional)</label>
            <textarea
              value={publishComment}
              onChange={e => setPublishComment(e.target.value)}
              rows={3}
              placeholder="Add publication notes..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setShowPublishModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => publish.mutate()}
                disabled={publish.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60"
              >
                {publish.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Publish Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal (updated for approver rejection) */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="font-semibold text-gray-900 text-lg mb-3">Reject Task</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for rejection *</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Explain why this task is being rejected..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => isApprover && currentStatus === TaskStatus.Completed ? rejectByApprover.mutate() : reject.mutate()}
                disabled={reject.isPending || rejectByApprover.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60"
              >
                {(reject.isPending || rejectByApprover.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                Reject Task
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => del.mutate()}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}
