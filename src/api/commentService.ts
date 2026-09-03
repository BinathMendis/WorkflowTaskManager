import api from './axiosInstance'
import { CommentDto } from '../types/task.types'

export const getTaskComments = async (taskId: number): Promise<CommentDto[]> => {
  const res = await api.get<CommentDto[]>(`/tasks/${taskId}/comments`)
  return res.data
}

export const addComment = async (taskId: number, commentText: string): Promise<CommentDto> => {
  const res = await api.post<CommentDto>(`/tasks/${taskId}/comments`, { commentText })
  return res.data
}

export const deleteComment = async (commentId: number): Promise<void> => {
  await api.delete(`/tasks/comments/${commentId}`)
}
