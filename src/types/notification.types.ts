export interface NotificationDto {
  id: number
  title: string
  message: string
  isRead: boolean
  createdAt: string
  userId?: number | string | null
  recipientUserId?: number | string | null
  recipientId?: number | string | null
  receiverUserId?: number | string | null
  targetUserId?: number | string | null
  notifiedUserId?: number | string | null
  assignedUserId?: number | string | null
  createdByUserId?: number | string | null
  role?: string | null
  targetRole?: string | null
  roles?: string[] | null
  targetRoles?: string[] | null
}
