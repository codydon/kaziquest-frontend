<script setup lang="ts">
import { sub } from 'date-fns'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Period, Range } from '~/types'

const { isNotificationsSlideoverOpen } = useDashboard()

const items = [[{
  label: 'Open hiring dashboard',
  icon: 'i-lucide-briefcase-business',
  to: '/hiring/dashboard'
}, {
  label: 'Open employees',
  icon: 'i-lucide-users',
  to: '/employees'
}]] satisfies DropdownMenuItem[][]

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})
const period = ref<Period>('daily')
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <DashboardPageHeader
        title="Home"
        breadcrumb="Dashboard / Home"
      >
        <template #right>
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>

          <UserMenu avatar-only class="shrink-0" />
        </template>
        <template #toolbar>
          <UDashboardToolbar>
            <template #left>
              <HomeDateRangePicker v-model="range" class="-ms-1" />
              <HomePeriodSelect v-model="period" :range="range" />
            </template>
          </UDashboardToolbar>
        </template>
      </DashboardPageHeader>
    </template>

    <template #body>
      <HomeStats :period="period" :range="range" />
      <HomeChart :period="period" :range="range" />
      <HomeSales :period="period" :range="range" />
    </template>
  </UDashboardPanel>
</template>
