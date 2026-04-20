<script setup lang="ts">
import { h, reactive, resolveComponent, unref } from 'vue'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { SortingState } from '@tanstack/table-core'
import { employeeService } from '~~/services/employee.service'
import { companyService } from '~~/services/company.service'
import { authService } from '~~/services/auth.service'
import { ROUTE_LIST } from '~/constants/routeList'
import { parseApiError } from '~/utils/parseApiError'
import { useAuthStore } from '~/stores/auth'
import type { AuthUser } from '~/types'

definePageMeta({
  layout: 'default'
})

interface EmployeeListRow {
  id: string
  status?: string
  department?: string | null
  position?: string | null
  start_date?: string | null
  salary?: number | null
  self_service_access?: boolean
  employee_number?: string | null
  user?: {
    full_name?: string
    email?: string
    email_verified?: boolean
    phone_number?: string
  }
}

const pageSizeOptions = [10, 30, 50, 100, 200]

/** Radix/Nuxt UI Select forbids `value: ''` on items; use sentinel for “all”. */
const ALL_DEPARTMENTS = '__all_departments__'

const urlParams = reactive({
  page_size: 10,
  search: '',
  page: 1,
  department: ALL_DEPARTMENTS,
  status: 'Active',
  stats: true as boolean
})

const employeesPayload = ref<Record<string, unknown> | null>(null)
const loadingEmployees = ref(false)
const departmentsLoading = ref(false)
const departmentList = ref<{ name: string }[]>([])

const toast = useToast()
const authStore = useAuthStore()
const { token, session, isHydrating, setUser, setAuthTokens } = useAuthSession()
const { hasPermission, isBaseLevelEmployee, isAdmin, isManager } = useRolePermissionGuard()

const canShowAddEmployee = computed(
  () => isAdmin.value || isManager.value || hasPermission('add_employee')
)

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')
const UserAvatar = resolveComponent('UserAvatar')
const NuxtLink = resolveComponent('NuxtLink')
const NuxtTime = resolveComponent('NuxtTime')

const statusOptions = [
  'Active',
  'Suspended',
  'Terminated',
  'Terminated-Voluntary',
  'Terminated-Involuntary',
  'Terminated-Layoff',
  'Terminated-Retirement'
]

const horizontalFilters = reactive([
  { label: 'Active', slot: 'active', badge: 0, click: () => { urlParams.status = 'Active' } },
  { label: 'Suspended', slot: 'suspended', badge: 0, click: () => { urlParams.status = 'Suspended' } },
  { label: 'Exited', slot: 'exited', badge: 0, click: () => { urlParams.status = 'Exited' } },
  { label: 'On Leave', slot: 'onleave', badge: 0, click: () => { urlParams.status = 'onleave' } },
  { label: 'Pending', slot: 'pending', badge: 0, click: () => { urlParams.status = 'Pending' } },
  { label: 'No Access', slot: 'noaccess', badge: 0, click: () => { urlParams.status = 'noaccess' } },
  { label: 'Has Access', slot: 'hasaccess', badge: 0, click: () => { urlParams.status = 'hasaccess' } },
  { label: 'All', slot: 'all', badge: 0, click: () => { urlParams.status = 'all' } }
])

function unwrapEmployeesPayload(res: unknown): Record<string, unknown> | null {
  if (res == null || typeof res !== 'object') {
    return null
  }
  const r = res as Record<string, unknown>
  const inner = r.data as Record<string, unknown> | undefined
  if (inner && Array.isArray(inner.results)) {
    return inner
  }
  if (Array.isArray(r.results)) {
    return r
  }
  const innerData = inner?.data as Record<string, unknown> | undefined
  if (innerData && Array.isArray(innerData.results)) {
    return innerData
  }
  return inner ?? r
}

async function ensureAuthProfileReady() {
  if (!import.meta.client) {
    return
  }
  const deadline = Date.now() + 8000
  while (isHydrating.value && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 40))
  }
  if (!token.value) {
    return
  }
  const user = session.value.user as { group?: { name?: string } } | null | undefined
  const groupReady = Boolean(user && String(user.group?.name ?? '').trim())
  if (groupReady) {
    return
  }
  try {
    const response = await authService.fetchAuthUser({
      handler: '$fetch',
      secured: true
    }) as Record<string, unknown>
    const payload = (response?.data ?? response) as Record<string, unknown>
    const userData = (payload?.data ?? payload) as Record<string, unknown>
    if (!userData || typeof userData !== 'object') {
      return
    }
    if (typeof userData.access === 'string' && userData.access) {
      setAuthTokens({
        accessToken: userData.access,
        refreshToken: typeof userData.refresh === 'string' ? userData.refresh : null
      })
    }
    const { access: _access, refresh: _refresh, ...user } = userData
    setUser(user as AuthUser)
  } catch {
    /* non-fatal: list may still load with cached session */
  }
}

async function fetchEmployees() {
  loadingEmployees.value = true
  try {
    const query = {
      page: urlParams.page,
      page_size: urlParams.page_size,
      search: urlParams.search,
      department: urlParams.department === ALL_DEPARTMENTS ? '' : urlParams.department,
      status: urlParams.status,
      stats: urlParams.stats ? 'true' : 'false'
    }
    const res = await employeeService.getEmployees({
      handler: '$fetch',
      query,
      secured: true
    })
    employeesPayload.value = unwrapEmployeesPayload(res)
  } catch (error: unknown) {
    toast.add({
      title: 'Unable to load employees',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
    employeesPayload.value = null
  } finally {
    loadingEmployees.value = false
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => ({
    page: urlParams.page,
    page_size: urlParams.page_size,
    search: urlParams.search,
    department: urlParams.department,
    status: urlParams.status,
    stats: urlParams.stats
  }),
  () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      void fetchEmployees()
    }, 400)
  },
  { deep: true }
)

watch(
  () => urlParams.page_size,
  () => {
    urlParams.page = 1
  }
)

watch(
  () => [urlParams.search, urlParams.department, urlParams.status],
  () => {
    urlParams.page = 1
  }
)

watch(
  employeesPayload,
  (data) => {
    if (!data?.stats || typeof data.stats !== 'object') {
      return
    }
    const stats = data.stats as Record<string, number>
    for (const filter of horizontalFilters) {
      const key = filter.slot
      filter.badge = Number(stats[key] ?? stats[key.toLowerCase() as keyof typeof stats] ?? 0)
    }
  },
  { deep: true, immediate: true }
)

function unwrapDepartmentList(res: unknown): { name: string }[] {
  const raw = (res as Record<string, unknown> | null)?.data ?? res
  const keep = (d: { name?: string }) => Boolean(d?.name && String(d.name).trim())
  if (Array.isArray(raw)) {
    return (raw as { name: string }[]).filter(keep)
  }
  if (raw && typeof raw === 'object' && 'results' in raw && Array.isArray((raw as { results: unknown }).results)) {
    return ((raw as { results: { name: string }[] }).results).filter(keep)
  }
  return []
}

onMounted(async () => {
  await ensureAuthProfileReady()
  departmentsLoading.value = true
  try {
    const res = await companyService.fetchDepartments({
      handler: '$fetch',
      secured: true
    })
    departmentList.value = unwrapDepartmentList(res)
  } catch {
    departmentList.value = []
  } finally {
    departmentsLoading.value = false
  }

  loadStoredOptionalColumns()
  await fetchEmployees()
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
})

const rows = computed(() => {
  const r = employeesPayload.value?.results
  return Array.isArray(r) ? (r as EmployeeListRow[]) : []
})

const totalCount = computed(() => {
  const raw = employeesPayload.value?.count
  const n = Number(raw)
  if (Number.isFinite(n) && n > 0) {
    return n
  }
  if (rows.value.length > 0) {
    return rows.value.length
  }
  return Number.isFinite(n) ? n : 0
})

const showingFrom = computed(() => {
  if (!totalCount.value) {
    return 0
  }
  return (urlParams.page - 1) * urlParams.page_size + 1
})

const showingTo = computed(() => {
  if (!totalCount.value) {
    return 0
  }
  return Math.min(urlParams.page * urlParams.page_size, totalCount.value)
})

const paginationPage = computed({
  get: () => urlParams.page,
  set: (p: number) => {
    urlParams.page = p
  }
})

function formatSalary(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—'
  }
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(value))
}

/** Legacy `formartToLongDayMonthDate`: `DD, MMMM, YYYY` (e.g. `01, April, 2026`). */
function formatStartDateLong(value: string | null | undefined) {
  if (!value) {
    return '—'
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return '—'
  }
  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('en-GB', { month: 'long' })
  const year = d.getFullYear()
  return `${day}, ${month}, ${year}`
}

function employeeDetailPath(id: string) {
  return ROUTE_LIST.employees.detail.replace(':uuid', id)
}

const accessModalOpen = ref(false)
const accessEmployee = ref<EmployeeListRow | null>(null)
const accessAction = ref<'enable' | 'disable'>('disable')
const accessLoading = ref(false)

const resendModalOpen = ref(false)
const resendEmployee = ref<EmployeeListRow | null>(null)
const resendLoading = ref(false)

function isTerminationExitStatus(status: string | undefined): boolean {
  if (!status) {
    return false
  }
  return status === 'Terminated' || status.startsWith('Terminated-')
}

const exitInfoCache = ref<Record<string, boolean>>({})
const exitInfoCheckInProgress = ref<Record<string, boolean>>({})

async function hasEmployeeExitInfo(employeeId: string): Promise<boolean> {
  if (exitInfoCache.value[employeeId] !== undefined) {
    return exitInfoCache.value[employeeId]!
  }
  if (exitInfoCheckInProgress.value[employeeId]) {
    return false
  }
  exitInfoCheckInProgress.value[employeeId] = true
  try {
    const response = await employeeService.getEmployeeExitInfo(employeeId, {
      handler: '$fetch',
      secured: true
    }) as { success?: boolean, data?: unknown }
    const hasExitInfo = Boolean(response?.success && response?.data)
    exitInfoCache.value[employeeId] = hasExitInfo
    return hasExitInfo
  } catch {
    exitInfoCache.value[employeeId] = false
    return false
  } finally {
    exitInfoCheckInProgress.value[employeeId] = false
  }
}

function shouldShowExitButton(row: EmployeeListRow): boolean {
  if (!isTerminationExitStatus(row.status)) {
    return false
  }
  if (exitInfoCache.value[row.id] === true) {
    return false
  }
  if (exitInfoCache.value[row.id] === undefined) {
    void hasEmployeeExitInfo(row.id)
  }
  return exitInfoCache.value[row.id] !== false
}

const exitModalOpen = ref(false)
const exitEmployee = ref<EmployeeListRow | null>(null)

function openExitModal(row: EmployeeListRow) {
  exitEmployee.value = row
  exitModalOpen.value = true
}

function handleExitSuccess() {
  exitModalOpen.value = false
  if (exitEmployee.value?.id) {
    exitInfoCache.value[exitEmployee.value.id] = true
  }
  exitEmployee.value = null
  void fetchEmployees()
}

function openAccessModal(row: EmployeeListRow, action: 'enable' | 'disable') {
  accessEmployee.value = row
  accessAction.value = action
  accessModalOpen.value = true
}

async function confirmAccessChange() {
  const employee = accessEmployee.value
  if (!employee) {
    return
  }
  accessLoading.value = true
  try {
    await employeeService.enableDisableAccess({
      handler: '$fetch',
      body: {
        employee_id: employee.id,
        action: accessAction.value
      }
    })
    toast.add({
      title: `Access ${accessAction.value === 'enable' ? 'enabled' : 'disabled'}`,
      color: 'success'
    })
    accessModalOpen.value = false
    await fetchEmployees()
  } catch (error: unknown) {
    toast.add({
      title: 'Update failed',
      description: parseApiError(error, 'Unable to update access.'),
      color: 'error'
    })
  } finally {
    accessLoading.value = false
  }
}

function openResendModal(row: EmployeeListRow) {
  resendEmployee.value = row
  resendModalOpen.value = true
}

async function confirmResendActivation() {
  const employee = resendEmployee.value
  if (!employee) {
    return
  }
  resendLoading.value = true
  try {
    await employeeService.resendActivationEmail({
      handler: '$fetch',
      body: { employee_id: employee.id }
    })
    toast.add({ title: 'Activation email sent', color: 'success' })
    resendModalOpen.value = false
  } catch (error: unknown) {
    toast.add({
      title: 'Resend failed',
      description: parseApiError(error, 'Unable to resend email.'),
      color: 'error'
    })
  } finally {
    resendLoading.value = false
  }
}

function rowActions(row: EmployeeListRow) {
  const verified = Boolean(row.user?.email_verified)
  const editItem = {
    label: 'Edit',
    icon: 'i-lucide-pencil',
    to: employeeDetailPath(row.id)
  }
  const accessItem = {
    label: row.self_service_access ? 'Disable access' : 'Enable access',
    icon: row.self_service_access ? 'i-lucide-lock' : 'i-lucide-lock-open',
    onSelect: () => {
      openAccessModal(row, row.self_service_access ? 'disable' : 'enable')
    }
  }
  const exitItem = (!isBaseLevelEmployee.value && shouldShowExitButton(row))
    ? [{
        label: 'Exit',
        icon: 'i-lucide-log-out',
        onSelect: () => openExitModal(row)
      }]
    : []

  const resendActivationItem = urlParams.status === 'Pending' && !verified
    ? [{
        label: 'Send activation email',
        icon: 'i-lucide-mail',
        onSelect: () => openResendModal(row)
      }]
    : []

  if (verified) {
    return [[editItem, ...exitItem, accessItem]]
  }
  return [[
    editItem,
    ...exitItem,
    ...resendActivationItem,
    accessItem
  ]]
}

const STORAGE_KEY_EMPLOYEE_COLS = 'kq-employees-optional-cols'

interface OptionalColDef {
  key: string
  label: string
}

/** Toggleable data columns (select, row #, name, and actions stay fixed). */
const optionalColumnDefs: OptionalColDef[] = [
  { key: 'email', label: 'Email' },
  { key: 'dept_position', label: 'Dept & Position' },
  { key: 'start_date', label: 'Start Date' },
  { key: 'salary', label: 'Salary' },
  { key: 'status', label: 'Status' },
  { key: 'access', label: 'Access' }
]

const LEGACY_OPTIONAL_COL_KEYS = new Set([
  'email',
  'start_date',
  'salary',
  'status',
  'access'
])

const LEGACY_DEPT_POS_KEYS = new Set(['department', 'position'])

const selectedOptionalColumnKeys = ref<string[]>([...optionalColumnDefs.map(c => c.key)])

function defaultOptionalColumnKeys(): string[] {
  return optionalColumnDefs.map(c => c.key)
}

function loadStoredOptionalColumns() {
  if (!import.meta.client) {
    return
  }
  const defaults = defaultOptionalColumnKeys()
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMPLOYEE_COLS)
    if (!raw) {
      return
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      selectedOptionalColumnKeys.value = defaults
      return
    }
    const allowed = new Set(optionalColumnDefs.map(c => c.key))
    const rawKeys = parsed.filter((k): k is string => typeof k === 'string')
    const keys = new Set(rawKeys.filter(k => allowed.has(k)))
    for (const k of rawKeys) {
      if (LEGACY_DEPT_POS_KEYS.has(k)) {
        keys.add('dept_position')
      }
    }
    const legacyOnly
      = rawKeys.length > 0 && rawKeys.every(k => LEGACY_OPTIONAL_COL_KEYS.has(k))
    if (legacyOnly) {
      keys.add('dept_position')
    }
    if (!keys.size) {
      selectedOptionalColumnKeys.value = defaults
      return
    }
    const order = optionalColumnDefs.map(c => c.key)
    selectedOptionalColumnKeys.value = order.filter(k => keys.has(k))
  } catch {
    selectedOptionalColumnKeys.value = defaults
  }
}

function resetOptionalColumnsToDefault() {
  selectedOptionalColumnKeys.value = defaultOptionalColumnKeys()
}

function setOptionalColumnKey(key: string, on: boolean) {
  const order = optionalColumnDefs.map(c => c.key)
  const next = new Set(selectedOptionalColumnKeys.value)
  if (on) {
    next.add(key)
  } else {
    next.delete(key)
  }
  selectedOptionalColumnKeys.value = order.filter(k => next.has(k))
}

const tableSorting = ref<SortingState>([])

watch(isBaseLevelEmployee, () => {
  tableSorting.value = []
})

watch(selectedOptionalColumnKeys, () => {
  tableSorting.value = []
}, { deep: true })

const SALARY_REVEAL_MS = 4000
const salaryVisibleByEmployeeId = reactive<Record<string, boolean>>({})
const salaryRevealTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function clearSalaryRevealTimeout(employeeId: string) {
  const t = salaryRevealTimeouts.get(employeeId)
  if (t) {
    clearTimeout(t)
    salaryRevealTimeouts.delete(employeeId)
  }
}

function onSalaryVisibilityClick(employeeId: string, currentlyRevealed: boolean) {
  if (currentlyRevealed) {
    clearSalaryRevealTimeout(employeeId)
    salaryVisibleByEmployeeId[employeeId] = false
    return
  }
  clearSalaryRevealTimeout(employeeId)
  salaryVisibleByEmployeeId[employeeId] = true
  const t = setTimeout(() => {
    salaryVisibleByEmployeeId[employeeId] = false
    salaryRevealTimeouts.delete(employeeId)
  }, SALARY_REVEAL_MS)
  salaryRevealTimeouts.set(employeeId, t)
}

onBeforeUnmount(() => {
  for (const t of salaryRevealTimeouts.values()) {
    clearTimeout(t)
  }
  salaryRevealTimeouts.clear()
})

function salaryCell(row: EmployeeListRow) {
  if (row.salary == null || Number.isNaN(Number(row.salary))) {
    return '—'
  }
  const id = String(row.id)
  const revealed = Boolean(salaryVisibleByEmployeeId[id])
  const formatted = formatSalary(row.salary)
  return h('div', { class: 'flex items-center justify-end gap-1' }, [
    h(
      'span',
      {
        class: ['tabular-nums', revealed ? '' : 'select-none blur-sm'].filter(Boolean).join(' ')
      },
      formatted
    ),
    h(UButton, {
      'color': 'neutral',
      'variant': 'ghost',
      'size': 'xs',
      'square': true,
      'icon': revealed ? 'i-lucide-eye-off' : 'i-lucide-eye',
      'class': 'shrink-0',
      'aria-label': revealed ? 'Hide salary' : 'Show salary briefly',
      'onClick': () => onSalaryVisibilityClick(id, revealed)
    })
  ])
}

watch(
  selectedOptionalColumnKeys,
  (keys) => {
    if (!import.meta.client) {
      return
    }
    if (!keys?.length) {
      selectedOptionalColumnKeys.value = defaultOptionalColumnKeys()
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY_EMPLOYEE_COLS, JSON.stringify(keys))
    } catch {
      /* ignore */
    }
  },
  { deep: true }
)

const selectedRows = ref<EmployeeListRow[]>([])

watch(rows, (next) => {
  const ids = new Set(next.map(r => String(r.id)))
  selectedRows.value = selectedRows.value.filter(r => ids.has(String(r.id)))
})

function isRowSelected(row: EmployeeListRow) {
  return selectedRows.value.some(r => String(r.id) === String(row.id))
}

function toggleRow(row: EmployeeListRow, checked: boolean) {
  if (checked) {
    if (!isRowSelected(row)) {
      selectedRows.value.push(row)
    }
  } else {
    selectedRows.value = selectedRows.value.filter(r => String(r.id) !== String(row.id))
  }
}

function toggleSelectPage(checked: boolean) {
  if (checked) {
    const map = new Map(selectedRows.value.map(r => [String(r.id), r]))
    for (const r of rows.value) {
      map.set(String(r.id), r)
    }
    selectedRows.value = [...map.values()]
  } else {
    const pageIds = new Set(rows.value.map(r => String(r.id)))
    selectedRows.value = selectedRows.value.filter(r => !pageIds.has(String(r.id)))
  }
}

const allPageSelected = computed(() => {
  if (!rows.value.length) {
    return false
  }
  return rows.value.every(r => isRowSelected(r))
})

const selectedEmployeesCount = computed(
  () => new Set(selectedRows.value.map(r => String(r.id))).size
)

function clearSelectedRows() {
  selectedRows.value = []
}

function employeeNameCell(row: EmployeeListRow) {
  const u = row.user
  const name = u?.full_name || '—'
  return h('div', { class: 'flex items-center gap-3 min-w-0' }, [
    h(UserAvatar, { user: u ?? null, size: 'sm' }),
    h('div', { class: 'min-w-0 flex-1' }, [
      h(
        NuxtLink,
        {
          to: employeeDetailPath(row.id),
          class: 'font-medium text-primary hover:underline capitalize block truncate'
        },
        name
      ),
      row.employee_number
        ? h('p', { class: 'text-xs text-muted truncate' }, String(row.employee_number))
        : null
    ])
  ])
}

function copyEmail(email: string) {
  if (!import.meta.client || !email) {
    return
  }
  void navigator.clipboard.writeText(email).then(() => {
    toast.add({ title: 'Email copied', color: 'success' })
  }).catch(() => {
    toast.add({ title: 'Copy failed', color: 'error' })
  })
}

function csvEscape(s: string) {
  return `"${s.replace(/"/g, '""')}"`
}

function exportEmployees(format: 'csv' | 'xls') {
  if (!selectedRows.value.length) {
    toast.add({ title: 'Select at least one row to export', color: 'warning' })
    return
  }
  const list = Array.from(new Map(selectedRows.value.map(r => [String(r.id), r])).values())
  const headers = ['Employee Name', 'Email', 'Department', 'Position', 'Start Date', 'Salary', 'Status', 'Access']
  const sep = format === 'xls' ? '\t' : ','
  const lines: string[] = [headers.join(sep)]
  for (const row of list) {
    const access = row.self_service_access ? 'Has Access' : 'No Access'
    const cells = [
      row.user?.full_name ?? '',
      row.user?.email ?? '',
      row.department ?? '',
      row.position ?? '',
      formatStartDateLong(row.start_date),
      row.salary != null ? String(row.salary) : '',
      row.status ?? '',
      access
    ]
    if (format === 'csv') {
      lines.push(cells.map(c => csvEscape(c)).join(','))
    } else {
      lines.push(cells.map(c => String(c).replace(/\t/g, ' ')).join(sep))
    }
  }
  const body = lines.join('\n')
  const mime = format === 'xls' ? 'application/vnd.ms-excel' : 'text/csv;charset=utf-8;'
  const blob = new Blob([body], { type: mime })
  const ext = format === 'xls' ? 'xls' : 'csv'
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `employees_${new Date().toISOString().slice(0, 10)}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: 'Export ready', color: 'success' })
}

const exportMenuItems = [[
  {
    label: 'Export as Excel',
    icon: 'i-lucide-download',
    onSelect: () => exportEmployees('xls')
  }
], [
  {
    label: 'Export as CSV',
    icon: 'i-lucide-download',
    onSelect: () => exportEmployees('csv')
  }
]] satisfies DropdownMenuItem[][]

const smsModalOpen = ref(false)
const smsRecipients = ref<{ sent_to?: string, phone_number: string }[]>([])
const filtersSlideoverOpen = ref(false)

function openSendSms() {
  if (!selectedRows.value.length) {
    toast.add({ title: 'Select at least one employee to send SMS', color: 'warning' })
    return
  }
  smsRecipients.value = selectedRows.value.map((row) => {
    return {
      sent_to: row.user?.full_name,
      phone_number: String(row.user?.phone_number ?? '').trim()
    }
  })
  smsModalOpen.value = true
}

const mobileMoreMenuItems = computed<DropdownMenuItem[][]>(() => {
  if (isBaseLevelEmployee.value) {
    return []
  }
  return [
    [{
      label: 'Import',
      icon: 'i-lucide-import',
      to: ROUTE_LIST.employees.import
    }],
    [{
      label: 'Send SMS',
      icon: 'i-lucide-message-square',
      onSelect: () => openSendSms()
    }],
    ...exportMenuItems
  ]
})

const deptPositionColumn: TableColumn<EmployeeListRow> = {
  id: 'dept_position',
  accessorFn: row => `${row.position ?? ''}\n${row.department ?? ''}`,
  header: 'Dept & Position',
  cell: ({ row }) => {
    const pos = row.original.position
      ? String(row.original.position)
      : '—'
    const dept = row.original.department
      ? String(row.original.department)
      : '—'
    return h('div', { class: 'flex min-w-0 max-w-[14rem] flex-col gap-0.5 py-0.5' }, [
      h('span', { class: 'block truncate text-sm capitalize leading-snug' }, pos),
      h('span', { class: 'block truncate text-xs capitalize leading-snug text-muted' }, dept)
    ])
  }
}

const actionsColumn: TableColumn<EmployeeListRow> = {
  id: 'actions',
  enableSorting: false,
  header: 'Actions',
  cell: ({ row }) =>
    h(
      'div',
      { class: 'text-end' },
      h(
        UDropdownMenu,
        { items: rowActions(row.original), content: { align: 'end' } },
        () =>
          h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            square: true
          })
      )
    )
}

const tableColumns = computed<TableColumn<EmployeeListRow>[]>(() => {
  const selectColumn: TableColumn<EmployeeListRow> = {
    id: 'select',
    enableSorting: false,
    header: () =>
      h(UCheckbox, {
        'modelValue': allPageSelected.value,
        'onUpdate:modelValue': (v: boolean | 'indeterminate') => toggleSelectPage(v === true)
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': isRowSelected(row.original),
        'onUpdate:modelValue': (v: boolean | 'indeterminate') => toggleRow(row.original, v === true)
      })
  }

  const rowNumberColumn: TableColumn<EmployeeListRow> = {
    id: 'row_number',
    enableSorting: false,
    header: '#',
    cell: ({ row }) => {
      const n = (urlParams.page - 1) * urlParams.page_size + row.index + 1
      return h('span', { class: 'tabular-nums text-muted' }, `${n}.`)
    }
  }

  const nameColumn: TableColumn<EmployeeListRow> = {
    id: 'name',
    accessorFn: row => row.user?.full_name ?? '',
    header: 'Employee Name',
    cell: ({ row }) => employeeNameCell(row.original)
  }

  const cols: TableColumn<EmployeeListRow>[] = [selectColumn, rowNumberColumn, nameColumn]

  if (isBaseLevelEmployee.value) {
    cols.push(deptPositionColumn)
    return cols
  }

  const selected = new Set(selectedOptionalColumnKeys.value)

  if (selected.has('email')) {
    cols.push({
      id: 'email',
      accessorFn: row => row.user?.email ?? '',
      header: 'Email',
      cell: ({ row }) => {
        const email = row.original.user?.email ?? ''
        if (!email) {
          return '—'
        }
        return h('div', { class: 'flex items-center gap-1 min-w-0' }, [
          h('span', { class: 'truncate' }, email),
          h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            size: 'xs',
            square: true,
            icon: 'i-lucide-copy',
            class: 'shrink-0',
            onClick: () => copyEmail(email)
          })
        ])
      }
    })
  }

  if (selected.has('dept_position')) {
    cols.push(deptPositionColumn)
  }

  if (selected.has('start_date')) {
    cols.push({
      accessorKey: 'start_date',
      header: 'Start Date',
      cell: ({ row }) => {
        const iso = row.original.start_date
        if (!iso) {
          return '—'
        }
        return h(NuxtTime, {
          datetime: iso,
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })
      }
    })
  }
  if (selected.has('salary')) {
    cols.push({
      accessorKey: 'salary',
      header: 'Salary',
      cell: ({ row }) => salaryCell(row.original)
    })
  }
  if (selected.has('status')) {
    cols.push({
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) =>
        h(
          UBadge,
          { color: 'primary', variant: 'subtle', class: 'capitalize' },
          () => row.original.status ?? '—'
        )
    })
  }
  if (selected.has('access')) {
    cols.push({
      id: 'self_service_access',
      accessorFn: row => (row.self_service_access ? 1 : 0),
      header: 'Access',
      cell: ({ row }) => {
        const on = Boolean(row.original.self_service_access)
        return h(
          UBadge,
          { color: on ? 'success' : 'error', variant: 'subtle' },
          () => (on ? 'Has Access' : 'No Access')
        )
      }
    })
  }

  cols.push(actionsColumn)
  return cols
})

function resetFilters() {
  urlParams.page = 1
  urlParams.department = ALL_DEPARTMENTS
  urlParams.status = 'Active'
  urlParams.search = ''
  urlParams.page_size = pageSizeOptions[0] ?? 10
}

useSeoMeta({
  title: computed(() => {
    const u = unref(authStore.user) as Record<string, unknown> | undefined
    const company = u?.company as Record<string, unknown> | undefined
    const name = company?.name
    return `${typeof name === 'string' && name ? name : 'KaziQuest'} - Employees`
  }),
  description: 'View and manage employees in your company.'
})
</script>

<template>
  <UDashboardPanel id="employees">
    <template #header>
      <DashboardPageHeader
        title="Employees"
        breadcrumb="Dashboard / Employees"
      >
        <template #right>
          <UserMenu avatar-only class="shrink-0" />
        </template>
      </DashboardPageHeader>
    </template>

    <template #body>
      <div
        class="mx-auto w-full max-w-[1600px] space-y-4 px-4 pt-0 sm:px-5 lg:space-y-5 lg:px-6"
        :class="selectedEmployeesCount > 0 ? 'pb-24 sm:pb-28 lg:pb-6' : 'pb-5 sm:pb-6'"
      >
        <div
          v-if="!isBaseLevelEmployee"
          class="-mx-4 sm:-mx-5 lg:-mx-6"
        >
          <div
            class="mx-4 flex min-w-0 gap-0.5 overflow-x-auto overscroll-x-contain rounded-lg border border-default/60 bg-elevated/35 p-0.5 [scrollbar-width:thin] sm:mx-5 lg:mx-6"
            role="tablist"
            aria-label="Employee status filters"
          >
            <button
              v-for="filter in horizontalFilters"
              :key="filter.slot"
              type="button"
              role="tab"
              :aria-selected="urlParams.status.toLowerCase() === filter.slot"
              class="flex min-h-8 shrink-0 touch-manipulation items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
              :class="urlParams.status.toLowerCase() === filter.slot
                ? 'bg-primary text-inverted shadow-sm'
                : 'text-muted hover:bg-default/60 hover:text-highlighted'"
              @click="filter.click"
            >
              <span>{{ filter.label }}</span>
              <span
                class="tabular-nums text-[11px]"
                :class="urlParams.status.toLowerCase() === filter.slot ? 'text-inverted/85' : 'text-muted/80'"
              >{{ filter.badge }}</span>
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <div class="pb-3">
            <div class="flex w-full flex-col gap-2 lg:hidden">
              <UInput
                v-model="urlParams.search"
                class="w-full min-w-0"
                icon="i-lucide-search"
                placeholder="Search"
                type="search"
              />
              <div class="flex gap-2">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-sliders-horizontal"
                  label="Filters"
                  class="h-9 flex-1 justify-center"
                  @click="filtersSlideoverOpen = true"
                />
                <UDropdownMenu
                  v-if="!isBaseLevelEmployee && mobileMoreMenuItems.length"
                  :items="mobileMoreMenuItems"
                  :disabled="loadingEmployees"
                >
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-more-horizontal"
                    square
                    class="h-9 w-9 shrink-0"
                    aria-label="More actions"
                  />
                </UDropdownMenu>
              </div>
            </div>

            <div
              class="hidden gap-3 lg:flex lg:flex-row lg:items-center lg:gap-3"
            >
              <div
                class="flex min-h-9 min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]"
              >
                <UInput
                  v-model="urlParams.search"
                  class="w-40 min-w-40 shrink-0 sm:w-48 sm:min-w-48"
                  icon="i-lucide-search"
                  placeholder="Search"
                  type="search"
                />
                <USelect
                  v-model="urlParams.department"
                  :loading="departmentsLoading"
                  class="w-[8.5rem] min-w-[8.5rem] shrink-0 sm:w-36 sm:min-w-36"
                  placeholder="Department"
                  value-key="value"
                  label-key="label"
                  :items="[
                    { label: 'All departments', value: ALL_DEPARTMENTS },
                    ...departmentList.map(d => ({ label: d.name, value: d.name }))
                  ]"
                />
                <USelect
                  v-model="urlParams.status"
                  class="w-28 min-w-28 shrink-0 sm:w-32 sm:min-w-32"
                  placeholder="Status"
                  value-key="value"
                  label-key="label"
                  :items="statusOptions.map(s => ({ label: s, value: s }))"
                />
                <UPopover
                  v-if="!isBaseLevelEmployee"
                  :content="{ align: 'start', sideOffset: 8 }"
                >
                  <UTooltip text="Columns">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      icon="i-lucide-columns-3"
                      label="Columns"
                      class="h-9 shrink-0 whitespace-nowrap px-2"
                      :disabled="loadingEmployees"
                    />
                  </UTooltip>
                  <template #content="{ close }">
                    <div class="flex w-60 max-h-[min(70vh,24rem)] flex-col gap-3 overflow-y-auto p-3">
                      <p class="text-xs font-medium text-muted">
                        Visible columns
                      </p>
                      <div class="flex flex-col gap-2">
                        <UCheckbox
                          v-for="c in optionalColumnDefs"
                          :key="c.key"
                          :model-value="selectedOptionalColumnKeys.includes(c.key)"
                          :label="c.label"
                          @update:model-value="(v: boolean | 'indeterminate') => setOptionalColumnKey(c.key, v === true)"
                        />
                      </div>
                      <UButton
                        color="neutral"
                        variant="soft"
                        size="xs"
                        label="Reset to default"
                        class="self-start"
                        @click="resetOptionalColumnsToDefault(); close?.()"
                      />
                    </div>
                  </template>
                </UPopover>
              </div>

              <div
                class="flex shrink-0 flex-nowrap items-center gap-1 lg:border-l lg:border-default/60 lg:pl-3"
              >
                <span
                  v-if="selectedEmployeesCount > 0"
                  class="hidden text-xs tabular-nums text-muted whitespace-nowrap lg:inline"
                  aria-live="polite"
                >
                  {{ selectedEmployeesCount }} selected
                </span>
                <UIcon
                  v-if="accessLoading || resendLoading"
                  name="i-lucide-loader-circle"
                  class="size-4 shrink-0 animate-spin text-primary"
                  aria-hidden="true"
                />
                <UTooltip text="Reset filters">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-filter-x"
                    label="Reset"
                    class="h-8 shrink-0 px-2 text-xs"
                    @click="resetFilters"
                  />
                </UTooltip>
                <UButton
                  v-if="canShowAddEmployee"
                  icon="i-lucide-user-plus"
                  label="Add"
                  size="sm"
                  class="h-8 shrink-0 px-3"
                  :disabled="loadingEmployees"
                  :to="ROUTE_LIST.employees.add"
                />
                <UButton
                  v-if="!isBaseLevelEmployee"
                  class="hidden h-8 shrink-0 px-2 text-xs lg:inline-flex"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-import"
                  label="Import"
                  :disabled="loadingEmployees"
                  :to="ROUTE_LIST.employees.import"
                />
                <UButton
                  v-if="!isBaseLevelEmployee"
                  class="hidden h-8 shrink-0 px-2 text-xs lg:inline-flex"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-message-square"
                  label="SMS"
                  :disabled="loadingEmployees"
                  @click="openSendSms"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-refresh-ccw"
                  label="Refresh"
                  class="h-8 shrink-0 px-2 text-xs"
                  :loading="loadingEmployees"
                  @click="() => void fetchEmployees()"
                />
                <UDropdownMenu
                  v-if="!isBaseLevelEmployee"
                  class="hidden shrink-0 self-center lg:inline-flex lg:items-center"
                  :items="exportMenuItems"
                  :disabled="loadingEmployees"
                >
                  <UButton
                    color="neutral"
                    variant="ghost"
                    label="Export"
                    trailing-icon="i-lucide-chevron-down"
                    class="h-8 shrink-0 px-2 text-xs"
                    :disabled="loadingEmployees"
                  />
                </UDropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <div class="relative overflow-x-auto">
          <div class="min-w-[52rem] sm:min-w-[60rem]">
            <UTable
              v-model:sorting="tableSorting"
              :data="rows"
              :columns="tableColumns"
              :loading="loadingEmployees"
              class="min-w-full shrink-0"
              :ui="{
                base: 'min-w-full border-separate border-spacing-0',
                thead: '[&>tr]:bg-transparent [&>tr]:after:content-none',
                tbody: '[&>tr]:last:[&>td]:border-b-0 [&>tr:hover]:bg-elevated/30',
                th: 'border-b border-default/80 py-2 text-left text-xs font-medium text-muted',
                td: 'border-b border-default/60 py-2 align-middle text-sm'
              }"
            />
          </div>
        </div>

        <div
          v-if="!loadingEmployees && (totalCount > 0 || rows.length > 0)"
          class="flex flex-col gap-3 border-t border-default/80 pt-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-center text-xs text-muted sm:text-start">
            Showing {{ showingFrom }} to {{ showingTo }} of {{ totalCount }}
          </p>
          <div class="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <UPagination
              v-model:page="paginationPage"
              :items-per-page="urlParams.page_size"
              :total="totalCount"
              size="sm"
              class="justify-center sm:justify-end"
            />
            <div class="flex items-center justify-center gap-1.5 sm:justify-end">
              <span class="text-xs text-muted">Rows</span>
              <USelect
                v-model="urlParams.page_size"
                class="w-20 min-w-20"
                :items="pageSizeOptions.map(n => ({ label: String(n), value: n }))"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-3 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-2 opacity-0"
  >
    <div
      v-if="selectedEmployeesCount > 0"
      class="fixed bottom-0 left-0 right-0 z-40 border-t border-default/80 bg-default/90 px-3 py-2.5 backdrop-blur-sm supports-[padding:max(0px)]:pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:bottom-3 sm:left-3 sm:right-3 sm:rounded-lg sm:border sm:border-default/80 sm:py-2 md:left-auto md:right-5 md:max-w-md lg:hidden"
      role="region"
      aria-label="Bulk actions for selected employees"
    >
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p
          class="text-center text-xs tabular-nums text-muted sm:text-start"
          aria-live="polite"
        >
          {{ selectedEmployeesCount }} selected
        </p>
        <div class="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
          <template v-if="!isBaseLevelEmployee">
            <UDropdownMenu
              :items="exportMenuItems"
              :disabled="loadingEmployees"
            >
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                label="Export"
                trailing-icon="i-lucide-chevron-down"
                class="h-8"
                :disabled="loadingEmployees"
              />
            </UDropdownMenu>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-message-square"
              label="SMS"
              class="h-8"
              :disabled="loadingEmployees"
              @click="openSendSms"
            />
          </template>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            label="Clear"
            class="h-8"
            @click="clearSelectedRows"
          />
        </div>
      </div>
    </div>
  </Transition>

  <USlideover
    v-model:open="filtersSlideoverOpen"
    side="bottom"
    title="Filters"
    description="Department, status, and columns"
    class="lg:hidden"
    :ui="{ content: 'max-h-[80dvh] rounded-t-xl border-t border-default/80' }"
  >
    <template #body="{ close }">
      <div class="flex flex-col gap-4 pb-1">
        <UFormField label="Department">
          <USelect
            v-model="urlParams.department"
            :loading="departmentsLoading"
            class="w-full"
            placeholder="Department"
            value-key="value"
            label-key="label"
            :items="[
              { label: 'All departments', value: ALL_DEPARTMENTS },
              ...departmentList.map(d => ({ label: d.name, value: d.name }))
            ]"
          />
        </UFormField>
        <UFormField label="Status">
          <USelect
            v-model="urlParams.status"
            class="w-full"
            placeholder="Status"
            value-key="value"
            label-key="label"
            :items="statusOptions.map(s => ({ label: s, value: s }))"
          />
        </UFormField>
        <template v-if="!isBaseLevelEmployee">
          <div>
            <p class="mb-2 text-sm font-medium text-highlighted">
              Visible columns
            </p>
            <div class="flex flex-col gap-2.5 rounded-lg border border-default/60 p-3">
              <UCheckbox
                v-for="c in optionalColumnDefs"
                :key="c.key"
                :model-value="selectedOptionalColumnKeys.includes(c.key)"
                :label="c.label"
                @update:model-value="(v: boolean | 'indeterminate') => setOptionalColumnKey(c.key, v === true)"
              />
              <UButton
                color="neutral"
                variant="soft"
                size="sm"
                label="Reset columns to default"
                class="self-start"
                @click="resetOptionalColumnsToDefault()"
              />
            </div>
          </div>
        </template>
        <UButton
          block
          color="neutral"
          variant="soft"
          label="Done"
          @click="() => { close?.() }"
        />
      </div>
    </template>
  </USlideover>

  <UModal
    v-model:open="accessModalOpen"
    :title="accessAction === 'disable' ? 'Disable access?' : 'Enable access?'"
    :description="accessEmployee
      ? `This will ${accessAction} self-service access for ${accessEmployee.user?.full_name || 'this employee'}.`
      : undefined"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancel"
          :disabled="accessLoading"
          @click="accessModalOpen = false"
        />
        <UButton
          :color="accessAction === 'disable' ? 'error' : 'primary'"
          :label="accessAction === 'disable' ? 'Disable' : 'Enable'"
          :loading="accessLoading"
          @click="() => void confirmAccessChange()"
        />
      </div>
    </template>
  </UModal>

  <UModal
    v-model:open="resendModalOpen"
    title="Send activation email?"
    :description="resendEmployee
      ? `Resend the activation email to ${resendEmployee.user?.full_name || resendEmployee.user?.email || 'this employee'}?`
      : undefined"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancel"
          :disabled="resendLoading"
          @click="resendModalOpen = false"
        />
        <UButton
          label="Send email"
          :loading="resendLoading"
          @click="() => void confirmResendActivation()"
        />
      </div>
    </template>
  </UModal>

  <EmployeesExitModal
    v-if="exitEmployee"
    v-model:open="exitModalOpen"
    :employee="{
      id: exitEmployee.id,
      full_name: exitEmployee.user?.full_name || 'Employee',
      status: exitEmployee.status
    }"
    @success="handleExitSuccess"
  />

  <EmployeesBulkSmsModal
    v-model:open="smsModalOpen"
    :recipients="smsRecipients"
  />
</template>
