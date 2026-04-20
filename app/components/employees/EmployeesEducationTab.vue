<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import * as z from 'zod'
import type { EmployeeEducation } from '~/types/employee'
import { employeeService } from '~~/services/employee.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  employeeId: string
}>()

const toast = useToast()
const { isBaseLevelEmployee } = useRolePermissionGuard()
const UButton = resolveComponent('UButton')

const certificationItems = [
  'PRIMARY_EDUCATION',
  'LOWER_SECONDARY_EDUCATION',
  'UPPER_SECONDARY_EDUCATION',
  'SECONDARY_EDUCATION',
  'COLLEGE',
  'O_LEVEL_EDUCATION',
  'A_LEVEL_EDUCATION',
  'ADULT_REMEDIAL_EDUCATION',
  'ASSOCIATES_OR_EQUIVALENT',
  'BACHELORS_OR_EQUIVALENT',
  'MASTERS_OR_EQUIVALENT',
  'DOCTORAL_OR_EQUIVALENT',
  'DEGREE_TYPE_UNSPECIFIED'
].map(item => ({ label: item.replaceAll('_', ' '), value: item }))

const schema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  study_field: z.string().min(1, 'Study field is required'),
  certification: z.string().optional(),
  grade: z.string().optional(),
  points: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
})

type Schema = z.output<typeof schema>

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const rows = ref<EmployeeEducation[]>([])
const modalOpen = ref(false)
const editing = ref<EmployeeEducation | null>(null)

const state = reactive<Schema>({
  institution: '',
  study_field: '',
  certification: '',
  grade: '',
  points: '',
  start_date: '',
  end_date: ''
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
  if (Array.isArray((inner as Record<string, unknown>).data)) {
    return (inner as Record<string, unknown>).data as T[]
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
    const res = await employeeService.getEducationForEmployee(props.employeeId, {
      handler: '$fetch',
      secured: true
    })
    rows.value = unwrapList<EmployeeEducation>(res)
  } catch (error: unknown) {
    rows.value = []
    toast.add({
      title: 'Unable to load education',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

watch(() => props.employeeId, () => void load(), { immediate: true })

function resetForm() {
  state.institution = ''
  state.study_field = ''
  state.certification = ''
  state.grade = ''
  state.points = ''
  state.start_date = ''
  state.end_date = ''
}

function openCreate() {
  editing.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(row: EmployeeEducation) {
  editing.value = row
  state.institution = String(row.institution || '')
  state.study_field = String(row.study_field || '')
  state.certification = String(row.certification || '')
  state.grade = String(row.grade || '')
  state.points = String(row.points || '')
  state.start_date = String(row.start_date || '').slice(0, 10)
  state.end_date = String(row.end_date || '').slice(0, 10)
  modalOpen.value = true
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    const body = {
      ...state,
      employee: props.employeeId
    }
    if (editing.value?.id) {
      await employeeService.updateEducationForEmployee(String(editing.value.id), {
        handler: '$fetch',
        secured: true,
        body
      })
      toast.add({ title: 'Education updated', color: 'success' })
    } else {
      await employeeService.addEducation({
        handler: '$fetch',
        secured: true,
        body
      })
      toast.add({ title: 'Education added', color: 'success' })
    }
    modalOpen.value = false
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

async function remove(row: EmployeeEducation) {
  if (!row.id) {
    return
  }
  deletingId.value = String(row.id)
  try {
    await employeeService.deleteEducationForEmployee(String(row.id), {
      handler: '$fetch',
      secured: true
    })
    toast.add({ title: 'Education deleted', color: 'success' })
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

const columns: TableColumn<EmployeeEducation>[] = [
  { accessorKey: 'institution', header: 'Institution' },
  { accessorKey: 'study_field', header: 'Study Field' },
  {
    accessorKey: 'certification',
    header: 'Certification',
    cell: ({ row }) => row.original.certification ? row.original.certification.replaceAll('_', ' ') : '—'
  },
  { accessorKey: 'grade', header: 'Grade/Honours' },
  { accessorKey: 'points', header: 'Points' },
  {
    accessorKey: 'start_date',
    header: 'Start Date',
    cell: ({ row }) => row.original.start_date ? String(row.original.start_date).slice(0, 10) : '—'
  },
  {
    accessorKey: 'end_date',
    header: 'End Date',
    cell: ({ row }) => row.original.end_date ? String(row.original.end_date).slice(0, 10) : '—'
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
          Education
        </h3>
        <p class="text-sm text-muted">
          Academic background and certifications.
        </p>
      </div>
      <UButton
        v-if="!isBaseLevelEmployee"
        icon="i-lucide-plus"
        label="Add education"
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
      :title="editing?.id ? 'Update education' : 'Add education'"
    >
      <UForm
        id="employee-education-form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Institution" name="institution" required>
          <UInput v-model="state.institution" class="w-full" />
        </UFormField>
        <UFormField label="Study field" name="study_field" required>
          <UInput v-model="state.study_field" class="w-full" />
        </UFormField>
        <UFormField label="Certification" name="certification">
          <USelect
            v-model="state.certification"
            :items="certificationItems"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Start date" name="start_date">
            <UInput v-model="state.start_date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="End date" name="end_date">
            <UInput v-model="state.end_date" type="date" class="w-full" />
          </UFormField>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Grade" name="grade">
            <UInput v-model="state.grade" class="w-full" />
          </UFormField>
          <UFormField label="Points / GPA" name="points">
            <UInput v-model="state.points" class="w-full" />
          </UFormField>
        </div>
      </UForm>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="modalOpen = false" />
          <UButton
            form="employee-education-form"
            :loading="saving"
            :label="editing?.id ? 'Save changes' : 'Save'"
            type="submit"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
