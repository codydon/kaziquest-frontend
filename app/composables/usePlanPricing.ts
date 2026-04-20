export type BillingCycle = 'MONTHLY' | 'HALF_YEARLY' | 'YEARLY'

export interface SubscriptionPlanPricing {
  KES_amount?: string | number | null
  USD_amount?: string | number | null
  vat_rate?: number | null
  semi_annual_discount_pct?: number | null
  annual_discount_pct?: number | null
}

export function usePlanPricing() {
  function computePeriodAmount(
    plan: SubscriptionPlanPricing | null,
    billingCycle: BillingCycle,
    currency: 'KES' | 'USD'
  ): { amount: number, totalAmount: number, vatAmount: number } {
    if (!plan) {
      return { amount: 0, totalAmount: 0, vatAmount: 0 }
    }

    const monthlyRateKes = plan.KES_amount != null ? Number(plan.KES_amount) : null
    const monthlyRateUsd = plan.USD_amount != null ? Number(plan.USD_amount) : null
    const yearlyRate = (currency === 'USD'
      ? monthlyRateUsd
      : monthlyRateKes)
    const yearlyRateComputed = yearlyRate != null ? yearlyRate * 12 : null
    const monthlyRate = currency === 'USD'
      ? monthlyRateUsd
      : monthlyRateKes

    const vatRate = Number(plan.vat_rate ?? 0)
    const semiAnnualDiscount = Number(plan.semi_annual_discount_pct ?? 0)
    const annualDiscount = Number(plan.annual_discount_pct ?? 0)

    let baseAmount: number
    let discountPct: number

    if (billingCycle === 'MONTHLY') {
      baseAmount = monthlyRate ?? 0
      discountPct = 0
    } else if (billingCycle === 'HALF_YEARLY') {
      const monthly = monthlyRate ?? 0
      baseAmount = monthly * 6
      discountPct = semiAnnualDiscount
    } else {
      baseAmount = yearlyRateComputed ?? (monthlyRate != null ? monthlyRate * 12 : 0)
      discountPct = annualDiscount
    }

    const discountedAmount = baseAmount * (1 - discountPct / 100)
    const vatAmount = (vatRate / 100) * discountedAmount
    const totalAmount = discountedAmount + vatAmount

    return {
      amount: Math.round(discountedAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100
    }
  }

  return { computePeriodAmount }
}
