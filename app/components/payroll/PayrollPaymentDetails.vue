<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { EmpCoverageItem } from '~/types/payroll'
import { companyService } from '~~/services/company.service'

const { toDDMMYYYY } = usePayrollDates()
const payrollStore = usePayrollStore()

const props = withDefaults(
  defineProps<{
    coverageReport?: Record<string, unknown>
  }>(),
  {
    coverageReport: () => ({})
  },
)

const emit = defineEmits<{
  back: []
}>()

onMounted(() => {
  const period = (props.coverageReport as { period?: { from_date?: string, to_date?: string } })?.period
  if (period?.from_date && period?.to_date) {
    payrollStore.setCurrentPeriod(period.from_date, period.to_date)
  }
})

const formattedPeriod = computed(() => {
  const period = (props.coverageReport as { period?: { from_date?: string, to_date?: string } })?.period
  if (!period?.from_date || !period?.to_date) {
    return 'Payroll period '
  }
  const from = toDDMMYYYY(period.from_date)
  const to = toDDMMYYYY(period.to_date)
  return `Payroll period: ${from} – ${to} coverage report`
})

const {
  data: departmentsRes,
  status: statusDepartments,
  refresh: getDepartments,
} = await companyService.fetchDepartments() as {
  data: Ref<unknown>
  status: Ref<string>
  refresh: () => Promise<void>
}

const loadingDepartments = computed(() => statusDepartments.value === 'pending')

const departmentList = computed(() => {
  const raw = departmentsRes.value
  if (Array.isArray(raw)) {
    return raw as { name?: string }[]
  }
  const obj = raw as { results?: unknown[], data?: unknown[] } | null
  const list = obj?.results ?? obj?.data
  return Array.isArray(list) ? list as { name?: string }[] : []
})

const detailTab = ref('included')
const detailTabItems = [
  { label: 'Included employees', value: 'included', icon: 'i-lucide-users' },
  { label: 'Excluded employees', value: 'excluded', icon: 'i-lucide-user-x' },
]

const columns: TableColumn<EmpCoverageItem>[] = [
  { id: 'count', header: '#' },
  { accessorKey: 'name', header: 'Employee name' },
  { accessorKey: 'department', header: 'Department' },
  { accessorKey: 'position', header: 'Position' },
  { accessorKey: 'salary', header: 'Salary' },
  { id: 'action', header: 'Actions' },
]

const manualExclusions = computed(() => {
  const exclusions = payrollStore.employeesExcludedByPeriod[payrollStore.currentPeriodKey] || []
  return new Set(exclusions)
})

const manualInclusions = computed(() => {
  const inclusions = payrollStore.employeesManuallyIncludedByPeriod[payrollStore.currentPeriodKey] || []
  return new Set(inclusions)
})

const includedEmployees = computed((): EmpCoverageItem[] => {
  const allIncluded = (props.coverageReport?.employees as { included?: EmpCoverageItem[], excluded?: EmpCoverageItem[] } | undefined)?.included || []
  const allExcluded = (props.coverageReport?.employees as { excluded?: EmpCoverageItem[] } | undefined)?.excluded || []
  const exclusions = manualExclusions.value
  const inclusions = manualInclusions.value
  const fromBackendIncluded = allIncluded.filter(emp => !exclusions.has(emp.id))
  const fromBackendExcluded = allExcluded.filter(emp => inclusions.has(emp.id))
  return [...fromBackendIncluded, ...fromBackendExcluded]
})

const excludedEmployees = computed((): EmpCoverageItem[] => {
  const allIncluded = (props.coverageReport?.employees as { included?: EmpCoverageItem[] } | undefined)?.included || []
  const allExcluded = (props.coverageReport?.employees as { excluded?: EmpCoverageItem[] } | undefined)?.excluded || []
  const exclusions = manualExclusions.value
  const inclusions = manualInclusions.value
  const manuallyExcluded = allIncluded.filter(emp => exclusions.has(emp.id))
  const systemExcluded = allExcluded.filter(emp => !inclusions.has(emp.id))
  return [...systemExcluded, ...manuallyExcluded]
})

const searchQuery = ref('')
const selectedDepartment = ref('')

const filteredIncludedEmployees = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return includedEmployees.value.filter((emp) => {
    const hay = [emp?.name, emp?.employee_number, emp?.position, emp?.department].filter(Boolean).join(' ').toLowerCase()
    const matchesSearch = !q || hay.includes(q)
    const matchesDept = !selectedDepartment.value || emp?.department === selectedDepartment.value
    return matchesSearch && matchesDept
  })
})

const filteredExcludedEmployees = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return excludedEmployees.value.filter((emp) => {
    const hay = [emp?.name, emp?.employee_number, emp?.position, emp?.department].filter(Boolean).join(' ').toLowerCase()
    const matchesSearch = !q || hay.includes(q)
    const matchesDept = !selectedDepartment.value || emp?.department === selectedDepartment.value
    return matchesSearch && matchesDept
  })
})

function resetFilters() {
  searchQuery.value = ''
  selectedDepartment.value = ''
}

function formatNumber(num: unknown) {
  const n = Number(num)
  if (Number.isNaN(n)) {
    return '--'
  }
  return new Intl.NumberFormat('en-KE', { maximumFractionDigits: 2 }).format(n)
}

function goEmployee(row: EmpCoverageItem) {
  void navigateTo(`/employees/${row.id}`)
}

function excludeEmployee(row: EmpCoverageItem) {
  payrollStore.removeManualInclusion(row.id)
  payrollStore.addManualExclusion(row.id)
}

function includeEmployee(row: EmpCoverageItem) {
  const backendExcluded = (props.coverageReport?.employees as { excluded?: EmpCoverageItem[] } | undefined)?.excluded || []
  const isSystemExcluded = backendExcluded.some(emp => emp.id === row.id)
  if (isSystemExcluded) {
    payrollStore.addManualInclusion(row.id)
  }
  else {
    payrollStore.removeManualExclusion(row.id)
  }
}

onMounted(() => {
  void getDepartments()
})

defineExpose({
  includedEmployees,
  excludedEmployees,
  filteredIncludedEmployees,
  filteredExcludedEmployees,
  searchQuery,
  selectedDepartment,
  resetFilters,
})
</script>

<template>
  <UCard>
    <template #header>
      <UButton
        variant="link"
        class="mb-4"
        icon="i-lucide-chevron-left"
        label="Back"
        @click="emit('back')"
      />
      <h2 class="text-xl font-semibold text-highlighted mb-4">
        {{ formattedPeriod }}
      </h2>
    </template>

    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div class="flex gap-4">
        <div class="flex items-center gap-3 p-3 rounded-lg border border-info/30 bg-info/5 min-w-[140px]">
          <UIcon name="i-lucide-users" class="size-6 text-info" aria-hidden="true" />
          <div>
            <div class="text-xs font-medium text-muted">Included</div>
            <div class="text-lg font-bold text-info">
              {{ includedEmployees.length }}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 rounded-lg border border-error/30 bg-error/5 min-w-[140px]">
          <UIcon name="i-lucide-user-x" class="size-6 text-error" aria-hidden="true" />
          <div>
            <div class="text-xs font-medium text-muted">Excluded</div>
            <div class="text-lg font-bold text-error">
              {{ excludedEmployees.length }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 items-center">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Search employees…"
          aria-label="Search employees"
          class="min-w-[160px] flex-1"
          size="sm"
        />
        <USelect
          v-model="selectedDepartment"
          :loading="loadingDepartments"
          class="w-44 min-w-40"
          placeholder="All departments"
          value-key="value"
          label-key="label"
          :items="[
            { label: 'All departments', value: '' },
            ...departmentList.map(d => ({ label: d.name || '—', value: d.name || '' })),
          ]"
        />
        <UTooltip text="Reset filters">
          <UButton
            color="neutral"
            icon="i-lucide-filter-x"
            size="sm"
            :disabled="!searchQuery && !selectedDepartment"
            aria-label="Reset filters"
            @click="resetFilters"
          />
        </UTooltip>
      </div>
    </div>

    <UTabs
      v-model="detailTab"
      :items="detailTabItems"
      :content="false"
      class="w-full py-2"
    />

    <div v-show="detailTab === 'included'" class="mt-4">
      <UTable
        :data="filteredIncludedEmployees"
        :columns="columns"
        class="border border-default rounded-md"
      >
        <template #count-cell="{ row }">
          <span>{{ row.index + 1 }}.</span>
        </template>
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2">
            <UAvatar :alt="row.original.name" size="sm" />
            <div>
              <button
                type="button"
                class="text-primary hover:underline cursor-pointer capitalize text-left"
                @click="goEmployee(row.original)"
              >
                {{ row.original.name }}
              </button>
              <p class="text-sm text-muted">{{ row.original.employee_number }}</p>
            </div>
          </div>
        </template>
        <template #department-cell="{ row }">
          <span>{{ row.original?.department || '—' }}</span>
        </template>
        <template #position-cell="{ row }">
          <span>{{ row.original?.position || '—' }}</span>
        </template>
        <template #salary-cell="{ row }">
          <span>{{
            (row.original as { current_job_data?: { current_pay_info?: unknown } }).current_job_data?.current_pay_info === null
              ? '—'
              : formatNumber(row.original?.salary)
          }}</span>
        </template>
        <template #action-cell="{ row }">
          <UTooltip text="Exclude from payroll">
            <UButton
              icon="i-lucide-minus-circle"
              variant="ghost"
              color="error"
              @click="excludeEmployee(row.original)"
            />
          </UTooltip>
        </template>
      </UTable>
    </div>

    <div v-show="detailTab === 'excluded'" class="mt-4">
      <UTable
        :data="filteredExcludedEmployees"
        :columns="columns"
        class="border border-default rounded-md"
      >
        <template #count-cell="{ row }">
          <span>{{ row.index + 1 }}.</span>
        </template>
        <template #name-cell="{ row }">
          <div class="flex items-center gap-2">
            <UAvatar :alt="row.original.name" size="sm" />
            <div>
              <button
                type="button"
                class="text-primary hover:underline cursor-pointer capitalize text-left"
                @click="goEmployee(row.original)"
              >
                {{ row.original.name }}
              </button>
              <p class="text-sm text-muted">{{ row.original.employee_number }}</p>
            </div>
          </div>
        </template>
        <template #department-cell="{ row }">
          <span>{{ row.original?.department || '—' }}</span>
        </template>
        <template #position-cell="{ row }">
          <span>{{ row.original?.position || '—' }}</span>
        </template>
        <template #salary-cell="{ row }">
          <span>{{
            (row.original as { current_job_data?: { current_pay_info?: unknown } }).current_job_data?.current_pay_info === null
              ? '—'
              : formatNumber(row.original?.salary)
          }}</span>
        </template>
        <template #action-cell="{ row }">
          <UTooltip text="Include in payroll">
            <UButton
              icon="i-lucide-plus-circle"
              variant="ghost"
              color="success"
              @click="includeEmployee(row.original)"
            />
          </UTooltip>
        </template>
      </UTable>
    </div>
  </UCard>
</template>
