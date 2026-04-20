<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  description?: string
}>(), {
  description: 'This page is scaffolded for migration and will be replaced with the migrated feature implementation.'
})
</script>

<template>
  <UDashboardPanel :id="props.title.toLowerCase().replace(/\s+/g, '-')">
    <template #header>
      <DashboardPageHeader
        :title="props.title"
        :breadcrumb="`Dashboard / ${props.title}`"
      >
        <template #right>
          <UserMenu avatar-only class="shrink-0" />
        </template>
      </DashboardPageHeader>
    </template>

    <template #body>
      <UCard>
        <p class="text-sm text-muted">
          {{ props.description }}
        </p>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
