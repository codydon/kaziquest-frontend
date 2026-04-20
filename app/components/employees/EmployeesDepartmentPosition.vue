<script setup lang="ts">
import { companyService } from '~~/services/company.service'
import { parseApiError } from '~/utils/parseApiError'
import type { IDepartment, IPosition } from '~/types/employee'

const emit = defineEmits<{
  'selected-department': [IDepartment]
  'selected-position': [IPosition]
}>()

const toast = useToast()

const departments = ref<IDepartment[]>([])
const positions = ref<IPosition[]>([])
const deptLoading = ref(false)
const posLoading = ref(false)
const creatingDept = ref(false)
const creatingPos = ref(false)
const deptCreateOpen = ref(false)
const posCreateOpen = ref(false)

const selectedDeptId = ref<string | undefined>(undefined)
const selectedPosId = ref<string | undefined>(undefined)
const deptSearchTerm = ref('')
const posSearchTerm = ref('')
const deptCreateName = ref('')
const deptCreateDescription = ref('')
const posCreateTitle = ref('')
const posCreateDescription = ref('')

function unwrapList(res: unknown): unknown[] {
  if (Array.isArray(res)) return res
  if (res && typeof res !== 'object') {
    return []
  }
  const r = res as Record<string, unknown>
  if (Array.isArray(r.results)) return r.results
  if (r.data && typeof r.data === 'object' && Array.isArray((r.data as { results?: unknown[] }).results)) {
    return (r.data as { results: unknown[] }).results
  }
  return []
}

async function loadDepartments() {
  deptLoading.value = true
  try {
    const res = await companyService.fetchDepartments({
      handler: '$fetch',
      secured: true
    })
    departments.value = unwrapList(res) as IDepartment[]
  } catch {
    departments.value = []
  } finally {
    deptLoading.value = false
  }
}

async function loadPositions(deptName: string) {
  if (!deptName) {
    positions.value = []
    return
  }
  posLoading.value = true
  try {
    const res = await companyService.fetchPositions({ department: deptName })
    positions.value = unwrapList(res) as IPosition[]
  } catch {
    positions.value = []
  } finally {
    posLoading.value = false
  }
}

const departmentItems = computed(() =>
  departments.value
    .filter(d => d?.name)
    .map(d => ({ label: String(d.name), value: String(d.id ?? d.name) }))
)

const positionItems = computed(() =>
  positions.value
    .filter(p => p?.job_title)
    .map(p => ({ label: String(p.job_title), value: String(p.id ?? p.job_title) }))
)

const deptQueryTrimmed = computed(() => deptSearchTerm.value.trim())
const posQueryTrimmed = computed(() => posSearchTerm.value.trim())

const showCreateDepartmentLink = computed(() => {
  const q = deptQueryTrimmed.value
  if (q.length < 1) {
    return false
  }
  const lower = q.toLowerCase()
  return !departments.value.some(d =>
    String(d.name ?? '').toLowerCase().includes(lower)
  )
})

const currentDepartment = computed(
  () => departments.value.find(x => String(x.id ?? x.name) === String(selectedDeptId.value)) || null
)

const showCreatePositionLink = computed(() => {
  const q = posQueryTrimmed.value
  if (q.length < 1 || !selectedDeptId.value || !currentDepartment.value?.id) {
    return false
  }
  const lower = q.toLowerCase()
  return !positions.value.some(p =>
    String(p.job_title ?? '').toLowerCase().includes(lower)
  )
})

watch(selectedDeptId, (id) => {
  const d = departments.value.find(x => String(x.id ?? x.name) === String(id)) || {}
  emit('selected-department', d)
  selectedPosId.value = undefined
  posSearchTerm.value = ''
  emit('selected-position', {})
  void loadPositions(String(d.name ?? ''))
})

watch(selectedPosId, (id) => {
  const p = positions.value.find(x => String(x.id ?? x.job_title) === String(id)) || {}
  emit('selected-position', p)
})

function openCreateDepartmentModal() {
  deptCreateName.value = deptQueryTrimmed.value
  deptCreateDescription.value = ''
  deptCreateOpen.value = true
}

function openCreatePositionModal() {
  posCreateTitle.value = posQueryTrimmed.value
  posCreateDescription.value = ''
  posCreateOpen.value = true
}

async function onCreateDepartment() {
  const name = deptCreateName.value.trim()
  if (!name || creatingDept.value) {
    return
  }
  creatingDept.value = true
  try {
    await companyService.createDepartment({
      handler: '$fetch',
      method: 'POST',
      secured: true,
      body: { name, description: deptCreateDescription.value.trim() } as Record<string, unknown>
    })
    await loadDepartments()
    const created = departments.value.find(
      d => String(d.name ?? '').trim().toLowerCase() === name.toLowerCase()
    )
    if (created) {
      selectedDeptId.value = String(created.id ?? created.name)
    }
    deptSearchTerm.value = ''
    deptCreateOpen.value = false
    toast.add({ title: 'Department created', color: 'success' })
  } catch (err: unknown) {
    toast.add({
      title: 'Could not create department',
      description: parseApiError(err, 'Request failed.'),
      color: 'error'
    })
  } finally {
    creatingDept.value = false
  }
}

async function onCreatePosition() {
  const title = posCreateTitle.value.trim()
  const dept = currentDepartment.value
  if (!title || !dept?.id || creatingPos.value) {
    return
  }
  creatingPos.value = true
  try {
    const deptPk = typeof dept.id === 'number' ? dept.id : Number(dept.id)
    await companyService.createPosition({
      handler: '$fetch',
      method: 'POST',
      secured: true,
      body: {
        department_id: Number.isFinite(deptPk) ? deptPk : dept.id,
        job_title: title,
        description: posCreateDescription.value.trim()
      } as Record<string, unknown>
    })
    await loadPositions(String(dept.name ?? ''))
    const created = positions.value.find(
      p => String(p.job_title ?? '').trim().toLowerCase() === title.toLowerCase()
    )
    if (created) {
      selectedPosId.value = String(created.id ?? created.job_title)
    }
    posSearchTerm.value = ''
    posCreateOpen.value = false
    toast.add({ title: 'Position created', color: 'success' })
  } catch (err: unknown) {
    toast.add({
      title: 'Could not create position',
      description: parseApiError(err, 'Request failed.'),
      color: 'error'
    })
  } finally {
    creatingPos.value = false
  }
}

onMounted(() => {
  void loadDepartments()
})
</script>

<template>
  <div class="grid gap-x-5 gap-y-3 md:grid-cols-2 md:items-start">
    <UFormField name="department">
      <template #label>
        <div class="flex w-full items-center justify-between gap-2">
          <span>Department <span class="text-error">*</span></span>
          <button
            v-if="showCreateDepartmentLink"
            type="button"
            class="text-primary max-w-[55%] shrink-0 truncate text-left text-sm font-normal underline underline-offset-2 hover:opacity-90"
            :disabled="creatingDept"
            @click="openCreateDepartmentModal"
          >
            Create new {{ deptQueryTrimmed }}
          </button>
        </div>
      </template>
      <USelectMenu
        v-model="selectedDeptId"
        v-model:search-term="deptSearchTerm"
        class="w-full max-w-md"
        :items="departmentItems"
        value-key="value"
        label-key="label"
        :loading="deptLoading"
        :reset-search-term-on-blur="false"
        placeholder="Search or select department"
      />
    </UFormField>
    <UFormField name="position">
      <template #label>
        <div class="flex w-full items-center justify-between gap-2">
          <span>Position <span class="text-error">*</span></span>
          <button
            v-if="showCreatePositionLink"
            type="button"
            class="text-primary max-w-[55%] shrink-0 truncate text-left text-sm font-normal underline underline-offset-2 hover:opacity-90"
            :disabled="creatingPos || !selectedDeptId"
            @click="openCreatePositionModal"
          >
            Create new {{ posQueryTrimmed }}
          </button>
        </div>
      </template>
      <USelectMenu
        v-model="selectedPosId"
        v-model:search-term="posSearchTerm"
        class="w-full max-w-md"
        :items="positionItems"
        value-key="value"
        label-key="label"
        :loading="posLoading"
        :disabled="!selectedDeptId"
        :reset-search-term-on-blur="false"
        placeholder="Search or select position"
      />
    </UFormField>
  </div>

  <UModal
    v-model:open="deptCreateOpen"
    title="Create Department"
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #body>
      <div class="space-y-3">
        <UFormField label="Department name" required>
          <UInput
            v-model="deptCreateName"
            placeholder="Enter department name"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Description">
          <UTextarea
            v-model="deptCreateDescription"
            placeholder="Enter description (optional)"
            class="w-full"
            :rows="3"
          />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancel"
          :disabled="creatingDept"
          @click="deptCreateOpen = false"
        />
        <UButton
          label="Create Department"
          :loading="creatingDept"
          :disabled="!deptCreateName.trim()"
          @click="() => void onCreateDepartment()"
        />
      </div>
    </template>
  </UModal>

  <UModal
    v-model:open="posCreateOpen"
    title="Create Position"
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #body>
      <div class="space-y-3">
        <div class="rounded-md border border-default bg-elevated/40 px-3 py-2">
          <p class="text-xs font-medium uppercase tracking-wide text-muted">
            Department
          </p>
          <p class="mt-1 text-sm text-highlighted">
            {{ String(currentDepartment?.name || '-') }}
          </p>
        </div>
        <UFormField label="Position title" required>
          <UInput
            v-model="posCreateTitle"
            placeholder="Enter position title"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Description">
          <UTextarea
            v-model="posCreateDescription"
            placeholder="Enter description (optional)"
            class="w-full"
            :rows="3"
          />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancel"
          :disabled="creatingPos"
          @click="posCreateOpen = false"
        />
        <UButton
          label="Create Position"
          :loading="creatingPos"
          :disabled="!posCreateTitle.trim()"
          @click="() => void onCreatePosition()"
        />
      </div>
    </template>
  </UModal>
</template>
