import { AuthState } from '../types/auth.types'
import { NotificationDto } from '../types/notification.types'

const normalizeRole = (role?: string | null) => (role || '').trim().toLowerCase()

const normalizeId = (value: number | string | null | undefined) => {
  const id = Number(value)
  return Number.isFinite(id) ? id : null
}

export function isNotificationRelevant(notification: NotificationDto, auth: AuthState) {
  if (!auth.isAuthenticated || !auth.userId) return false

  if (auth.role === 'Admin') return true

  const currentUserId = Number(auth.userId)
  const targetUserIds = [
    notification.userId,
    notification.recipientUserId,
    notification.recipientId,
    notification.receiverUserId,
    notification.targetUserId,
    notification.notifiedUserId,
    notification.assignedUserId,
    notification.createdByUserId,
  ].map(normalizeId).filter((id): id is number => id !== null)

  if (targetUserIds.length > 0) {
    return targetUserIds.includes(currentUserId)
  }

  const currentRoles = new Set([auth.role, ...auth.roles].map(normalizeRole).filter(Boolean))
  const targetRoles = [
    notification.role,
    notification.targetRole,
    ...(notification.roles || []),
    ...(notification.targetRoles || []),
  ].map(normalizeRole).filter(Boolean)

  if (targetRoles.length > 0) {
    return targetRoles.some(role => currentRoles.has(role))
  }

  return false
}

export function getRelevantNotifications(notifications: NotificationDto[], auth: AuthState) {
  return notifications.filter(notification => isNotificationRelevant(notification, auth))
}
