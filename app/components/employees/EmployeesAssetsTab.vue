<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import * as z from 'zod'
import type { EmployeeAsset } from '~/types/employee'
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
  serial_number: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  asset_name: z.string().min(1, 'Asset name is required'),
  asset_description: z.string().optional(),
  date_assigned: z.string().min(1, 'Date assigned is required'),
  date_returned: z.string().optional(),
  amount: z.number().optional(),
  is_holding: z.boolean()
})

type Schema = z.output<typeof schema>

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const rows = ref<EmployeeAsset[]>([])
const categoryItems = ref<{ label: string, value: string }[]>([])
const modalOpen = ref(false)
const editing = ref<EmployeeAsset | null>(null)

const state = reactive<Schema>({
  serial_number: '',
  category: '',
  asset_name: '',
  asset_description: '',
  date_assigned: '',
  date_returned: undefined,
  amount: undefined,
  is_holding: true
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
    const res = await employeeService.fetchEmployeeAssets(`?employee_id=${encodeURIComponent(props.employeeId)}`, {
      handler: '$fetch',
      secured: true
    })
    rows.value = unwrapList<EmployeeAsset>(res)
  } catch (error: unknown) {
    rows.value = []
    toast.add({
      title: 'Unable to load assets',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const res = await companyService.getAssetsCategories()
    const categories = unwrapList<{ id?: string | number, name?: string }>(res)
    categoryItems.value = categories
      .filter(category => category.id != null && category.name)
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

watch(() => state.is_holding, (holding) => {
  if (holding) {
    state.date_returned = undefined
  }
})

function resetForm() {
  state.serial_number = ''
  state.category = ''
  state.asset_name = ''
  state.asset_description = ''
  state.date_assigned = ''
  state.date_returned = undefined
  state.amount = undefined
  state.is_holding = true
}

function openCreate() {
  editing.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(row: EmployeeAsset) {
  editing.value = row
  state.serial_number = String(row.serial_number || '')
  state.category = String(row.asset_category || '')
  state.asset_name = String(row.asset_name || '')
  state.asset_description = String(row.asset_description || '')
  state.date_assigned = String(row.date_assigned || '').slice(0, 10)
  state.date_returned = row.date_returned ? String(row.date_returned).slice(0, 10) : undefined
  state.amount = row.amount ?? undefined
  state.is_holding = !row.date_returned
  modalOpen.value = true
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    const body = {
      serial_number: state.serial_number,
      category: state.category,
      asset_name: state.asset_name,
      asset_description: state.asset_description,
      date_assigned: state.date_assigned,
      date_returned: state.is_holding ? null : state.date_returned,
      is_holding: state.is_holding,
      employee_assigned: props.employeeId,
      amount: state.amount
    }
    if (editing.value?.id) {
      await employeeService.updateEmployeeAsset(String(editing.value.id), {
        handler: '$fetch',
        secured: true,
        body
      })
      toast.add({ title: 'Asset updated', color: 'success' })
    } else {
      await employeeService.addEmployeeAsset({
        handler: '$fetch',
        secured: true,
        body
      })
      toast.add({ title: 'Asset added', color: 'success' })
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

async function remove(row: EmployeeAsset) {
  if (!row.id) {
    return
  }
  deletingId.value = String(row.id)
  try {
    await employeeService.deleteEmployeeAsset(String(row.id), {
      handler: '$fetch',
      secured: true
    })
    toast.add({ title: 'Asset deleted', color: 'success' })
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

const columns: TableColumn<EmployeeAsset>[] = [
  { accessorKey: 'asset_name', header: 'Asset Name' },
  { accessorKey: 'serial_number', header: 'Serial Number' },
  { accessorKey: 'asset_category', header: 'Asset Category' },
  { accessorKey: 'assigned_by', header: 'Assigned By' },
  {
    accessorKey: 'date_assigned',
    header: 'Date Assigned',
    cell: ({ row }) => row.original.date_assigned ? String(row.original.date_assigned).slice(0, 10) : '—'
  },
  {
    accessorKey: 'date_returned',
    header: 'Date Returned',
    cell: ({ row }) => row.original.date_returned ? String(row.original.date_returned).slice(0, 10) : '—'
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
          Assets
        </h3>
        <p class="text-sm text-muted">
          Company assets assigned to this employee.
        </p>
      </div>
      <UButton
        v-if="!isBaseLevelEmployee"
        icon="i-lucide-plus"
        label="Add asset"
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
      :title="editing?.id ? 'Update asset' : 'Add asset'"
    >
      <UForm
        id="employee-assets-form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Asset serial" name="serial_number">
          <UInput v-model="state.serial_number" class="w-full" />
        </UFormField>
        <UFormField label="Category" name="category" required>
          <USelect
            v-model="state.category"
            :items="categoryItems"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Asset name" name="asset_name" required>
          <UInput v-model="state.asset_name" class="w-full" />
        </UFormField>
        <UFormField label="Asset value" name="amount">
          <UInput v-model.number="state.amount" type="number" class="w-full" />
        </UFormField>
        <UFormField name="is_holding">
          <UCheckbox v-model="state.is_holding" label="Currently holding" />
        </UFormField>
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Date assigned" name="date_assigned" required>
            <UInput v-model="state.date_assigned" type="date" class="w-full" />
          </UFormField>
          <UFormField v-if="!state.is_holding" label="Date returned" name="date_returned">
            <UInput v-model="state.date_returned" type="date" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="Description" name="asset_description">
          <UTextarea v-model="state.asset_description" class="w-full" autoresize />
        </UFormField>
      </UForm>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="modalOpen = false" />
          <UButton
            form="employee-assets-form"
            :loading="saving"
            :label="editing?.id ? 'Save changes' : 'Save'"
            type="submit"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
