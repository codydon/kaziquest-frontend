<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'

interface SubscriptionRow {
  plan_title?: string
  amount?: number
  currency?: string
  status?: string
  start_date?: string
  activate_date?: string
  expiry_date?: string
  plan?: { title?: string, job_limit?: number | null, employee_limit?: number | null }
  job_posting_credit?: number | null
  add_employee_credit?: number | null
}

defineProps<{
  rows: SubscriptionRow[]
  loading: boolean
}>()

const UBadge = resolveComponent('UBadge')

function formatLimitValue(value: number | null | undefined) {
  if (value == null) {
    return 'Unlimited'
  }
  return String(value)
}

function formatMoney(amount: number | undefined, currency: string | undefined) {
  const cur = currency === 'USD' ? 'USD' : 'KES'
  const n = Number(amount ?? 0)
  return `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(value: string | undefined) {
  if (!value) {
    return '—'
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return '—'
  }
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

function statusColor(status: string | undefined) {
  if (status === 'ACTIVE') {
    return 'success'
  }
  if (status === 'PREPAID') {
    return 'info'
  }
  if (status === 'EXPIRED') {
    return 'error'
  }
  return 'neutral'
}

function employeeLimitCell(row: SubscriptionRow) {
  const lim = row.plan?.employee_limit
  const rem = row.add_employee_credit
  const lines = [`Limit: ${formatLimitValue(lim)}`]
  if (row.status === 'ACTIVE') {
    lines.push(`Remainder: ${formatLimitValue(rem)}`)
  }
  return lines.join('\n')
}

function jobLimitCell(row: SubscriptionRow) {
  const lim = row.plan?.job_limit
  const rem = row.job_posting_credit
  const lines = [`Limit: ${formatLimitValue(lim)}`]
  if (row.status === 'ACTIVE') {
    lines.push(`Remainder: ${formatLimitValue(rem)}`)
  }
  return lines.join('\n')
}

const columns: TableColumn<SubscriptionRow>[] = [
  {
    accessorKey: 'plan_title',
    header: 'Billing plan',
    cell: ({ row }) => row.original.plan?.title ?? row.original.plan_title ?? '—'
  },
  {
    accessorKey: 'amount',
    header: 'Plan cost',
    cell: ({ row }) => formatMoney(row.original.amount, row.original.currency)
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(
        UBadge,
        { color: statusColor(row.original.status), variant: 'subtle', class: 'uppercase' },
        () => row.original.status ?? '—'
      )
  },
  {
    accessorKey: 'employee_limit',
    header: 'Employee limit',
    cell: ({ row }) =>
      h('span', { class: 'whitespace-pre-line text-sm' }, employeeLimitCell(row.original))
  },
  {
    accessorKey: 'job_limit',
    header: 'Job limit',
    cell: ({ row }) =>
      h('span', { class: 'whitespace-pre-line text-sm' }, jobLimitCell(row.original))
  },
  {
    accessorKey: 'start_date',
    header: 'Start date',
    cell: ({ row }) => formatDate(row.original.start_date || row.original.activate_date)
  },
  {
    accessorKey: 'expiry_date',
    header: 'Expiry date',
    cell: ({ row }) => formatDate(row.original.expiry_date)
  }
]
</script>

<template>
  <div>
    <UTable
      :data="rows"
      :columns="columns"
      :loading="loading"
      class="w-full"
    />
    <p v-if="!loading && !rows.length" class="mt-4 text-center text-sm text-muted">
      No subscriptions yet.
    </p>
  </div>
</template>
