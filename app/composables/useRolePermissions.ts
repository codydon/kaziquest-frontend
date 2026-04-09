export type RoleType = 'system' | 'custom'

export interface RolePermissionModule {
  key: string
  label: string
  actions: Array<{
    key: string
    label: string
  }>
}

export type RolePermissions = Record<string, Record<string, boolean>>

export interface RoleItem {
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

export const ROLE_NAME_MAX_LENGTH = 60

export const ROLE_PERMISSION_MODULES: RolePermissionModule[] = [
  {
    key: 'employees',
    label: 'Employees',
    actions: [
      { key: 'viewUserDetails', label: 'View user details' },
      { key: 'manage', label: 'Manage' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  {
    key: 'departments',
    label: 'Departments',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'manage', label: 'Manage' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  {
    key: 'branches',
    label: 'Branches',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'manage', label: 'Manage' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  {
    key: 'payroll',
    label: 'Payroll',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'runPayroll', label: 'Run Payroll' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  {
    key: 'leaves',
    label: 'Leaves',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'manage', label: 'Manage' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  {
    key: 'jobPostings',
    label: 'Job Postings',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'manage', label: 'Manage' },
      { key: 'delete', label: 'Delete' }
    ]
  },
  {
    key: 'applicants',
    label: 'Applicants',
    actions: [
      { key: 'view', label: 'View' },
      { key: 'update', label: 'Update' },
      { key: 'delete', label: 'Delete' }
    ]
  }
]

export function createEmptyPermissions(): RolePermissions {
  return ROLE_PERMISSION_MODULES.reduce((acc, module) => {
    acc[module.key] = module.actions.reduce((actions, action) => {
      actions[action.key] = false
      return actions
    }, {} as Record<string, boolean>)
    return acc
  }, {} as RolePermissions)
}

export function clonePermissions(permissions: RolePermissions): RolePermissions {
  return JSON.parse(JSON.stringify(permissions)) as RolePermissions
}

export function applyPermissionDependency(
  permissions: RolePermissions,
  moduleKey: string,
  actionKey: string,
  checked: boolean
): RolePermissions {
  const next = clonePermissions(permissions)
  next[moduleKey] ??= {}
  next[moduleKey][actionKey] = checked

  const viewKey = moduleKey === 'employees' ? 'viewUserDetails' : 'view'
  const hasView = Object.prototype.hasOwnProperty.call(next[moduleKey], viewKey)

  if (!hasView) {
    return next
  }

  if (checked && actionKey !== viewKey) {
    next[moduleKey][viewKey] = true
  }

  if (!checked && actionKey === viewKey) {
    for (const key of Object.keys(next[moduleKey])) {
      if (key !== viewKey) {
        next[moduleKey][key] = false
      }
    }
  }

  return next
}
