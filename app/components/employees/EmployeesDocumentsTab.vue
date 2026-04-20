<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import * as z from 'zod'
import type { EmployeeDocument } from '~/types/employee'
import { employeeService } from '~~/services/employee.service'
import { companyService } from '~~/services/company.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  employeeId: string
}>()

const toast = useToast()
const { isBaseLevelEmployee } = useRolePermissionGuard()
const UButton = resolveComponent('UButton')

const schema = z.object({
  document_name: z.string().min(1, 'Document name is required'),
  document_type: z.string().min(1, 'Folder is required'),
  description: z.string().optional()
})

type Schema = z.output<typeof schema>

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const rows = ref<EmployeeDocument[]>([])
const categoryItems = ref<{ label: string, value: string }[]>([])
const modalOpen = ref(false)
const editing = ref<EmployeeDocument | null>(null)
const selectedFile = ref<File | null>(null)

const state = reactive<Schema>({
  document_name: '',
  document_type: '',
  description: ''
})

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) {
    return res as T[]
  }
  if (!res || typeof res !== 'object') {
    return []
  }
  const raw = res as Record<string, unknown>
  const inner = raw.data && typeof raw.data === 'object' ? raw.data as Record<string, unknown> : raw
  if (Array.isArray(inner.results)) {
    return inner.results as T[]
  }
  if (Array.isArray(raw.results)) {
    return raw.results as T[]
  }
  return []
}

async function load() {
  if (!props.employeeId) {
    return
  }
  loading.value = true
  try {
    const res = await employeeService.getEmployeeDocuments(props.employeeId, {
      handler: '$fetch',
      secured: true
    })
    rows.value = unwrapList<EmployeeDocument>(res)
  } catch (error: unknown) {
    rows.value = []
    toast.add({
      title: 'Unable to load documents',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const res = await companyService.getDocumentCategories()
    const categories = unwrapList<{ id?: string, name?: string }>(res)
    categoryItems.value = categories
      .filter(category => category.id && category.name)
      .map(category => ({
        label: String(category.name),
        value: String(category.id)
      }))
  } catch {
    categoryItems.value = []
  }
}

watch(() => props.employeeId, async () => {
  await Promise.all([load(), loadCategories()])
}, { immediate: true })

function resetForm() {
  state.document_name = ''
  state.document_type = ''
  state.description = ''
  selectedFile.value = null
}

function openCreate() {
  editing.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(row: EmployeeDocument) {
  editing.value = row
  state.document_name = String(row.document_name || row.name || '')
  state.document_type = String(row.document_type || '')
  state.description = String(row.description || '')
  selectedFile.value = null
  modalOpen.value = true
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] ?? null
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('document_name', state.document_name)
    formData.append('document_type', state.document_type)
    formData.append('description', state.description || '')
    formData.append('employee', props.employeeId)
    if (selectedFile.value) {
      formData.append('file', selectedFile.value)
    }
    if (editing.value?.id) {
      await employeeService.updateEmployeeDocument(String(editing.value.id), {
        handler: '$fetch',
        secured: true,
        body: formData
      })
      toast.add({ title: 'Document updated', color: 'success' })
    } else {
      if (!selectedFile.value) {
        throw new Error('Select a file before saving.')
      }
      await employeeService.addEmployeeDocument({
        handler: '$fetch',
        secured: true,
        body: formData
      })
      toast.add({ title: 'Document added', color: 'success' })
    }
    modalOpen.value = false
    resetForm()
    await load()
  } catch (error: unknown) {
    toast.add({
      title: editing.value?.id ? 'Update failed' : 'Create failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function remove(row: EmployeeDocument) {
  if (!row.id) {
    return
  }
  deletingId.value = String(row.id)
  try {
    await employeeService.deleteEmployeeDocument(String(row.id), {
      handler: '$fetch',
      secured: true
    })
    toast.add({ title: 'Document deleted', color: 'success' })
    await load()
  } catch (error: unknown) {
    toast.add({
      title: 'Delete failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    deletingId.value = null
  }
}

const columns: TableColumn<EmployeeDocument>[] = [
  {
    accessorKey: 'document_name',
    header: 'Name',
    cell: ({ row }) => row.original.document_name || row.original.name || '—'
  },
  { accessorKey: 'document_type', header: 'Folder' },
  { accessorKey: 'description', header: 'Description' },
  {
    accessorKey: 'file',
    header: 'File',
    cell: ({ row }) => {
      const url = row.original.file
      if (!url) {
        return '—'
      }
      return h(UButton, {
        size: 'xs',
        variant: 'link',
        label: 'Open',
        to: url,
        target: '_blank'
      })
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      if (isBaseLevelEmployee.value) {
        return null
      }
      return h('div', { class: 'flex justify-end gap-2' }, [
        h(UButton, {
          size: 'xs',
          variant: 'ghost',
          color: 'neutral',
          icon: 'i-lucide-pencil',
          onClick: () => openEdit(row.original)
        }),
        h(UButton, {
          size: 'xs',
          variant: 'ghost',
          color: 'error',
          icon: deletingId.value === row.original.id ? 'i-lucide-loader-circle' : 'i-lucide-trash-2',
          loading: deletingId.value === row.original.id,
          onClick: () => void remove(row.original)
        })
      ])
    }
  }
]
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold">
          Documents
        </h3>
        <p class="text-sm text-muted">
          Employee folders and uploaded files.
        </p>
      </div>
      <UButton
        v-if="!isBaseLevelEmployee"
        icon="i-lucide-plus"
        label="Add document"
        @click="openCreate"
      />
    </div>

    <UTable
      :data="rows"
      :columns="columns"
      :loading="loading"
    />

    <UModal
      v-model:open="modalOpen"
      :title="editing?.id ? 'Update document' : 'Add document'"
    >
      <UForm
        id="employee-document-form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Document name" name="document_name" required>
          <UInput v-model="state.document_name" class="w-full" />
        </UFormField>
        <UFormField label="Folder" name="document_type" required>
          <USelect
            v-model="state.document_type"
            :items="categoryItems"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" class="w-full" autoresize />
        </UFormField>
        <UFormField :label="editing?.id ? 'Replace file' : 'File'">
          <input
            type="file"
            class="block w-full text-sm"
            @change="onFileChange"
          >
        </UFormField>
      </UForm>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="modalOpen = false" />
          <UButton
            form="employee-document-form"
            :loading="saving"
            :label="editing?.id ? 'Save changes' : 'Save'"
            type="submit"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
