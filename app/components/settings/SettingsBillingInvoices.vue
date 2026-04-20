<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { subscriptionService } from '~~/services/subscriptions.service'
import { calculateInvoiceTotal, getInvoicePaymentStatus } from '~/utils/invoices'
import { parseApiError } from '~/utils/parseApiError'
import { useSubscriptionStore } from '~/stores/subscriptions'

interface InvoiceRow {
  id?: string
  code?: string
  plan?: { title?: string, id?: string }
  total_amount?: number | null
  amount?: number | null
  vat_rate?: number | null
  amount_paid?: number | null
  paid_infull?: boolean
  currency?: string
  created_at?: string
  start_date?: string
  activate_date?: string
  expiry_date?: string
  is_trial?: boolean
}

const props = defineProps<{
  rows: InvoiceRow[]
  loading: boolean
}>()

const toast = useToast()
const subscriptionStore = useSubscriptionStore()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const NuxtTime = resolveComponent('NuxtTime')

const sortedRows = computed(() => {
  return [...props.rows]
    .filter(invoice => invoice?.is_trial !== false)
    .sort((a, b) => {
      const aTime = new Date(a?.created_at || a?.start_date || a?.activate_date || 0).getTime()
      const bTime = new Date(b?.created_at || b?.start_date || b?.activate_date || 0).getTime()
      return bTime - aTime
    })
})

function payStatusColor(status: string) {
  if (status === 'Paid') {
    return 'success'
  }
  if (status === 'Partially Paid') {
    return 'warning'
  }
  return 'error'
}

function sanitizeFilenamePart(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

function buildInvoiceFilename(invoice: InvoiceRow) {
  const code = sanitizeFilenamePart(String(invoice.code || 'invoice'))
  const dateSource = invoice.created_at || invoice.activate_date
  const date = dateSource ? new Date(dateSource).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  return `KaziQuest_Invoice_${code}_${date}.pdf`
}

async function downloadPdf(invoice: InvoiceRow) {
  if (!invoice.id) {
    return
  }
  try {
    const response = await subscriptionService.getInvoicePdf(invoice.id) as Blob
    const blob = new Blob([response], { type: 'application/pdf' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = buildInvoiceFilename(invoice)
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000)
  } catch (err: unknown) {
    toast.add({
      title: 'Download failed',
      description: parseApiError(err, 'Could not download invoice PDF.'),
      color: 'error'
    })
  }
}

function goPay(invoice: InvoiceRow) {
  subscriptionStore.setSelectedSubscription(invoice as Record<string, unknown>)
  const planId = typeof invoice.plan === 'object' && invoice.plan?.id
    ? invoice.plan.id
    : undefined
  void navigateTo(`/checkout/subscription/${invoice.id || planId || ''}`)
}

function periodCell(row: InvoiceRow) {
  const start = row.start_date || row.activate_date
  const end = row.expiry_date
  const children: ReturnType<typeof h>[] = []
  if (start) {
    children.push(h(NuxtTime, { datetime: start, month: 'short', day: '2-digit', year: 'numeric' }))
  } else {
    children.push(h('span', {}, '—'))
  }
  children.push(h('span', { class: 'mx-1' }, '—'))
  if (end) {
    children.push(h(NuxtTime, { datetime: end, month: 'short', day: '2-digit', year: 'numeric' }))
  } else {
    children.push(h('span', {}, '—'))
  }
  return h('span', { class: 'inline-flex flex-wrap items-center gap-1 text-sm' }, children)
}

const columns: TableColumn<InvoiceRow>[] = [
  {
    accessorKey: 'code',
    header: 'Number',
    cell: ({ row }) => row.original.code ?? '—'
  },
  {
    accessorKey: 'period',
    header: 'Period',
    cell: ({ row }) => periodCell(row.original)
  },
  {
    accessorKey: 'type',
    header: 'Plan',
    cell: ({ row }) => row.original.plan?.title ?? '—'
  },
  {
    accessorKey: 'total_amount',
    header: 'Total',
    cell: ({ row }) => {
      const r = row.original
      const cur = r.currency === 'USD' ? 'USD' : 'KES'
      return `${cur} ${calculateInvoiceTotal(r).toFixed(2)}`
    }
  },
  {
    accessorKey: 'pay-status',
    header: 'Status',
    cell: ({ row }) => {
      const status = getInvoicePaymentStatus(row.original)
      return h(UBadge, { color: payStatusColor(status), variant: 'subtle' }, () => status)
    }
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const r = row.original
      const buttons = [
        h(UButton, {
          size: 'xs',
          variant: 'outline',
          label: 'Download',
          icon: 'i-lucide-download',
          onClick: () => void downloadPdf(r)
        })
      ]
      if (r.paid_infull !== true) {
        buttons.push(h(UButton, {
          size: 'xs',
          variant: 'outline',
          color: 'primary',
          label: 'Pay',
          icon: 'i-lucide-credit-card',
          onClick: () => goPay(r)
        }))
      }
      return h('div', { class: 'flex flex-wrap gap-2' }, buttons)
    }
  }
]
</script>

<template>
  <div>
    <UTable
      :data="sortedRows"
      :columns="columns"
      :loading="loading"
      class="w-full"
    />
    <p v-if="!loading && !sortedRows.length" class="mt-4 text-center text-sm text-muted">
      No invoices yet.
    </p>
  </div>
</template>
