<script setup lang="ts">
import { unref } from 'vue'
import { planDetails } from '~~/constants/planData'
import { planService } from '~~/services/plans.service'
import { parseApiError } from '~/utils/parseApiError'
import type { BillingCycle } from '~/composables/usePlanPricing'
import { usePlanPricing } from '~/composables/usePlanPricing'
import { useAuthStore } from '~/stores/auth'
import { useCompanyStore } from '~/stores/company'

interface SubscriptionPlan {
  id?: string
  title?: string
  description?: string
  vat_rate?: number
  KES_amount?: string
  USD_amount?: string
  semi_annual_discount_pct?: number | null
  annual_discount_pct?: number | null
  job_limit?: number | null
  employee_limit?: number | null
  is_addon?: boolean
  is_trial?: boolean
  is_hidden?: boolean
  is_quote_only?: boolean
  is_premium?: boolean
  is_basic?: boolean
  is_standard?: boolean
  is_growth?: boolean
  is_professional?: boolean
  features?: string[]
}

type PlanDetailsType = (typeof planDetails)[0]

const toast = useToast()
const authStore = useAuthStore()
const companyStore = useCompanyStore()
const { computePeriodAmount } = usePlanPricing()

const activeBillingCycle = computed(() => unref(companyStore.selectedBillingCycle) as BillingCycle)

const plans = ref<SubscriptionPlan[]>([])
const loading = ref(true)
const quoteOpen = ref(false)

const quoteUserEmail = computed(() =>
  (unref(authStore.user) as Record<string, unknown> | undefined)?.email as string | undefined
)

const currencies = [
  { country: 'kenya', val: 'KES' as const },
  { country: 'usa', val: 'USD' as const }
] as const

const selectedCurrency = ref<(typeof currencies)[number]>(currencies[0])

const currentPlanId = computed(() => {
  const u = unref(authStore.user) as Record<string, unknown> | undefined
  const company = u?.company as Record<string, unknown> | undefined
  const sub = company?.current_subscription as Record<string, unknown> | undefined
  const plan = sub?.plan as Record<string, unknown> | undefined
  const id = plan?.id
  return id != null ? String(id) : null
})

const displayPlans = computed(() => {
  if (!plans.value.length) {
    return []
  }
  return [...plans.value]
    .filter(plan => !plan.is_addon && !plan.is_trial && !plan.is_hidden)
    .sort((a, b) => {
      if (a.is_quote_only === b.is_quote_only) {
        return 0
      }
      return a.is_quote_only ? 1 : -1
    })
})

function benefitsFor(plan: SubscriptionPlan): PlanDetailsType | null {
  if (plan.is_basic) {
    return planDetails.find((p: PlanDetailsType) => p.planName === 'Starter') ?? null
  }
  if (plan.is_standard) {
    return planDetails.find((p: PlanDetailsType) => p.planName === 'Standard') ?? null
  }
  if (plan.is_growth) {
    return planDetails.find((p: PlanDetailsType) => p.planName === 'Growth') ?? null
  }
  if (plan.is_professional) {
    return planDetails.find((p: PlanDetailsType) => p.planName === 'Professional') ?? null
  }
  if (plan.is_premium) {
    return planDetails.find((p: PlanDetailsType) => p.planName === 'Premium') ?? null
  }
  return null
}

function summaryFeatures(plan: SubscriptionPlan) {
  const fromBackend = plan.features && plan.features.length ? plan.features : null
  const base = fromBackend ?? benefitsFor(plan)?.summaryFeatures ?? []
  return base.slice(0, 6)
}

function formatPrice(plan: SubscriptionPlan) {
  const cur = selectedCurrency.value.val
  const cycle = unref(companyStore.selectedBillingCycle) as BillingCycle
  const { amount } = computePeriodAmount(plan, cycle, cur)
  return `${cur === 'USD' ? '$' : 'KES '}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function periodLabel() {
  const cycle = unref(companyStore.selectedBillingCycle)
  if (cycle === 'YEARLY') {
    return 'per year'
  }
  if (cycle === 'HALF_YEARLY') {
    return 'per 6 months'
  }
  return 'per month'
}

function discountLabel(plan: SubscriptionPlan) {
  const cycle = unref(companyStore.selectedBillingCycle)
  if (cycle === 'HALF_YEARLY' && plan.semi_annual_discount_pct) {
    const val = Number(plan.semi_annual_discount_pct)
    if (!Number.isFinite(val) || val <= 0) {
      return null
    }
    return `${val.toFixed(0)}% off`
  }
  if (cycle === 'YEARLY' && plan.annual_discount_pct) {
    const val = Number(plan.annual_discount_pct)
    if (!Number.isFinite(val) || val <= 0) {
      return null
    }
    return `${val.toFixed(0)}% off`
  }
  return null
}

function isQuoteOnly(plan: SubscriptionPlan) {
  return Boolean(plan.is_quote_only || plan.is_premium)
}

function selectPlan(plan: SubscriptionPlan) {
  companyStore.setSelectedPlan(plan as Record<string, unknown>)
  companyStore.changeCurrency(selectedCurrency.value.val)
  void navigateTo({
    path: `/checkout/plan/${plan.id}`,
    query: { billingCycle: unref(companyStore.selectedBillingCycle) }
  })
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await planService.getPlans() as SubscriptionPlan[] | { results?: SubscriptionPlan[] }
    if (Array.isArray(res)) {
      plans.value = res
    } else if (res && typeof res === 'object' && Array.isArray(res.results)) {
      plans.value = res.results
    } else {
      plans.value = []
    }
  } catch (err: unknown) {
    toast.add({
      title: 'Could not load plans',
      description: parseApiError(err, 'Request failed.'),
      color: 'error'
    })
    plans.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-end gap-3">
      <div class="inline-flex items-center gap-1 rounded-full border border-default bg-muted/30 p-1">
        <button
          v-for="c in currencies"
          :key="c.val"
          type="button"
          class="rounded-full px-3 py-1.5 text-sm font-medium transition"
          :class="selectedCurrency.val === c.val ? 'bg-default text-default shadow-sm' : 'text-muted hover:text-default'"
          @click="selectedCurrency = c"
        >
          {{ c.val }}
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          size="sm"
          :variant="activeBillingCycle === 'MONTHLY' ? 'solid' : 'outline'"
          label="Monthly"
          @click="companyStore.setSelectedBillingCycle('MONTHLY')"
        />
        <UButton
          size="sm"
          :variant="activeBillingCycle === 'HALF_YEARLY' ? 'solid' : 'outline'"
          label="6 months"
          @click="companyStore.setSelectedBillingCycle('HALF_YEARLY')"
        />
        <UButton
          size="sm"
          :variant="activeBillingCycle === 'YEARLY' ? 'solid' : 'outline'"
          label="Yearly"
          @click="companyStore.setSelectedBillingCycle('YEARLY')"
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
    </div>

    <div
      v-else
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <UCard
        v-for="plan in displayPlans"
        :key="String(plan.id)"
        :ui="{ body: 'flex flex-1 flex-col gap-4' }"
        :class="plan.is_standard ? 'ring-2 ring-primary' : ''"
      >
        <template #header>
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-lg font-semibold">
              {{ plan.title }}
            </h3>
            <UBadge
              v-if="plan.id === currentPlanId"
              color="success"
              variant="subtle"
              label="Current"
            />
          </div>
          <p v-if="plan.description" class="text-sm text-muted line-clamp-2">
            {{ plan.description }}
          </p>
        </template>

        <div v-if="!isQuoteOnly(plan)" class="border-b border-default pb-4">
          <p class="text-2xl font-bold">
            {{ formatPrice(plan) }}
          </p>
          <div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{{ periodLabel() }}</span>
            <UBadge v-if="discountLabel(plan)" color="success" variant="subtle">
              {{ discountLabel(plan) }}
            </UBadge>
          </div>
        </div>
        <div v-else class="border-b border-default pb-4 text-sm text-muted">
          <p class="font-medium text-default">
            Custom pricing
          </p>
          <p>Tailored pricing based on your needs.</p>
        </div>

        <ul class="flex-1 space-y-2 text-sm">
          <li v-for="(feat, idx) in summaryFeatures(plan)" :key="idx" class="flex gap-2">
            <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{{ feat }}</span>
          </li>
        </ul>

        <UButton
          v-if="isQuoteOnly(plan)"
          block
          label="Request a quote"
          @click="quoteOpen = true"
        />
        <UButton
          v-else
          block
          :label="plan.id === currentPlanId ? 'Current plan' : 'Choose plan'"
          :variant="plan.id === currentPlanId ? 'soft' : 'solid'"
          :disabled="plan.id === currentPlanId"
          @click="selectPlan(plan)"
        />
      </UCard>
    </div>

    <UModal v-model:open="quoteOpen" title="Request a quote" description="We will respond with tailored pricing.">
      <div class="flex flex-col gap-3 text-sm text-muted">
        <p>
          Email
          <NuxtLink to="mailto:info@kaziquest.com" class="font-medium text-primary underline">
            info@kaziquest.com
          </NuxtLink>
          from {{ quoteUserEmail || 'your company email' }}.
        </p>
      </div>
      <template #footer>
        <UButton class="ms-auto" label="Close" @click="quoteOpen = false" />
      </template>
    </UModal>
  </div>
</template>
