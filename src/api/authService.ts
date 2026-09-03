import api from './axiosInstance'
import { AuthResponse, LoginDto, RegisterDto } from '../types/auth.types'

export const login = async (data: LoginDto): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/Auth/login', data)
  return res.data
}

export const register = async (data: RegisterDto): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/Auth/register', data)
  return res.data
}
