import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { getNotifications, markAsRead } from '../api/notificationService'
import { formatRelative, formatDateTime } from '../utils/dateHelpers'
import { toast } from 'react-toastify'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import { getRelevantNotifications } from '../utils/notificationHelpers'

export default function NotificationsPage() {
  const qc = useQueryClient()
  const { state } = useAuth()

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  })

  const relevantNotifications = useMemo(
    () => getRelevantNotifications(notifications, state),
    [notifications, state],
  )

  const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] })

  const read = useMutation({
    mutationFn: markAsRead,
    onSuccess: refresh,
  })

  const readAll = useMutation({
    mutationFn: async () => {
      const unread = relevantNotifications.filter(n => !n.isRead)
      await Promise.all(unread.map(n => markAsRead(n.id)))
    },
    onSuccess: () => { toast.success('Relevant notifications marked as read'); refresh() },
    onError: () => toast.error('Failed to mark notifications'),
  })

  const unreadCount = relevantNotifications.filter(n => !n.isRead).length

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => readAll.mutate()}
            disabled={readAll.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <CheckCheck className="h-4 w-4 text-red-500" />
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" className="mt-12" />
      ) : error ? (
        <ErrorMessage message="Failed to load notifications." />
      ) : relevantNotifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <BellOff className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No notifications yet</p>
          <p className="text-gray-400 text-sm mt-1">You'll see updates about your tasks here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {relevantNotifications.map(n => (
            <div
              key={n.id}
              className={`px-6 py-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-red-50/40' : ''}`}
              onClick={() => !n.isRead && read.mutate(n.id)}
            >
              <div className={`mt-1 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${!n.isRead ? 'bg-red-100' : 'bg-gray-100'}`}>
                <Bell className={`h-4 w-4 ${!n.isRead ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                    {n.title}
                    {!n.isRead && (
                      <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </p>
                  <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{formatRelative(n.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{n.message}</p>
                <p className="mt-1.5 text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
