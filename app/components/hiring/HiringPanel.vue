<script setup lang="ts">
const props = withDefaults(defineProps<{
  id: string
  title: string
  description?: string
}>(), {
  description: ''
})
</script>

<template>
  <UDashboardPanel :id="props.id">
    <template #header>
      <DashboardPageHeader
        :title="props.title"
        :breadcrumb="`Dashboard / Hiring / ${props.title}`"
      >
        <template #default>
          <p v-if="props.description" class="hidden text-sm text-muted md:block">
            {{ props.description }}
          </p>
        </template>
        <template #right>
          <slot name="actions" />
          <UserMenu avatar-only class="shrink-0" />
        </template>
      </DashboardPageHeader>
    </template>

    <template #body>
      <div class="flex flex-col gap-6">
        <slot />
      </div>
    </template>
  </UDashboardPanel>
</template>
