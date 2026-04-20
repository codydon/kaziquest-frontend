<script setup lang="ts">
const props = defineProps<{
  selectedPayPeriod: Record<string, unknown>
  payrollIssues: unknown[]
  coverageReport?: Record<string, unknown> | null
  hasValidated?: boolean
  periodExcludedCount?: number
  periodIncludedCount?: number
}>()

const emit = defineEmits<{
  runPayroll: [run: boolean]
  viewPaymentDetails: []
  resetValidation: []
}>()

const { toDDMMYYYY } = usePayrollDates()
const payrollStore = usePayrollStore()

const isIssuesModalOpen = ref(false)
const blockersCount = computed(() => (props.payrollIssues || []).length)
const warningsCount = computed(() => {
  const validation = (props.coverageReport?.validation || null) as { issues?: { severity?: string }[] } | null
  const issues = validation?.issues || []
  return issues.filter(issue => issue.severity === 'warning').length
})

const validationSummary = computed(() => {
  if (!props.hasValidated) {
    return ''
  }
  return blockersCount.value === 0
    ? `Validation complete. No blockers${warningsCount.value ? `, ${warningsCount.value} warning${warningsCount.value > 1 ? 's' : ''}.` : '.'}`
    : `Validation complete. ${blockersCount.value} blocker${blockersCount.value > 1 ? 's' : ''} found.`
})

watch(
  () => props.selectedPayPeriod,
  (newItem) => {
    if (newItem?.from_date && newItem?.to_date) {
      payrollStore.setCurrentPeriod(String(newItem.from_date), String(newItem.to_date))
    }
  },
  { immediate: true, deep: true },
)

function normalizeStatus(raw?: string) {
  if (!raw) {
    return 'not_settled'
  }
  const s = String(raw).trim().toLowerCase()
  if (s === 'approved') {
    return 'approved'
  }
  if (s.includes('partial') || s === 'partially_approved') {
    return 'partially_approved'
  }
  if (s === 'pending' || s.includes('pend')) {
    return 'pending'
  }
  if (s.includes('process') || s === 'processing') {
    return 'processing'
  }
  if (s.includes('not run') || s === 'not_run') {
    return 'not_run'
  }
  return 'not_settled'
}

const normalizedStatus = computed(() => normalizeStatus(props.selectedPayPeriod?.status as string | undefined))

interface StatusMeta {
  label: string
  outer: string
  inner: string
  text: string
}

const defaultStatusMeta: StatusMeta = {
  label: 'Up next',
  outer: 'bg-muted',
  inner: 'bg-muted/80',
  text: 'text-highlighted',
}

const statusMetaMap: Record<string, StatusMeta> = {
  approved: { label: 'Approved', outer: 'bg-success/20', inner: 'bg-success/30', text: 'text-success' },
  pending: { label: 'Pending', outer: 'bg-warning/20', inner: 'bg-warning/30', text: 'text-warning' },
  processing: { label: 'Processing', outer: 'bg-warning/20', inner: 'bg-warning/30', text: 'text-warning' },
  partially_approved: { label: 'Partial', outer: 'bg-warning/20', inner: 'bg-warning/30', text: 'text-warning' },
  not_run: { label: 'Not run', outer: 'bg-error/20', inner: 'bg-error/30', text: 'text-error' },
  not_settled: defaultStatusMeta,
}

function getStatusMeta(statusKey: string): StatusMeta {
  return statusMetaMap[statusKey] ?? defaultStatusMeta
}

const statusMeta = computed<StatusMeta>(() => getStatusMeta(normalizedStatus.value))

function handleValidationChanged() {
  emit('resetValidation')
}
</script>

<template>
  <div>
    <div v-if="normalizedStatus === 'approved'">
      <div class="flex flex-col justify-center items-center min-h-[450px]">
        <div
          :class="['flex flex-col justify-center items-center gap-4 h-[170px] w-[170px] rounded-full', statusMeta.outer]"
        >
          <div
            :class="['flex flex-col justify-center items-center p-2 rounded-full w-[150px] h-[150px]', statusMeta.inner]"
          >
            <p :class="statusMeta.text">{{ statusMeta.label }}</p>
            <p>{{ toDDMMYYYY(String(selectedPayPeriod.pay_date || '')) }}</p>
            <NuxtLink v-if="selectedPayPeriod.id" :to="`/payroll/${selectedPayPeriod.id}/review`">
              <UButton variant="link" label="View details" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="normalizedStatus === 'processing' || normalizedStatus === 'partially_approved' || normalizedStatus === 'pending'">
      <div v-if="selectedPayPeriod.id" class="flex flex-col justify-center items-center min-h-[450px]">
        <div
          :class="['flex flex-col justify-center items-center gap-4 h-[170px] w-[170px] rounded-full', statusMeta.outer]"
        >
          <div
            :class="['flex flex-col justify-center items-center p-2 rounded-full w-[150px] h-[150px]', statusMeta.inner]"
          >
            <p :class="statusMeta.text">{{ statusMeta.label }}</p>
            <p>{{ toDDMMYYYY(String(selectedPayPeriod.pay_date || '')) }}</p>
            <NuxtLink :to="`/payroll/${selectedPayPeriod.id}/review`">
              <UButton variant="link" label="View details" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="normalizedStatus === 'not_settled' || normalizedStatus === 'not_run'">
      <div class="flex flex-col lg:flex-row gap-2 my-2 text-md text-muted">
        <UIcon name="i-lucide-calendar-days" class="size-12 text-primary" />
        <div>
          <p class="text-2xl text-primary font-bold">
            {{ selectedPayPeriod.month }} {{ selectedPayPeriod.date }} Payroll
          </p>
          <p class="text-sm">Set the period, validate coverage, then run payroll.</p>
        </div>
      </div>

      <div v-if="validationSummary" class="border border-default rounded-lg p-4 my-4" aria-live="polite">
        <p class="text-sm text-muted">{{ validationSummary }}</p>
      </div>

      <div class="border border-default rounded-lg p-5 my-4">
        <p class="text-sm font-semibold text-highlighted">What needs attention</p>

        <div v-if="blockersCount > 0" class="mt-3 border border-warning rounded-lg p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex gap-3">
              <UIcon name="i-lucide-triangle-alert" class="size-6 text-error" />
              <div>
                <p class="text-sm font-semibold text-error">Blockers</p>
                <p class="text-sm text-muted">
                  {{ blockersCount }} employee{{ blockersCount > 1 ? 's have' : ' has' }} missing information. Fix or exclude them before running payroll.
                </p>
              </div>
            </div>
            <UButton size="sm" label="Review affected employees" @click="isIssuesModalOpen = true" />
          </div>
        </div>

        <div v-else class="mt-3 border border-default rounded-lg p-4">
          <p class="text-sm text-muted">No blockers found. You can run payroll when ready.</p>
        </div>

        <div v-if="warningsCount" class="mt-3 border border-default rounded-lg p-4">
          <p class="text-sm font-semibold text-highlighted">Warnings</p>
          <ul class="list-disc pl-5 text-sm text-muted mt-2 space-y-1">
            <li v-if="(coverageReport as any)?.mid_period_joiners_count">Prorated joiners detected.</li>
            <li v-if="(coverageReport as any)?.mid_period_leavers_count">Prorated leavers detected.</li>
            <li v-if="(coverageReport as any)?.excluded_already_settled_count">
              Some employees are excluded because they were already settled in an overlapping payroll.
            </li>
          </ul>
        </div>

        <div class="mt-4">
          <UButton variant="link" label="View employees being paid" @click="emit('viewPaymentDetails')" />
        </div>
      </div>

      <div class="border border-default rounded-lg p-5 my-4">
        <p class="text-sm font-semibold text-highlighted">Basics</p>
        <div class="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm text-muted">
          <div>
            <p class="font-medium text-highlighted">Pay period</p>
            <p>{{ toDDMMYYYY(String(selectedPayPeriod.from_date || '')) }} – {{ toDDMMYYYY(String(selectedPayPeriod.to_date || '')) }}</p>
          </div>
        </div>
        <p class="text-xs text-muted mt-3">
          Employees are included if they have an active job record during the pay period.
        </p>
        <p class="text-xs text-muted mt-3">
          Employees already settled in an off-cycle payroll for this period are automatically excluded to prevent double-pay.
        </p>
      </div>

      <div class="border border-default rounded-lg p-5 my-4">
        <p class="text-sm font-semibold text-highlighted">Coverage report</p>
        <p class="text-xs text-muted">Who will be paid, and why some will not.</p>

        <div class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between items-center p-3 bg-info/10 rounded-lg">
            <span class="text-muted">Total employees:</span>
            <span class="font-semibold text-highlighted">{{ (coverageReport as any)?.summary?.total_in_scope ?? 0 }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-success/10 rounded-lg">
            <span class="text-muted">Will be paid:</span>
            <span class="font-semibold text-success">{{ periodIncludedCount }}</span>
          </div>
          <div v-if="(periodExcludedCount ?? 0) > 0" class="flex justify-between items-center p-3 bg-error/10 rounded-lg">
            <span class="text-muted">Excluded:</span>
            <span class="font-semibold text-error">{{ periodExcludedCount }}</span>
          </div>
        </div>
      </div>

      <hr class="lg:my-12 mt-5 border-default">
    </div>

    <PayrollViewIssuesModal
      v-if="isIssuesModalOpen"
      :is-open="isIssuesModalOpen"
      :issues="payrollIssues"
      :from-date="String(selectedPayPeriod.from_date || '')"
      :to-date="String(selectedPayPeriod.to_date || '')"
      :pay-date="String(selectedPayPeriod.pay_date || '')"
      @close="isIssuesModalOpen = false"
      @validation-changed="handleValidationChanged"
    />
  </div>
</template>
