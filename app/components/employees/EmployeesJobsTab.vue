<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { Employee, EmployeeJobRow, IEmployeeJob, IPosition } from '~/types/employee'
import { employeeService } from '~~/services/employee.service'
import { urlParamsExtensionUtil } from '~/utils/urlParams'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  employee: Employee
}>()

const emit = defineEmits<{
  refresh: []
}>()

const { isBaseLevelEmployee, isAdmin } = useRolePermissionGuard()
const toast = useToast()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UBadge = resolveComponent('UBadge')

function unwrapArray(res: unknown): unknown[] {
  if (Array.isArray(res)) return res
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>
    if (Array.isArray(r.results)) return r.results
    if (Array.isArray(r.data)) return r.data as unknown[]
    const d = r.data as Record<string, unknown> | undefined
    if (d && Array.isArray(d.results)) return d.results
  }
  return []
}

function fmtDate(v: string | undefined) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

function fmtMoney(v: unknown) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
}

const employeeId = computed(() => String(props.employee?.id ?? ''))

const loadingJobs = ref(false)
const loadingPay = ref(false)
const employeeJobs = ref<IEmployeeJob[]>([])
const payInfo = ref<Record<string, unknown>[]>([])

const showAddJob = ref(false)
const jobSaving = ref(false)
const selectedDepartmentId = ref<string | number | undefined>(undefined)
const selectedPositionId = ref<string | number | undefined>(undefined)

const jobForm = reactive({
  hire_date: '',
  end_date: '',
  location: '',
  is_current: false
})

function onDeptPos(_dept: unknown, pos: IPosition) {
  selectedPositionId.value = pos.id
}

watch(showAddJob, (v) => {
  if (!v) return
  jobForm.hire_date = ''
  jobForm.end_date = ''
  jobForm.location = ''
  jobForm.is_current = false
  selectedDepartmentId.value = undefined
  selectedPositionId.value = undefined
})

async function loadJobs() {
  if (!employeeId.value) return
  loadingJobs.value = true
  try {
    const q = urlParamsExtensionUtil({ employee_id: employeeId.value })
    const res = await employeeService.getEmployeeJobs(q || `?employee_id=${employeeId.value}`, {
      handler: '$fetch',
      secured: true
    })
    employeeJobs.value = unwrapArray(res) as IEmployeeJob[]
  } catch (error: unknown) {
    toast.add({
      title: 'Unable to load jobs',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
    employeeJobs.value = []
  } finally {
    loadingJobs.value = false
  }
}

async function loadPayInfo() {
  if (!employeeId.value) return
  loadingPay.value = true
  try {
    const q = urlParamsExtensionUtil({ employee_id: employeeId.value })
    const res = await employeeService.getPayInfo(q || `?employee_id=${employeeId.value}`, {
      handler: '$fetch',
      secured: true
    })
    payInfo.value = unwrapArray(res) as Record<string, unknown>[]
  } catch (error: unknown) {
    toast.add({
      title: 'Unable to load pay info',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
    payInfo.value = []
  } finally {
    loadingPay.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadJobs(), loadPayInfo()])
})

async function refreshAll() {
  await Promise.all([loadJobs(), loadPayInfo()])
  emit('refresh')
}

async function submitNewJob() {
  if (!selectedDepartmentId.value || !selectedPositionId.value) {
    toast.add({ title: 'Select department and position', color: 'warning' })
    return
  }
  jobSaving.value = true
  try {
    await employeeService.addEmployeeJob({
      handler: '$fetch',
      secured: true,
      body: {
        employee: employeeId.value,
        department: selectedDepartmentId.value,
        position: selectedPositionId.value,
        hire_date: jobForm.hire_date || null,
        end_date: jobForm.is_current ? null : (jobForm.end_date || null),
        location: jobForm.location || null,
        is_current: jobForm.is_current
      }
    })
    toast.add({ title: 'Job added', color: 'success' })
    showAddJob.value = false
    await refreshAll()
  } catch (error: unknown) {
    toast.add({
      title: 'Unable to add job',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    jobSaving.value = false
  }
}

const showUpdateJob = ref(false)
const selectedJob = ref<EmployeeJobRow | null>(null)

const showUpdatePay = ref(false)
const selectedPay = ref<Record<string, unknown> | null>(null)

const showAddComp = ref(false)
const compJob = ref<IEmployeeJob | null>(null)

const currentJobs = computed(() => employeeJobs.value.filter(j => j.is_current))
const currentJobTitle = computed(() => currentJobs.value[0]?.position?.job_title ?? 'Current job')
const currentJobId = computed(() => String(currentJobs.value[0]?.id ?? ''))

function getJobTitle(jobRef: unknown): string {
  const id = Number(jobRef)
  if (!Number.isFinite(id)) return '—'
  const j = employeeJobs.value.find(x => Number(x.id) === id)
  return j?.position?.job_title ?? '—'
}

function openEditJob(row: IEmployeeJob) {
  if (row.id == null) {
    toast.add({ title: 'This job cannot be edited (missing id).', color: 'error' })
    return
  }
  selectedJob.value = {
    ...row,
    id: row.id,
    employee: { id: employeeId.value },
    employment_status: (row as Record<string, unknown>).employment_status as string | undefined
  }
  showUpdateJob.value = true
}

function openEditPay(row: Record<string, unknown>) {
  selectedPay.value = row
  showUpdatePay.value = true
}

function openAddComp(row: IEmployeeJob) {
  compJob.value = row
  showAddComp.value = true
}

const jobDeleteOpen = ref(false)
const jobToDelete = ref<IEmployeeJob | null>(null)

const payDeleteOpen = ref(false)
const payToDelete = ref<Record<string, unknown> | null>(null)

async function confirmDeleteJob() {
  const row = jobToDelete.value
  if (!row?.id) return
  try {
    await employeeService.deleteJob(String(row.id), { handler: '$fetch', secured: true })
    toast.add({ title: 'Job deleted', color: 'success' })
    jobDeleteOpen.value = false
    jobToDelete.value = null
    await refreshAll()
  } catch (error: unknown) {
    toast.add({
      title: 'Delete failed',
      description: parseApiError(error, 'Unable to delete job.'),
      color: 'error'
    })
  }
}

async function confirmDeletePay() {
  const row = payToDelete.value
  if (!row?.id) return
  try {
    await employeeService.deleteCompensation(String(row.id), { handler: '$fetch', secured: true })
    toast.add({ title: 'Compensation removed', color: 'success' })
    payDeleteOpen.value = false
    payToDelete.value = null
    await loadPayInfo()
    emit('refresh')
  } catch (error: unknown) {
    toast.add({
      title: 'Delete failed',
      description: parseApiError(error, 'Unable to delete compensation.'),
      color: 'error'
    })
  }
}

function jobRowActions(row: IEmployeeJob) {
  if (isBaseLevelEmployee.value) return []
  return [[
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => openEditJob(row)
    },
    {
      label: 'Add compensation',
      icon: 'i-lucide-plus',
      onSelect: () => openAddComp(row)
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      onSelect: () => {
        jobToDelete.value = row
        jobDeleteOpen.value = true
      }
    }
  ]]
}

function payRowActions(row: Record<string, unknown>) {
  if (!isAdmin.value) return []
  return [[
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect: () => openEditPay(row)
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      onSelect: () => {
        payToDelete.value = row
        payDeleteOpen.value = true
      }
    }
  ]]
}

const jobColumns = computed<TableColumn<IEmployeeJob>[]>(() => {
  const base: TableColumn<IEmployeeJob>[] = [
    {
      accessorKey: 'position',
      header: 'Job title',
      cell: ({ row }) => {
        const title = row.original.position?.job_title ?? '—'
        return h('div', { class: 'flex items-center gap-2' }, [
          h('span', title),
          row.original.is_current
            ? h(UBadge, { color: 'primary', variant: 'subtle' }, () => 'Current')
            : null
        ])
      }
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => row.original.position?.department?.name ?? '—'
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => row.original.location ?? '—'
    },
    {
      accessorKey: 'hire_date',
      header: 'Start date',
      cell: ({ row }) => fmtDate(row.original.hire_date)
    },
    {
      accessorKey: 'end_date',
      header: 'End date',
      cell: ({ row }) => fmtDate(row.original.end_date ?? undefined)
    }
  ]
  if (!isBaseLevelEmployee.value) {
    base.push({
      id: 'actions',
      cell: ({ row }) =>
        h(
          'div',
          { class: 'text-end' },
          h(
            UDropdownMenu,
            { items: jobRowActions(row.original), content: { align: 'end' } },
            () =>
              h(UButton, {
                icon: 'i-lucide-ellipsis-vertical',
                color: 'neutral',
                variant: 'ghost',
                square: true
              })
          )
        )
    })
  }
  return base
})

const payColumns = computed<TableColumn<Record<string, unknown>>[]>(() => {
  const base: TableColumn<Record<string, unknown>>[] = [
    {
      accessorKey: 'job',
      header: 'Job',
      cell: ({ row }) => getJobTitle(row.original.job)
    },
    {
      accessorKey: 'effective_date',
      header: 'Effective date',
      cell: ({ row }) => fmtDate(String(row.original.effective_date ?? ''))
    },
    {
      accessorKey: 'basic_salary',
      header: 'Pay rate',
      cell: ({ row }) => fmtMoney(row.original.basic_salary)
    },
    {
      accessorKey: 'pay_frequency',
      header: 'Frequency',
      cell: ({ row }) => String(row.original.pay_frequency ?? '—')
    },
    {
      accessorKey: 'change_reason',
      header: 'Change reason',
      cell: ({ row }) => String(row.original.change_reason ?? '—')
    }
  ]
  if (isAdmin.value) {
    base.push({
      id: 'actions',
      cell: ({ row }) =>
        h(
          'div',
          { class: 'text-end' },
          h(
            UDropdownMenu,
            { items: payRowActions(row.original), content: { align: 'end' } },
            () =>
              h(UButton, {
                icon: 'i-lucide-ellipsis-vertical',
                color: 'neutral',
                variant: 'ghost',
                square: true
              })
          )
        )
    })
  }
  return base
})

</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-end gap-2">
      <UButton
        v-if="!isBaseLevelEmployee"
        icon="i-lucide-plus"
        label="Add job"
        @click="showAddJob = !showAddJob"
      />
      <UButton
        icon="i-lucide-refresh-cw"
        variant="outline"
        label="Refresh"
        :loading="loadingJobs || loadingPay"
        @click="() => void refreshAll()"
      />
    </div>

    <UCard v-if="showAddJob && !isBaseLevelEmployee">
      <template #header>
        <span class="font-medium">New job</span>
      </template>
      <div class="space-y-4">
        <EmployeesDepartmentPosition
          @selected-department="(d) => { selectedDepartmentId = d.id }"
          @selected-position="(p) => { selectedPositionId = p.id }"
        />
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Hire date">
            <UInput v-model="jobForm.hire_date" type="date" />
          </UFormField>
          <UFormField v-if="!jobForm.is_current" label="End date">
            <UInput v-model="jobForm.end_date" type="date" />
          </UFormField>
        </div>
        <UCheckbox v-model="jobForm.is_current" label="Is current job" />
        <UFormField label="Location">
          <UInput v-model="jobForm.location" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="showAddJob = false" />
          <UButton label="Save job" :loading="jobSaving" @click="() => void submitNewJob()" />
        </div>
      </div>
    </UCard>

    <div>
      <h3 class="mb-2 text-lg font-medium">
        Jobs
      </h3>
      <UTable
        :data="employeeJobs"
        :columns="jobColumns"
        :loading="loadingJobs"
        class="shrink-0"
      />
    </div>

    <div>
      <h3 class="mb-2 text-lg font-medium">
        Compensation
      </h3>
      <UTable
        :data="payInfo"
        :columns="payColumns"
        :loading="loadingPay"
        class="shrink-0"
      />
    </div>

    <EmployeesUpdateJobModal
      v-model:open="showUpdateJob"
      :job="selectedJob"
      @success="() => void refreshAll()"
    />

    <EmployeesUpdatePayInfoModal
      v-model:open="showUpdatePay"
      :pay-info="selectedPay ?? {}"
      :employee-id="employeeId"
      @success="() => void loadPayInfo()"
    />

    <EmployeesAddCompensation
      v-model:open="showAddComp"
      :employee-id="employeeId"
      :job-id="String(compJob?.id ?? currentJobId)"
      :job-name="compJob?.position?.job_title ?? currentJobTitle"
      @success="() => void refreshAll()"
    />

    <UModal
      v-model:open="jobDeleteOpen"
      title="Delete job?"
      description="This action cannot be undone."
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="jobDeleteOpen = false" />
          <UButton color="error" label="Delete" @click="() => void confirmDeleteJob()" />
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="payDeleteOpen"
      title="Delete compensation record?"
      description="This action cannot be undone."
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="payDeleteOpen = false" />
          <UButton color="error" label="Delete" @click="() => void confirmDeletePay()" />
        </div>
      </template>
    </UModal>
  </div>
</template>
