<script setup lang="ts">
import { employeeService } from '~~/services/employee.service'

const route = useRoute()
const router = useRouter()
const payrollStore = usePayrollStore()

const { data: employee, status, refresh: getEmployee }: Record<string, any> = await employeeService.getEmployee(String(route.params.id))
const loading = computed(() => status.value === 'pending')
const activeSection = ref<'deductions' | 'extra-pay'>('deductions')
const rerunPayrollId = computed(() => {
  const s = payrollStore as { payslipToView?: { payroll?: { id?: string } }, payrollId?: string }
  return String(s.payslipToView?.payroll?.id || s.payrollId || '')
})

const employeeName = computed(() => employee.value?.user?.full_name || 'Employee')
const employeeRole = computed(() =>
  employee.value?.current_job_data?.position?.job_title
  || employee.value?.current_job_data?.department?.name
  || ''
)
const employeeNumber = computed(() => employee.value?.employee_number || '')
const employeePaySummary = computed(() => {
  const salary = employee.value?.current_job_data?.current_pay_info?.basic_salary
  if (salary) return `KES ${formatNumber(salary)}`
  return employeeNumber.value
})

const sectionOptions = [
  {
    key: 'deductions',
    label: 'Deductions',
    shortLabel: 'Deductions',
    description: 'Adjust recurring, till-paid, advance, and custom deductions.',
    icon: 'i-heroicons-scissors'
  },
  {
    key: 'extra-pay',
    label: 'Extra Pay',
    shortLabel: 'Extra Pay',
    description: 'Adjust bonuses, allowances, and one-off additions.',
    icon: 'i-heroicons-banknotes'
  }
] as const

const activeSectionOption = computed(() =>
  sectionOptions.find(option => option.key === activeSection.value) ?? sectionOptions[0]
)

onMounted(() => {
  getEmployee()
})
</script>

<template>
  <div class="space-y-5">
    <LoadingIndicator v-if="loading" classes="w-full m-auto" />

    <div v-else class="space-y-5">
      <div class="flex items-center justify-between gap-3">
        <UButton
          @click="router.back()"
          variant="ghost"
          icon="i-heroicons-chevron-left"
          label="Payroll Details"
        />

        <div class="flex items-center gap-2">
          <UButton
            v-if="rerunPayrollId"
            @click="navigateTo(`/payroll/${rerunPayrollId}/rerun`)"
            variant="ghost"
            color="neutral"
            class="rounded-full px-4"
            icon="i-heroicons-arrow-path"
            label="Rerun Payroll"
          />

          <UButton
            @click="navigateTo(`/employees/${route.params.id}`)"
            variant="outline"
            color="neutral"
            class="rounded-full px-4"
          >
            <span>Employee Profile</span>
            <UIcon name="i-heroicons-arrow-top-right-on-square" class="h-4 w-4" />
          </UButton>
        </div>
      </div>

      <UCard class="bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div class="flex flex-col gap-4">
          <div class="flex items-start gap-4">
            <UAvatar
              size="xl"
              :src="employee?.user?.profile_pic ?? undefined"
              :alt="employeeName"
              class="ring-2 ring-white shadow-sm"
            />

            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Payroll adjustments</p>
              <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{{ employeeName }}</h1>
              <p v-if="employeeRole || employeePaySummary" class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                <span v-if="employeeRole">{{ employeeRole }}</span>
                <span v-if="employeeRole && employeePaySummary" class="text-slate-300">•</span>
                <span v-if="employeePaySummary" class="font-medium text-slate-700">{{ employeePaySummary }}</span>
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-2">
              <UIcon name="i-heroicons-information-circle" class="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
              <p>Changes here affect payroll inputs only. Rerun payroll to update the payslip.</p>
            </div>

            <UButton
              v-if="rerunPayrollId"
              @click="navigateTo(`/payroll/${rerunPayrollId}/rerun`)"
              variant="link"
              color="info"
              class="px-0 sm:self-auto"
              label="Go to rerun"
            />
          </div>
        </div>
      </UCard>

      <div class="space-y-3">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Choose what to update</h2>
          <p class="mt-1 text-sm text-slate-600">Make your changes, then rerun payroll once you are done.</p>
        </div>

        <div class="inline-flex w-full rounded-2xl border border-slate-200 bg-white p-1 shadow-sm md:w-auto">
          <button
            v-for="option in sectionOptions"
            :key="option.key"
            type="button"
            class="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all md:flex-initial"
            :class="activeSection === option.key
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
            @click="activeSection = option.key"
          >
            <UIcon :name="option.icon" class="h-4 w-4" />
            <span>{{ option.shortLabel }}</span>
          </button>
        </div>
      </div>

      <UCard class="bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div class="mb-5 border-b border-slate-200 pb-4">
          <div>
            <h3 class="text-xl font-semibold text-slate-900">{{ activeSectionOption.label }}</h3>
            <p class="mt-1 text-sm text-slate-600">{{ activeSectionOption.description }}</p>
          </div>
        </div>

        <div v-if="activeSection === 'deductions'">
          <EmployeeDeductions
            :employee-id="String(route.params.id)"
            :data-from="'payslip'"
            :hide-processing-note="true"
          />
        </div>

        <div v-else>
          <EmployeeExtraPay :employee-id="String(route.params.id)" :data-from="'payslip'" />
        </div>
      </UCard>
    </div>
  </div>
</template>
