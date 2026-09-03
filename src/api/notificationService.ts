import api from './axiosInstance'
import { NotificationDto } from '../types/notification.types'

export const getNotifications = async (): Promise<NotificationDto[]> => {
  const res = await api.get<NotificationDto[]>('/notifications')
  return res.data
}

export const getUnreadNotifications = async (): Promise<NotificationDto[]> => {
  const res = await api.get<NotificationDto[]>('/notifications/unread')
  return res.data
}

export const getUnreadCount = async (): Promise<number> => {
  const res = await api.get<number>('/notifications/unread-count')
  return res.data
}

export const markAsRead = async (id: number): Promise<void> => {
  await api.put(`/notifications/${id}/read`)
}

export const markAllAsRead = async (): Promise<void> => {
  await api.put('/notifications/mark-all-read')
}
