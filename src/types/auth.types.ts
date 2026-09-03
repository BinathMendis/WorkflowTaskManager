export interface AuthResponse {
  token: string
  userId: number
  username: string
  email: string
  role: 'Admin' | 'User' | 'Approver' | 'Publisher' | string
  roles?: string[]  // NEW: Array of all roles (Approver, Publisher, etc.)
}

export interface AuthState {
  token: string | null
  userId: number | null
  username: string | null
  email: string | null
  role: 'Admin' | 'User' | null
  roles: string[]  // NEW: Store all roles
  isAuthenticated: boolean
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  username: string
  email: string
  password: string
  role: 'Admin' | 'User'
}

export interface DecodedToken {
  nameid: string
  unique_name: string
  email: string
  role: string
  exp: number
  iat: number
}
