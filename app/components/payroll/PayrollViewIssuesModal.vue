<script setup lang="ts">
import { format } from 'date-fns'

interface EmployeeIssue {
  employee_id: string
  name: string
  issues: Array<{ issue_name: string }>
}

const props = defineProps<{
  isOpen: boolean
  issues: unknown[]
  fromDate?: string | null
  toDate?: string | null
  payDate?: string | null
  coverageReport?: Record<string, unknown> | null
}>()

const emit = defineEmits<{
  close: []
  'validation-changed': []
}>()

const payrollStore = usePayrollStore()
const toast = useToast()

const confirmExcludeAllOpen = ref(false)

const modalOpen = computed({
  get: () => props.isOpen,
  set: (v: boolean) => {
    if (!v) {
      emit('close')
    }
  }
})

onMounted(() => {
  if (props.fromDate && props.toDate) {
    payrollStore.setCurrentPeriod(props.fromDate, props.toDate)
  }
})

const manualExclusions = computed(() => {
  const key = payrollStore.currentPeriodKey
  const exclusions = payrollStore.employeesExcludedByPeriod[key] || []
  return new Set(exclusions)
})

const employeesWithIssues = computed(() => {
  const exclusions = manualExclusions.value
  return (props.issues || []).filter((emp: unknown) => {
    const e = emp as EmployeeIssue
    return !exclusions.has(e.employee_id)
  }) as EmployeeIssue[]
})

const excludedEmployeesFromIssues = computed(() => {
  const exclusions = manualExclusions.value
  return (props.issues || []).filter((emp: unknown) => {
    const e = emp as EmployeeIssue
    return exclusions.has(e.employee_id)
  }) as EmployeeIssue[]
})

function excludeEmployee(row: EmployeeIssue) {
  payrollStore.addManualExclusion(row.employee_id)
  emit('validation-changed')
}

function includeEmployee(row: EmployeeIssue) {
  payrollStore.removeManualExclusion(row.employee_id)
  emit('validation-changed')
}

function handleClose() {
  emit('close')
}

function requestExcludeAll() {
  confirmExcludeAllOpen.value = true
}

function confirmExcludeAll() {
  const allToExclude = [...employeesWithIssues.value]
  allToExclude.forEach(emp => excludeEmployee(emp))
  confirmExcludeAllOpen.value = false
  toast.add({ title: 'Employees excluded', color: 'success' })
}

function includeAll() {
  if (excludedEmployeesFromIssues.value.length === 0) {
    toast.add({ title: 'No employees to include', color: 'neutral' })
    return
  }
  const allToInclude = [...excludedEmployeesFromIssues.value]
  allToInclude.forEach(emp => includeEmployee(emp))
  toast.add({ title: 'Employees included', color: 'success' })
}
</script>

<template>
  <UModal
    v-model:open="modalOpen"
    title="Payroll issues"
    :ui="{ content: 'sm:max-w-4xl' }"
  >
    <div class="flex flex-col gap-3 p-1">
      <div class="rounded border border-primary/20 bg-primary/5 px-4 py-3">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div>
            <span class="text-muted">Period:</span>
            <span class="font-semibold text-highlighted ml-2">
              {{ fromDate ? format(new Date(fromDate), 'dd MMM') : 'N/A' }} – {{ toDate ? format(new Date(toDate), 'dd MMM') : 'N/A' }}
            </span>
          </div>
          <div>
            <span class="text-muted">Pay date:</span>
            <span class="font-semibold text-highlighted ml-2">
              {{ payDate ? format(new Date(payDate), 'dd MMM yyyy') : 'N/A' }}
            </span>
          </div>
        </div>
        <p class="text-xs text-primary border-t border-primary/20 pt-2 mt-2">
          <strong>Changes apply immediately</strong> — exclusions sync across all views.
        </p>
      </div>

      <UAlert
        color="error"
        variant="subtle"
        title="Payroll blockers"
        :description="`${employeesWithIssues.length} ${employeesWithIssues.length === 1 ? 'employee has' : 'employees have'} payroll issues. Exclude them or fix their profiles.`"
      />

      <div v-if="excludedEmployeesFromIssues.length > 0" class="rounded border border-warning/30 bg-warning/5 px-4 py-3">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-semibold text-highlighted">
            {{ excludedEmployeesFromIssues.length }} excluded
          </p>
          <UButton label="Include all" size="xs" variant="outline" icon="i-lucide-plus-circle" @click="includeAll" />
        </div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(employee, index) in excludedEmployeesFromIssues"
            :key="index"
            class="flex items-center bg-default border border-default rounded-full px-3.5 py-1.5"
          >
            <span class="text-sm font-medium text-highlighted">{{ employee.name }}</span>
            <UButton
              icon="i-lucide-plus"
              color="neutral"
              variant="ghost"
              size="xs"
              class="ml-2"
              @click="includeEmployee(employee)"
            />
          </div>
        </div>
      </div>

      <div class="border border-default rounded overflow-hidden">
        <div class="bg-muted/40 border-b border-default px-4 py-2 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h3 class="text-sm font-semibold text-highlighted">Employees with issues</h3>
            <span class="text-xs text-muted">{{ employeesWithIssues.length }} total</span>
          </div>
          <UButton
            label="Exclude all"
            size="xs"
            variant="ghost"
            color="error"
            icon="i-lucide-minus-circle"
            :disabled="employeesWithIssues.length === 0"
            @click="requestExcludeAll"
          />
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/40 border-b border-default">
              <tr>
                <th class="px-4 py-2 text-left font-semibold text-highlighted">Name</th>
                <th class="px-4 py-2 text-left font-semibold text-highlighted">Issues</th>
                <th class="px-4 py-2 text-right font-semibold text-highlighted w-28">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-for="row in employeesWithIssues" :key="row.employee_id" class="hover:bg-muted/20">
                <td class="px-4 py-2 font-medium text-highlighted">{{ row.name }}</td>
                <td class="px-4 py-2">
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="(issue, idx) in row.issues"
                      :key="idx"
                      class="inline-block bg-error/10 text-error text-xs px-2 py-1 rounded capitalize"
                    >
                      {{ issue.issue_name }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-2 text-right">
                  <div class="flex justify-end gap-1">
                    <UButton
                      icon="i-lucide-wrench"
                      size="xs"
                      variant="ghost"
                      color="primary"
                      :to="`/employees/${row.employee_id}`"
                    />
                    <UButton
                      icon="i-lucide-minus-circle"
                      size="xs"
                      variant="ghost"
                      color="error"
                      @click="excludeEmployee(row)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Close" color="neutral" variant="outline" @click="handleClose" />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="confirmExcludeAllOpen" title="Exclude all employees?">
    <p class="text-sm text-muted">
      This will exclude every employee with issues from this payroll run.
    </p>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" label="Cancel" @click="confirmExcludeAllOpen = false" />
        <UButton color="error" label="Yes, exclude all" @click="confirmExcludeAll" />
      </div>
    </template>
  </UModal>
</template>
