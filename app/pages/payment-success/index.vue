<script setup lang="ts">
import { ROUTE_LIST } from '~/constants/routeList'
import paymentSuccessMiddleware from '~~/middleware/payment-success'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: [paymentSuccessMiddleware]
})

const authStore = useAuthStore()

const company = computed(() => {
  const user = authStore.user as { company?: { name?: string } }
  return user?.company ?? {}
})

const pageTitle = computed(() => `${company.value?.name || 'KaziQuest'} - Payment Success`)

useSeoMeta({
  title: pageTitle,
  ogTitle: pageTitle,
  description: 'Hire smart | Onboarding | People Management',
  ogDescription: 'This is my amazing site, let me tell you all about it.'
})

function pushDataLayer(payload: Record<string, unknown>) {
  if (!import.meta.client) {
    return
  }
  const w = window as Window & { dataLayer?: Record<string, unknown>[] }
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push(payload)
}

onMounted(() => {
  pushDataLayer({
    event: 'subscription_payment',
    companyName: company.value?.name || 'KaziQuest',
    paymentStatus: 'success'
  })
})

function handleReturnClick() {
  pushDataLayer({
    event: 'button_click',
    eventName: 'return_to_dashboard'
  })
  void navigateTo(ROUTE_LIST.home)
}
</script>

<template>
  <div class="mx-2 flex h-[88vh] items-center justify-center rounded-lg bg-white">
    <UCard
      class="w-full max-w-md transform bg-gradient-to-r from-blue-50 to-green-50 shadow-md transition-transform hover:scale-105"
      :ui="{ body: 'space-y-6 p-8' }"
    >
      <div class="flex flex-col items-center gap-6">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <UIcon name="i-lucide-check" class="h-10 w-10 text-blue-500" />
        </div>
        <div class="space-y-2 text-center">
          <h1 class="text-4xl font-semibold text-gray-800">
            Payment Received
          </h1>
          <p class="text-2xl text-gray-600">
            We have successfully received your payment.
          </p>
        </div>
        <UButton
          color="primary"
          size="lg"
          class="rounded-full px-8 font-semibold"
          @click="handleReturnClick"
        >
          Return to Dashboard
        </UButton>
      </div>
    </UCard>
  </div>
</template>
