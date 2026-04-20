<script setup lang="ts">
import { ROUTE_LIST } from '~/constants/routeList'

definePageMeta({
  layout: 'default'
})

const route = useRoute()

const legacyHashRedirect = computed(() => {
  const hash = String(route.hash || '').replace('#', '').toLowerCase()

  if (hash === 'hiring') {
    return ROUTE_LIST.hiring.settings
  }

  /** Legacy employer: `pages/settings/index.vue` used `#payroll` for Payroll Settings + Mass Deductions tabs. */
  if (hash === 'payroll') {
    return { path: '/payroll/settings', query: { ...route.query, tab: String(route.query.tab || 'settings') } }
  }

  return '/settings/company'
})

await navigateTo(legacyHashRedirect.value as string | Parameters<typeof navigateTo>[0], { replace: true })
</script>

<template>
  <div class="p-6 text-sm text-muted">
    Redirecting…
  </div>
</template>
