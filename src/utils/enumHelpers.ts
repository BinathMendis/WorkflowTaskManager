import { Platform, TaskPriority, TaskStatus } from '../types/task.types'

export const platformLabels: Record<Platform, string> = {
  [Platform.Facebook]: 'Facebook',
  [Platform.Instagram]: 'Instagram',
  [Platform.TikTok]: 'TikTok',
  [Platform.YouTube]: 'YouTube',
}

export const priorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.Low]: 'Low',
  [TaskPriority.Medium]: 'Medium',
  [TaskPriority.High]: 'High',
  [TaskPriority.Urgent]: 'Urgent',
}

export const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.Pending]: 'Pending',
  [TaskStatus.Accepted]: 'Accepted',
  [TaskStatus.InProgress]: 'In Progress',
  [TaskStatus.Completed]: 'Completed',
  [TaskStatus.Rejected]: 'Rejected',
  [TaskStatus.Closed]: 'Closed',
  [TaskStatus.PendingApproval]: 'Pending Approval',
  [TaskStatus.Approved]: 'Approved',
  [TaskStatus.Published]: 'Published',
}

export const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: TaskStatus.Pending, label: statusLabels[TaskStatus.Pending] },
  { value: TaskStatus.Accepted, label: statusLabels[TaskStatus.Accepted] },
  { value: TaskStatus.InProgress, label: statusLabels[TaskStatus.InProgress] },
  { value: TaskStatus.Completed, label: statusLabels[TaskStatus.Completed] },
  { value: TaskStatus.Rejected, label: statusLabels[TaskStatus.Rejected] },
  { value: TaskStatus.Closed, label: statusLabels[TaskStatus.Closed] },
  { value: TaskStatus.PendingApproval, label: statusLabels[TaskStatus.PendingApproval] },
  { value: TaskStatus.Approved, label: statusLabels[TaskStatus.Approved] },
  { value: TaskStatus.Published, label: statusLabels[TaskStatus.Published] },
]

export const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.Pending]: 'bg-slate-100 text-slate-700 border-slate-200',
  [TaskStatus.Accepted]: 'bg-red-100 text-red-700 border-red-200',
  [TaskStatus.InProgress]: 'bg-amber-100 text-amber-700 border-amber-200',
  [TaskStatus.Completed]: 'bg-green-100 text-green-700 border-green-200',
  [TaskStatus.Rejected]: 'bg-red-100 text-red-700 border-red-200',
  [TaskStatus.Closed]: 'bg-gray-100 text-gray-600 border-gray-200',
  [TaskStatus.PendingApproval]: 'bg-blue-100 text-blue-700 border-blue-200',
  [TaskStatus.Approved]: 'bg-green-100 text-green-700 border-green-200',
  [TaskStatus.Published]: 'bg-purple-100 text-purple-700 border-purple-200',
}

export const statusDotColors: Record<TaskStatus, string> = {
  [TaskStatus.Pending]: 'bg-slate-400',
  [TaskStatus.Accepted]: 'bg-red-500',
  [TaskStatus.InProgress]: 'bg-amber-500',
  [TaskStatus.Completed]: 'bg-green-500',
  [TaskStatus.Rejected]: 'bg-red-500',
  [TaskStatus.Closed]: 'bg-gray-400',
  [TaskStatus.PendingApproval]: 'bg-blue-500',
  [TaskStatus.Approved]: 'bg-green-500',
  [TaskStatus.Published]: 'bg-purple-500',
}

export const getStatusValue = (status: TaskStatus | string | number | null | undefined): TaskStatus => {
  if (status === null || status === undefined || status === '') return TaskStatus.Pending
  if (typeof status === 'number') return status in statusLabels ? status as TaskStatus : TaskStatus.Pending

  const numericStatus = Number(status)
  if (!Number.isNaN(numericStatus) && numericStatus in statusLabels) {
    return numericStatus as TaskStatus
  }

  const normalized = String(status).replace(/\s+/g, '').toLowerCase()
  const statusMap: Record<string, TaskStatus> = {
    pending: TaskStatus.Pending,
    accepted: TaskStatus.Accepted,
    inprogress: TaskStatus.InProgress,
    completed: TaskStatus.Completed,
    rejected: TaskStatus.Rejected,
    closed: TaskStatus.Closed,
    pendingapproval: TaskStatus.PendingApproval,
    approved: TaskStatus.Approved,
    published: TaskStatus.Published,
  }

  return statusMap[normalized] ?? TaskStatus.Pending
}

export const getStatusLabel = (status: TaskStatus | string | number | null | undefined): string => {
  return statusLabels[getStatusValue(status)]
}

export const getStatusQueryValue = (status: TaskStatus | string | number | null | undefined): string | undefined => {
  if (status === null || status === undefined || status === '') return undefined
  return getStatusLabel(status).replace(/\s+/g, '')
}

export const getStatusColor = (status: TaskStatus | string | number | null | undefined): string => {
  return statusColors[getStatusValue(status)]
}

export const priorityColors: Record<TaskPriority, string> = {
  [TaskPriority.Low]: 'bg-green-100 text-green-700 border-green-200',
  [TaskPriority.Medium]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [TaskPriority.High]: 'bg-orange-100 text-orange-700 border-orange-200',
  [TaskPriority.Urgent]: 'bg-red-100 text-red-700 border-red-200',
}

export const platformColors: Record<Platform, string> = {
  [Platform.Facebook]: 'bg-red-600 text-white',
  [Platform.Instagram]: 'bg-pink-500 text-white',
  [Platform.TikTok]: 'bg-black text-white',
  [Platform.YouTube]: 'bg-red-600 text-white',
}

export const platformEmoji: Record<Platform, string> = {
  [Platform.Facebook]: 'FB',
  [Platform.Instagram]: 'IG',
  [Platform.TikTok]: 'TT',
  [Platform.YouTube]: 'YT',
}

export const getPlatformValue = (platform: Platform | string | number | null | undefined): Platform | null => {
  if (platform === null || platform === undefined || platform === '') return null
  if (typeof platform === 'number') return platform in platformLabels ? platform as Platform : null

  const numericPlatform = Number(platform)
  if (!Number.isNaN(numericPlatform) && numericPlatform in platformLabels) {
    return numericPlatform as Platform
  }

  const normalized = String(platform).replace(/\s+/g, '').toLowerCase()
  const platformMap: Record<string, Platform> = {
    facebook: Platform.Facebook,
    instagram: Platform.Instagram,
    tiktok: Platform.TikTok,
    youtube: Platform.YouTube,
  }

  return platformMap[normalized] ?? null
}

export const getPlatformLabel = (platform: Platform | string | number | null | undefined): string => {
  const value = getPlatformValue(platform)
  return value === null ? String(platform || 'Unknown') : platformLabels[value]
}

export const getPlatformBadge = (platform: Platform | string | number | null | undefined): string => {
  const value = getPlatformValue(platform)
  return value === null ? 'PL' : platformEmoji[value]
}
