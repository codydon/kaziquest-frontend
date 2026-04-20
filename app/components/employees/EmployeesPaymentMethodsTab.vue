<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import * as z from 'zod'
import type { EmployeePaymentMethod } from '~/types/employee'
import { employeeService } from '~~/services/employee.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  employeeId: string
}>()

const toast = useToast()
const { isBaseLevelEmployee } = useRolePermissionGuard()
const UButton = resolveComponent('UButton')

const accountTypeItems = [
  'Bank Account',
  'Mobile Wallet',
  'Cash',
  'Other Financial Institution'
].map(item => ({ label: item, value: item }))

const bankNames = [
  'KCB Bank Kenya Ltd',
  'Equity Bank Kenya Ltd',
  'Co-operative Bank of Kenya Ltd',
  'ABSA Bank Kenya Plc',
  'Standard Chartered Bank Kenya Ltd',
  'Stanbic Bank Kenya Ltd',
  'NCBA Bank Kenya Plc',
  'I&M Bank Ltd',
  'Diamond Trust Bank Kenya Ltd',
  'Family Bank Ltd',
  'Bank of Africa Kenya Ltd',
  'Prime Bank Ltd',
  'Guaranty Trust Bank Kenya Ltd'
].map(item => ({ label: item, value: item }))

const walletItems = ['Mpesa', 'Airtel Money'].map(item => ({ label: item, value: item }))

const schema = z.object({
  account_type: z.string().min(1, 'Payment type is required'),
  bank_name: z.string().optional(),
  account_name: z.string().optional(),
  account_number: z.string().optional(),
  bank_branch: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  is_primary: z.boolean(),
  is_active: z.boolean(),
  comments: z.string().optional()
})

type Schema = z.output<typeof schema>

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const rows = ref<EmployeePaymentMethod[]>([])
const modalOpen = ref(false)
const editing = ref<EmployeePaymentMethod | null>(null)
const mobileWalletName = ref('Mpesa')

const state = reactive<Schema>({
  account_type: 'Bank Account',
  bank_name: 'KCB Bank Kenya Ltd',
  account_name: '',
  account_number: '',
  bank_branch: '',
  currency: 'ksh',
  is_primary: true,
  is_active: true,
  comments: ''
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
  if (Array.isArray((inner as Record<string, unknown>).value)) {
    return (inner as Record<string, unknown>).value as T[]
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
    const res = await employeeService.getEmployeePaymentMethods(props.employeeId, {
      handler: '$fetch',
      secured: true
    })
    rows.value = unwrapList<EmployeePaymentMethod>(res)
  } catch (error: unknown) {
    rows.value = []
    toast.add({
      title: 'Unable to load payment methods',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

watch(() => props.employeeId, () => void load(), { immediate: true })

watch(() => state.account_type, (type) => {
  if (type === 'Cash') {
    state.account_number = ''
    state.bank_branch = 'Cash'
    state.account_name = 'Cash'
  } else if (type === 'Mobile Wallet') {
    state.account_name = mobileWalletName.value
    state.bank_branch = ''
  } else if (type === 'Bank Account') {
    state.account_name = state.bank_name || ''
  }
})

watch(mobileWalletName, (wallet) => {
  if (state.account_type === 'Mobile Wallet') {
    state.account_name = wallet
  }
})

function resetForm() {
  state.account_type = 'Bank Account'
  state.bank_name = 'KCB Bank Kenya Ltd'
  state.account_name = ''
  state.account_number = ''
  state.bank_branch = ''
  state.currency = 'ksh'
  state.is_primary = true
  state.is_active = true
  state.comments = ''
  mobileWalletName.value = 'Mpesa'
}

function openCreate() {
  editing.value = null
  resetForm()
  modalOpen.value = true
}

function openEdit(row: EmployeePaymentMethod) {
  editing.value = row
  state.account_type = String(row.account_type || 'Bank Account')
  state.bank_name = String(row.bank_name || 'KCB Bank Kenya Ltd')
  state.account_name = String(row.account_name || '')
  state.account_number = row.account_number ?? ''
  state.bank_branch = String(row.bank_branch || '')
  state.currency = String(row.currency || 'ksh')
  state.is_primary = Boolean(row.is_primary)
  state.is_active = Boolean(row.is_active)
  state.comments = String(row.comments || '')
  modalOpen.value = true
}

function buildBody() {
  const body: Record<string, unknown> = {
    employee: props.employeeId,
    account_number: state.account_type === 'Cash' ? null : state.account_number,
    account_name: state.account_type === 'Mobile Wallet'
      ? mobileWalletName.value
      : (state.account_type === 'Bank Account' ? state.bank_name : state.account_name),
    account_type: state.account_type,
    bank_name: state.account_type === 'Mobile Wallet' ? mobileWalletName.value : state.bank_name,
    bank_branch: state.account_type === 'Cash' ? 'Cash' : state.bank_branch,
    currency: state.currency,
    is_primary: state.is_primary,
    is_active: state.is_active,
    comments: state.comments
  }
  if (state.account_type === 'Cash') {
    body.account_name = 'Cash'
  }
  return body
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  saving.value = true
  try {
    if (editing.value?.id) {
      await employeeService.updateEmployeePaymentMethod(String(editing.value.id), {
        handler: '$fetch',
        secured: true,
        body: buildBody()
      })
      toast.add({ title: 'Payment method updated', color: 'success' })
    } else {
      await employeeService.addEmployeePaymentMethod({
        handler: '$fetch',
        secured: true,
        body: buildBody()
      })
      toast.add({ title: 'Payment method added', color: 'success' })
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

async function remove(row: EmployeePaymentMethod) {
  if (!row.id) {
    return
  }
  deletingId.value = String(row.id)
  try {
    await employeeService.deleteEmployeePaymentMethod(String(row.id), {
      handler: '$fetch',
      secured: true
    })
    toast.add({ title: 'Payment method deleted', color: 'success' })
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

const columns: TableColumn<EmployeePaymentMethod>[] = [
  {
    accessorKey: 'account_name',
    header: 'Name',
    cell: ({ row }) => row.original.account_type === 'Cash'
      ? 'Cash'
      : (row.original.bank_name || row.original.account_name || '—')
  },
  {
    accessorKey: 'account_number',
    header: 'Account Number',
    cell: ({ row }) => row.original.account_type === 'Cash' ? '—' : (row.original.account_number || '—')
  },
  {
    accessorKey: 'bank_branch',
    header: 'Bank Branch',
    cell: ({ row }) => row.original.account_type === 'Cash' ? '—' : (row.original.bank_branch || '—')
  },
  { accessorKey: 'currency', header: 'Currency' },
  {
    accessorKey: 'is_primary',
    header: 'Primary',
    cell: ({ row }) => row.original.is_primary ? 'Yes' : 'No'
  },
  {
    accessorKey: 'is_active',
    header: 'Active',
    cell: ({ row }) => row.original.is_active ? 'Yes' : 'No'
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
          Payment methods
        </h3>
        <p class="text-sm text-muted">
          Salary disbursement accounts and wallets for this employee.
        </p>
      </div>
      <UButton
        v-if="!isBaseLevelEmployee"
        icon="i-lucide-plus"
        label="Add payment method"
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
      :title="editing?.id ? 'Update payment method' : 'Add payment method'"
    >
      <UForm
        id="employee-payment-method-form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Payment type" name="account_type" required>
          <USelect
            v-model="state.account_type"
            :items="accountTypeItems"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
        <UFormField v-if="state.account_type === 'Bank Account'" label="Bank name" name="bank_name">
          <USelect
            v-model="state.bank_name"
            :items="bankNames"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
        <UFormField v-if="state.account_type === 'Mobile Wallet'" label="Wallet" name="bank_name">
          <USelect
            v-model="mobileWalletName"
            :items="walletItems"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>
        <UFormField
          v-if="state.account_type === 'Other Financial Institution'"
          label="Institution name"
          name="bank_name"
        >
          <UInput v-model="state.bank_name" class="w-full" />
        </UFormField>
        <UFormField
          v-if="state.account_type !== 'Cash'"
          :label="state.account_type === 'Mobile Wallet' ? 'Phone number' : 'Account number'"
          name="account_number"
        >
          <UInput v-model="state.account_number" class="w-full" />
        </UFormField>
        <UFormField
          v-if="state.account_type === 'Bank Account' || state.account_type === 'Other Financial Institution'"
          label="Account name"
          name="account_name"
        >
          <UInput v-model="state.account_name" class="w-full" />
        </UFormField>
        <UFormField
          v-if="state.account_type === 'Bank Account' || state.account_type === 'Other Financial Institution'"
          label="Bank branch"
          name="bank_branch"
        >
          <UInput v-model="state.bank_branch" class="w-full" />
        </UFormField>
        <UFormField label="Currency" name="currency">
          <UInput v-model="state.currency" class="w-full" />
        </UFormField>
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField name="is_primary">
            <UCheckbox v-model="state.is_primary" label="Set as primary" />
          </UFormField>
          <UFormField name="is_active">
            <UCheckbox v-model="state.is_active" label="Set as active" />
          </UFormField>
        </div>
        <UFormField label="Comments" name="comments">
          <UTextarea v-model="state.comments" class="w-full" autoresize />
        </UFormField>
      </UForm>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="modalOpen = false" />
          <UButton
            form="employee-payment-method-form"
            :loading="saving"
            :label="editing?.id ? 'Save changes' : 'Save'"
            type="submit"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
