export interface InvoiceLikeRow {
  total_amount?: number | null
  amount?: number | null
  vat_rate?: number | null
  amount_paid?: number | null
  paid_infull?: boolean
}

export function calculateInvoiceTotal(invoice: Partial<InvoiceLikeRow> = {}) {
  if (invoice.total_amount != null) {
    return Number(invoice.total_amount)
  }

  const amount = Number(invoice.amount ?? 0)
  const vatRate = Number(invoice.vat_rate ?? 0)
  return amount + (vatRate / 100) * amount
}

export function getInvoicePaymentStatus(invoice: Partial<InvoiceLikeRow> = {}) {
  const totalAmount = calculateInvoiceTotal(invoice)
  const amountPaid = Number(invoice.amount_paid ?? 0)

  if (invoice.paid_infull || (totalAmount > 0 && amountPaid >= totalAmount)) {
    return 'Paid'
  }

  if (amountPaid > 0) {
    return 'Partially Paid'
  }

  return 'Unpaid'
}
