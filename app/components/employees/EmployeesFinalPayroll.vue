<script setup lang="ts">
import { employeeService } from '~~/services/employee.service'
const props = defineProps<{
  employee: { id: string; full_name: string }
  exitDetails: any
  assetData: any
  payrollData: any
  deductionOptions: any
}>()

const emit = defineEmits(['update:payrollData', 'update:deductionOptions'])

const localDeductionOptions = ref({
  includeAssetDeductions: !!props?.deductionOptions?.includeAssetDeductions,
  includeAccruedLeave: !!props?.deductionOptions?.includeAccruedLeave
})
const payrollData = ref({
  earnings: {
    basicSalary: 0,
    benefits: 0,
    accruedLeaveValue: 0
  },
  deductions: {
    paye: 0,
    nhif: 0,
    nssf: 0,
    nssf_tier1: 0,
    nssf_tier2: 0,
    ahl: 0,
    assetDeductions: 0,
    outstandingLoan: 0,
  },
  isProrated: false
})

const prorataDetails = ref<any>(null)

const safeNumber = (value: any) => {
  const num = Number(value) || 0
  return isNaN(num) ? 0 : num
}

const isReady = computed(() => {
  return !!(props.exitDetails?.exit_type && props.exitDetails?.last_working_day && props.exitDetails?.official_exit_date)
})

const mapPreviewToState = (res: any) => {
  const payload = (res && typeof res === 'object' && 'data' in res) ? (res as any).data : res
  const e = payload?.earnings || {}
  const d = payload?.deductions || {}
  payrollData.value.earnings.basicSalary = safeNumber(e.prorated_salary)
  payrollData.value.earnings.accruedLeaveValue = safeNumber(e.accrued_leave_value)
  payrollData.value.earnings.benefits = safeNumber(e.benefits)
  payrollData.value.deductions.paye = safeNumber(d.paye)
  payrollData.value.deductions.nhif = safeNumber(d.nhif)
  payrollData.value.deductions.nssf = safeNumber(d.nssf)
  payrollData.value.deductions.nssf_tier1 = safeNumber(d.nssf_tier1)
  payrollData.value.deductions.nssf_tier2 = safeNumber(d.nssf_tier2)
  payrollData.value.deductions.ahl = safeNumber(d.ahl)
  payrollData.value.deductions.assetDeductions = safeNumber(d.asset_deductions)
  payrollData.value.isProrated = !!payload?.is_prorated
  ;(payrollData.value as any).prorataDetails = payload?.prorata_details || null
  prorataDetails.value = payload?.prorata_details || null
  emit('update:payrollData', payrollData.value)
}

const loadingPreview = ref(false)
const previewError = ref<string | null>(null)
let debounceId: ReturnType<typeof setTimeout> | null = null

const buildPreviewPayload = () => {
  const lostOrDamaged = (props.assetData?.assets || [])
    .filter((a: any) => ['lost', 'damaged'].includes(a.exitStatus))
    .map((a: any) => ({
      status: a.exitStatus,
      amount: safeNumber(a.amount),
      serial_number: a.serial_number || undefined,
    }))

  const exitPayload = {
    exit_type: props.exitDetails?.exit_type,
    last_working_day: props.exitDetails?.last_working_day,
    official_exit_date: props.exitDetails?.official_exit_date,
    reason_for_exit: props.exitDetails?.reason_for_exit,
  }

  return {
    ...exitPayload,
    exitDetails: exitPayload,
    asset_returns: lostOrDamaged,
    deduction_options: {
      include_asset_deductions: localDeductionOptions.value.includeAssetDeductions,
      include_accrued_leave: localDeductionOptions.value.includeAccruedLeave,
    },
    preview: true,
  }
}

const runPreview = async () => {
  if (!isReady.value) return
  previewError.value = null
  try {
    loadingPreview.value = true
    const payload = buildPreviewPayload()
    const res: any = await employeeService.previewEmployeeExit((props.employee as any)?.id, {
      handler: '$fetch',
      body: payload,
    })
    mapPreviewToState(res)
  } catch (err: any) {
    previewError.value = err?.message || 'Failed to preview payroll'
  } finally {
    loadingPreview.value = false
  }
}

const schedulePreview = () => {
  if (debounceId) clearTimeout(debounceId)
  debounceId = setTimeout(() => runPreview(), 700)
}

watch(
  () => [props.exitDetails, props.assetData, localDeductionOptions.value],
  () => {
    if (!isReady.value) return
    schedulePreview()
  },
  { deep: true, immediate: false }
)

onMounted(() => {
  if (isReady.value) schedulePreview()
})

const handleDeductionChange = () => {
  emit('update:deductionOptions', localDeductionOptions.value)
  if (isReady.value) schedulePreview()
}

const grossEarnings = computed(() => {
  return safeNumber(payrollData.value.earnings.basicSalary) +
         safeNumber(payrollData.value.earnings.benefits) +
         (localDeductionOptions.value.includeAccruedLeave ? safeNumber(payrollData.value.earnings.accruedLeaveValue) : 0)
})

const totalDeductions = computed(() => {
  return safeNumber(payrollData.value.deductions.paye) +
         safeNumber(payrollData.value.deductions.nhif) +
         safeNumber(payrollData.value.deductions.nssf) +
         safeNumber(payrollData.value.deductions.ahl) +
         safeNumber(payrollData.value.deductions.assetDeductions) +
         safeNumber((payrollData.value.deductions as any).outstandingLoan || 0)
})

const netPay = computed(() => {
  return grossEarnings.value - totalDeductions.value
})

const assetDeductionLabel = computed(() => {
  const lostAssets = (props.assetData?.assets || [])
    .filter((a: any) => ['lost', 'damaged'].includes(String(a.exitStatus || '').toLowerCase()))
  
  if (lostAssets.length === 0) return 'Asset Deductions'
  const assetNames = lostAssets.map((a: any) => {
    const name = a?.name || a?.asset_name || a?.item_name || a?.asset?.name || a?.asset?.asset_name || ''

    if (name && name.trim() && name.trim().toLowerCase() !== 'asset') {
      return name.trim()
    }
    return a?.description?.trim() || null
  }).filter(Boolean)
  
  if (assetNames.length === 0) {
    return 'Asset Deductions'
  } else if (assetNames.length === 1) {
    return `Asset Deduction (${assetNames[0]})`
  } else {
    const nameList = assetNames.join(', ')
    return `Asset Deductions (${nameList})`
  }
})

const prorataDaysText = computed(() => {
  const pd = prorataDetails.value || {}
  const dw = pd.days_worked ?? pd.daysWorked
  const td = pd.total_days_in_month ?? pd.total_days
  if (typeof dw === 'number' && typeof td === 'number' && td > 0) {
    return `${dw}/${td} days`
  }
  return ''
})
</script>

<template>
  <div class="space-y-6">
    <UAlert v-if="!isReady" color="warning" variant="soft">
      <template #title>
        Fill Exit Details (Exit Type, Last Working Day, Official Exit Date) to see the payroll preview.
      </template>
    </UAlert>

    <UAlert v-else color="info" variant="soft">
      <template #title>
        This is an automated calculation based on the employee's last working day and clearance details. Review carefully before finalizing.
      </template>
    </UAlert>

    <UAlert v-if="previewError" color="error" variant="soft">
      <template #title>{{ previewError }}</template>
    </UAlert>

    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Payroll Options</h3>
      </template>
      <div class="space-y-3">
        <label class="flex items-center gap-2">
          <UCheckbox v-model="localDeductionOptions.includeAssetDeductions" @update:modelValue="handleDeductionChange" />
          <span>Include asset deductions for lost/damaged items</span>
        </label>
      </div>
    </UCard>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Earnings</h3>
        </template>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>
              Pro-rated Salary
              <span v-if="prorataDaysText">({{ prorataDaysText }})</span>
            </span>
            <span>{{ payrollData.earnings.basicSalary.toFixed(2) }}</span>
          </div>
          <div class="border-t pt-2 font-semibold flex justify-between">
            <span>Gross Earnings</span>
            <span>{{ grossEarnings.toFixed(2) }}</span>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Deductions</h3>
        </template>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>PAYE (Tax)</span>
            <span>- {{ payrollData.deductions.paye.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>NHIF</span>
            <span>- {{ payrollData.deductions.nhif.toFixed(2) }}</span>
          </div>
          <div v-if="payrollData.deductions.ahl > 0" class="flex justify-between">
            <span>AHL (Affordable Housing Levy)</span>
            <span>- {{ payrollData.deductions.ahl.toFixed(2) }}</span>
          </div>
          <div v-if="(payrollData.deductions as any).outstandingLoan && (payrollData.deductions as any).outstandingLoan > 0" class="flex justify-between">
            <span>Outstanding Loan Balance</span>
            <span>- {{ (payrollData.deductions as any).outstandingLoan.toFixed(2) }}</span>
          </div>
          <div v-if="payrollData.deductions.assetDeductions > 0" class="flex justify-between">
            <span>{{ assetDeductionLabel }}</span>
            <span>- {{ payrollData.deductions.assetDeductions.toFixed(2) }}</span>
          </div>
          <div class="border-t pt-2 font-semibold flex justify-between">
            <span>Total Deductions</span>
            <span class="text-red-600">- {{ totalDeductions.toFixed(2) }}</span>
          </div>
        </div>
      </UCard>
    </div>

    <UCard class="bg-blue-50">
      <div class="flex justify-between items-center text-xl font-bold">
        <span>Net Final Pay</span>
        <span>{{ netPay.toFixed(2) }}</span>
      </div>
    </UCard>
  </div>
</template>
