const ROLE_CLAIM_KEYS = [
  'role',
  'roles',
  'Role',
  'Roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
]

export const normalizeRoleName = (role?: unknown): string | null => {
  const normalized = String(role ?? '').trim().toLowerCase()
  const roleMap: Record<string, string> = {
    '0': 'User',
    '1': 'Admin',
    '2': 'Approver',
    '3': 'Publisher',
    admin: 'Admin',
    user: 'User',
    approver: 'Approver',
    approve: 'Approver',
    publisher: 'Publisher',
    publish: 'Publisher',
  }
  return roleMap[normalized] || null
}

const addRoleValue = (roles: Set<string>, value: unknown) => {
  if (Array.isArray(value)) {
    value.forEach(item => addRoleValue(roles, item))
    return
  }

  String(value ?? '')
    .split(/[;,]/)
    .map(item => normalizeRoleName(item))
    .filter((role): role is string => Boolean(role))
    .forEach(role => roles.add(role))
}

export const extractRoleNames = (...values: unknown[]): string[] => {
  const roles = new Set<string>()
  values.forEach(value => addRoleValue(roles, value))
  return Array.from(roles)
}

export const extractRolesFromObject = (value: unknown): string[] => {
  if (!value || typeof value !== 'object') {
    return extractRoleNames(value)
  }

  const roles = new Set<string>()
  ROLE_CLAIM_KEYS.forEach(key => addRoleValue(roles, (value as Record<string, unknown>)[key]))
  return Array.from(roles)
}

