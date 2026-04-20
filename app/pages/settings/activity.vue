<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { companyService } from '~~/services/company.service'
import { ROUTE_LIST } from '~/constants/routeList'
import { urlParamsExtensionUtil } from '~/utils/urlParams'

definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'Settings — Activity log',
  description: 'Audit trail of important actions across your workspace.'
})

const toast = useToast()

const areaOptions = [
  { label: 'All areas', value: 'all' },
  { label: 'Access & Security', value: 'accounts' },
  { label: 'People', value: 'employee' },
  { label: 'Payroll', value: 'payroll' },
  { label: 'Time Off', value: 'timeoffs' },
  { label: 'Company', value: 'companies' },
  { label: 'System', value: 'kaziquest' }
]

const pageSizeOptions = [10, 30, 50, 100, 200]
const pageSize = ref<number>(pageSizeOptions[0] ?? 10)

const filters = reactive({
  page: 1,
  search: '',
  target_app: 'all'
})

interface LogActor {
  employee_id: string | null
  full_name: string | null
  job_title: string | null
  department: string | null
}

interface LogTarget {
  id: string | null
  type: string | null
  label: string | null
}

interface LogMetadata {
  browser_agent?: string | null
  ip_address?: string | null
  login_context?: string | null
}

interface LogRow {
  __position?: number
  id: string | number
  action: string
  action_label: string
  category: string
  summary: string
  description: string | null
  timestamp: string
  metadata: LogMetadata
  target: LogTarget
  user: LogActor
}

interface PaginationResponse {
  current_page: number
  current_page_count: number
  count: number
  results: LogRow[]
}

const response = ref<PaginationResponse>({
  current_page: 1,
  current_page_count: 0,
  count: 0,
  results: []
})

const logs = ref<LogRow[]>([])
const loading = ref(false)

const showingFrom = computed(() => {
  if (!logs.value.length) {
    return 0
  }
  return ((response.value.current_page - 1) * pageSize.value) + 1
})

const showingTo = computed(() => {
  if (!logs.value.length) {
    return 0
  }
  return ((response.value.current_page - 1) * pageSize.value) + response.value.current_page_count
})

const queryString = computed(() => {
  const params: Record<string, string | number> = {
    page: filters.page,
    page_size: pageSize.value,
    search: filters.search
  }
  if (filters.target_app !== 'all') {
    params.target_app = filters.target_app
  }
  return urlParamsExtensionUtil(params)
})

const paginationPage = computed({
  get: () => filters.page,
  set: (p: number) => {
    filters.page = p
  }
})

function getActivityColor(category: string) {
  switch (category) {
    case 'Access & Security':
      return 'info'
    case 'Payroll':
      return 'success'
    case 'Time Off':
      return 'warning'
    case 'People':
      return 'error'
    case 'Company':
      return 'primary'
    case 'System':
      return 'neutral'
    default:
      return 'neutral'
  }
}

function actorName(row: LogRow) {
  return row.user.full_name || 'System'
}

function actorMeta(row: LogRow) {
  return [row.user.job_title, row.user.department].filter(Boolean).join(' • ')
}

function shouldShowDescription(row: LogRow) {
  const description = row.description?.trim()
  if (!description) {
    return false
  }
  return description !== row.summary
}

const UBadge = resolveComponent('UBadge')
const NuxtLink = resolveComponent('NuxtLink')
const NuxtTime = resolveComponent('NuxtTime')

const columns: TableColumn<LogRow>[] = [
  {
    accessorKey: 'position',
    header: '#',
    cell: ({ row }) => String(row.original.__position ?? '')
  },
  {
    accessorKey: 'activity',
    header: 'Activity',
    cell: ({ row }) => {
      const r = row.original
      const children: ReturnType<typeof h>[] = [
        h('div', { class: 'flex flex-wrap items-center gap-2' }, [
          h(UBadge, { color: getActivityColor(r.category), variant: 'subtle' }, () => r.action_label),
          h('span', { class: 'font-medium text-default' }, r.summary)
        ])
      ]
      if (shouldShowDescription(r)) {
        children.push(h('p', { class: 'text-sm text-muted' }, r.description || ''))
      }
      children.push(h('div', { class: 'flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted' }, [
        h('span', {}, r.category),
        r.metadata.login_context ? h('span', {}, String(r.metadata.login_context)) : null,
        r.metadata.ip_address ? h('span', {}, `IP: ${r.metadata.ip_address}`) : null,
        r.metadata.browser_agent ? h('span', {}, String(r.metadata.browser_agent)) : null
      ].filter(Boolean)))
      return h('div', { class: 'space-y-1 py-1' }, children)
    }
  },
  {
    accessorKey: 'actor',
    header: 'Done by',
    cell: ({ row }) => {
      const r = row.original
      const name = actorName(r)
      const meta = actorMeta(r)
      const linkTo = r.user.employee_id
        ? ROUTE_LIST.employees.detail.replace(':uuid', String(r.user.employee_id))
        : null
      const nameEl = linkTo
        ? h(
            NuxtLink,
            { to: linkTo, class: 'font-medium text-primary hover:underline' },
            () => name
          )
        : h('span', { class: 'font-medium text-default' }, name)
      return h('div', { class: 'space-y-1 py-1' }, [
        nameEl,
        meta ? h('p', { class: 'text-sm text-muted' }, meta) : null
      ].filter(Boolean))
    }
  },
  {
    accessorKey: 'target',
    header: 'Target',
    cell: ({ row }) => {
      const r = row.original
      return h('div', { class: 'space-y-1 py-1' }, [
        h('span', { class: 'font-medium text-default' }, r.target.label || 'Unknown target'),
        h('p', { class: 'text-sm text-muted' }, r.target.type || 'Record')
      ])
    }
  },
  {
    accessorKey: 'timestamp',
    header: 'When',
    cell: ({ row }) =>
      h(NuxtTime, {
        datetime: row.original.timestamp,
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
  }
]

async function getLogs() {
  try {
    loading.value = true
    const res = await companyService.getLogs(queryString.value) as PaginationResponse
    if (res && Array.isArray(res.results)) {
      response.value = res
      const start = (res.current_page - 1) * pageSize.value
      logs.value = res.results.map((log, i) => ({
        ...log,
        __position: start + i + 1
      }))
    }
  } catch {
    toast.add({
      title: 'Failed to load activity log',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

let debounce: ReturnType<typeof setTimeout> | null = null

watch(
  () => [filters.page, filters.search, filters.target_app, pageSize.value],
  () => {
    if (debounce) {
      clearTimeout(debounce)
    }
    debounce = setTimeout(() => {
      void getLogs()
    }, 350)
  }
)

watch(
  () => filters.search,
  () => {
    filters.page = 1
  }
)

watch(
  () => filters.target_app,
  () => {
    filters.page = 1
  }
)

watch(pageSize, () => {
  filters.page = 1
})

onMounted(() => {
  void getLogs()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <UPageCard
      title="Activity log"
      description="Track major activity across access, leave, payroll, company changes, and employee updates."
      variant="naked"
    />

    <div class="flex flex-col gap-3 rounded-lg border border-default p-4 sm:flex-row sm:items-center sm:justify-between">
      <UInput
        v-model="filters.search"
        class="w-full sm:max-w-md"
        icon="i-lucide-search"
        placeholder="Search activities or people..."
      />
      <USelect
        v-model="filters.target_app"
        class="w-full sm:w-56"
        :items="areaOptions"
        value-key="value"
        label-key="label"
      />
    </div>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <UTable
        :data="logs"
        :columns="columns"
        :loading="loading"
        class="w-full"
      />

      <div
        v-if="!loading && logs.length === 0"
        class="flex flex-col items-center justify-center gap-2 py-12 text-center"
      >
        <UIcon name="i-lucide-scroll-text" class="size-10 text-muted" />
        <p class="text-sm font-medium text-default">
          No activity found
        </p>
        <p class="text-sm text-muted">
          Try widening the search or changing the selected area.
        </p>
      </div>

      <div
        v-if="logs.length > 0"
        class="flex flex-col gap-3 border-t border-default p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="text-sm text-muted">
          Showing {{ showingFrom }} to {{ showingTo }} of {{ response.count }} entries
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <UPagination
            v-model:page="paginationPage"
            :items-per-page="pageSize"
            :total="response.count"
          />
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted">Per page</span>
            <USelect
              v-model="pageSize"
              class="w-24"
              :items="pageSizeOptions.map(n => ({ label: String(n), value: n }))"
              value-key="value"
              label-key="label"
            />
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
