<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { employeeService } from '~~/services/employee.service'
import { timeOffService } from '~~/services/timeoff.service'
import { parseApiError } from '~/utils/parseApiError'
import { ROUTE_LIST } from '~/constants/routeList'

definePageMeta({ layout: 'default' })

interface LeaveRequestRow {
  id: string
  status?: string
  start_date?: string
  end_date?: string
  created_at?: string
  note?: string
  requested_days?: number
  duration_type?: string
  employee_data?: {
    id?: string
    user?: { full_name?: string, profile_pic?: string }
    current_job_data?: { position?: { job_title?: string } }
  }
  category_data?: { name?: string }
}

const toast = useToast()
const NuxtLink = resolveComponent('NuxtLink')
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')

const { isBaseLevelEmployee, hasReportsTo, isLeaveApprover } = useRolePermissionGuard()
const { session } = useAuthSession()

const canCreateTimeOff = computed(() => {
  const group = (session.value.user?.group as { name?: string } | undefined)?.name || ''
  return group === 'Admin' || group === 'HR Manager' || group === 'Hr Manager'
})

const urlParams = reactive({
  page: 1,
  page_size: 10,
  search: '',
  status: '',
  paginate: true,
})

const selectedStatuses = ref<string[]>([])
const selectedStatusFilter = ref<'requested' | 'partially_approved' | 'approved' | 'rejected' | 'all'>('requested')
const selectedLeaveTypes = ref<string[]>([])

const statusesByFilter: Record<typeof selectedStatusFilter.value, string[]> = {
  approved: ['Approved'],
  all: [],
  requested: ['Requested'],
  partially_approved: ['Partially Approved'],
  rejected: ['Rejected'],
}

watch(selectedStatusFilter, (filterValue) => {
  selectedStatuses.value = [...statusesByFilter[filterValue]]
}, { immediate: true })

const computedQuery = computed(() => {
  const params: Record<string, unknown> = {
    ...urlParams,
    status: selectedStatuses.value.length ? selectedStatuses.value.join(',') : undefined,
  }
  for (const key of Object.keys(params)) {
    const v = params[key]
    if (v === '' || v == null) {
      delete params[key]
    }
  }
  return params
})

const leaveCategories = ref<{ name?: string, id?: string }[]>([])
const employeesOptions = ref<{ label: string, value: string, subtitle?: string }[]>([])
const rows = ref<LeaveRequestRow[]>([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSizeFromApi = ref(10)
const statusCounts = ref<Record<string, number>>({})
const loading = ref(false)
const loadingMeta = ref(false)

let debounce: ReturnType<typeof setTimeout> | undefined
watch(
  [computedQuery, selectedStatuses],
  () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => {
      void fetchRequests()
    }, 400)
  },
  { deep: true },
)

async function loadCategories() {
  try {
    const res = await timeOffService.getLeaveCategories({
      handler: '$fetch',
    }) as { results?: { name?: string, id?: string }[] }
    leaveCategories.value = Array.isArray(res?.results) ? res.results : []
  }
  catch {
    leaveCategories.value = []
  }
}

async function loadEmployees() {
  loadingMeta.value = true
  try {
    const res = await employeeService.getEmployees({
      handler: '$fetch',
      query: { paginate: 'false', page_size: 500, page: 1 },
    }) as { results?: Record<string, unknown>[] }
    const list = res?.results ?? []
    employeesOptions.value = list.map((item: Record<string, unknown>) => ({
      label: String((item.user as { full_name?: string } | undefined)?.full_name
        || item.full_name
        || item.work_email
        || 'Employee'),
      value: String(item.id),
      subtitle: String(item.employee_number || ''),
    })).filter(o => o.value)
  }
  catch {
    employeesOptions.value = []
  }
  finally {
    loadingMeta.value = false
  }
}

async function fetchRequests() {
  loading.value = true
  try {
    const res = await timeOffService.getLeaveRequests({
      handler: '$fetch',
      query: computedQuery.value as Record<string, string | number | boolean>,
    }) as {
      results?: LeaveRequestRow[]
      count?: number
      current_page?: number
      current_page_count?: number
      status_counts?: Record<string, number>
    }
    rows.value = Array.isArray(res?.results) ? res.results : []
    totalCount.value = Number(res?.count ?? rows.value.length)
    currentPage.value = Number(res?.current_page ?? urlParams.page)
    pageSizeFromApi.value = Number(res?.current_page_count ?? urlParams.page_size)
    statusCounts.value = res?.status_counts ?? {}
  }
  catch (error: unknown) {
    toast.add({
      title: 'Unable to load leave requests',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
    rows.value = []
  }
  finally {
    loading.value = false
  }
}

onBeforeUnmount(() => {
  clearTimeout(debounce)
})

const leaveTypeOptions = computed(() =>
  leaveCategories.value.map(c => c.name).filter((n): n is string => Boolean(n)),
)

const addableLeaveTypeOptions = computed(() =>
  leaveCategories.value
    .filter(c => c.name && c.id)
    .map(c => ({ label: String(c.name), value: String(c.id) })),
)

const displayedRows = computed(() => {
  if (!selectedLeaveTypes.value.length) {
    return rows.value
  }
  const set = new Set(selectedLeaveTypes.value)
  return rows.value.filter(r => r.category_data?.name && set.has(r.category_data.name))
})

const statusTabs = computed(() => [
  { label: 'Requested', value: 'requested' as const, count: statusCounts.value.requested ?? 0 },
  { label: 'Partially approved', value: 'partially_approved' as const, count: statusCounts.value.partially_approved ?? 0 },
  { label: 'Approved', value: 'approved' as const, count: statusCounts.value.approved ?? 0 },
  { label: 'Rejected', value: 'rejected' as const, count: statusCounts.value.rejected ?? 0 },
  { label: 'All', value: 'all' as const, count: statusCounts.value.all ?? 0 },
])

function statusBadgeColor(statusValue: string) {
  if (statusValue === 'Requested') {
    return 'primary'
  }
  if (statusValue === 'Approved') {
    return 'success'
  }
  if (statusValue === 'Partially Approved') {
    return 'warning'
  }
  if (statusValue === 'Rejected') {
    return 'error'
  }
  return 'neutral'
}

function leaveDurationLabel(row: LeaveRequestRow) {
  const days = Number(row?.requested_days || 0)
  if (!Number.isFinite(days)) {
    return '—'
  }
  const durationType = row?.duration_type || 'fullday'
  if (durationType === 'hours') {
    const hours = Math.round(days * 8 * 2) / 2
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours % 1) * 60)
    if (wholeHours > 0 && minutes > 0) {
      return `${wholeHours}h ${minutes}m`
    }
    if (wholeHours > 0) {
      return `${wholeHours}h`
    }
    return `${minutes}m`
  }
  return `${days} day${days === 1 ? '' : 's'}`
}

function formatDateTime(iso?: string) {
  if (!iso) {
    return '—'
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return '—'
  }
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function noteLabel(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return '—'
  }
  return value.trim()
}

function employeePath(id?: string) {
  if (!id) {
    return '#'
  }
  return ROUTE_LIST.employees.detail.replace(':uuid', id)
}

interface ColDef {
  key: string
  label: string
  sortable?: boolean
  class?: string
}

const allColumns: ColDef[] = [
  { key: 'employee_name', label: 'Employee', sortable: true },
  { key: 'designation', label: 'Designation' },
  { key: 'category_data.name', label: 'Time off type', sortable: true, class: 'capitalize' },
  { key: 'requested_days', label: 'Duration', sortable: true },
  { key: 'leave_period', label: 'Start & end', sortable: true },
  { key: 'created_at', label: 'Requested on', sortable: true },
  { key: 'note', label: 'Reason' },
  { key: 'status', label: 'Status' },
  { key: 'action', label: 'Action' },
]

const STORAGE_KEY_COLUMNS = 'timeoff-view-applications-column-keys'

function getStoredColumnKeys(): string[] | null {
  if (!import.meta.client) {
    return null
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COLUMNS)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed) && parsed.every(x => typeof x === 'string')) {
      return parsed
    }
  }
  catch {
    return null
  }
  return null
}

function columnsFromKeys(keys: string[]): ColDef[] {
  const valid = keys.filter(k => allColumns.some(c => c.key === k))
  return allColumns.filter(c => valid.includes(c.key))
}

const selectedColumnKeys = ref<string[]>(allColumns.map(c => c.key))

onMounted(async () => {
  const stored = getStoredColumnKeys()
  if (stored?.length) {
    selectedColumnKeys.value = stored.filter(k => allColumns.some(c => c.key === k))
  }
  await Promise.all([loadCategories(), loadEmployees()])
  await fetchRequests()
})

watch(
  selectedColumnKeys,
  (keys) => {
    if (import.meta.client && keys?.length) {
      try {
        localStorage.setItem(STORAGE_KEY_COLUMNS, JSON.stringify(keys))
      }
      catch {
        /* ignore */
      }
    }
  },
  { deep: true },
)

const selectedColumnDefs = computed(() => columnsFromKeys(selectedColumnKeys.value))

const tableColumns = computed<TableColumn<LeaveRequestRow>[]>(() =>
  selectedColumnDefs.value.map((col) => {
    if (col.key === 'employee_name') {
      return {
        accessorKey: 'employee_name',
        header: col.label,
        cell: ({ row }) => {
          const r = row.original
          const id = r.employee_data?.id
          const name = r.employee_data?.user?.full_name || '—'
          const pic = r.employee_data?.user?.profile_pic
          return h('div', { class: 'flex items-center gap-2' }, [
            h(UAvatar, { size: 'sm', src: pic || undefined, alt: name }),
            h(
              NuxtLink,
              { to: employeePath(id), class: 'font-medium text-primary hover:underline' },
              () => name,
            ),
          ])
        },
      }
    }
    if (col.key === 'designation') {
      return {
        accessorKey: 'designation',
        header: col.label,
        cell: ({ row }) =>
          row.original.employee_data?.current_job_data?.position?.job_title || '—',
      }
    }
    if (col.key === 'category_data.name') {
      return {
        accessorKey: 'category',
        header: col.label,
        cell: ({ row }) => row.original.category_data?.name ?? '—',
      }
    }
    if (col.key === 'requested_days') {
      return {
        accessorKey: 'requested_days',
        header: col.label,
        cell: ({ row }) => leaveDurationLabel(row.original),
      }
    }
    if (col.key === 'leave_period') {
      return {
        id: 'leave_period',
        header: col.label,
        cell: ({ row }) => {
          const a = row.original.start_date
          const b = row.original.end_date
          if (!a && !b) {
            return '—'
          }
          return `${formatDateTime(a)} → ${formatDateTime(b)}`
        },
      }
    }
    if (col.key === 'created_at') {
      return {
        accessorKey: 'created_at',
        header: col.label,
        cell: ({ row }) => formatDateTime(row.original.created_at),
      }
    }
    if (col.key === 'note') {
      return {
        accessorKey: 'note',
        header: col.label,
        cell: ({ row }) => h('span', { class: 'line-clamp-1 text-sm' }, noteLabel(row.original.note)),
      }
    }
    if (col.key === 'status') {
      return {
        accessorKey: 'status',
        header: col.label,
        cell: ({ row }) =>
          h(UBadge, {
            color: statusBadgeColor(String(row.original.status || '')),
            variant: 'subtle',
            class: 'capitalize',
          }, () => row.original.status || '—'),
      }
    }
    if (col.key === 'action') {
      return {
        id: 'action',
        header: col.label,
        cell: ({ row }) => {
          if (isBaseLevelEmployee.value && !hasReportsTo.value && !isLeaveApprover.value) {
            return h('span', { class: 'text-muted text-sm' }, '—')
          }
          return h(resolveComponent('UButton'), {
            label: 'View',
            size: 'xs',
            variant: 'soft',
            icon: 'i-lucide-eye',
            loading: viewingLeaveId.value === row.original.id,
            onClick: () => void openDetail(row.original),
          })
        },
      }
    }
    return { accessorKey: col.key, header: col.label }
  }),
)

const paginationPage = computed({
  get: () => urlParams.page,
  set: (p: number) => {
    urlParams.page = p
  },
})

watch(
  () => urlParams.page_size,
  () => {
    urlParams.page = 1
  },
)

const hasActiveFilters = computed(() =>
  Boolean(urlParams.search?.trim())
  || selectedLeaveTypes.value.length > 0
  || selectedStatusFilter.value !== 'requested',
)

function clearAllFilters() {
  urlParams.search = ''
  selectedLeaveTypes.value = []
  selectedStatusFilter.value = 'requested'
}

const isEmpty = computed(() => !loading.value && displayedRows.value.length === 0)

const detailOpen = ref(false)
const selectedLeave = ref<Record<string, unknown> | null>(null)
const viewingLeaveId = ref<string | null>(null)

async function openDetail(row: LeaveRequestRow) {
  viewingLeaveId.value = row.id
  try {
    const detail = await timeOffService.getLeaveDetail(row.id) as Record<string, unknown>
    selectedLeave.value = detail
    detailOpen.value = true
  }
  catch (error: unknown) {
    toast.add({
      title: 'Unable to load leave',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
  }
  finally {
    viewingLeaveId.value = null
  }
}

function onDetailSuccess() {
  void fetchRequests()
}

const addOpen = ref(false)
const addLoading = ref(false)
const addFormError = ref('')
const addForm = reactive({
  employee: '',
  category: '',
  start_date: '',
  end_date: '',
  note: '',
})

watch(addOpen, (o) => {
  if (!o) {
    addForm.employee = ''
    addForm.category = ''
    addForm.start_date = ''
    addForm.end_date = ''
    addForm.note = ''
    addFormError.value = ''
  }
})

function normalizeDateInput(value: unknown): string | null {
  if (!value) {
    return null
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }
  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }
  return null
}

function buildFullDaySelections(startDate: string, endDate: string) {
  const selections: Record<string, string> = {}
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return selections
  }
  const cursor = new Date(start)
  while (cursor <= end) {
    const yyyy = cursor.getFullYear()
    const mm = String(cursor.getMonth() + 1).padStart(2, '0')
    const dd = String(cursor.getDate()).padStart(2, '0')
    selections[`${yyyy}-${mm}-${dd}`] = 'fullday'
    cursor.setDate(cursor.getDate() + 1)
  }
  return selections
}

async function submitAddTimeOff() {
  addFormError.value = ''
  if (!addForm.employee || !addForm.category || !addForm.start_date || !addForm.end_date) {
    addFormError.value = 'Employee, leave type, start date, and end date are required.'
    return
  }
  const start = normalizeDateInput(addForm.start_date)
  const end = normalizeDateInput(addForm.end_date)
  if (!start || !end) {
    addFormError.value = 'Invalid dates.'
    return
  }
  addLoading.value = true
  try {
    const daySelections = buildFullDaySelections(start, end)
    const fullDaysCount = Object.keys(daySelections).length
    const form = new FormData()
    form.append('employee', addForm.employee)
    form.append('category', addForm.category)
    form.append('start_date', start)
    form.append('end_date', end)
    form.append('leave_type', 'days')
    form.append('duration_type', 'fullday')
    form.append('full_days_count', String(fullDaysCount))
    form.append('half_days_count', '0')
    form.append('day_selections', JSON.stringify(daySelections))
    form.append('note', addForm.note || '')
    const res = await timeOffService.applyLeave({
      handler: '$fetch',
      method: 'POST',
      body: form,
    }) as { success?: boolean, message?: string }
    if (res && typeof res === 'object' && 'success' in res && res.success === false) {
      throw new Error(res.message || 'Could not create request')
    }
    toast.add({ title: 'Leave request created', color: 'success' })
    addOpen.value = false
    await fetchRequests()
  }
  catch (error: unknown) {
    addFormError.value = parseApiError(error, 'Could not create leave request.')
  }
  finally {
    addLoading.value = false
  }
}

useSeoMeta({
  title: 'Time off — Requests',
  description: 'Review and manage leave requests.',
})
</script>

<template>
  <UDashboardPanel id="time-off-requests">
    <template #header>
      <DashboardPageHeader
        title="Time off requests"
        breadcrumb="Dashboard / Time Off / Requests"
      >
        <template #right>
          <UserMenu avatar-only class="shrink-0" />
        </template>
      </DashboardPageHeader>
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-2 border-b border-default pb-2">
          <UButton
            v-for="tab in statusTabs"
            :key="tab.value"
            size="sm"
            :variant="selectedStatusFilter === tab.value ? 'solid' : 'outline'"
            :label="`${tab.label} (${tab.count})`"
            @click="selectedStatusFilter = tab.value"
          />
        </div>

        <div class="flex flex-col flex-wrap gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap items-center gap-2">
            <UInput
              v-model="urlParams.search"
              icon="i-lucide-search"
              class="min-w-48 max-w-xs"
              placeholder="Name, email, employee #"
              type="search"
            />
            <USelectMenu
              v-model="selectedLeaveTypes"
              multiple
              searchable
              class="min-w-48"
              :items="leaveTypeOptions"
              placeholder="Leave types"
            />
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UButton
              v-if="canCreateTimeOff"
              icon="i-lucide-plus"
              label="Add time off"
              @click="addOpen = true"
            />
            <UButton
              color="neutral"
              variant="outline"
              label="Reset filters"
              :disabled="!hasActiveFilters"
              @click="clearAllFilters"
            />
            <USelect
              v-model="selectedColumnKeys"
              multiple
              class="min-w-52"
              placeholder="Columns"
              :items="allColumns.map(c => ({ label: c.label, value: c.key }))"
              value-key="value"
              label-key="label"
            />
            <UButton
              icon="i-lucide-refresh-cw"
              variant="outline"
              label="Refresh"
              :loading="loading"
              @click="() => void fetchRequests()"
            />
          </div>
        </div>

        <div
          v-if="isEmpty"
          class="flex flex-col items-center justify-center rounded-lg border border-dashed border-default p-12 text-center"
        >
          <UIcon name="i-lucide-inbox" class="mb-2 size-10 text-muted" />
          <p class="font-medium">
            No leave requests match your filters.
          </p>
          <p class="mt-1 text-sm text-muted">
            Try changing or clearing filters.
          </p>
          <UButton class="mt-4" variant="soft" label="Clear filters" @click="clearAllFilters" />
        </div>

        <UTable
          v-else
          :data="displayedRows"
          :columns="tableColumns"
          :loading="loading"
          class="w-full"
        />

        <div
          v-if="!isEmpty && totalCount > 0"
          class="flex flex-col gap-3 border-t border-default pt-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            Showing {{ ((currentPage || 1) - 1) * (pageSizeFromApi || urlParams.page_size) + 1 }}
            to
            {{ Math.min((currentPage || 1) * (pageSizeFromApi || urlParams.page_size), totalCount) }}
            of {{ totalCount }}
          </span>
          <div class="flex flex-wrap items-center gap-3">
            <UPagination
              v-model:page="paginationPage"
              :items-per-page="urlParams.page_size"
              :total="totalCount"
            />
            <USelect
              v-model="urlParams.page_size"
              class="w-24"
              :items="[10, 20, 30, 40].map(n => ({ label: String(n), value: n }))"
              value-key="value"
              label-key="label"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <ClientOnly>
    <USlideover v-model:open="addOpen" class="max-w-md">
      <template #content>
        <div class="flex h-full flex-col gap-4 overflow-y-auto p-5">
          <div>
            <h3 class="text-lg font-semibold">
              Add time off
            </h3>
            <p class="text-sm text-muted">
              Create a leave request on behalf of an employee.
            </p>
          </div>
          <UAlert v-if="addFormError" color="error" variant="soft" :title="addFormError" />
          <UFormField label="Employee" required>
            <USelectMenu
              v-model="addForm.employee"
              searchable
              class="w-full"
              :items="employeesOptions"
              value-key="value"
              label-key="label"
              :loading="loadingMeta"
              placeholder="Select employee"
            />
          </UFormField>
          <UFormField label="Leave type" required>
            <USelectMenu
              v-model="addForm.category"
              class="w-full"
              :items="addableLeaveTypeOptions"
              value-key="value"
              label-key="label"
              placeholder="Select type"
            />
          </UFormField>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <UFormField label="Start date" required>
              <UInput v-model="addForm.start_date" type="date" />
            </UFormField>
            <UFormField label="End date" required>
              <UInput v-model="addForm.end_date" type="date" />
            </UFormField>
          </div>
          <UFormField label="Reason">
            <UTextarea v-model="addForm.note" :rows="3" class="w-full" />
          </UFormField>
          <div class="mt-auto flex justify-end gap-2 border-t border-default pt-3">
            <UButton color="neutral" variant="outline" label="Cancel" @click="addOpen = false" />
            <UButton label="Save" :loading="addLoading" @click="() => void submitAddTimeOff()" />
          </div>
        </div>
      </template>
    </USlideover>
  </ClientOnly>

  <TimeOffLeaveRequestDetailModal
    v-model:open="detailOpen"
    :leave="selectedLeave"
    @success="onDetailSuccess"
    @refetch="() => void fetchRequests()"
  />
</template>
