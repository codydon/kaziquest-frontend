<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import * as z from 'zod'
import { employeeService } from '~~/services/employee.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  employeeId: string
  employeeName?: string
}>()

interface DisciplinaryCaseRow {
  id?: string
  case_number?: string
  incident_title?: string
  title?: string
  description?: string
  date_time?: string
  status?: string
}

interface EmployeeOption {
  label: string
  value: string
}

const toast = useToast()
const { isBaseLevelEmployee } = useRolePermissionGuard()
const UButton = resolveComponent('UButton')
const NuxtTime = resolveComponent('NuxtTime')

const schema = z.object({
  incident_title: z.string().min(1, 'Incident title is required'),
  witnesses: z.array(z.string()).optional(),
  date_time: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
  comments: z.string().optional()
})

type Schema = z.output<typeof schema>

const loading = ref(false)
const rows = ref<DisciplinaryCaseRow[]>([])
const deletingId = ref<string | null>(null)
const modalOpen = ref(false)
const saving = ref(false)
const selectedFiles = ref<FileList | null>(null)
const employeesLoading = ref(false)
const employeeOptions = ref<EmployeeOption[]>([])

const state = reactive<Schema>({
  incident_title: '',
  witnesses: [],
  date_time: '',
  description: '',
  comments: ''
})

const disciplinaryStatusItems = [
  { label: 'Under Review', value: 'under_review', color: 'info' },
  { label: 'Awaiting Employee Response', value: 'awaiting_employee_response', color: 'warning' },
  { label: 'Hearing Scheduled', value: 'hearing_scheduled', color: 'secondary' },
  { label: 'Hearing Completed', value: 'hearing_completed', color: 'secondary' },
  { label: 'Action Taken', value: 'action_taken', color: 'warning' },
  { label: 'Appeal Requested', value: 'appeal_requested', color: 'secondary' },
  { label: 'Appeal Under Review', value: 'appeal_under_review', color: 'error' },
  { label: 'Resolved', value: 'resolved', color: 'success' },
  { label: 'Dismissed', value: 'dismissed', color: 'neutral' }
] as const

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) {
    return res as T[]
  }
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>
    if (Array.isArray(r.results)) {
      return r.results as T[]
    }
    if (r.data && typeof r.data === 'object' && Array.isArray((r.data as { results?: unknown[] }).results)) {
      return (r.data as { results: T[] }).results
    }
  }
  return []
}

function statusBadgeColor(value: string) {
  return disciplinaryStatusItems.find(item => item.value === value)?.color || 'neutral'
}

async function load() {
  if (!props.employeeId) {
    return
  }
  loading.value = true
  try {
    const res = await employeeService.getEmployeeDisciplinary({
      handler: '$fetch',
      secured: true,
      params: { employee_id: props.employeeId }
    })
    rows.value = unwrapList<DisciplinaryCaseRow>(res)
  } catch (error: unknown) {
    rows.value = []
    toast.add({
      title: 'Unable to load disciplinary cases',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function loadEmployees() {
  employeesLoading.value = true
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
    employeeOptions.value = unwrapList<Record<string, unknown>>(res)
      .map((item) => {
        const user = item.user as { id?: string, full_name?: string } | undefined
        return {
          label: user?.full_name || String(item.full_name || 'Employee'),
          value: String(user?.id || item.id || '')
        }
      })
      .filter(item => item.value && item.value !== props.employeeId)
  } catch {
    employeeOptions.value = []
  } finally {
    employeesLoading.value = false
  }
}

watch(() => props.employeeId, () => void load(), { immediate: true })

function resetForm() {
  state.incident_title = ''
  state.witnesses = []
  state.date_time = ''
  state.description = ''
  state.comments = ''
  selectedFiles.value = null
}

async function openCreate() {
  resetForm()
  modalOpen.value = true
  if (!employeeOptions.value.length) {
    await loadEmployees()
  }
}

function onFilesChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFiles.value = target.files
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('incident_title', state.incident_title)
    formData.append('date_time', state.date_time)
    if (state.description) {
      formData.append('description', state.description)
    }
    if (state.comments) {
      formData.append('comments', state.comments)
    }
    formData.append('employees_involved_ids', props.employeeId)
    for (const witness of state.witnesses || []) {
      formData.append('witnesses_ids', witness)
    }
    if (selectedFiles.value?.length) {
      for (const file of Array.from(selectedFiles.value)) {
        formData.append('files', file)
      }
    }
    const res = await employeeService.registerDisciplinary({
      handler: '$fetch',
      secured: true,
      body: formData
    }) as { case_number?: string }
    toast.add({
      title: res?.case_number ? `Case created: ${res.case_number}` : 'Disciplinary case created',
      color: 'success'
    })
    modalOpen.value = false
    resetForm()
    await load()
  } catch (error: unknown) {
    toast.add({
      title: 'Unable to create disciplinary case',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

async function remove(row: DisciplinaryCaseRow) {
  if (!row.id) {
    return
  }
  deletingId.value = String(row.id)
  try {
    await employeeService.deleteDisciplinary(String(row.id), {
      handler: '$fetch',
      secured: true
    })
    toast.add({ title: 'Disciplinary case deleted', color: 'success' })
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

const columns: TableColumn<DisciplinaryCaseRow>[] = [
  {
    accessorKey: 'case_number',
    header: 'Case #',
    cell: ({ row }) => {
      const value = String(row.original.case_number || row.original.id || '')
      const to = `/employees/${props.employeeId}/disciplinary/${encodeURIComponent(value)}`
      return h(UButton, { size: 'xs', variant: 'link', label: value || 'View', to })
    }
  },
  {
    accessorKey: 'incident_title',
    header: 'Incident',
    cell: ({ row }) => row.original.incident_title || row.original.title || '—'
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      const description = String(row.original.description || '')
      return description.length > 72 ? `${description.slice(0, 72)}...` : (description || '—')
    }
  },
  {
    accessorKey: 'date_time',
    header: 'Date',
    cell: ({ row }) => {
      const value = row.original.date_time
      if (!value) {
        return '—'
      }
      return h(NuxtTime, { datetime: value, month: 'short', day: '2-digit', year: 'numeric' })
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const value = String(row.original.status || '')
      if (!value) {
        return '—'
      }
      return h('div', [
        h(resolveComponent('UBadge'), {
          variant: 'soft',
          color: statusBadgeColor(value)
        }, () => value.replaceAll('_', ' '))
      ])
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
          Disciplinary Cases
        </h3>
        <p class="text-sm text-muted">
          Track incidents, hearing progress, and case outcomes.
        </p>
      </div>
      <UButton
        v-if="!isBaseLevelEmployee"
        icon="i-lucide-plus"
        label="Add case"
        @click="() => void openCreate()"
      />
    </div>

    <UTable
      :data="rows"
      :columns="columns"
      :loading="loading"
    />

    <UModal
      v-model:open="modalOpen"
      :title="props.employeeName ? `Add disciplinary case for ${props.employeeName}` : 'Add disciplinary case'"
    >
      <UForm
        id="employee-disciplinary-form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Incident title" name="incident_title" required>
          <UInput v-model="state.incident_title" class="w-full" />
        </UFormField>
        <UFormField label="Witnesses" name="witnesses">
          <USelect
            v-model="state.witnesses"
            :items="employeeOptions"
            :loading="employeesLoading"
            value-key="value"
            label-key="label"
            multiple
            placeholder="Select witnesses"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Date" name="date_time" required>
          <UInput v-model="state.date_time" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Attachments">
          <input type="file" class="block w-full text-sm" multiple @change="onFilesChange">
        </UFormField>
        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" class="w-full" autoresize />
        </UFormField>
        <UFormField label="Comments" name="comments">
          <UTextarea v-model="state.comments" class="w-full" autoresize />
        </UFormField>
      </UForm>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="modalOpen = false" />
          <UButton form="employee-disciplinary-form" type="submit" label="Save case" :loading="saving" />
        </div>
      </template>
    </UModal>
  </div>
</template>
