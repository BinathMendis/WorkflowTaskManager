import api from './axiosInstance'
import { TaskDto, CreateTaskDto, UpdateTaskStatusDto, TaskFilterDto } from '../types/task.types'
import { getStatusQueryValue } from '../utils/enumHelpers'

export const getTasks = async (
  filters: TaskFilterDto = {}
): Promise<TaskDto[]> => {
  try {
    const params: Record<string, string | number | boolean> = {}

    if (filters.companyId !== undefined) params.companyId = filters.companyId
    if (filters.assignedUserId !== undefined) params.assignedUserId = filters.assignedUserId
    if (filters.status !== undefined) {
      const status = getStatusQueryValue(filters.status)
      if (status) params.status = status
    }
    if (filters.platform !== undefined) params.platform = filters.platform
    if (filters.priority !== undefined) params.priority = filters.priority
    if (filters.dueDateFrom) params.dueDateFrom = filters.dueDateFrom
    if (filters.dueDateTo) params.dueDateTo = filters.dueDateTo

    params.page = filters.page ?? 1
    params.pageSize = filters.pageSize ?? 20

    if (filters.sortBy) params.sortBy = filters.sortBy
    if (filters.sortDescending !== undefined) params.sortDescending = filters.sortDescending

    const res = await api.get('/Tasks', { params })
    
    if (res.data && res.data.data && Array.isArray(res.data.data)) {
      return res.data.data
    }
    
    if (res.data && Array.isArray(res.data)) {
      return res.data
    }
    
    console.warn('Unexpected tasks response structure:', res.data)
    return []
  } catch (error) {
    console.error('Error in getTasks:', error)
    return []
  }
}

export const getAllTasks = async (
  filters: TaskFilterDto = {},
  pageSize = 200
): Promise<TaskDto[]> => {
  const allTasks: TaskDto[] = []
  let page = 1

  while (page <= 100) {
    const tasks = await getTasks({ ...filters, page, pageSize })
    allTasks.push(...tasks)

    if (tasks.length < pageSize) break
    page += 1
  }

  return allTasks
}

export const getMyTasks = async (): Promise<TaskDto[]> => {
  try {
    const res = await api.get('/Tasks/my-tasks')
    
    if (res.data && Array.isArray(res.data)) {
      return res.data
    }
    if (res.data && res.data.data && Array.isArray(res.data.data)) {
      return res.data.data
    }
    return []
  } catch (error) {
    console.error('Error in getMyTasks:', error)
    return []
  }
}

export const getTaskById = async (id: number): Promise<TaskDto> => {
  const res = await api.get<TaskDto>(`/Tasks/${id}`)
  return res.data
}

export const createTask = async (data: CreateTaskDto): Promise<TaskDto> => {
  const res = await api.post<TaskDto>('/Tasks', data)
  return res.data
}

export const updateTaskStatus = async (
  id: number,
  data: UpdateTaskStatusDto
): Promise<void> => {
  await api.put(`/Tasks/${id}/status`, data)
}

export const acceptTask = async (id: number): Promise<void> => {
  await api.post(`/Tasks/${id}/accept`)
}

export const rejectTask = async (id: number, reason?: string): Promise<void> => {
  await api.post(`/Tasks/${id}/reject`, { reason: reason || '' })
}

export const completeTask = async (id: number): Promise<void> => {
  await api.post(`/Tasks/${id}/complete`)
}

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/Tasks/${id}`)
}

// ========== NEW: Approval Workflow Methods ==========

export const getPendingApprovalTasks = async (): Promise<TaskDto[]> => {
  const res = await api.get('/Approval/pending-approval')
  return Array.isArray(res.data) ? res.data : []
}

export const getApprovedForPublishTasks = async (): Promise<TaskDto[]> => {
  const res = await api.get('/Approval/approved-for-publish')
  return Array.isArray(res.data) ? res.data : []
}

export const approveTask = async (taskId: number, comment?: string): Promise<TaskDto> => {
  const res = await api.post(`/Approval/${taskId}/approve`, comment || '')
  return res.data
}

export const rejectTaskByApprover = async (taskId: number, rejectionReason: string): Promise<TaskDto> => {
  const res = await api.post(`/Approval/${taskId}/reject`, rejectionReason)
  return res.data
}

export const publishTask = async (taskId: number, comment?: string): Promise<TaskDto> => {
  const res = await api.post(`/Approval/${taskId}/publish`, comment || '')
  return res.data
}

export const uploadAttachment = async (taskId: number, file: File): Promise<any> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const res = await api.post(`/Tasks/${taskId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}
