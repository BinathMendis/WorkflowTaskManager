export enum Platform {
  Facebook = 0,
  Instagram = 1,
  TikTok = 2,
  YouTube = 3,
}

export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3,
}

export enum TaskStatus {
  Pending = 0,
  Accepted = 1,
  InProgress = 2,
  Completed = 3,
  Rejected = 4,
  Closed = 5,
  // NEW: Approval workflow statuses
  PendingApproval = 6,
  Approved = 7,
  Published = 8,
}

export interface CommentDto {
  id: number
  taskId: number
  userId: number
  userName: string
  commentText: string
  createdAt: string
}

export interface AttachmentDto {
  id: number
  taskId: number
  fileName: string
  fileType: string
  fileSize: number
  uploadedByUserName: string
  uploadedBy: number
  createdAt: string
  downloadUrl: string
}

export interface TaskDto {
  id: number
  title: string
  description: string
  companyId: number
  companyName: string
  assignedUserId: number
  assignedUserName: string
  platform: Platform
  priority: TaskPriority
  status: TaskStatus
  dueDate: string
  createdAt: string
  updatedAt: string
  comments: CommentDto[]
  attachments?: AttachmentDto[]
  // NEW: Approval fields
  approvedByUserId?: number
  approvedByUserName?: string
  approvedAt?: string
  publishedByUserId?: number
  publishedByUserName?: string
  publishedAt?: string
  rejectionReason?: string
}

export interface CreateTaskDto {
  title: string
  description: string
  companyId: number
  assignedUserId: number
  platform: string
  priority: string
  dueDate: string
}

export interface UpdateTaskStatusDto {
  status: string
  comment?: string
}

export interface TaskFilterDto {
  companyId?: number
  assignedUserId?: number
  status?: TaskStatus | string
  platform?: Platform
  priority?: TaskPriority
  dueDateFrom?: string
  dueDateTo?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDescending?: boolean
}
