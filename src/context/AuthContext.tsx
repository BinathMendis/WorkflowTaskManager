import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { jwtDecode } from 'jwt-decode'
import { AuthState, AuthResponse, DecodedToken } from '../types/auth.types'
import api from '../api/axiosInstance'
import { extractRoleNames, extractRolesFromObject, normalizeRoleName } from '../utils/roleHelpers'

type AuthAction =
  | { type: 'LOGIN'; payload: AuthResponse }
  | { type: 'LOGOUT' }

const initialState: AuthState = {
  token: null,
  userId: null,
  username: null,
  email: null,
  role: null,
  roles: [],
  isAuthenticated: false,
}

const normalizeAuthPayload = (payload: AuthResponse): AuthResponse => {
  const payloadRoles = extractRoleNames(payload.role, payload.roles)
  const primaryRole: 'Admin' | 'User' = payloadRoles.includes('Admin') ? 'Admin' : 'User'
  const roles = new Set<string>(payloadRoles)

  roles.add(primaryRole)

  return {
    ...payload,
    role: primaryRole,
    roles: Array.from(roles),
  }
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN': {
      const payload = normalizeAuthPayload(action.payload)
      return {
        token: payload.token,
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        role: payload.role as 'Admin' | 'User',
        roles: payload.roles || [],
        isAuthenticated: true,
      }
    }

    case 'LOGOUT':
      return initialState

    default:
      return state
  }
}

interface AuthContextValue {
  state: AuthState
  loading: boolean
  login: (data: AuthResponse) => Promise<void>
  logout: () => void
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  refreshRoles: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const [loading, setLoading] = useState(true)

  const hasRole = (role: string): boolean => {
    const targetRole = normalizeRoleName(role)
    if (!targetRole) return false
    const primaryRole = normalizeRoleName(state.role || undefined)
    const roles = state.roles.map(role => normalizeRoleName(role)).filter(Boolean)
    return roles.includes(targetRole) || primaryRole === targetRole
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role))
  }

  // Function to fetch roles from API
  const fetchUserRoles = async (token: string): Promise<string[]> => {
    try {
      const response = await api.get('/RoleManagement/current', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return extractRolesFromObject(response.data)
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
    return []
  }

  // Refresh roles for current user
  const refreshRoles = async (): Promise<void> => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const freshRoles = await fetchUserRoles(token)
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        const normalizedUser = normalizeAuthPayload({
          ...userData,
          roles: freshRoles.length > 0 ? freshRoles : userData.roles || [userData.role],
        })
        localStorage.setItem('user', JSON.stringify(normalizedUser))
        
        dispatch({
          type: 'LOGIN',
          payload: normalizedUser,
        })
      }
    } catch (error) {
      console.error('Error refreshing roles:', error)
    }
  }

  useEffect(() => {
    const restoreUser = async () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (!token || !storedUser) {
        setLoading(false)
        return
      }

      try {
        const decoded = jwtDecode<DecodedToken>(token)
        const isExpired = decoded.exp * 1000 < Date.now()

        if (isExpired) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          dispatch({ type: 'LOGOUT' })
          setLoading(false)
          return
        }

        const userData = JSON.parse(storedUser)
        const tokenRoles = extractRolesFromObject(decoded)
        
        // Fetch fresh roles from API
        const freshRoles = await fetchUserRoles(token)
        
        if (freshRoles.length > 0) {
          userData.roles = freshRoles
        } else if (tokenRoles.length > 0) {
          userData.roles = tokenRoles
        } else if (!userData.roles) {
          userData.roles = [userData.role]
        }

        const normalizedUser = normalizeAuthPayload(userData)
        localStorage.setItem('user', JSON.stringify(normalizedUser))
        
        dispatch({
          type: 'LOGIN',
          payload: normalizedUser,
        })
      } catch (error) {
        console.error('Error restoring user:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        dispatch({ type: 'LOGOUT' })
      } finally {
        setLoading(false)
      }
    }

    restoreUser()
  }, [])

  const login = async (data: AuthResponse) => {
    // Fetch roles from API
    const roles = await fetchUserRoles(data.token)
    const tokenRoles = extractRolesFromObject(jwtDecode<DecodedToken>(data.token))
    
    // Use fetched roles or fallback to primary role
    const normalizedData = normalizeAuthPayload({
      ...data,
      roles: roles.length > 0 ? roles : tokenRoles.length > 0 ? tokenRoles : data.roles || [data.role],
    })
    
    localStorage.setItem('token', normalizedData.token)
    localStorage.setItem('user', JSON.stringify(normalizedData))

    dispatch({
      type: 'LOGIN',
      payload: normalizedData,
    })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    dispatch({ type: 'LOGOUT' })
  }

  return (
    <AuthContext.Provider value={{ state, loading, login, logout, hasRole, hasAnyRole, refreshRoles }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return ctx
}
