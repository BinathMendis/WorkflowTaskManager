import api from './axiosInstance'
import { extractRolesFromObject } from '../utils/roleHelpers'

export interface UserDto {
  id: number
  username: string
  email: string
  role?: string
  roles?: string[]
  createdAt?: string
}

export const getUsers = async (): Promise<UserDto[]> => {
  const res = await api.get<UserDto[]>('/users')
  return res.data
}

// ========== NEW: Role Management Methods ==========

export interface AssignRoleDto {
  userId: number
  role: string  // User, Admin, Approver, Publisher
  assign: boolean
}

export const assignRole = async (data: AssignRoleDto): Promise<void> => {
  await api.post('/RoleManagement/assign', data)
}

export const getUserRoles = async (userId: number): Promise<string[]> => {
  const res = await api.get(`/RoleManagement/user/${userId}`)
  return extractRolesFromObject(res.data)
}

export const getUsersByRole = async (role: string): Promise<UserDto[]> => {
  const res = await api.get(`/RoleManagement/by-role/${role}`)
  return Array.isArray(res.data) ? res.data : []
}

export const getCurrentUserWithRoles = async (): Promise<UserDto> => {
  const res = await api.get('/RoleManagement/current')
  return res.data
}
