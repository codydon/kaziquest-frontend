<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import * as z from 'zod'
import type { EmployeeNextOfKin } from '~/types/employee'
import { employeeService } from '~~/services/employee.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  employeeId: string
}>()

const toast = useToast()
const { isBaseLevelEmployee } = useRolePermissionGuard()

const relations = [
  'Father',
  'Mother',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Uncle',
  'Aunt',
  'Cousin',
  'Spouse',
  'Friend',
  'Other'
].map(item => ({ label: item, value: item }))

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  relation: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Valid email is required'),
  is_dependent: z.boolean(),
  comments: z.string().optional()
})

type Schema = z.output<typeof schema>

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const rows = ref<EmployeeNextOfKin[]>([])
const modalOpen = ref(false)
const editing = ref<EmployeeNextOfKin | null>(null)

const state = reactive<Schema>({
  name: '',
  relation: '',
  phone: '',
  email: '',
  is_dependent: false,
  comments: ''
})

function unwrapList(res: unknown): EmployeeNextOfKin[] {
  if (Array.isArray(res)) {
    return res as EmployeeNextOfKin[]
  }
  if (!res || typeof res !== 'object') {
    return []
  }
  const raw = res as Record<string, unknown>
  const inner = raw.data && typeof raw.data === 'object' ? raw.data as Record<string, unknown> : raw
  if (Array.isArray(inner.results)) {
    return inner.results as EmployeeNextOfKin[]
  }
  if (Array.isArray(raw.results)) {
    return raw.results as EmployeeNextOfKin[]
  }
  return []
}

async function load() {
  if (!props.employeeId) {
    return
  }
  loading.value = true
  try {
    const res = await employeeService.getEmployeeNextOfKin(props.employeeId, {
      handler: '$fetch',
      secured: true
    })
    rows.value = unwrapList(res)
  } catch (error: unknown) {
    rows.value = []
    toast.add({
      title: 'Unable to load next of kin',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

watch(() => props.employeeId, () => void load(), { immediate: true })

function resetForm() {
  state.name = ''
  state.relation = ''
  state.phone = ''
  state.email = ''
  state.is_dependent = false
  state.comments = ''
}

function openCreate() {
  editing.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(row: EmployeeNextOfKin) {
  editing.value = row
  state.name = String(row.name ?? '')
  state.relation = String(row.relation ?? '')
  state.phone = String(row.phone ?? '')
  state.email = String(row.email ?? '')
  state.is_dependent = Boolean(row.is_dependent)
  state.comments = String(row.comments ?? '')
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
      await employeeService.updateEmployeeNextOfKin(String(editing.value.id), {
        handler: '$fetch',
        secured: true,
        body
      })
      toast.add({ title: 'Next of kin updated', color: 'success' })
    } else {
      await employeeService.addEmployeeNextOfKin({
        handler: '$fetch',
        secured: true,
        body
      })
      toast.add({ title: 'Next of kin added', color: 'success' })
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

async function remove(row: EmployeeNextOfKin) {
  if (!row.id) {
    return
  }
  deletingId.value = String(row.id)
  try {
    await employeeService.deleteEmployeeNextOfKin(String(row.id), {
      handler: '$fetch',
      secured: true
    })
    toast.add({ title: 'Next of kin deleted', color: 'success' })
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

const columns: TableColumn<EmployeeNextOfKin>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'relation', header: 'Relationship' },
  { accessorKey: 'phone', header: 'Phone' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'is_dependent',
    header: 'Dependent',
    cell: ({ row }) => row.original.is_dependent ? 'Yes' : 'No'
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      if (isBaseLevelEmployee.value) {
        return null
      }
      return h('div', { class: 'flex justify-end gap-2' }, [
        h(resolveComponent('UButton'), {
          size: 'xs',
          variant: 'ghost',
          color: 'neutral',
          icon: 'i-lucide-pencil',
          onClick: () => openEdit(row.original)
        }),
        h(resolveComponent('UButton'), {
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
          Next of kin
        </h3>
        <p class="text-sm text-muted">
          Emergency and dependent contacts for this employee.
        </p>
      </div>
      <UButton
        v-if="!isBaseLevelEmployee"
        icon="i-lucide-plus"
        label="Add next of kin"
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
      :title="editing?.id ? 'Update next of kin' : 'Add next of kin'"
    >
      <UForm
        id="employee-next-of-kin-form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name" required>
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField label="Relationship" name="relation" required>
          <USelect
            v-model="state.relation"
            :items="relations"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Phone" name="phone" required>
            <UInput v-model="state.phone" class="w-full" />
          </UFormField>
          <UFormField label="Email" name="email" required>
            <UInput v-model="state.email" type="email" class="w-full" />
          </UFormField>
        </div>
        <UFormField name="is_dependent">
          <UCheckbox v-model="state.is_dependent" label="Dependent" />
        </UFormField>
        <UFormField label="Comments" name="comments">
          <UTextarea v-model="state.comments" class="w-full" autoresize />
        </UFormField>
      </UForm>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="modalOpen = false" />
          <UButton
            form="employee-next-of-kin-form"
            :loading="saving"
            :label="editing?.id ? 'Save changes' : 'Save'"
            type="submit"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
