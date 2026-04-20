<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { formatNumber } from '~/utils/formatNumbers'
import { walletService } from '~~/services/wallet.service'

definePageMeta({
  layout: 'default'
})

const router = useRouter()
const toast = useToast()
const { toDateTime } = usePayrollDates()

interface WalletRow {
  available_balance?: number | string
  actual_balance?: number | string
  payments_in?: number | string
  payments_out?: number | string
}

interface WalletTransactionRow {
  id: string
  transaction_type?: string
  created_at?: string
  code?: string
  total_amount_due?: number | string
  status?: string
}

const {
  data: walletData,
  error: walletDataError,
  refresh: walletDataRefresh,
  status: walletDataStatus
} = await walletService.getCompanyWallet() as {
  data: Ref<WalletRow[] | null>
  error: Ref<unknown>
  refresh: () => Promise<void>
  status: Ref<string>
}

const loadingWalletData = computed(() => walletDataStatus.value === 'pending')

const {
  data: walletTransactions,
  status: walletTransactionsStatus,
  refresh: walletTransactionsRefresh
} = await walletService.getWalletTransactions() as {
  data: Ref<WalletTransactionRow[] | { results?: WalletTransactionRow[] } | null>
  status: Ref<string>
  refresh: () => Promise<void>
}

const loadingWalletTransactions = computed(() => walletTransactionsStatus.value === 'pending')

onMounted(() => {
  void walletDataRefresh()
  void walletTransactionsRefresh()
})

const walletTransactionsColumns: TableColumn<WalletTransactionRow>[] = [
  { accessorKey: 'transaction_type', header: 'Type' },
  { accessorKey: 'created_at', header: 'Date and time' },
  { accessorKey: 'code', header: 'Transaction code' },
  { accessorKey: 'total_amount_due', header: 'Amount' },
  { accessorKey: 'status', header: 'Status' }
]

const txRows = computed(() => {
  const raw = walletTransactions.value
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object' && 'results' in raw && Array.isArray((raw as { results?: WalletTransactionRow[] }).results)) {
    return (raw as { results: WalletTransactionRow[] }).results
  }
  return []
})

const withdrawalAmount = ref<number | null>(null)
const withdrawalAmountError = ref('')

const handleWithdraw = async () => {
  withdrawalAmountError.value = ''
  const amt = withdrawalAmount.value
  if (amt == null || amt < 500) {
    withdrawalAmountError.value = 'Minimum withdrawal amount is KES 500'
    return
  }

  const ok = confirm('Request this withdrawal from the company wallet?')
  if (!ok) return

  const { error } = await walletService.requestWithdrawal({ body: { amount: amt } })

  if (error?.value) {
    toast.add({
      icon: 'i-heroicons-x-circle',
      title: 'Withdrawal failed',
      color: 'error'
    })
    return
  }

  withdrawalAmount.value = null
  void walletTransactionsRefresh()
  toast.add({
    icon: 'i-heroicons-check-circle',
    title: 'Withdrawal requested',
    color: 'success'
  })
}
</script>

<template>
  <div>
    <UProgress v-if="loadingWalletData || loadingWalletTransactions" animation="carousel" />
    <div>
      <UButton
        class="mb-2"
        icon="i-heroicons-chevron-left"
        label="Back"
        variant="ghost"
        @click="router.back()"
      />
      <UCard>
        <div class="flex flex-col gap-8">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-highlighted">
              Balances
            </h1>
            <UButton
              variant="outline"
              label="Refresh"
              :loading="loadingWalletData || loadingWalletTransactions"
              @click="[walletDataRefresh(), walletTransactionsRefresh()]"
            />
          </div>

          <UAlert
            v-if="walletDataError"
            color="error"
            variant="soft"
            title="Could not load wallet"
          />

          <div
            v-if="walletData?.length"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <UCard>
              <p class="text-sm text-muted">
                KES
              </p>
              <h2 class="text-2xl font-semibold">
                {{ formatNumber(walletData[0]?.available_balance) }}
              </h2>
              <p class="text-sm text-muted">
                Available balance
              </p>
            </UCard>
            <UCard>
              <p class="text-sm text-muted">
                KES
              </p>
              <h2 class="text-2xl font-semibold">
                {{ formatNumber(walletData[0]?.actual_balance) }}
              </h2>
              <p class="text-sm text-muted">
                Actual balance
              </p>
            </UCard>
            <UCard>
              <p class="text-sm text-muted">
                KES
              </p>
              <h2 class="text-2xl font-semibold">
                {{ formatNumber(walletData[0]?.payments_in) }}
              </h2>
              <p class="text-sm text-muted">
                Payments in
              </p>
            </UCard>
            <UCard>
              <p class="text-sm text-muted">
                KES
              </p>
              <h2 class="text-2xl font-semibold">
                {{ formatNumber(walletData[0]?.payments_out) }}
              </h2>
              <p class="text-sm text-muted">
                Payments out
              </p>
            </UCard>
          </div>

          <UCard>
            <div class="flex flex-wrap gap-4">
              <UTooltip text="Wallet top-up UI is not wired in this build yet.">
                <UButton label="Top up balance" disabled />
              </UTooltip>
              <div class="flex flex-wrap gap-3">
                <div>
                  <UInput
                    v-model.number="withdrawalAmount"
                    type="number"
                    placeholder="Withdrawal amount (KES)"
                  />
                  <p v-if="withdrawalAmountError" class="mt-1 text-sm text-error">
                    {{ withdrawalAmountError }}
                  </p>
                </div>
                <UButton label="Request withdraw" @click="handleWithdraw" />
              </div>
            </div>
          </UCard>

          <UTable :data="txRows" :columns="walletTransactionsColumns">
            <template #transaction_type-cell="{ row }">
              <p class="text-sm capitalize">
                {{ row.original.transaction_type }}
              </p>
            </template>
            <template #total_amount_due-cell="{ row }">
              <p class="text-sm">
                KES {{ formatNumber(row.original.total_amount_due) }}
              </p>
            </template>
            <template #code-cell="{ row }">
              <p class="text-sm">
                {{ row.original.code?.slice(0, 6) }}
              </p>
            </template>
            <template #created_at-cell="{ row }">
              <p class="text-sm">
                {{ row.original.created_at ? toDateTime(row.original.created_at) : '—' }}
              </p>
            </template>
            <template #status-cell="{ row }">
              <p class="text-sm capitalize">
                {{ row.original.status }}
              </p>
            </template>
          </UTable>
        </div>
      </UCard>
    </div>
  </div>
</template>
