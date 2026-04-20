<script setup lang="ts">
import { companyService } from '~~/services/company.service'
import { parseApiError } from '~/utils/parseApiError'

interface IDepartment {
  id: string | number
  name?: string
  description?: string
}

interface IPosition {
  id: string | number
  job_title?: string
  description?: string
}

const toast = useToast()

const { data: departmentsData, status, refresh: refreshDepartments } = companyService.fetchDepartments()

const loadingDepartments = computed(() => status.value === 'pending')

const departmentList = computed<IDepartment[]>(() => {
  const d = departmentsData.value
  if (Array.isArray(d)) {
    return d as IDepartment[]
  }
  if (d && typeof d === 'object' && Array.isArray((d as { results?: IDepartment[] }).results)) {
    return (d as { results: IDepartment[] }).results
  }
  return []
})

const selectedDepartment = ref<IDepartment>({ id: '', name: '' })
const positions = ref<IPosition[]>([])
const loadingPositions = ref(false)

const deptModalOpen = ref(false)
const editDepartment = ref(false)
const departmentForModal = ref<IDepartment>({ id: '', name: '', description: '' })
const positionModalOpen = ref(false)
const editPosition = ref(false)
const positionForModal = ref<IPosition>({ id: '', job_title: '', description: '' })

const deleteOpen = ref(false)
const deleteKind = ref<'department' | 'position'>('department')
const deleteTarget = ref<{ id: number, label: string } | null>(null)

watch(
  departmentList,
  (list) => {
    if (!list.length) {
      selectedDepartment.value = { id: '', name: '' }
      positions.value = []
      return
    }
    const still = list.find(d => d.id === selectedDepartment.value?.id)
    if (!still) {
      selectedDepartment.value = list[0]!
    }
  },
  { immediate: true }
)

watch(
  () => selectedDepartment.value?.name,
  (name) => {
    if (name) {
      void loadPositions()
    } else {
      positions.value = []
    }
  }
)

async function loadPositions() {
  const deptName = selectedDepartment.value?.name
  if (!deptName) {
    positions.value = []
    return
  }
  loadingPositions.value = true
  try {
    const res = await companyService.fetchPositions({ department: deptName }) as unknown
    if (Array.isArray(res)) {
      positions.value = res as IPosition[]
    } else if (res && typeof res === 'object' && Array.isArray((res as { results?: IPosition[] }).results)) {
      positions.value = (res as { results: IPosition[] }).results
    } else {
      positions.value = []
    }
  } catch (err: unknown) {
    toast.add({
      title: 'Could not load positions',
      description: parseApiError(err, 'Request failed.'),
      color: 'error'
    })
    positions.value = []
  } finally {
    loadingPositions.value = false
  }
}

function selectDepartment(d: IDepartment) {
  selectedDepartment.value = d
}

function openAddDepartment() {
  editDepartment.value = false
  departmentForModal.value = { id: '', name: '', description: '' }
  deptModalOpen.value = true
}

function openEditDepartment(d: IDepartment) {
  editDepartment.value = true
  departmentForModal.value = { ...d }
  selectedDepartment.value = d
  deptModalOpen.value = true
}

function openAddPosition() {
  editPosition.value = false
  positionForModal.value = { id: '', job_title: '', description: '' }
  positionModalOpen.value = true
}

function openEditPosition(p: IPosition) {
  editPosition.value = true
  positionForModal.value = { ...p }
  positionModalOpen.value = true
}

function confirmDeleteDepartment(d: IDepartment) {
  deleteKind.value = 'department'
  deleteTarget.value = { id: Number(d.id), label: String(d.name ?? 'Department') }
  deleteOpen.value = true
}

function confirmDeletePosition(p: IPosition) {
  deleteKind.value = 'position'
  deleteTarget.value = { id: Number(p.id), label: String(p.job_title ?? 'Position') }
  deleteOpen.value = true
}

const deleting = ref(false)

async function executeDelete() {
  if (!deleteTarget.value) {
    return
  }
  deleting.value = true
  try {
    if (deleteKind.value === 'department') {
      await companyService.deleteDepartment(deleteTarget.value.id)
      toast.add({ title: `${deleteTarget.value.label} deleted`, color: 'success' })
      await refreshDepartments()
    } else {
      await companyService.deletePosition(deleteTarget.value.id)
      toast.add({ title: `${deleteTarget.value.label} deleted`, color: 'success' })
      await loadPositions()
    }
    deleteOpen.value = false
    deleteTarget.value = null
  } catch (err: unknown) {
    toast.add({
      title: 'Delete failed',
      description: parseApiError(err, 'Request failed.'),
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}

async function onDepartmentSaved() {
  await refreshDepartments()
}

async function onPositionSaved() {
  await loadPositions()
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid gap-6 lg:grid-cols-2">
      <UCard :ui="{ body: 'space-y-4' }">
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <div>
              <h3 class="text-base font-semibold">
                Departments
              </h3>
              <p class="text-sm text-muted">
                Select a department to manage its positions.
              </p>
            </div>
            <UBadge color="neutral" variant="subtle">
              {{ departmentList.length }}
            </UBadge>
          </div>
        </template>

        <div class="flex flex-wrap gap-2">
          <UButton
            icon="i-lucide-plus"
            label="Add department"
            size="sm"
            @click="openAddDepartment"
          />
        </div>

        <div v-if="loadingDepartments" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
        </div>
        <div
          v-else-if="!departmentList.length"
          class="rounded-lg border border-dashed border-default px-4 py-8 text-center text-sm text-muted"
        >
          No departments yet. Add your first department.
        </div>
        <ul v-else class="space-y-2">
          <li
            v-for="department in departmentList"
            :key="String(department.id)"
            class="flex cursor-pointer items-center justify-between rounded-lg border border-default px-3 py-2.5 transition hover:bg-elevated"
            :class="selectedDepartment.id === department.id ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : ''"
            @click="selectDepartment(department)"
          >
            <span class="font-medium">{{ department.name }}</span>
            <div class="flex items-center gap-1" @click.stop>
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="openEditDepartment(department)"
              />
              <UButton
                icon="i-lucide-trash"
                color="error"
                variant="ghost"
                size="xs"
                @click="confirmDeleteDepartment(department)"
              />
            </div>
          </li>
        </ul>
      </UCard>

      <UCard :ui="{ body: 'space-y-4' }">
        <template #header>
          <div>
            <h3 class="text-base font-semibold">
              {{ selectedDepartment.name || 'Positions' }}
            </h3>
            <p class="text-sm text-muted">
              {{ selectedDepartment.name ? `Positions in ${selectedDepartment.name}` : 'Select a department to view positions.' }}
            </p>
          </div>
        </template>

        <div v-if="selectedDepartment.name" class="flex flex-wrap gap-2">
          <UButton
            icon="i-lucide-plus"
            label="Add position"
            size="sm"
            @click="openAddPosition"
          />
        </div>

        <div v-if="!selectedDepartment.name" class="rounded-lg border border-dashed border-default px-4 py-8 text-center text-sm text-muted">
          Select a department on the left to manage positions.
        </div>
        <div v-else-if="loadingPositions" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
        </div>
        <div
          v-else-if="!positions.length"
          class="rounded-lg border border-dashed border-default px-4 py-8 text-center text-sm text-muted"
        >
          No positions yet for this department.
        </div>
        <ul v-else class="space-y-2">
          <li
            v-for="position in positions"
            :key="String(position.id)"
            class="flex items-center justify-between rounded-lg border border-default px-3 py-2.5"
          >
            <span class="font-medium">{{ position.job_title }}</span>
            <div class="flex items-center gap-1">
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="openEditPosition(position)"
              />
              <UButton
                icon="i-lucide-trash"
                color="error"
                variant="ghost"
                size="xs"
                @click="confirmDeletePosition(position)"
              />
            </div>
          </li>
        </ul>
      </UCard>
    </div>

    <SettingsCompanyDepartmentModal
      v-model:open="deptModalOpen"
      :edit="editDepartment"
      :department="departmentForModal"
      @saved="() => void onDepartmentSaved()"
    />

    <SettingsCompanyPositionModal
      v-model:open="positionModalOpen"
      :edit="editPosition"
      :selected-dept="selectedDepartment"
      :position="positionForModal"
      @saved="() => void onPositionSaved()"
    />

    <UModal
      v-model:open="deleteOpen"
      :title="deleteKind === 'department' ? 'Delete department?' : 'Delete position?'"
      :description="deleteTarget ? `This will remove “${deleteTarget.label}”.` : ''"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancel"
            @click="deleteOpen = false"
          />
          <UButton
            color="error"
            label="Delete"
            :loading="deleting"
            @click="() => void executeDelete()"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
