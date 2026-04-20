<script setup lang="ts">
import type { ApplicationStatusItem } from '~~/services/applications.service'
import { useApplicationsStore } from '~/stores/applications'
import { parseApiError } from '~/utils/parseApiError'
import { formatHiringStatusLabel } from '~/utils/hiring'

const toast = useToast()
const applicationsStore = useApplicationsStore()

const loading = ref(false)
const open = ref(false)
const mode = ref<'create' | 'edit'>('create')
const editing = ref<ApplicationStatusItem | null>(null)

const form = reactive({
  name: '',
  description: '',
  color: '#71717a',
  order: 1,
  hidden: false
})

const stages = computed<ApplicationStatusItem[]>(() => (
  [...(applicationsStore.applicationStatuses.value as unknown as ApplicationStatusItem[])]
))

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'order', header: 'Order' },
  { accessorKey: 'hidden', header: 'Hidden' },
  { id: 'actions', header: '' }
]

function resetForm() {
  form.name = ''
  form.description = ''
  form.color = '#71717a'
  form.order = (stages.value.length ? Math.max(...stages.value.map(stage => Number(stage.order || 0))) : 0) + 1
  form.hidden = false
}

async function refresh() {
  loading.value = true
  try {
    await applicationsStore.fetchApplicationStatuses()
  }
  finally {
    loading.value = false
  }
}

function openCreate() {
  mode.value = 'create'
  editing.value = null
  resetForm()
  open.value = true
}

function openEdit(stage: ApplicationStatusItem) {
  mode.value = 'edit'
  editing.value = stage
  form.name = stage.name || ''
  form.description = stage.description || stage.name || ''
  form.color = stage.color || '#71717a'
  form.order = Number(stage.order || 1)
  form.hidden = Boolean(stage.hidden)
  open.value = true
}

async function save() {
  loading.value = true
  try {
    if (mode.value === 'create') {
      await applicationsStore.createApplicationStatus({
        name: form.name.trim(),
        description: form.description.trim() || form.name.trim(),
        color: form.color,
        order: form.order
      })
      toast.add({ title: 'Stage created', color: 'success' })
    } else if (editing.value?.id) {
      await applicationsStore.updateApplicationStatus(String(editing.value.id), {
        name: form.name.trim(),
        description: form.description.trim() || form.name.trim(),
        color: form.color,
        order: form.order,
        hidden: form.hidden
      })
      toast.add({ title: 'Stage updated', color: 'success' })
    }
    open.value = false
  } catch (error: unknown) {
    toast.add({
      title: 'Could not save stage',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function removeStage(stage: ApplicationStatusItem) {
  if (!stage.id) {
    return
  }

  loading.value = true
  try {
    await applicationsStore.deleteApplicationStatus(String(stage.id))
    toast.add({ title: `${formatHiringStatusLabel(stage.name)} deleted`, color: 'success' })
  } catch (error: unknown) {
    toast.add({
      title: 'Could not delete stage',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

await refresh()
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-end gap-2">
      <UButton icon="i-lucide-refresh-cw" variant="outline" :loading="loading" @click="refresh">
        Refresh
      </UButton>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Add stage
      </UButton>
    </div>

    <UTable :data="stages" :columns="columns" :loading="loading" class="flex-1">
      <template #name-cell="{ row }">
        <div class="flex items-center gap-2">
          <span class="inline-block size-3 rounded-full border border-default" :style="{ backgroundColor: row.original.color || '#71717a' }" />
          <span class="font-medium">{{ formatHiringStatusLabel(row.original.name) }}</span>
        </div>
      </template>

      <template #description-cell="{ row }">
        {{ row.original.description || '—' }}
      </template>

      <template #hidden-cell="{ row }">
        {{ row.original.hidden ? 'Yes' : 'No' }}
      </template>

      <template #actions-cell="{ row }">
        <div class="flex justify-end gap-1">
          <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" size="xs" @click="openEdit(row.original)" />
          <UButton icon="i-lucide-trash" variant="ghost" color="error" size="xs" @click="removeStage(row.original)" />
        </div>
      </template>
    </UTable>

    <UModal v-model:open="open" :title="mode === 'create' ? 'Add applicant stage' : 'Edit applicant stage'">
      <template #body>
        <div class="grid gap-4">
          <UFormField label="Internal name" required>
            <UInput v-model="form.name" placeholder="shortlisted" />
          </UFormField>
          <UFormField label="Display label">
            <UInput v-model="form.description" placeholder="Shortlisted" />
          </UFormField>
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Order">
              <UInput v-model="form.order" type="number" />
            </UFormField>
            <UFormField label="Color">
              <UInput v-model="form.color" type="color" />
            </UFormField>
          </div>
          <UCheckbox v-model="form.hidden" label="Hide this stage from dropdowns" />
        </div>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="open = false">
            Cancel
          </UButton>
          <UButton :loading="loading" @click="save">
            Save
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
