<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { TableColumn } from '@nuxt/ui'
import { companyService } from '~~/services/company.service'
import { timeOffService } from '~~/services/timeoff.service'
import { parseApiError } from '~/utils/parseApiError'
import { ROUTE_LIST } from '~/constants/routeList'

definePageMeta({
  layout: 'default',
})

interface BalanceRow {
  id: string
  employee_data?: {
    id?: string
    full_name?: string
    employee_number?: string
    reports_to?: { id: string | number }[]
    current_job_data?: {
      position?: {
        department?: { name?: string }
        job_title?: string
      }
    }
  }
  leave_category_data?: {
    name?: string
    total_entitled_days?: number
  }
  available_balance?: number
  used_days?: number
}

const toast = useToast()
const NuxtLink = resolveComponent('NuxtLink')
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')

const urlParams = reactive({
  page: 1,
  page_size: 10,
  search: '',
  department: '',
  leave_type: '',
})

const departments = ref<{ name: string }[]>([])
const leaveTypeNames = ref<string[]>([])
const rows = ref<BalanceRow[]>([])
const totalCount = ref(0)
const currentPageFromApi = ref(1)
const pageSizeFromApi = ref(10)
const loading = ref(false)
const leaveYearLabel = ref('—')

const balanceModalOpen = ref(false)
const selectedBalanceRow = ref<BalanceRow | null>(null)

const STORAGE_KEY_COLUMNS = 'kq-time-off-balance-cols'

interface ColDef {
  key: string
  label: string
}

const allColumns: ColDef[] = [
  { key: 'employee', label: 'Employee' },
  { key: 'leave_type', label: 'Leave type' },
  { key: 'job', label: 'Job' },
  { key: 'entitled', label: 'Entitled' },
  { key: 'available', label: 'Available' },
  { key: 'used', label: 'Used' },
]

const selectedColumnKeys = ref<string[]>(allColumns.map(c => c.key))

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
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : null
  }
  catch {
    return null
  }
}

function columnsFromKeys(keys: string[]) {
  const set = new Set(keys)
  return allColumns.filter(c => set.has(c.key))
}

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

const selectedRows = ref<BalanceRow[]>([])

watch(rows, (next) => {
  const ids = new Set(next.map(r => String(r.id)))
  selectedRows.value = selectedRows.value.filter(r => ids.has(String(r.id)))
})

function isRowSelected(row: BalanceRow) {
  return selectedRows.value.some(r => String(r.id) === String(row.id))
}

function toggleRow(row: BalanceRow, checked: boolean) {
  if (checked) {
    if (!isRowSelected(row)) {
      selectedRows.value.push(row)
    }
  }
  else {
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
  }
  else {
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

async function loadDepartments() {
  try {
    const res = await companyService.fetchDepartments({ handler: '$fetch' }) as unknown
    const raw = (res as Record<string, unknown>)?.data ?? res
    if (Array.isArray(raw)) {
      departments.value = (raw as { name: string }[]).filter(d => d?.name)
    }
    else if (raw && typeof raw === 'object' && 'results' in raw) {
      departments.value = ((raw as { results: { name: string }[] }).results).filter(d => d?.name)
    }
    else {
      departments.value = []
    }
  }
  catch {
    departments.value = []
  }
}

async function loadLeaveTypes() {
  try {
    const res = await timeOffService.getLeaveCategories({
      handler: '$fetch',
    }) as { results?: { name?: string }[] }
    const list = res?.results ?? []
    leaveTypeNames.value = list.map(c => c.name).filter((n): n is string => Boolean(n))
  }
  catch {
    leaveTypeNames.value = []
  }
}

async function loadLeaveYear() {
  try {
    const res = await timeOffService.getCompanyLeaveYearSettings({
      handler: '$fetch',
    }) as {
      leave_year_start?: string
      leave_year_start_month?: number
      leave_year_start_day?: number
    }
    if (res?.leave_year_start === 'contract_start') {
      leaveYearLabel.value = 'Each employee’s contract start date'
      return
    }
    const m = res?.leave_year_start_month ?? 1
    const d = res?.leave_year_start_day ?? 1
    const month = new Date(2024, m - 1, 1).toLocaleString(undefined, { month: 'long' })
    leaveYearLabel.value = `${month} ${d} every year`
  }
  catch {
    leaveYearLabel.value = '—'
  }
}

let debounce: ReturnType<typeof setTimeout> | undefined

watch(
  () => urlParams.page,
  () => {
    void fetchBalances()
  },
)

watch(
  () => [urlParams.search, urlParams.department, urlParams.leave_type] as const,
  () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => {
      if (urlParams.page !== 1) {
        urlParams.page = 1
      }
      else {
        void fetchBalances()
      }
    }, 400)
  },
  { deep: true },
)

watch(
  () => urlParams.page_size,
  () => {
    if (urlParams.page !== 1) {
      urlParams.page = 1
    }
    else {
      void fetchBalances()
    }
  },
)

interface LeaveBalancesResponse {
  results?: BalanceRow[]
  count?: number
  current_page?: number
  current_page_count?: number
}

async function fetchBalances() {
  loading.value = true
  try {
    const res = await timeOffService.getLeaveBalances({
      handler: '$fetch',
      query: { ...urlParams } as Record<string, string | number | boolean>,
    }) as LeaveBalancesResponse
    rows.value = Array.isArray(res?.results) ? res.results : []
    totalCount.value = Number(res?.count ?? rows.value.length)
    if (typeof res?.current_page === 'number') {
      currentPageFromApi.value = res.current_page
      urlParams.page = res.current_page
    }
    else {
      currentPageFromApi.value = urlParams.page
    }
    if (typeof res?.current_page_count === 'number') {
      pageSizeFromApi.value = res.current_page_count
    }
    else {
      pageSizeFromApi.value = urlParams.page_size
    }
  }
  catch (error: unknown) {
    toast.add({
      title: 'Unable to load leave balances',
      description: parseApiError(error, 'Request failed.'),
      color: 'error',
    })
    rows.value = []
  }
  finally {
    loading.value = false
  }
}

onMounted(async () => {
  const stored = getStoredColumnKeys()
  if (stored?.length) {
    const next = stored.filter(k => allColumns.some(c => c.key === k))
    selectedColumnKeys.value = next.length ? next : allColumns.map(c => c.key)
  }
  await Promise.all([loadDepartments(), loadLeaveTypes(), loadLeaveYear()])
  await fetchBalances()
})

onBeforeUnmount(() => {
  clearTimeout(debounce)
})

function employeePath(id?: string) {
  if (!id) {
    return '#'
  }
  return ROUTE_LIST.employees.detail.replace(':uuid', id)
}

function openBalanceModal(row: BalanceRow) {
  selectedBalanceRow.value = row
  balanceModalOpen.value = true
}

function onBalanceModalSuccess() {
  void fetchBalances()
}

function csvEscape(s: string) {
  return `"${s.replace(/"/g, '""')}"`
}

function exportBalances(format: 'csv' | 'xls') {
  if (!selectedRows.value.length) {
    toast.add({ title: 'Select at least one row to export', color: 'warning' })
    return
  }
  const list = Array.from(new Map(selectedRows.value.map(r => [String(r.id), r])).values())
  const headers = ['Employee Name', 'Department', 'Job Title', 'Leave Type', 'Total Entitled Days', 'Available Days', 'Used Days']
  const sep = format === 'xls' ? '\t' : ','
  const lines: string[] = [headers.join(sep)]
  for (const item of list) {
    const cells = [
      item.employee_data?.full_name ?? '',
      item.employee_data?.current_job_data?.position?.department?.name ?? '',
      item.employee_data?.current_job_data?.position?.job_title ?? '',
      item.leave_category_data?.name ?? '',
      String(item.leave_category_data?.total_entitled_days ?? ''),
      String(item.available_balance ?? ''),
      String(item.used_days ?? ''),
    ]
    if (format === 'csv') {
      lines.push(cells.map(c => csvEscape(c)).join(','))
    }
    else {
      lines.push(cells.map(c => c.replace(/\t/g, ' ')).join(sep))
    }
  }
  const body = lines.join('\n')
  const mime = format === 'xls' ? 'application/vnd.ms-excel' : 'text/csv;charset=utf-8;'
  const blob = new Blob([body], { type: mime })
  const ext = format === 'xls' ? 'xls' : 'csv'
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leave_balance_${new Date().toISOString().slice(0, 10)}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: 'Export ready', color: 'success' })
}

const exportMenuItems = [[
  {
    label: 'Export as CSV',
    icon: 'i-lucide-download',
    onSelect: () => exportBalances('csv'),
  },
  {
    label: 'Export as Excel',
    icon: 'i-lucide-download',
    onSelect: () => exportBalances('xls'),
  },
]] satisfies DropdownMenuItem[][]

const selectedColumnDefs = computed(() => columnsFromKeys(selectedColumnKeys.value))

const tableColumns = computed<TableColumn<BalanceRow>[]>(() => {
  const cols: TableColumn<BalanceRow>[] = [
    {
      id: 'select',
      header: () =>
        h(UCheckbox, {
          modelValue: allPageSelected.value,
          'onUpdate:modelValue': (v: boolean) => toggleSelectPage(!!v),
        }),
      cell: ({ row }) =>
        h(UCheckbox, {
          modelValue: isRowSelected(row.original),
          'onUpdate:modelValue': (v: boolean) => toggleRow(row.original, !!v),
        }),
    },
  ]

  for (const col of selectedColumnDefs.value) {
    if (col.key === 'employee') {
      cols.push({
        accessorKey: 'employee_data',
        header: 'Employee',
        cell: ({ row }) => {
          const id = row.original.employee_data?.id
          const name = row.original.employee_data?.full_name || '—'
          const num = row.original.employee_data?.employee_number
          return h('div', { class: 'flex flex-col gap-0.5' }, [
            h(
              NuxtLink,
              {
                to: employeePath(id),
                class: 'font-medium text-primary hover:underline capitalize',
              },
              () => name,
            ),
            h('span', { class: 'text-xs text-muted' }, num || ''),
          ])
        },
      })
    }
    else if (col.key === 'leave_type') {
      cols.push({
        accessorKey: 'leave_category_data',
        header: 'Leave type',
        cell: ({ row }) => row.original.leave_category_data?.name ?? '—',
      })
    }
    else if (col.key === 'job') {
      cols.push({
        id: 'job',
        header: 'Job',
        cell: ({ row }) => {
          const dept = row.original.employee_data?.current_job_data?.position?.department?.name
          const title = row.original.employee_data?.current_job_data?.position?.job_title
          return h('div', { class: 'flex flex-col text-sm' }, [
            h('span', {}, `Dept: ${dept || '—'}`),
            h('span', {}, `Title: ${title || '—'}`),
          ])
        },
      })
    }
    else if (col.key === 'entitled') {
      cols.push({
        accessorKey: 'leave_category_data.total_entitled_days',
        header: 'Entitled',
        cell: ({ row }) => row.original.leave_category_data?.total_entitled_days ?? '—',
      })
    }
    else if (col.key === 'available') {
      cols.push({
        accessorKey: 'available_balance',
        header: 'Available',
        cell: ({ row }) => row.original.available_balance ?? '—',
      })
    }
    else if (col.key === 'used') {
      cols.push({
        accessorKey: 'used_days',
        header: 'Used',
        cell: ({ row }) => row.original.used_days ?? '—',
      })
    }
  }

  cols.push({
    id: 'actions',
    header: 'Action',
    cell: ({ row }) =>
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        icon: 'i-lucide-eye',
        label: 'View',
        onClick: () => openBalanceModal(row.original),
      }),
  })

  return cols
})

const paginationPage = computed({
  get: () => urlParams.page,
  set: (p: number) => {
    urlParams.page = p
  },
})

function resetFilters() {
  urlParams.search = ''
  urlParams.department = ''
  urlParams.leave_type = ''
  urlParams.page = 1
}

const showingFrom = computed(() => {
  if (!totalCount.value) {
    return 0
  }
  return (currentPageFromApi.value - 1) * pageSizeFromApi.value + 1
})

const showingTo = computed(() => {
  return Math.min(currentPageFromApi.value * pageSizeFromApi.value, totalCount.value)
})

useSeoMeta({
  title: 'Time off — Balances',
  description: 'Employee leave balances and entitlements.',
})
</script>

<template>
  <UDashboardPanel id="time-off-balances">
    <template #header>
      <DashboardPageHeader
        title="Leave balances"
        breadcrumb="Dashboard / Time Off / Leave balances"
      >
        <template #right>
          <UserMenu avatar-only class="shrink-0" />
        </template>
      </DashboardPageHeader>
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <UCard>
          <template #header>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="text-lg font-semibold">
                  Overview
                </h2>
                <p class="text-sm text-muted">
                  Leave year: {{ leaveYearLabel }}
                </p>
              </div>
            </div>
          </template>
        </UCard>

        <div class="flex flex-wrap items-center gap-2">
          <UInput
            v-model="urlParams.search"
            icon="i-lucide-search"
            class="min-w-48 max-w-xs"
            placeholder="Search"
            type="search"
          />
          <USelect
            v-model="urlParams.department"
            class="min-w-44"
            placeholder="Department"
            :items="[
              { label: 'All departments', value: '' },
              ...departments.map(d => ({ label: d.name, value: d.name })),
            ]"
            value-key="value"
            label-key="label"
          />
          <USelect
            v-model="urlParams.leave_type"
            class="min-w-44"
            placeholder="Leave type"
            :items="[
              { label: 'All types', value: '' },
              ...leaveTypeNames.map(n => ({ label: n, value: n })),
            ]"
            value-key="value"
            label-key="label"
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
            color="neutral"
            variant="outline"
            label="Reset filters"
            :disabled="urlParams.search === '' && urlParams.department === '' && urlParams.leave_type === ''"
            @click="resetFilters"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            variant="outline"
            label="Refresh"
            :loading="loading"
            @click="() => void fetchBalances()"
          />
          <UDropdownMenu :items="exportMenuItems" :content="{ align: 'end' }">
            <UButton
              color="neutral"
              variant="outline"
              label="Export"
              trailing-icon="i-lucide-chevron-down"
            />
          </UDropdownMenu>
        </div>

        <UTable
          :data="rows"
          :columns="tableColumns"
          :loading="loading"
          class="w-full"
        />

        <div
          v-if="totalCount > 0"
          class="flex flex-col gap-3 border-t border-default pt-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-sm text-muted">
            Showing {{ showingFrom }} to {{ showingTo }} of {{ totalCount }} entries
            <span v-if="selectedRows.length" class="ml-1">
              · {{ selectedRows.length }} selected
            </span>
          </p>
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

  <TimeOffViewLeaveBalanceModal
    v-model:open="balanceModalOpen"
    :row="selectedBalanceRow"
    @success="onBalanceModalSuccess"
  />
</template>
