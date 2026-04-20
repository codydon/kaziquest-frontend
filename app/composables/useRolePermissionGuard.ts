import { companyService } from '~~/services/company.service'

/**
 * Mirrors legacy `kaziquest-employer-nuxt` permission checks using the current session user.
 * Adds leave-approver + reports-to checks used by Time Off flows.
 */
interface CompanyApproverRow {
  type?: string
  approver?: string | number
  is_active?: boolean
}

export function useRolePermissionGuard() {
  const { session } = useAuthSession()

  const permissions = computed(() => {
    const group = session.value.user?.group as { permissions?: { codename: string }[] } | undefined
    return group?.permissions ?? []
  })

  const hasPermission = (codename: string) => {
    return permissions.value.some(p => p.codename === codename)
  }

  const isBaseLevelEmployee = computed(() => {
    const group = session.value.user?.group as { name?: string } | undefined
    return (group?.name || '') === 'Employee'
  })

  const isManager = computed(() => {
    const group = session.value.user?.group as { name?: string } | undefined
    const name = group?.name || ''
    return name === 'Hr Manager' || name === 'HR Manager'
  })

  const isAdmin = computed(() => {
    const group = session.value.user?.group as { name?: string } | undefined
    return (group?.name || '') === 'Admin'
  })

  const approvers = useState<CompanyApproverRow[]>('kq-company-approvers', () => [])
  const approversLoadStatus = useState<'idle' | 'loading' | 'ready' | 'error'>('kq-company-approvers-status', () => 'idle')

  async function ensureApproversLoaded() {
    if (!import.meta.client || approversLoadStatus.value === 'loading' || approversLoadStatus.value === 'ready') {
      return
    }
    approversLoadStatus.value = 'loading'
    try {
      const res = await companyService.getApprovers({
        handler: '$fetch',
      }) as CompanyApproverRow[] | { results?: CompanyApproverRow[], data?: CompanyApproverRow[] }
      const list = Array.isArray(res)
        ? res
        : (res?.results ?? res?.data ?? [])
      approvers.value = Array.isArray(list) ? list : []
      approversLoadStatus.value = 'ready'
    }
    catch {
      approvers.value = []
      approversLoadStatus.value = 'error'
    }
  }

  const userId = computed(() => String((session.value.user as { id?: string | number } | undefined)?.id ?? ''))

  const isLeaveApprover = computed(() => {
    if (!userId.value) {
      return false
    }
    return approvers.value.some(
      a => a.type === 'LEAVE' && String(a.approver) === userId.value && a.is_active !== false,
    )
  })

  const isPayrollApprover = computed(() => {
    if (!userId.value) {
      return false
    }
    return approvers.value.some(
      a => a.type === 'PAYROLL' && String(a.approver) === userId.value && a.is_active !== false,
    )
  })

  const hasReportsTo = computed(() => {
    const user = session.value.user as {
      employee?: { employees_managed?: unknown[] }
    } | undefined
    const managed = user?.employee?.employees_managed
    return Array.isArray(managed) && managed.length > 0
  })

  if (import.meta.client) {
    void ensureApproversLoaded()
  }

  return {
    hasPermission,
    isBaseLevelEmployee,
    isManager,
    isAdmin,
    isLeaveApprover,
    isPayrollApprover,
    hasReportsTo,
    ensureApproversLoaded,
  }
}
