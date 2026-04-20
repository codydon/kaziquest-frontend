<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'Settings — Company',
  description: 'Company profile, directory visibility, and departments.'
})

const tabItems = [
  { label: 'Profile', value: 'profile' },
  { label: 'Directory', value: 'directory' },
  { label: 'Departments', value: 'departments' }
]

const selectedTab = ref('profile')
</script>

<template>
  <div class="flex flex-col gap-6">
    <UPageCard
      title="Company"
      description="Manage how your organization appears and how the directory is structured."
      variant="naked"
    />

    <UTabs
      v-model="selectedTab"
      :items="tabItems"
      :content="false"
      class="w-full"
    />

    <div v-show="selectedTab === 'profile'" class="mt-4">
      <SettingsCompanyProfile />
    </div>
    <div v-show="selectedTab === 'directory'" class="mt-4">
      <SettingsCompanyDirectory />
    </div>
    <div v-show="selectedTab === 'departments'" class="mt-4">
      <SettingsCompanyDepartments />
    </div>
  </div>
</template>
