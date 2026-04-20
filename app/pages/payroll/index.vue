<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default'
})

const authStore = useAuthStore()

const payrollTitle = computed(
  () => `${(authStore.user as { company?: { name?: string } })?.company?.name || 'KaziQuest'} - Payroll`
)

useSeoMeta({
  title: payrollTitle,
  description: 'View and manage payroll'
})
</script>

<template>
  <div class="space-y-4">
    <ClientOnly>
      <PayrollOverview v-if="authStore.isPayrollSetup" />
      <UCard v-else>
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">
            Complete payroll setup
          </h2>
        </template>
        <div class="space-y-4">
          <UAlert
            color="warning"
            variant="soft"
            title="Company KRA PIN required"
            description="Payroll is enabled after your company profile includes a KRA PIN. You can also configure schedule and mass deductions in payroll settings."
          />
          <div class="flex flex-wrap gap-2">
            <UButton to="/settings/company" label="Company profile" />
            <UButton to="/payroll/settings" color="neutral" variant="outline" label="Payroll settings" />
          </div>
        </div>
      </UCard>
    </ClientOnly>
  </div>
</template>
