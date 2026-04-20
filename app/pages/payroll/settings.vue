<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const authStore = useAuthStore()

const tabItems = [
  { label: 'Schedule', value: 'schedule' },
  { label: 'Mass deductions', value: 'mass' }
]

const selectedTab = ref(route.query.tab === 'mass' ? 'mass' : 'schedule')

watch(
  () => route.query.tab,
  (t) => {
    selectedTab.value = t === 'mass' ? 'mass' : 'schedule'
  }
)

useSeoMeta({
  title: `${(authStore.user as { company?: { name?: string } })?.company?.name || 'KaziQuest'} - Payroll settings`,
  description: 'Payroll schedule and mass deductions'
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold text-highlighted">
        Payroll settings
      </h1>
      <p class="text-sm text-muted">
        Company pay schedule and mass deductions.
      </p>
    </div>

    <UTabs
      v-model="selectedTab"
      :items="tabItems"
      :content="false"
      class="w-full"
    />

    <div v-show="selectedTab === 'schedule'" class="mt-4">
      <PayrollCompanyScheduleForm @validate-step="void 0" />
    </div>
    <div v-show="selectedTab === 'mass'" class="mt-4">
      <PayrollMassDeductionManagement />
    </div>
  </div>
</template>
