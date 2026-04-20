<script setup lang="ts">
import { ROUTE_LIST } from '~/constants/routeList'
import { employeeService } from '~~/services/employee.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  open: boolean
  employee: { id: string; full_name: string; status?: string }
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v)
})

const currentTab = ref<'exitDetails' | 'clearanceChecklist' | 'assetReturns' | 'finalPayroll'>('exitDetails')
const toast = useToast()
const loading = ref(false)
const changeTracker = ref(0)

const mapStatusToExitType = (status: string | undefined): string => {
  if (!status) return ''
  const statusMapping: Record<string, string> = {
    Resigned: 'resignation',
    Terminated: 'termination',
    'Terminated-Retirement': 'retirement',
    'Terminated-Voluntary': 'voluntary',
    'Terminated-Involuntary': 'termination',
    'Terminated-Layoff': 'termination'
  }
  return statusMapping[status] || ''
}

const exitFlowData = reactive({
  exitDetails: {
    exit_type: '',
    last_working_day: '',
    official_exit_date: '',
    reason_for_exit: ''
  },
  clearanceData: {} as Record<string, unknown>,
  assetData: { assets: [] as unknown[] },
  payrollData: {} as Record<string, unknown>,
  deductionOptions: {
    includeAssetDeductions: false,
    includeAccruedLeave: false
  }
})

const assetsLoading = ref(false)
const loadEmployeeAssets = async () => {
  if (!props?.employee?.id) return
  try {
    assetsLoading.value = true
    const res: unknown = await employeeService.fetchEmployeeAssets(`?employee_id=${props.employee.id}`, {
      handler: '$fetch',
      secured: true
    })
    const raw = (res as { results?: unknown[] })?.results
      ?? (res as { data?: { results?: unknown[] } })?.data?.results
      ?? (Array.isArray(res) ? res : [])
    exitFlowData.assetData.assets = (raw as any[]).map((a: Record<string, unknown>) => ({
      name: (a?.asset as Record<string, unknown>)?.name || a?.asset_name || a?.name || a?.item_name || '',
      description: a?.description || (a?.asset as Record<string, unknown>)?.description || '',
      amount: Number(a?.amount ?? a?.value ?? a?.asset_value ?? 0),
      serial_number: a?.serial_number || a?.serial || a?.code || '',
      exitStatus: '',
      returnDate: null as string | null
    }))
  } catch {
    // keep empty assets
  } finally {
    assetsLoading.value = false
  }
}

watch(() => props.open, (open) => {
  if (open) {
    void loadEmployeeAssets()
  }
})

const tabItems = [
  { label: 'Exit Details', value: 'exitDetails' as const },
  { label: 'Clearance', value: 'clearanceChecklist' as const },
  { label: 'Assets', value: 'assetReturns' as const },
  { label: 'Final Payroll', value: 'finalPayroll' as const }
]

const isCurrentTabValid = computed(() => {
  changeTracker.value
  if (currentTab.value === 'exitDetails') {
    return Boolean(
      exitFlowData.exitDetails.exit_type
      && exitFlowData.exitDetails.last_working_day
      && exitFlowData.exitDetails.official_exit_date
    )
  }
  return true
})

function goToNextTab() {
  if (!isCurrentTabValid.value) return
  const order = tabItems.map(t => t.value)
  const i = order.indexOf(currentTab.value)
  if (i < order.length - 1) {
    currentTab.value = order[i + 1]!
  }
}

function goToPreviousTab() {
  const order = tabItems.map(t => t.value)
  const i = order.indexOf(currentTab.value)
  if (i > 0) {
    currentTab.value = order[i - 1]!
  }
}

function updateExitDetails(data: Record<string, unknown>) {
  Object.assign(exitFlowData.exitDetails, data)
  changeTracker.value++
}

function updateClearanceData(data: Record<string, unknown>) {
  Object.assign(exitFlowData, { clearanceData: data })
}

function updateAssetData(data: { assets: unknown[] }) {
  Object.assign(exitFlowData, { assetData: data })
}

function updatePayrollData(data: Record<string, unknown>) {
  Object.assign(exitFlowData, { payrollData: data })
}

function updateDeductionOptions(data: Record<string, unknown>) {
  Object.assign(exitFlowData, { deductionOptions: data })
}

watch(() => props.open, (open) => {
  if (open && props.employee?.status) {
    const autoExitType = mapStatusToExitType(props.employee.status)
    if (autoExitType) {
      exitFlowData.exitDetails.exit_type = autoExitType
      changeTracker.value++
    }
  }
}, { immediate: true })

const safeNum = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

async function handleSubmit() {
  try {
    loading.value = true
    const fe = exitFlowData.payrollData as Record<string, any>
    const earnings = fe?.earnings || {}
    const deductions = fe?.deductions || {}
    const grossEarningsNum = safeNum(earnings.basicSalary) + safeNum(earnings.benefits)
      + (exitFlowData.deductionOptions.includeAccruedLeave ? safeNum(earnings.accruedLeaveValue) : 0)
    const totalDeductionsNum = safeNum(deductions.paye) + safeNum(deductions.nhif) + safeNum(deductions.nssf)
      + safeNum(deductions.ahl) + safeNum(deductions.assetDeductions)
    const netPayNum = grossEarningsNum - totalDeductionsNum

    const finalPayrollPayload = {
      earnings: {
        grossEarnings: grossEarningsNum,
        proRatedSalary: safeNum(earnings.basicSalary),
        accruedLeaveValue: exitFlowData.deductionOptions.includeAccruedLeave ? safeNum(earnings.accruedLeaveValue) : 0
      },
      deductions: {
        paye: safeNum(deductions.paye),
        nhif: safeNum(deductions.nhif),
        nssf: safeNum(deductions.nssf),
        nssf_tier1: safeNum(deductions.nssf_tier1),
        nssf_tier2: safeNum(deductions.nssf_tier2),
        ahl: safeNum(deductions.ahl),
        outstandingLoan: safeNum(deductions.outstandingLoan),
        assetDeductions: safeNum(deductions.assetDeductions)
      },
      netPay: netPayNum,
      isProrated: Boolean(fe?.isProrated),
      prorataDetails: fe?.prorataDetails || null
    }

    const submitData = {
      exit_type: exitFlowData.exitDetails.exit_type,
      last_working_day: exitFlowData.exitDetails.last_working_day,
      official_exit_date: exitFlowData.exitDetails.official_exit_date,
      reason_for_exit: exitFlowData.exitDetails.reason_for_exit,
      clearance_status: exitFlowData.clearanceData,
      asset_returns: exitFlowData.assetData.assets,
      final_payroll: finalPayrollPayload,
      deduction_options: exitFlowData.deductionOptions
    }

    const response = await employeeService.processEmployeeExit(props.employee.id, {
      handler: '$fetch',
      secured: true,
      body: submitData
    }) as { success?: boolean; data?: { payroll_id?: string }; message?: string }

    if (response?.success && response?.data?.payroll_id) {
      toast.add({
        title: 'Employee exit processed successfully',
        color: 'success'
      })
      emit('success')
      isOpen.value = false
      await navigateTo(ROUTE_LIST.payroll.review.replace(':payrollId', String(response.data.payroll_id)))
    } else {
      toast.add({
        title: response?.message || 'Error processing exit',
        color: 'error'
      })
    }
  } catch (error: unknown) {
    toast.add({
      title: 'Error processing exit',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

function handleClose() {
  currentTab.value = 'exitDetails'
  Object.assign(exitFlowData.exitDetails, {
    exit_type: '',
    last_working_day: '',
    official_exit_date: '',
    reason_for_exit: ''
  })
  Object.assign(exitFlowData, {
    clearanceData: {},
    assetData: { assets: [] as unknown[] },
    payrollData: {},
    deductionOptions: {
      includeAssetDeductions: false,
      includeAccruedLeave: false
    }
  })
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="`Exit process — ${employee.full_name}`"
    :ui="{ content: 'sm:max-w-4xl' }"
  >
    <div class="space-y-4">
      <UTabs
        v-model="currentTab"
        :items="tabItems"
        :content="false"
      />
      <div class="max-h-[calc(100vh-300px)] min-h-64 overflow-y-auto p-1">
        <div v-show="currentTab === 'exitDetails'">
          <EmployeesExitDetails
            :employee="employee"
            :exit-details="exitFlowData.exitDetails"
            @update:exit-details="updateExitDetails"
          />
        </div>
        <div v-show="currentTab === 'clearanceChecklist'">
          <EmployeesClearanceChecklist
            :employee="employee"
            :clearance-data="exitFlowData.clearanceData"
            @update:clearance-data="updateClearanceData"
          />
        </div>
        <div v-show="currentTab === 'assetReturns'">
          <div v-if="assetsLoading" class="text-sm text-muted">
            Loading assets…
          </div>
          <EmployeesAssetManagement
            v-else
            :employee="employee"
            :asset-data="exitFlowData.assetData"
            @update:asset-data="updateAssetData"
          />
        </div>
        <div v-show="currentTab === 'finalPayroll'">
          <EmployeesFinalPayroll
            :employee="employee"
            :exit-details="exitFlowData.exitDetails"
            :asset-data="exitFlowData.assetData"
            :payroll-data="exitFlowData.payrollData"
            :deduction-options="exitFlowData.deductionOptions"
            @update:payroll-data="updatePayrollData"
            @update:deduction-options="updateDeductionOptions"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-3 border-t border-default pt-3">
        <UButton
          v-if="currentTab === 'exitDetails'"
          color="error"
          variant="soft"
          label="Cancel"
          icon="i-lucide-x"
          @click="handleClose"
        />
        <UButton
          v-else
          variant="soft"
          label="Previous"
          icon="i-lucide-arrow-left"
          @click="goToPreviousTab"
        />
        <div class="flex-1" />
        <UButton
          v-if="currentTab !== 'finalPayroll'"
          :label="currentTab === 'exitDetails' && !isCurrentTabValid ? 'Complete required fields' : 'Next'"
          :disabled="currentTab === 'exitDetails' && !isCurrentTabValid"
          :loading="loading"
          trailing-icon="i-lucide-arrow-right"
          @click="goToNextTab"
        />
        <UButton
          v-else
          color="success"
          label="Submit offboarding"
          icon="i-lucide-check"
          :loading="loading"
          @click="() => void handleSubmit()"
        />
      </div>
    </template>
  </UModal>
</template>
