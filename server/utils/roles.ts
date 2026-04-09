type RoleType = 'system' | 'custom'

type RolePermissions = Record<string, Record<string, boolean>>

export interface RoleRecord {
  id: string
  name: string
  description: string
  type: RoleType
  userCount: number
  permissions: RolePermissions
  canEdit: boolean
  createdAt: string
  updatedAt: string
}

const PERMISSION_TEMPLATE: RolePermissions = {
  employees: { viewUserDetails: true, manage: false, delete: false },
  departments: { view: true, manage: false, delete: false },
  branches: { view: true, manage: false, delete: false },
  payroll: { view: true, runPayroll: false, delete: false },
  leaves: { view: true, manage: false, delete: false },
  jobPostings: { view: true, manage: false, delete: false },
  applicants: { view: true, update: false, delete: false }
}

const now = () => new Date().toISOString()

const clonePermissions = (permissions: RolePermissions): RolePermissions => JSON.parse(JSON.stringify(permissions)) as RolePermissions

const enforceDependencies = (permissions: RolePermissions): RolePermissions => {
  const next = clonePermissions(permissions)

  const getViewKey = (moduleKey: string) => moduleKey === 'employees' ? 'viewUserDetails' : 'view'

  for (const moduleKey of Object.keys(next)) {
    const modulePermissions = next[moduleKey]
    if (!modulePermissions) {
      continue
    }

    const viewKey = getViewKey(moduleKey)
    if (!Object.prototype.hasOwnProperty.call(modulePermissions, viewKey)) {
      continue
    }

    const hasPowerAction = Object.entries(modulePermissions).some(([key, value]) => key !== viewKey && value)
    if (hasPowerAction) {
      modulePermissions[viewKey] = true
    }

    if (!modulePermissions[viewKey]) {
      for (const key of Object.keys(modulePermissions)) {
        if (key !== viewKey) {
          modulePermissions[key] = false
        }
      }
    }
  }

  return next
}

const rolesStore: RoleRecord[] = [
  {
    id: 'role_admin',
    name: 'Admin',
    description: 'Full access to the platform',
    type: 'system',
    userCount: 2,
    canEdit: false,
    permissions: {
      employees: { viewUserDetails: true, manage: true, delete: true },
      departments: { view: true, manage: true, delete: true },
      branches: { view: true, manage: true, delete: true },
      payroll: { view: true, runPayroll: true, delete: true },
      leaves: { view: true, manage: true, delete: true },
      jobPostings: { view: true, manage: true, delete: true },
      applicants: { view: true, update: true, delete: true }
    },
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'role_hr_manager',
    name: 'HR Manager',
    description: 'Handles HR operations',
    type: 'system',
    userCount: 5,
    canEdit: true,
    permissions: {
      employees: { viewUserDetails: true, manage: true, delete: false },
      departments: { view: true, manage: true, delete: false },
      branches: { view: true, manage: false, delete: false },
      payroll: { view: true, runPayroll: false, delete: false },
      leaves: { view: true, manage: true, delete: false },
      jobPostings: { view: true, manage: true, delete: false },
      applicants: { view: true, update: true, delete: false }
    },
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'role_payroll',
    name: 'Payroll',
    description: 'Payroll handling',
    type: 'custom',
    userCount: 2,
    canEdit: true,
    permissions: {
      employees: { viewUserDetails: true, manage: false, delete: false },
      departments: { view: true, manage: false, delete: false },
      branches: { view: true, manage: false, delete: false },
      payroll: { view: true, runPayroll: true, delete: false },
      leaves: { view: true, manage: false, delete: false },
      jobPostings: { view: false, manage: false, delete: false },
      applicants: { view: false, update: false, delete: false }
    },
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'role_viewer',
    name: 'Viewer',
    description: 'Read-only access',
    type: 'custom',
    userCount: 3,
    canEdit: true,
    permissions: clonePermissions(PERMISSION_TEMPLATE),
    createdAt: now(),
    updatedAt: now()
  }
]

const normalized = (value: string) => value.trim().toLowerCase()

export function listRoles(): RoleRecord[] {
  return rolesStore.map(role => ({ ...role, permissions: clonePermissions(role.permissions) }))
}

export function getRole(id: string): RoleRecord | undefined {
  const found = rolesStore.find(role => role.id === id)
  if (!found) {
    return undefined
  }
  return { ...found, permissions: clonePermissions(found.permissions) }
}

export function ensureRoleNameUnique(name: string, currentId?: string): boolean {
  const target = normalized(name)
  return !rolesStore.some(role => normalized(role.name) === target && role.id !== currentId)
}

export function createRole(input: { name: string, description: string, permissions: RolePermissions }): RoleRecord {
  const timestamp = now()
  const role: RoleRecord = {
    id: `role_${Math.random().toString(36).slice(2, 10)}`,
    name: input.name.trim(),
    description: input.description.trim(),
    type: 'custom',
    userCount: 0,
    canEdit: true,
    permissions: enforceDependencies(input.permissions),
    createdAt: timestamp,
    updatedAt: timestamp
  }

  rolesStore.unshift(role)
  return { ...role, permissions: clonePermissions(role.permissions) }
}

export function updateRole(id: string, input: { name: string, description: string, permissions: RolePermissions }): RoleRecord | undefined {
  const existing = rolesStore.find(role => role.id === id)
  if (!existing) {
    return undefined
  }

  if (!existing.canEdit) {
    return existing
  }

  const updated: RoleRecord = {
    ...existing,
    name: input.name.trim(),
    description: input.description.trim(),
    permissions: enforceDependencies(input.permissions),
    updatedAt: now()
  }

  const index = rolesStore.findIndex(role => role.id === id)
  if (index !== -1) {
    rolesStore[index] = updated
  }

  return { ...updated, permissions: clonePermissions(updated.permissions) }
}

export function duplicateRole(id: string, input: { name: string, description: string }): RoleRecord | undefined {
  const source = rolesStore.find(role => role.id === id)
  if (!source) {
    return undefined
  }

  return createRole({
    name: input.name,
    description: input.description,
    permissions: clonePermissions(source.permissions)
  })
}

export function deleteRole(id: string): { deleted: boolean, reason?: string } {
  const role = rolesStore.find(item => item.id === id)
  if (!role) {
    return { deleted: false, reason: 'NOT_FOUND' }
  }

  if (role.type === 'system') {
    return { deleted: false, reason: 'SYSTEM_ROLE_NOT_DELETABLE' }
  }

  if (role.userCount > 0) {
    return { deleted: false, reason: 'ROLE_HAS_ASSIGNED_USERS' }
  }

  const index = rolesStore.findIndex(item => item.id === id)
  if (index !== -1) {
    rolesStore.splice(index, 1)
  }

  return { deleted: true }
}
