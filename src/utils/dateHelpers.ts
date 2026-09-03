import { format, formatDistanceToNow, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns'

export const formatDate = (dateStr: string) =>
  format(new Date(dateStr), 'MMM d, yyyy')

export const formatDateTime = (dateStr: string) =>
  format(new Date(dateStr), 'MMM d, yyyy h:mm a')

export const formatRelative = (dateStr: string) =>
  formatDistanceToNow(new Date(dateStr), { addSuffix: true })

export const isOverdue = (dueDateStr: string, status: number) => {
  if (status === 3 || status === 4 || status === 5) return false
  return isPast(new Date(dueDateStr)) && !isToday(new Date(dueDateStr))
}

export const isDueToday = (dueDateStr: string) =>
  isToday(new Date(dueDateStr))

export const isDueTomorrow = (dueDateStr: string) =>
  isTomorrow(new Date(dueDateStr))

export const getDueDateLabel = (dueDateStr: string, status: number): { label: string; className: string } => {
  const date = new Date(dueDateStr)
  if (status === 3 || status === 5) {
    return { label: formatDate(dueDateStr), className: 'text-gray-500' }
  }
  if (isPast(date) && !isToday(date)) {
    const days = Math.abs(differenceInDays(date, new Date()))
    return { label: `${days}d overdue`, className: 'text-red-600 font-semibold' }
  }
  if (isToday(date)) return { label: 'Due today', className: 'text-amber-600 font-semibold' }
  if (isTomorrow(date)) return { label: 'Due tomorrow', className: 'text-orange-500 font-medium' }
  const daysLeft = differenceInDays(date, new Date())
  if (daysLeft <= 7) return { label: `${daysLeft}d left`, className: 'text-yellow-600' }
  return { label: formatDate(dueDateStr), className: 'text-gray-500' }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
