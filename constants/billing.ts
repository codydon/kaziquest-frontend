import type { BillingCycle } from '~/types';

export const BILLING_CYCLE_OPTIONS: { value: BillingCycle; label: string; badge?: string }[] = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'HALF_YEARLY', label: 'Semi-Annual' },
  { value: 'YEARLY', label: 'Yearly', badge: 'Best value' },
];

export const BILLING_CYCLE_MONTHS: Record<BillingCycle, number> = {
  MONTHLY: 1,
  HALF_YEARLY: 6,
  YEARLY: 12,
};
