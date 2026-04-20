<script setup lang="ts">
import { paymentService } from '~~/services/payments.service'
import { parseApiError } from '~/utils/parseApiError'

interface EmployerPaymentMethod {
  id: string
  type: string
  label?: string | null
  masked_value?: string
  is_default?: boolean
}

const toast = useToast()

const methods = ref<EmployerPaymentMethod[]>([])
const loading = ref(false)
const submitting = ref(false)
const showForm = ref(false)
const deleteOpen = ref(false)
const deleteId = ref<string | null>(null)

const formState = reactive({
  type: 'mpesa' as 'mpesa' | 'paypal',
  label: '',
  rawValue: '',
  setAsDefault: true
})

async function loadMethods() {
  loading.value = true
  try {
    const res = await paymentService.listEmployerPaymentMethods() as EmployerPaymentMethod[]
    methods.value = Array.isArray(res) ? res : []
  } catch (err: unknown) {
    toast.add({
      title: 'Unable to load payment methods',
      description: parseApiError(err, 'Request failed.'),
      color: 'error'
    })
    methods.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadMethods()
})

async function handleCreate() {
  if (!formState.rawValue.trim()) {
    toast.add({
      title: formState.type === 'mpesa' ? 'Phone number required' : 'PayPal email required',
      color: 'warning'
    })
    return
  }

  submitting.value = true
  try {
    await paymentService.createEmployerPaymentMethod({
      type: formState.type,
      label: formState.label || null,
      raw_value: formState.rawValue.trim(),
      set_as_default: formState.setAsDefault
    })
    showForm.value = false
    formState.rawValue = ''
    formState.label = ''
    formState.setAsDefault = true
    await loadMethods()
    toast.add({ title: 'Payment method saved', color: 'success' })
  } catch (err: unknown) {
    toast.add({
      title: 'Save failed',
      description: parseApiError(err, 'Could not save payment method.'),
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}

async function handleSetDefault(id: string) {
  submitting.value = true
  try {
    await paymentService.setDefaultEmployerPaymentMethod(id)
    await loadMethods()
  } catch (err: unknown) {
    toast.add({
      title: 'Update failed',
      description: parseApiError(err, 'Could not set default.'),
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}

function askDelete(id: string) {
  deleteId.value = id
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!deleteId.value) {
    return
  }
  submitting.value = true
  try {
    await paymentService.deleteEmployerPaymentMethod(deleteId.value)
    deleteOpen.value = false
    deleteId.value = null
    await loadMethods()
    toast.add({ title: 'Payment method removed', color: 'success' })
  } catch (err: unknown) {
    toast.add({
      title: 'Delete failed',
      description: parseApiError(err, 'Could not remove payment method.'),
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}

const columns = [
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'label', header: 'Label' },
  { accessorKey: 'masked_value', header: 'Details' },
  { accessorKey: 'is_default', header: 'Default' },
  { accessorKey: 'actions', header: 'Actions' }
]
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-lg font-semibold">
        Saved payment methods
      </h3>
      <UButton
        size="sm"
        icon="i-lucide-plus"
        :label="showForm ? 'Cancel' : 'Add payment method'"
        @click="showForm = !showForm"
      />
    </div>

    <UCard v-if="showForm" :ui="{ body: 'space-y-4' }">
      <div class="grid gap-4 md:grid-cols-3">
        <UFormField label="Type">
          <USelect
            v-model="formState.type"
            :items="[
              { label: 'M-PESA', value: 'mpesa' },
              { label: 'PayPal', value: 'paypal' }
            ]"
            value-key="value"
            label-key="label"
          />
        </UFormField>
        <UFormField label="Label (optional)">
          <UInput v-model="formState.label" placeholder="e.g. Finance M-PESA" />
        </UFormField>
        <UFormField :label="formState.type === 'mpesa' ? 'Phone number' : 'PayPal email'">
          <UInput
            v-model="formState.rawValue"
            :placeholder="formState.type === 'mpesa' ? '2547…' : 'you@example.com'"
          />
        </UFormField>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <UCheckbox v-model="formState.setAsDefault" label="Set as default" />
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancel"
            @click="showForm = false"
          />
          <UButton :loading="submitting" label="Save" @click="() => void handleCreate()" />
        </div>
      </div>
    </UCard>

    <div v-if="loading" class="space-y-2">
      <USkeleton class="h-10 w-full" />
      <USkeleton class="h-10 w-full" />
    </div>
    <UTable
      v-else-if="methods.length"
      :data="methods"
      :columns="columns"
      class="w-full"
    >
      <template #type-cell="{ row }">
        <span class="font-medium">{{ row.original.type === 'mpesa' ? 'M-PESA' : 'PayPal' }}</span>
      </template>
      <template #label-cell="{ row }">
        {{ row.original.label || (row.original.type === 'mpesa' ? 'Mobile number' : 'PayPal account') }}
      </template>
      <template #masked_value-cell="{ row }">
        {{ row.original.masked_value }}
      </template>
      <template #is_default-cell="{ row }">
        <UBadge :color="row.original.is_default ? 'primary' : 'neutral'" variant="subtle">
          {{ row.original.is_default ? 'Default' : '—' }}
        </UBadge>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end gap-2">
          <UButton
            size="xs"
            variant="ghost"
            :disabled="row.original.is_default || submitting"
            label="Set default"
            @click="() => void handleSetDefault(row.original.id)"
          />
          <UButton
            size="xs"
            color="error"
            variant="ghost"
            :disabled="submitting"
            label="Remove"
            @click="askDelete(row.original.id)"
          />
        </div>
      </template>
    </UTable>
    <p v-else class="text-sm text-muted">
      No saved payment methods yet. Add one to speed up checkout.
    </p>

    <UModal
      v-model:open="deleteOpen"
      title="Delete payment method?"
      description="You can add it again later if needed."
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
            :loading="submitting"
            @click="() => void confirmDelete()"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
