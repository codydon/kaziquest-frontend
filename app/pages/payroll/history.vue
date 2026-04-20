<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { payrollService } from '~~/services/payroll.service'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default'
})

interface PayrollHistoryRow {
  id: string
  name?: string
  pay_date?: string
  from_date?: string
  to_date?: string
  status?: string
  shared?: boolean
  is_off_cycle?: boolean
}

const {
  data: payrollHistory,
  status,
  refresh: getPayrolls
} = await payrollService.getPayrolls() as {
  data: Ref<{ data?: PayrollHistoryRow[] } | null>
  status: Ref<string>
  refresh: () => Promise<void>
}

const loading = computed(() => status.value === 'pending')

const lastFetchTime = ref(Date.now())
const showRefreshSuccess = ref(false)

const FAST_REFRESH_INTERVAL = 10_000
const SLOW_REFRESH_INTERVAL = 60_000
let refreshInterval: ReturnType<typeof setInterval> | null = null

const rows = computed(() => payrollHistory.value?.data ?? [])

const hasProcessingPayroll = computed(() =>
  rows.value.some(p => p.status === 'processing')
)

const getRefreshInterval = () =>
  hasProcessingPayroll.value ? FAST_REFRESH_INTERVAL : SLOW_REFRESH_INTERVAL

const showSuccessIndicator = () => {
  showRefreshSuccess.value = true
  setTimeout(() => {
    showRefreshSuccess.value = false
  }, 2000)
}

const handleRefresh = async (isManual = false) => {
  await getPayrolls()
  lastFetchTime.value = Date.now()
  if (isManual) {
    showSuccessIndicator()
  }
  startAutoRefresh()
}

const startAutoRefresh = () => {
  if (refreshInterval) clearInterval(refreshInterval)
  refreshInterval = setInterval(() => void handleRefresh(false), getRefreshInterval())
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

const columns: TableColumn<PayrollHistoryRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'pay_date', header: 'Pay date' },
  { accessorKey: 'from_date', header: 'From' },
  { accessorKey: 'to_date', header: 'To' },
  { accessorKey: 'status', header: 'Status' }
]

const authStore = useAuthStore()

useSeoMeta({
  title: `${(authStore.user as { company?: { name?: string } })?.company?.name || 'KaziQuest'} - Payroll history`,
  description: 'View your payroll history'
})

onMounted(() => {
  void getPayrolls()
  lastFetchTime.value = Date.now()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

function statusColor(status?: string) {
  if (status === 'approved') return 'success'
  if (status === 'partially_approved') return 'warning'
  if (status === 'processing') return 'info'
  return 'neutral'
}
</script>

<template>
  <div>
    <UCard>
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-highlighted">
            Payroll history
          </h1>
          <div
            v-if="hasProcessingPayroll"
            class="flex items-center gap-1.5 rounded-full bg-info/15 px-2.5 py-1"
          >
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-info opacity-75" />
              <span class="relative inline-flex h-2 w-2 rounded-full bg-info" />
            </span>
            <span class="text-xs font-medium text-info">
              Auto-updating
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showRefreshSuccess"
              class="flex items-center gap-1.5 text-sm font-medium text-success"
            >
              <UIcon name="i-heroicons-check-circle" class="size-4" />
              <span>Updated</span>
            </div>
          </Transition>

          <UButton
            icon="i-heroicons-arrow-path"
            variant="ghost"
            color="neutral"
            :loading="loading"
            :disabled="loading"
            @click="handleRefresh(true)"
          >
            Refresh
          </UButton>
        </div>
      </div>

      <div class="overflow-auto rounded-lg border border-default">
        <UTable
          :loading="loading"
          :data="rows"
          :columns="columns"
        >
          <template #name-cell="{ row }">
            <div class="flex flex-col items-start justify-start gap-1">
              <UButton
                variant="link"
                class="font-medium"
                :padded="false"
                @click="navigateTo(`/payroll/${row.original.id}/review`)"
              >
                {{ row.original.name }}
              </UButton>
              <UBadge
                v-if="row.original.is_off_cycle"
                color="neutral"
                variant="subtle"
                size="xs"
              >
                Off cycle
              </UBadge>
            </div>
          </template>

          <template #pay_date-cell="{ row }">
            <span class="text-sm text-muted">
              {{
                row.original.pay_date
                  ? new Date(row.original.pay_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                  : '—'
              }}
            </span>
          </template>

          <template #from_date-cell="{ row }">
            <span class="text-sm text-muted">
              {{
                row.original.from_date
                  ? new Date(row.original.from_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })
                  : '—'
              }}
            </span>
          </template>

          <template #to_date-cell="{ row }">
            <span class="text-sm text-muted">
              {{
                row.original.to_date
                  ? new Date(row.original.to_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })
                  : '—'
              }}
            </span>
          </template>

          <template #status-cell="{ row }">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                :color="statusColor(row.original.status)"
                variant="soft"
                class="rounded-full"
              >
                <span class="flex items-center gap-1.5">
                  <span
                    v-if="row.original.status === 'processing'"
                    class="relative flex h-1.5 w-1.5"
                  >
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-info opacity-75" />
                    <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-info" />
                  </span>
                  {{
                    row.original.status === 'approved'
                      ? 'Approved'
                      : row.original.status === 'partially_approved'
                        ? 'Partially approved'
                        : row.original.status === 'processing'
                          ? 'Processing'
                          : 'Pending'
                  }}
                </span>
              </UBadge>

              <UBadge
                :color="row.original.shared ? 'success' : 'neutral'"
                variant="soft"
                class="rounded-full"
              >
                <span class="flex items-center gap-1.5">
                  <UIcon
                    :name="row.original.shared ? 'i-heroicons-check-circle' : 'i-heroicons-clock'"
                    class="size-3"
                  />
                  {{ row.original.shared ? 'Distributed' : 'Not distributed' }}
                </span>
              </UBadge>
            </div>
          </template>
        </UTable>
      </div>
    </UCard>
  </div>
</template>
