import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Edit2, Trash2, Shield, User, Loader2, Search, X, ShieldCheck, Send } from 'lucide-react'
import { getUsers, createUser, updateUser, deleteUser } from '../api/adminService'
import { assignRole, getUserRoles } from '../api/userService'
import { getTasks } from '../api/taskService'
import { TaskStatus } from '../types/task.types'
import { getStatusValue } from '../utils/enumHelpers'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { extractRoleNames, normalizeRoleName } from '../utils/roleHelpers'
import SelectField from '../components/common/SelectField'

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional().default(''),
  role: z.enum(['Admin', 'User']),
})

type UserFormValues = z.infer<typeof userSchema>
const ADDITIONAL_ROLES = ['Approver', 'Publisher']

const normalizePrimaryRole = (role?: string): 'Admin' | 'User' => normalizeRoleName(role) === 'Admin' ? 'Admin' : 'User'

const normalizeUserRoles = (user: any, fetchedRoles?: string[]) => {
  const roles = new Set<string>(extractRoleNames(user.role, fetchedRoles?.length ? fetchedRoles : user.roles || []))
  roles.add(normalizePrimaryRole(user.role))
  return Array.from(roles)
}

const normalizeUser = (user: any, fetchedRoles?: string[]) => ({
  ...user,
  role: normalizePrimaryRole(user.role),
  roles: normalizeUserRoles(user, fetchedRoles),
})

export default function UserListPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [canChangePrimaryRole, setCanChangePrimaryRole] = useState(true)
  const [isCheckingAssignedTasks, setIsCheckingAssignedTasks] = useState(false)
  const queryClient = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const users = await getUsers()
      return Promise.all(users.map(async (user: any) => {
        try {
          const roles = await getUserRoles(user.id)
          return normalizeUser(user, roles)
        } catch {
          return normalizeUser(user)
        }
      }))
    },
  })

  const { register, handleSubmit, reset, setError, setValue, watch, formState: { errors, isSubmitting } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'User' }
  })
  const selectedRole = watch('role') || 'User'

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created successfully')
      setIsModalOpen(false)
      reset()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create user')
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserFormValues> }) => 
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated successfully')
      setIsModalOpen(false)
      setEditingUser(null)
      reset()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update user')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted successfully')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete user')
    }
  })

  const assignRoleMutation = useMutation({
    mutationFn: assignRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      refreshUserRoles()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update role')
    }
  })

  const onSubmit = (data: UserFormValues) => {
    if (!editingUser && (!data.password || data.password.length < 6)) {
      setError('password', { message: 'Password must be at least 6 characters' })
      return
    }

    const payload = {
      ...data,
      role: editingUser && !canChangePrimaryRole ? normalizePrimaryRole(editingUser.role) : data.role,
    }

    if (editingUser && !payload.password) {
      delete (payload as Partial<UserFormValues>).password
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const openEditModal = (user: any) => {
    const normalizedUser = normalizeUser(user)
    setEditingUser(normalizedUser)
    setCanChangePrimaryRole(true)
    reset({
      username: normalizedUser.username,
      email: normalizedUser.email,
      role: normalizedUser.role,
      password: '',
    })
    setIsModalOpen(true)
    checkPrimaryRoleChangeAllowed(normalizedUser)
  }

  const checkPrimaryRoleChangeAllowed = async (user: any) => {
    if (!user?.id) return
    setIsCheckingAssignedTasks(true)
    try {
      const assignedTasks = await getTasks({ assignedUserId: user.id, pageSize: 500 })
      const hasUnpublishedAssignedTask = assignedTasks.some(task => getStatusValue(task.status) !== TaskStatus.Published)
      setCanChangePrimaryRole(!hasUnpublishedAssignedTask)
    } catch (error) {
      console.error('Failed to check assigned tasks:', error)
      setCanChangePrimaryRole(false)
      toast.error('Could not verify assigned tasks. Primary role change is disabled for safety.')
    } finally {
      setIsCheckingAssignedTasks(false)
    }
  }

  const openRoleModal = async (user: any) => {
    setSelectedUser(normalizeUser(user))
    setShowRoleModal(true)
    await refreshUserRoles(user.id)
  }

  const refreshUserRoles = async (userId?: number) => {
    const targetUserId = userId || selectedUser?.id
    if (!targetUserId) return
    
    setIsLoadingRoles(true)
    try {
      const roles = await getUserRoles(targetUserId)
      setUserRoles(normalizeUserRoles(selectedUser || {}, roles))
    } catch (error) {
      console.error('Failed to load roles:', error)
    } finally {
      setIsLoadingRoles(false)
    }
  }

  const handleRoleToggle = async (role: string, checked: boolean) => {
    if (!selectedUser) return
    if (assignRoleMutation.isPending) return
    if (role === 'Admin') {
      toast.error('Admin is a primary role and cannot be assigned as an additional role.')
      return
    }
    
    await assignRoleMutation.mutateAsync({
      userId: selectedUser.id,
      role: role,
      assign: checked
    })
    await refreshUserRoles(selectedUser.id)
    queryClient.invalidateQueries({ queryKey: ['users'] })
    
    toast.success(`${checked ? 'Assigned' : 'Removed'} ${role} role ${checked ? 'to' : 'from'} ${selectedUser.username}`)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Shield className="h-4 w-4" />
      case 'Approver':
        return <ShieldCheck className="h-4 w-4" />
      case 'Publisher':
        return <Send className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800'
      case 'Approver':
        return 'bg-green-100 text-green-800'
      case 'Publisher':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getUserRolesForDisplay = (user: any): string[] => {
    const roles: string[] = Array.isArray(user.roles) ? user.roles : []
    return Array.from(new Set(roles.filter((role: string) => ADDITIONAL_ROLES.includes(role))))
  }

  const filteredUsers = users.filter((user: any) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-red-500" /></div>
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-red-500" />
            User Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage system users and assign roles (Approver, Publisher, etc.)</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null)
            reset({ username: '', email: '', password: '', role: 'User' })
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Additional Roles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      {user.role === 'Admin' ? (
                        <Shield className="h-4 w-4 text-red-600" />
                      ) : (
                        <User className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <span className="font-medium text-gray-900">{user.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    <span className="ml-1">{user.role}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-1">
                    {getUserRolesForDisplay(user).map((role: string) => (
                      <span key={role} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
                        {getRoleIcon(role)}
                        <span className="ml-1">{role}</span>
                      </span>
                    ))}
                    {getUserRolesForDisplay(user).length === 0 && (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => openRoleModal(user)}
                    disabled={false}
                    className="inline-flex cursor-pointer items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                    title="Manage Roles"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-xs font-medium">Roles</span>
                  </button>
                  <button
                    onClick={() => openEditModal(user)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Edit User"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this user?')) {
                        deleteMutation.mutate(user.id)
                      }
                    }}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">No users found</div>
        )}
      </div>

      {/* Modal for Create/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingUser(null)
                  reset()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  {...register('username')}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:outline-none"
                  placeholder="johndoe"
                />
                {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:outline-none"
                  placeholder="user@example.com"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  {...register('password')}
                  type="password"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:outline-none"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Role</label>
                {editingUser ? (
                  <SelectField
                    value={selectedRole}
                    options={[
                      { value: 'User', label: 'User' },
                      { value: 'Admin', label: 'Admin' },
                    ]}
                    onChange={value => setValue('role', value as UserFormValues['role'], { shouldValidate: true, shouldDirty: true })}
                    disabled={!canChangePrimaryRole || isCheckingAssignedTasks}
                    buttonClassName="rounded-lg px-3 py-2 shadow-none disabled:bg-gray-50 disabled:text-gray-500"
                  />
                ) : (
                  <>
                    <input type="hidden" {...register('role')} value="User" />
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">User</div>
                  </>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {editingUser
                    ? canChangePrimaryRole
                      ? 'Primary role can change because there are no active assigned tasks.'
                      : 'Primary role is locked until every assigned task is Published.'
                    : 'New accounts start as User. Approver and Publisher are assigned in Role Management.'}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingUser(null)
                    reset()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (editingUser ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Manage Roles: {selectedUser.username}</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {isLoadingRoles ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-red-500" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">User</p>
                    <p className="text-xs text-gray-500">Primary role</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{selectedUser.role || 'User'}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Approver</p>
                    <p className="text-xs text-gray-500">Can approve completed tasks</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('Approver', !userRoles.includes('Approver'))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      userRoles.includes('Approver') ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                    aria-pressed={userRoles.includes('Approver')}
                    title="Toggle Approver role"
                  >
                    <span className={`absolute top-[2px] h-5 w-5 rounded-full border border-gray-300 bg-white transition-all ${
                      userRoles.includes('Approver') ? 'left-[22px]' : 'left-[2px]'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Publisher</p>
                    <p className="text-xs text-gray-500">Can publish approved tasks</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('Publisher', !userRoles.includes('Publisher'))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      userRoles.includes('Publisher') ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-pressed={userRoles.includes('Publisher')}
                    title="Toggle Publisher role"
                  >
                    <span className={`absolute top-[2px] h-5 w-5 rounded-full border border-gray-300 bg-white transition-all ${
                      userRoles.includes('Publisher') ? 'left-[22px]' : 'left-[2px]'
                    }`} />
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Additional roles: {userRoles.filter(r => ['Approver', 'Publisher'].includes(r)).join(', ') || 'None'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
