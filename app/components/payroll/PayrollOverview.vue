<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { EmpCoverageItem } from '~/types/payroll'
import { ROUTE_LIST } from '~/constants/routeList'
import { payrollService } from '~~/services/payroll.service'

const { formartToLongDayMonthDate, formatToMonthAndYear } = usePayrollDates()
const payrollStore = usePayrollStore()

const start = ref(false)
const route = useRoute()
const router = useRouter()
const toast = useToast()

const {
  data: payrollHistoryRes,
  status,
  refresh: refreshPayrollHistory,
} = await payrollService.getPayrolls() as Record<string, any>
const loadingPayrollHistory = computed(() => status.value === 'pending')
const payrollData = computed(() => payrollHistoryRes.value?.data || [])

const manualExclusions = computed(() => {
  return new Set<string>(payrollStore.getCurrentPeriodExclusions())
})

const manualInclusions = computed(() => {
  return new Set<string>(payrollStore.getCurrentPeriodManualInclusions())
})

const periodIncludedCount = computed(() => {
  const allIncluded = coverageReport.value?.employees?.included || []
  const allExcluded = coverageReport.value?.employees?.excluded || []
  const exclusions = manualExclusions.value
  const inclusions = manualInclusions.value
  const fromBackendIncluded = allIncluded.filter((emp: EmpCoverageItem) => !exclusions.has(emp.id)).length
  const fromBackendExcluded = allExcluded.filter((emp: EmpCoverageItem) => inclusions.has(emp.id)).length
  return fromBackendIncluded + fromBackendExcluded
})

const periodExcludedCount = computed(() => {
  const allIncluded = coverageReport.value?.employees?.included || []
  const allExcluded = coverageReport.value?.employees?.excluded || []
  const exclusions = manualExclusions.value
  const inclusions = manualInclusions.value
  const manuallyExcluded = allIncluded.filter((emp: EmpCoverageItem) => exclusions.has(emp.id)).length
  const systemExcluded = allExcluded.filter((emp: EmpCoverageItem) => !inclusions.has(emp.id)).length
  return manuallyExcluded + systemExcluded
})

const currentView = ref<'overview' | 'payment-details'>('overview')

function showPaymentDetails() {
  currentView.value = 'payment-details'
}

function hidePaymentDetails() {
  currentView.value = 'overview'
}

const currentYear = new Date().getFullYear()

const selectedYear = computed<number>({
  get: () => {
    const urlYear = Number(route.query.year)
    return Number.isFinite(urlYear) && urlYear > 0 ? urlYear : currentYear
  },
  set: async (y) => {
    await router.push({
      query: { ...route.query, year: String(y) },
    })
    payrollStore.setSelectedPayrollYear(Number(y))
  },
})

const yearSelectItems = computed(() => {
  const years: { label: string, value: number }[] = []
  for (let y = currentYear; y >= 2025; y--) {
    years.push({ label: String(y), value: y })
  }
  return years
})

interface PayPeriod {
  status?: string
  pay_date?: string
  from_date?: string
  to_date?: string
  month?: string
  date?: string
  id?: string
}

const selectedPayPeriod = ref<PayPeriod>({})

function handleSelectedPayPeriod(data: PayPeriod) {
  selectedPayPeriod.value = data
  payrollStore.setSelectedPayPeriod(data as Record<string, unknown>)
  hasValidated.value = false
  coverageReport.value = null
  if (data.from_date && data.to_date) {
    payrollStore.setCurrentPeriod(data.from_date, data.to_date)
  }
  void getCoverage()
}

interface RunPayrollData {
  employee_ids: string[]
  excluded_employee_ids?: string[]
  name: string
  pay_date: string
  from_date: string
  to_date: string
  start_payroll: boolean
  is_off_cycle: boolean
}

const runPayrollData = ref<RunPayrollData>({
  employee_ids: [],
  name: '',
  pay_date: '',
  from_date: '',
  to_date: '',
  start_payroll: false,
  is_off_cycle: false,
})

const payrollRunning = ref(false)
const payrollIssues = ref<any[]>([])
const payrollMessage = ref('')
const responseData = ref<any>(null)
const employeesToBepartOfPayroll = ref(0)

const coverageReport = ref<any>(null)
const hasValidated = ref(false)

function normalizeCoverage(apiPayload: any) {
  if (!apiPayload) {
    return null
  }
  if (apiPayload.summary) {
    return {
      period: apiPayload.period || null,
      summary: apiPayload.summary || {},
      employees: apiPayload.employees || { included: [], excluded: [] },
      validation: apiPayload.validation || {
        issues: [],
        has_issues: false,
        can_run: true,
      },
    }
  }
  return null
}

const periodInScopeCount = computed<number | null>(() => {
  const summary = coverageReport.value?.summary
  if (!summary) {
    return null
  }
  const total = Number(summary.total_in_scope || 0)
  return total > 0 ? total : null
})

watch(
  employeesToBepartOfPayroll,
  (newValue) => {
    payrollStore.validationData.totalEmployees = newValue || 0
  },
  { immediate: true },
)

const showRunPayrollModal = ref(false)
const futurePayrollConfirmed = ref(false)

const gettingCoverage = ref(false)

async function getCoverage(includeDetails: boolean = false) {
  if (gettingCoverage.value) {
    return
  }
  if (!selectedPayPeriod.value?.from_date || !selectedPayPeriod.value?.to_date) {
    return
  }

  payrollStore.setCurrentPeriod(
    selectedPayPeriod.value.from_date,
    selectedPayPeriod.value.to_date,
  )

  const body = {
    from_date: selectedPayPeriod.value.from_date,
    to_date: selectedPayPeriod.value.to_date,
  }

  try {
    gettingCoverage.value = true
    const { data, error }: any = await payrollService.getPayrollCoverage({
      body,
    })
    gettingCoverage.value = false

    if (error?.value) {
      payrollMessage.value = error.value.data?.message || 'Failed to load coverage'
      return
    }

    const apiPayload = data.value?.data || null
    if (apiPayload) {
      coverageReport.value = normalizeCoverage(apiPayload)
      payrollIssues.value = coverageReport.value?.validation?.issues || []
    }
  }
  catch {
    payrollMessage.value = 'Failed to load coverage'
    payrollIssues.value = []
  }
  finally {
    gettingCoverage.value = false
  }
}

async function runPayroll(run: boolean = false): Promise<void> {
  if (payrollIssues.value.length > 0 && run) {
    payrollMessage.value = 'Please fix validation issues first'
    return
  }

  if (run && selectedPayPeriod.value?.status === undefined || selectedPayPeriod.value?.status === null) {
    const today = new Date()
    const payrollDate = new Date(selectedPayPeriod.value.pay_date ?? '')
    today.setHours(0, 0, 0, 0)
    payrollDate.setHours(0, 0, 0, 0)
    if (payrollDate > today && !futurePayrollConfirmed.value) {
      showRunPayrollModal.value = true
      return
    }
  }

  if (!selectedPayPeriod.value?.to_date) {
    payrollMessage.value = 'Please select a valid pay period'
    return
  }

  runPayrollData.value = {
    employee_ids: (() => {
      const allIncluded = coverageReport.value?.employees?.included || []
      const allExcluded = coverageReport.value?.employees?.excluded || []
      const exclusions = manualExclusions.value
      const inclusions = manualInclusions.value
      const fromBackendIncluded = allIncluded
        .filter((emp: EmpCoverageItem) => !exclusions.has(emp.id))
        .map((emp: EmpCoverageItem) => emp.id)
      const fromBackendExcluded = allExcluded
        .filter((emp: EmpCoverageItem) => inclusions.has(emp.id))
        .map((emp: EmpCoverageItem) => emp.id)
      return [...fromBackendIncluded, ...fromBackendExcluded]
    })(),
    excluded_employee_ids: Array.from(manualExclusions.value),
    name: formartToLongDayMonthDate(selectedPayPeriod.value?.pay_date ?? ''),
    pay_date: selectedPayPeriod.value.pay_date ?? '',
    from_date: selectedPayPeriod.value.from_date ?? '',
    to_date: selectedPayPeriod.value.to_date ?? '',
    start_payroll: run,
    is_off_cycle: false,
  }

  try {
    payrollRunning.value = true
    const { error, status, data }: Record<string, any> = await payrollService.runPayroll({
      body: runPayrollData.value,
      server: false,
    })

    if (error?.value) {
      handlePayrollError(error.value)
      return
    }

    if (status.value === 'success' && data.value) {
      if (!run) {
        hasValidated.value = true
      }
      payrollMessage.value = data.value.message
      payrollIssues.value = data.value.data?.issues ?? []
      employeesToBepartOfPayroll.value = data.value.data?.total_employees ?? 0

      if (run) {
        toast.add({
          title: 'Payroll started',
          color: 'success',
        })
        await new Promise(resolve => setTimeout(resolve, 2000))
        await navigateTo(ROUTE_LIST.payroll.history)
        payrollStore.clearEmployeesExcluded()
        payrollStore.selectedPayPeriod = {}
      }
    }
  }
  catch {
    payrollMessage.value = 'An unexpected error occurred'
  }
  finally {
    payrollRunning.value = false
  }
}

function confirmFuturePayroll() {
  showRunPayrollModal.value = false
  futurePayrollConfirmed.value = true
  nextTick(() => {
    void runPayroll(true)
  })
}

function handlePayrollError(error: any) {
  payrollMessage.value = error?.data?.message || 'An error occurred.'
  responseData.value = error?.stack || error?.data || null
  payrollIssues.value = responseData.value?.data?.issues ?? []
  employeesToBepartOfPayroll.value = responseData.value?.data?.total_employees ?? 0
  coverageReport.value = normalizeCoverage(responseData.value?.data) ?? coverageReport.value
  if (!runPayrollData.value?.start_payroll) {
    hasValidated.value = true
  }
}

onMounted(async () => {
  if (!route.query.year) {
    await router.push({
      query: { ...route.query, year: String(currentYear) },
    })
  }
  payrollStore.setSelectedPayrollYear(selectedYear.value)
  selectedPayPeriod.value = payrollStore.selectedPayPeriod as PayPeriod
})

const canStartPayroll = computed(() => hasValidated.value && payrollIssues.value?.length === 0)

const primaryCtaLabel = computed(() => {
  if (gettingCoverage.value) {
    return 'Getting coverage…'
  }
  if (payrollRunning.value) {
    return runPayrollData.value.start_payroll ? 'Running…' : 'Validating…'
  }
  return canStartPayroll.value ? 'Run payroll' : 'Validate payroll'
})

async function onPrimaryCtaClick() {
  if (canStartPayroll.value) {
    showRunPayrollModal.value = true
    return
  }
  await runPayroll(false)
}

const formattedPayDate = computed(() => {
  if (!selectedPayPeriod.value?.pay_date) {
    return ''
  }
  return formartToLongDayMonthDate(selectedPayPeriod.value.pay_date ?? '')
})
</script>

<template>
  <div class="h-full w-full bg-default rounded-lg p-4 space-y-4 border border-default">
    <PayrollNssfNotice />

    <PayrollPaymentDetails
      v-if="selectedPayPeriod && currentView === 'payment-details'"
      :coverage-report="coverageReport"
      @back="hidePaymentDetails"
    />

    <div v-if="currentView === 'overview'">
      <div class="border-b border-default px-4 py-4 lg:px-8">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex items-center gap-4 flex-wrap">
            <div>
              <p class="lg:text-3xl text-xl font-bold text-primary">Payroll</p>
              <p class="text-sm text-muted">
                Validate, review coverage, then run payroll.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted">Year</span>
              <USelect
                v-model="selectedYear"
                :items="yearSelectItems"
                value-key="value"
                label-key="label"
                class="w-28"
                size="sm"
              />
            </div>
          </div>

          <UButton
            class="rounded-full"
            label="Off-cycle payroll"
            icon="i-lucide-arrow-right"
            trailing
            :to="ROUTE_LIST.payroll.offCycle"
          />
        </div>
      </div>

      <PayrollTimeline
        :payroll-data="payrollData"
        :selected-year="selectedYear"
        :loading="loadingPayrollHistory"
        @selected-pay-period="handleSelectedPayPeriod"
      />

      <div class="flex lg:flex-row gap-2 flex-col my-10">
        <PayrollInfo
          class="w-full lg:w-3/4"
          :payroll-issues="payrollIssues"
          :coverage-report="coverageReport"
          :selected-pay-period="selectedPayPeriod"
          :period-excluded-count="periodExcludedCount"
          :period-included-count="periodIncludedCount"
          :has-validated="hasValidated"
          @run-payroll="runPayroll"
          @view-payment-details="showPaymentDetails"
          @reset-validation="hasValidated = false"
        />

        <div v-if="selectedPayPeriod.status == null || selectedPayPeriod.status === undefined" class="w-full lg:w-1/4">
          <div class="border-2 border-default rounded-xl p-6 space-y-4">
            <div class="space-y-2">
              <p
                v-if="!gettingCoverage && periodIncludedCount === 0"
                class="text-sm text-error"
              >
                No employees were selected to be paid.
              </p>
              <UButton
                v-else
                :loading="payrollRunning || gettingCoverage"
                size="md"
                :label="primaryCtaLabel"
                block
                @click="onPrimaryCtaClick"
              />
              <p
                v-if="!canStartPayroll && runPayrollData.start_payroll === false"
                class="text-xs text-muted"
              >
                Fix blockers (if any), then re-validate to run.
              </p>
            </div>

            <USeparator />

            <div class="flex items-start gap-3 text-muted">
              <UIcon name="i-lucide-users" class="size-5 mt-0.5" />
              <div class="w-full">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-sm font-semibold text-highlighted">
                      <span v-if="periodInScopeCount !== null">{{ periodIncludedCount ?? 0 }} / {{ periodInScopeCount }}</span>
                      <span v-else>—</span>
                    </p>
                    <p class="text-xs text-muted">
                      <span v-if="periodInScopeCount !== null">In scope for this pay period</span>
                      <span v-else>Validate to see pay-period count</span>
                      <span v-if="periodExcludedCount && periodInScopeCount !== null"> • {{ periodExcludedCount }} excluded</span>
                    </p>
                  </div>
                  <UButton label="View" size="xs" variant="link" @click="showPaymentDetails" />
                </div>
                <p class="text-sm font-semibold text-highlighted mt-2">
                  Employees {{ selectedPayPeriod.status === 'approved' ? 'who were' : 'being' }} paid
                </p>
              </div>
            </div>

            <div class="flex items-start gap-3 text-muted">
              <UIcon name="i-lucide-calendar" class="size-5 mt-0.5" />
              <div class="leading-tight">
                <p class="text-sm font-semibold text-highlighted">
                  {{ formartToLongDayMonthDate(selectedPayPeriod.from_date ?? '') }}
                  –
                  {{ formartToLongDayMonthDate(selectedPayPeriod.to_date ?? '') }}
                </p>
                <p class="text-sm">Pay period</p>
              </div>
            </div>

            <div class="flex items-start gap-3 text-muted">
              <UIcon name="i-lucide-calendar" class="size-5 mt-0.5" />
              <div class="leading-tight">
                <p class="text-sm font-semibold text-highlighted">
                  {{ formartToLongDayMonthDate(selectedPayPeriod.pay_date ?? '') }}
                </p>
                <p class="text-sm">Pay date</p>
              </div>
            </div>
          </div>

          <div
            v-if="start"
            class="cursor-pointer hover:text-primary text-center my-4 lg:my-8 text-muted"
          >
            Skip this payroll
          </div>
        </div>
      </div>

      <UModal v-model:open="showRunPayrollModal">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-triangle-alert" class="size-6 text-warning" />
            <span class="font-semibold">Confirm payroll processing</span>
          </div>
        </template>
        <div class="space-y-4">
          <p class="text-sm text-muted">
            You're about to run payroll for
            <span class="font-semibold text-highlighted">{{ formatToMonthAndYear(formattedPayDate) }}</span>.
          </p>
          <UAlert color="neutral" variant="subtle" title="After you run" description="Payslips are generated. You can still adjust details before approval." />
          <div v-if="coverageReport" class="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-muted">Total employees:</span>
              <span class="font-semibold text-highlighted">{{ coverageReport.summary?.total_in_scope ?? 0 }}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-primary/20">
              <span class="font-semibold text-highlighted">Will be paid:</span>
              <span class="text-lg font-bold text-primary">{{ periodIncludedCount ?? 0 }}</span>
            </div>
            <p v-if="periodExcludedCount" class="text-xs text-muted pt-2">
              {{ periodExcludedCount }} excluded
            </p>
          </div>
          <p class="text-sm text-muted">
            This action cannot be undone. Do you want to continue?
          </p>
        </div>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <UButton color="neutral" variant="outline" label="Cancel" @click="showRunPayrollModal = false" />
            <UButton label="Yes, run payroll" @click="confirmFuturePayroll" />
          </div>
        </template>
      </UModal>
    </div>
  </div>
</template>
