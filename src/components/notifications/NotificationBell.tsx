import { useCallback, useEffect, useState, useRef } from 'react'
import { Bell, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getUnreadNotifications, markAsRead } from '../../api/notificationService'
import { NotificationDto } from '../../types/notification.types'
import { formatRelative } from '../../utils/dateHelpers'
import { useAuth } from '../../context/AuthContext'
import { getRelevantNotifications } from '../../utils/notificationHelpers'

export default function NotificationBell() {
  const { state } = useAuth()
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const fetchCount = useCallback(async () => {
    if (!state.isAuthenticated) return
    try {
      const list = await getUnreadNotifications()
      setCount(getRelevantNotifications(list, state).length)
    } catch { /* silent */ }
  }, [state])

  const fetchNotifications = useCallback(async () => {
    try {
      const list = await getUnreadNotifications()
      setNotifications(getRelevantNotifications(list, state))
    } catch { /* silent */ }
  }, [state])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 60_000)
    return () => clearInterval(interval)
  }, [fetchCount])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [fetchNotifications, open])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkRead = async (id: number) => {
    await markAsRead(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    setCount(prev => Math.max(0, prev - 1))
  }

  const handleMarkAll = async () => {
    await Promise.all(notifications.map(n => markAsRead(n.id)))
    setNotifications([])
    setCount(0)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-900 text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button onClick={handleMarkAll} className="text-xs text-red-600 hover:text-red-700 font-medium">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">All caught up!</div>
            ) : (
              notifications.slice(0, 10).map(n => (
                <div
                  key={n.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleMarkRead(n.id)}
                >
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-medium text-red-600 hover:text-red-700 py-3 border-t border-gray-100"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
