<script setup lang="ts">
import { unref } from 'vue'
import { employeeService } from '~~/services/employee.service'
import { ROUTE_LIST } from '~/constants/routeList'
import { parseApiError } from '~/utils/parseApiError'
import type { Employee } from '~/types/employee'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const { hasPermission, isBaseLevelEmployee, isAdmin, isManager } = useRolePermissionGuard()

const uuid = computed(() => String(route.params.uuid ?? ''))

function unwrapEmployee(res: unknown): Employee | null {
  if (res == null || typeof res !== 'object') return null
  const r = res as Record<string, unknown>
  const inner = (r.data ?? r) as Record<string, unknown>
  if (inner && typeof inner === 'object' && 'value' in inner && inner.value && typeof inner.value === 'object') {
    return inner.value as Employee
  }
  if (inner && typeof inner === 'object' && 'id' in inner) {
    return inner as Employee
  }
  return null
}

const employee = ref<Employee | null>(null)
const loadingEmployee = ref(true)
const loadError = ref<string | null>(null)
const managerModalOpen = ref(false)
const managersSaving = ref(false)
const managersLoading = ref(false)
const managerOptions = ref<{ label: string, value: string }[]>([])
const selectedManagers = ref<string[]>([])

async function loadEmployee() {
  if (!uuid.value) return
  loadingEmployee.value = true
  loadError.value = null
  try {
    const res = await employeeService.getEmployeeRaw(uuid.value, {
      handler: '$fetch',
      secured: true
    })
    employee.value = unwrapEmployee(res)
    if (!employee.value?.id) {
      loadError.value = 'Employee not found.'
    } else {
      selectedManagers.value = (employee.value.reports_to || [])
        .map(manager => String(manager.id || ''))
        .filter(Boolean)
    }
  } catch (error: unknown) {
    loadError.value = parseApiError(error, 'Unable to load employee.')
    employee.value = null
  } finally {
    loadingEmployee.value = false
  }
}

async function loadManagerOptions() {
  managersLoading.value = true
  try {
    const res = await employeeService.getEmployees({
      handler: '$fetch',
      secured: true,
      query: {
        page: 1,
        page_size: 500,
        paginate: 'false',
        stats: 'false'
      }
    })
    const list = Array.isArray(res)
      ? res
      : ((res as { data?: { results?: Record<string, unknown>[] }, results?: Record<string, unknown>[] })?.data?.results
        || (res as { results?: Record<string, unknown>[] })?.results
        || [])
    managerOptions.value = list
      .map((item) => {
        const user = item.user as { full_name?: string } | undefined
        return {
          label: user?.full_name || String(item.full_name || 'Employee'),
          value: String(item.id || '')
        }
      })
      .filter(item => item.value && item.value !== String(employee.value?.id || ''))
  } catch {
    managerOptions.value = []
  } finally {
    managersLoading.value = false
  }
}

const canViewAnyEmployee = computed(() =>
  isAdmin.value || isManager.value || hasPermission('view_basic_info') || hasPermission('view_employee'))

const currentUserEmployeeId = computed(() => {
  const u = unref(authStore.user) as Record<string, unknown> | undefined
  const emp = u?.employee as Record<string, unknown> | undefined
  return emp?.id != null ? String(emp.id) : ''
})

function enforceAccess() {
  if (!uuid.value) return
  if (canViewAnyEmployee.value) return
  if (currentUserEmployeeId.value && uuid.value === currentUserEmployeeId.value) return
  void navigateTo(ROUTE_LIST.home)
}

watch(uuid, () => {
  enforceAccess()
  void loadEmployee()
}, { immediate: true })

const employeeStatuses = [
  'Active',
  'Inactive',
  'Suspended',
  'Resigned',
  'Terminated',
  'Terminated-Voluntary',
  'Terminated-Involuntary',
  'Terminated-Layoff',
  'Terminated-Retirement'
]

const exitRelatedStatuses = [
  'Resigned',
  'Terminated',
  'Terminated-Voluntary',
  'Terminated-Involuntary',
  'Terminated-Layoff',
  'Terminated-Retirement'
]

const committedStatus = ref('')
watch(() => employee.value?.status, (s) => {
  committedStatus.value = s ? String(s) : ''
}, { immediate: true })

const statusModalOpen = ref(false)
const pendingStatus = ref('')
const statusUpdating = ref(false)

function askStatusChange(val: string | undefined) {
  if (!val || val === committedStatus.value) return
  pendingStatus.value = val
  statusModalOpen.value = true
}

async function confirmStatusChange() {
  if (!employee.value?.id || !pendingStatus.value) return
  statusUpdating.value = true
  try {
    await employeeService.updateEmployee(String(employee.value.id), {
      handler: '$fetch',
      secured: true,
      body: { status: pendingStatus.value }
    })
    toast.add({ title: 'Status updated', color: 'success' })
    committedStatus.value = pendingStatus.value
    statusModalOpen.value = false
    await loadEmployee()
  } catch (error: unknown) {
    toast.add({
      title: 'Update failed',
      description: parseApiError(error, 'Unable to update status.'),
      color: 'error'
    })
  } finally {
    statusUpdating.value = false
  }
}

function cancelStatusChange() {
  statusModalOpen.value = false
  pendingStatus.value = ''
}

const isExitStatusSelected = computed(() => {
  const s = committedStatus.value
  return Boolean(s && exitRelatedStatuses.includes(s))
})

const exitModalOpen = ref(false)

function openExitModal() {
  exitModalOpen.value = true
}

const accessLoading = ref(false)

async function toggleAccess(action: 'enable' | 'disable') {
  if (!employee.value?.id) return
  accessLoading.value = true
  try {
    await employeeService.enableDisableAccess({
      handler: '$fetch',
      secured: true,
      body: { employee_id: employee.value.id, action }
    })
    toast.add({ title: action === 'enable' ? 'Access enabled' : 'Access disabled', color: 'success' })
    await loadEmployee()
  } catch (error: unknown) {
    toast.add({
      title: 'Update failed',
      description: parseApiError(error, 'Unable to change access.'),
      color: 'error'
    })
  } finally {
    accessLoading.value = false
  }
}

const resendLoading = ref(false)

async function resendActivation() {
  if (!employee.value?.id) return
  resendLoading.value = true
  try {
    await employeeService.resendActivationEmail({
      handler: '$fetch',
      secured: true,
      body: { employee_id: employee.value.id }
    })
    toast.add({ title: 'Activation email sent', color: 'success' })
  } catch (error: unknown) {
    toast.add({
      title: 'Resend failed',
      description: parseApiError(error, 'Unable to resend email.'),
      color: 'error'
    })
  } finally {
    resendLoading.value = false
  }
}

async function openManagerModal() {
  selectedManagers.value = (employee.value?.reports_to || [])
    .map(manager => String(manager.id || ''))
    .filter(Boolean)
  managerModalOpen.value = true
  if (!managerOptions.value.length) {
    await loadManagerOptions()
  }
}

async function saveManagers() {
  if (!employee.value?.id) {
    return
  }
  managersSaving.value = true
  try {
    await employeeService.updateEmployee(String(employee.value.id), {
      handler: '$fetch',
      secured: true,
      body: { reports_to: selectedManagers.value }
    })
    toast.add({ title: 'Managers updated', color: 'success' })
    managerModalOpen.value = false
    await loadEmployee()
  } catch (error: unknown) {
    toast.add({
      title: 'Unable to update managers',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    managersSaving.value = false
  }
}

async function removeManager(id: string | undefined) {
  if (!employee.value?.id || !id) {
    return
  }
  managersSaving.value = true
  try {
    const nextManagers = (employee.value.reports_to || [])
      .map(manager => String(manager.id || ''))
      .filter(managerId => managerId && managerId !== id)
    await employeeService.updateEmployee(String(employee.value.id), {
      handler: '$fetch',
      secured: true,
      body: { reports_to: nextManagers }
    })
    toast.add({ title: 'Manager removed', color: 'success' })
    await loadEmployee()
  } catch (error: unknown) {
    toast.add({
      title: 'Unable to remove manager',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    managersSaving.value = false
  }
}

const tabItem = [
  { label: 'Personal Info', value: 'personal' },
  { label: 'Next of kin', value: 'next_of_kin' },
  { label: 'Education', value: 'education' },
  { label: 'Job', value: 'job' },
  { label: 'Timeoffs', value: 'timeoffs' },
  { label: 'Emails', value: 'emails' },
  { label: 'Assets', value: 'assets' },
  { label: 'Documents', value: 'documents' },
  { label: 'Disciplinary', value: 'disciplinary' },
  { label: 'Payment Information', value: 'payInfo' }
]

const baseTabItems = tabItem.filter(t => t.value !== 'documents' && t.value !== 'disciplinary')

const tabSeen = computed(() => (isBaseLevelEmployee.value ? baseTabItems : tabItem))

const selectedTab = ref('personal')

function syncTabFromRoute() {
  const hash = String(route.hash || '').replace('#', '')
  const allowed = tabSeen.value.map(t => t.value)
  selectedTab.value = hash && allowed.includes(hash) ? hash : tabSeen.value[0]!.value
}

watch(() => [route.hash, tabSeen.value], () => syncTabFromRoute(), { immediate: true, deep: true })

function onTabChange(val: string | number) {
  const v = String(val)
  selectedTab.value = v
  void router.replace({ path: route.path, hash: `#${v}` })
}

const displayName = computed(() => employee.value?.user?.full_name
  || [employee.value?.first_name, employee.value?.last_name].filter(Boolean).join(' ')
  || 'Employee')

useSeoMeta({
  title: computed(() => `${displayName.value} — Employees`)
})
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <UButton
          :to="ROUTE_LIST.employees.index"
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-left"
          label="Employees"
        />
      </div>
    </div>

    <USkeleton v-if="loadingEmployee" class="h-48 w-full rounded-lg" />

    <UAlert
      v-else-if="loadError"
      color="error"
      variant="soft"
      :title="loadError"
    />

    <template v-else-if="employee">
      <UPageCard variant="subtle" :title="displayName" :description="employee.user?.title || undefined">
        <template #trailing>
          <div class="flex flex-wrap items-center gap-2">
            <UBadge v-if="employee.status" variant="soft" color="neutral">
              {{ employee.status }}
            </UBadge>
            <UBadge variant="soft" :color="employee.self_service_access ? 'success' : 'warning'">
              {{ employee.self_service_access ? 'Has access' : 'No access' }}
            </UBadge>
          </div>
        </template>

        <div class="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex flex-col gap-4 text-sm text-muted">
            <div class="flex flex-col gap-1">
            <p v-if="employee.user?.email" class="flex items-center gap-2">
              <UIcon name="i-lucide-mail" class="size-4 shrink-0" />
              {{ employee.user.email }}
            </p>
            <p v-if="employee.user?.phone_number" class="flex items-center gap-2">
              <UIcon name="i-lucide-phone" class="size-4 shrink-0" />
              {{ employee.user.phone_number }}
            </p>
            <p v-if="employee.position_and_count?.position" class="flex items-center gap-2">
              <UIcon name="i-lucide-briefcase" class="size-4 shrink-0" />
              {{ employee.position_and_count.position }}
            </p>
            </div>

            <div class="rounded-lg border border-default p-3">
              <div class="flex items-center justify-between gap-2">
                <p class="font-medium text-default">
                  {{ employee.reports_to?.length && employee.reports_to.length > 1 ? 'Managers' : 'Manager' }}
                </p>
                <UButton
                  v-if="!isBaseLevelEmployee"
                  size="xs"
                  variant="outline"
                  icon="i-lucide-user-plus"
                  label="Manage"
                  @click="() => void openManagerModal()"
                />
              </div>
              <div v-if="employee.reports_to?.length" class="mt-3 space-y-2">
                <div
                  v-for="manager in employee.reports_to"
                  :key="manager.id || manager.full_name"
                  class="flex items-center justify-between gap-3 rounded-md bg-elevated/50 px-3 py-2"
                >
                  <div class="flex items-center gap-2 text-default">
                    <UIcon name="i-lucide-user-round" class="size-4 shrink-0" />
                    <span>{{ manager.full_name || 'Manager' }}</span>
                  </div>
                  <UButton
                    v-if="!isBaseLevelEmployee"
                    size="xs"
                    variant="ghost"
                    color="error"
                    icon="i-lucide-trash-2"
                    :loading="managersSaving"
                    @click="() => void removeManager(manager.id)"
                  />
                </div>
              </div>
              <p v-else class="mt-3 text-sm text-muted">
                No manager assigned.
              </p>
            </div>
          </div>

          <div v-if="!isBaseLevelEmployee" class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <USelect
              :model-value="committedStatus"
              :items="employeeStatuses.map(s => ({ label: s, value: s }))"
              value-key="value"
              label-key="label"
              placeholder="Status"
              class="min-w-48"
              :disabled="statusUpdating"
              @update:model-value="askStatusChange"
            />
            <UButton
              v-if="isExitStatusSelected"
              color="warning"
              label="Exit employee"
              icon="i-lucide-log-out"
              @click="openExitModal"
            />
          </div>
        </div>

        <div
          v-if="!isBaseLevelEmployee && employee.id !== currentUserEmployeeId"
          class="mt-4 flex flex-wrap gap-2 border-t border-default pt-4"
        >
          <UButton
            v-if="employee.self_service_access"
            variant="link"
            color="error"
            label="Disable access"
            :loading="accessLoading"
            @click="() => void toggleAccess('disable')"
          />
          <UButton
            v-else
            variant="link"
            color="success"
            label="Enable access"
            :loading="accessLoading"
            @click="() => void toggleAccess('enable')"
          />
          <UButton
            variant="link"
            color="primary"
            label="Resend activation"
            :loading="resendLoading"
            @click="() => void resendActivation()"
          />
        </div>
      </UPageCard>

      <UTabs
        :model-value="selectedTab"
        :items="tabSeen"
        :content="false"
        class="w-full"
        @update:model-value="onTabChange"
      />

      <div class="rounded-lg border border-default p-4">
        <div v-show="selectedTab === 'personal'">
          <EmployeesProfileTab :employee="employee" @saved="() => void loadEmployee()" />
        </div>
        <div v-show="selectedTab === 'next_of_kin'">
          <EmployeesNextOfKinTab v-if="employee.id" :employee-id="String(employee.id)" />
        </div>
        <div v-show="selectedTab === 'education'">
          <EmployeesEducationTab v-if="employee.id" :employee-id="String(employee.id)" />
        </div>
        <div v-show="selectedTab === 'job'">
          <EmployeesJobsTab v-if="employee.id" :employee="employee" @refresh="() => void loadEmployee()" />
        </div>
        <div v-show="selectedTab === 'timeoffs'">
          <UAlert color="info" variant="subtle" title="Time off">
            <template #description>
              <div class="flex flex-col gap-2">
                <p>Manage leave requests and balances in the Time off area.</p>
                <div class="flex flex-wrap gap-2">
                  <UButton size="sm" :to="ROUTE_LIST.timeOff.leaveBalances" label="Leave balances" />
                  <UButton
                    size="sm"
                    variant="outline"
                    :to="ROUTE_LIST.timeOff.applications"
                    label="Requests"
                  />
                </div>
              </div>
            </template>
          </UAlert>
        </div>
        <div v-show="selectedTab === 'emails'">
          <EmployeesEmailsTab v-if="employee.id" :employee-id="String(employee.id)" />
        </div>
        <div v-show="selectedTab === 'assets'">
          <EmployeesAssetsTab v-if="employee.id" :employee-id="String(employee.id)" />
        </div>
        <div v-show="selectedTab === 'documents'">
          <EmployeesDocumentsTab v-if="employee.id" :employee-id="String(employee.id)" />
        </div>
        <div v-show="selectedTab === 'disciplinary'">
          <EmployeesDisciplinaryTab
            v-if="employee.id"
            :employee-id="String(employee.id)"
            :employee-name="displayName"
          />
        </div>
        <div v-show="selectedTab === 'payInfo'">
          <div class="space-y-4">
            <EmployeesPaymentMethodsTab v-if="employee.id" :employee-id="String(employee.id)" />
            <EmployeesExtraPayTab v-if="employee.id" :employee-id="String(employee.id)" />
            <UAlert color="neutral" variant="subtle" title="Compensation and pay components">
              Compensation is managed from the Job tab. Deductions and taxes are still pending migration.
            </UAlert>
          </div>
        </div>
      </div>
    </template>

    <UModal v-model:open="statusModalOpen" title="Change employee status?">
      <p class="text-sm text-muted">
        Update status to <strong>{{ pendingStatus }}</strong>?
      </p>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancel"
            @click="cancelStatusChange"
          />
          <UButton label="Confirm" :loading="statusUpdating" @click="() => void confirmStatusChange()" />
        </div>
      </template>
    </UModal>

    <EmployeesExitModal
      v-if="employee?.id"
      v-model:open="exitModalOpen"
      :employee="{
        id: String(employee.id),
        full_name: displayName,
        status: employee.status || undefined
      }"
      @success="() => void loadEmployee()"
    />

    <UModal v-model:open="managerModalOpen" title="Manage managers">
      <div class="space-y-4">
        <UFormField label="Managers">
          <USelect
            v-model="selectedManagers"
            :items="managerOptions"
            :loading="managersLoading"
            value-key="value"
            label-key="label"
            multiple
            placeholder="Select managers"
            class="w-full"
          />
        </UFormField>
      </div>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="managerModalOpen = false" />
          <UButton label="Save managers" :loading="managersSaving" @click="() => void saveManagers()" />
        </div>
      </template>
    </UModal>
  </div>
</template>
