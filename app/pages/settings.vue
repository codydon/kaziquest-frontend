<script setup lang="ts">
const route = useRoute()

const isWideSettingsPage = computed(() => route.path.startsWith('/settings/roles-permissions'))

const settingsBodyClass = computed(() => {
  return isWideSettingsPage.value
    ? 'py-4 sm:py-5 lg:py-6'
    : 'py-6 sm:py-8 lg:py-10'
})
</script>

<template>
  <UDashboardPanel id="settings" :ui="{ body: settingsBodyClass }">
    <template #header>
      <DashboardPageHeader
        title="Settings"
        breadcrumb="Dashboard / Settings"
      >
        <template #right>
          <UserMenu avatar-only class="shrink-0" />
        </template>
      </DashboardPageHeader>
    </template>

    <template #body>
      <div
        class="mx-auto flex w-full min-w-0 flex-col"
        :class="isWideSettingsPage ? 'max-w-6xl gap-4 sm:gap-5 lg:gap-6' : 'max-w-5xl gap-4 sm:gap-6 lg:gap-8'"
      >
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
