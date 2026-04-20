<script setup lang="ts">
import { subscriptionService } from '~~/services/subscriptions.service'

definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'Settings — Billing',
  description: 'Subscriptions, invoices, plans, and saved payment methods.'
})

const route = useRoute()
const router = useRouter()

type BillingTab = 'subscriptions' | 'invoices' | 'plans'

const activeTab = ref<BillingTab>('subscriptions')

watch(
  () => route.query.tab,
  (tab) => {
    const t = String(tab || '').toLowerCase()
    if (t === 'subscriptions' || t === 'invoices' || t === 'plans') {
      activeTab.value = t as BillingTab
    }
  },
  { immediate: true }
)

watch(activeTab, (tab) => {
  void router.replace({ query: { ...route.query, tab } })
})

const { data: subscriptionsPayload, status, refresh } = subscriptionService.getSubscriptions()

const loading = computed(() => status.value === 'pending')

const allRows = computed(() => {
  const v = subscriptionsPayload.value
  if (Array.isArray(v)) {
    return v
  }
  if (v && typeof v === 'object' && Array.isArray((v as { results?: unknown[] }).results)) {
    return (v as { results: unknown[] }).results
  }
  return []
})

const subscriptions = computed(() => {
  return allRows.value.filter((sub: { status?: string }) =>
    sub.status === 'ACTIVE' || sub.status === 'PREPAID' || sub.status === 'EXPIRED'
  )
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <UPageCard
      title="Billing"
      description="Review subscriptions, invoices, available plans, and saved payment methods."
      variant="naked"
    />

    <div class="flex flex-wrap gap-2">
      <UButton
        :variant="activeTab === 'subscriptions' ? 'solid' : 'outline'"
        label="Subscriptions"
        @click="activeTab = 'subscriptions'"
      />
      <UButton
        :variant="activeTab === 'invoices' ? 'solid' : 'outline'"
        label="Invoices"
        @click="activeTab = 'invoices'"
      />
      <UButton
        :variant="activeTab === 'plans' ? 'solid' : 'outline'"
        label="Plans"
        @click="activeTab = 'plans'"
      />
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="ghost"
        :loading="loading"
        class="ms-auto"
        label="Refresh"
        @click="() => void refresh()"
      />
    </div>

    <div v-show="activeTab === 'subscriptions'">
      <SettingsBillingSubscriptions :rows="subscriptions" :loading="loading" />
    </div>
    <div v-show="activeTab === 'invoices'">
      <SettingsBillingInvoices :rows="allRows as never" :loading="loading" />
    </div>
    <div v-show="activeTab === 'plans'" class="flex flex-col gap-8">
      <SettingsBillingPlans />
      <SettingsBillingPaymentMethods />
    </div>
  </div>
</template>
