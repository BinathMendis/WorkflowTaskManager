import api from './axiosInstance'
import { AttachmentDto } from '../types/task.types'

export const getTaskAttachments = async (taskId: number): Promise<AttachmentDto[]> => {
  const res = await api.get<AttachmentDto[]>(`/Tasks/${taskId}/attachments`)
  return res.data
}

export const uploadAttachment = async (taskId: number, file: File): Promise<AttachmentDto> => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post<AttachmentDto>(`/Tasks/${taskId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const downloadAttachment = async (taskId: number, attachmentId: number, fileName: string): Promise<void> => {
  const response = await api.get(`/Tasks/${taskId}/attachments/${attachmentId}/download`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const deleteAttachment = async (attachmentId: number): Promise<void> => {
  await api.delete(`/Tasks/attachments/${attachmentId}`)
}