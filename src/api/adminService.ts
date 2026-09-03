import api from './axiosInstance'

export const getUsers = async () => {
  const response = await api.get('/auth/admin/users')
  return response.data
}

export const getUserById = async (id: number) => {
  const response = await api.get(`/auth/admin/users/${id}`)
  return response.data
}

export const createUser = async (data: {
  username: string
  email: string
  password: string
  role: string
}) => {
  const response = await api.post('/auth/admin/users', {
    username: data.username,
    email: data.email,
    password: data.password,
    role: data.role
  })
  return response.data
}

export const updateUser = async (id: number, data: Partial<{
  username: string
  email: string
  password: string
  role: string
}>) => {
  const response = await api.put(`/auth/admin/users/${id}`, data)
  return response.data
}

export const deleteUser = async (id: number) => {
  const response = await api.delete(`/auth/admin/users/${id}`)
  return response.data
}