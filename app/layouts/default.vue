<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const links = [[{
  label: 'Home',
  icon: 'i-lucide-house',
  to: '/home',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Employees',
  icon: 'i-lucide-users',
  to: '/employees',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Time Off',
  icon: 'i-lucide-calendar-check-2',
  defaultOpen: true,
  type: 'trigger',
  children: [{
    label: 'Requests',
    to: '/time-off/requests',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Balances',
    to: '/time-off/balances',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Settings',
    to: '/settings#timeoffs',
    onSelect: () => {
      open.value = false
    }
  }]
}, {
  label: 'Payroll',
  icon: 'i-lucide-wallet',
  type: 'trigger',
  children: [{
    label: 'Run Payroll',
    to: '/payroll',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'History',
    to: '/payroll/history',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Wallet',
    to: '/payroll/wallet-balance',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Off-cycle',
    to: '/payroll/off-cycle',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Settings',
    to: '/payroll/settings',
    onSelect: () => {
      open.value = false
    }
  }]
}, {
  label: 'Hiring',
  icon: 'i-lucide-briefcase-business',
  type: 'trigger',
  children: [{
    label: 'Dashboard',
    to: '/hiring/dashboard',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Applicants',
    to: '/hiring/applicants',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Job Postings',
    to: '/hiring/postings',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Career Site',
    to: '/hiring/career-site',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Talent Network',
    to: '/hiring/talent-network',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Settings',
    to: '/hiring/settings',
    onSelect: () => {
      open.value = false
    }
  }]
}, {
  label: 'Events',
  icon: 'i-lucide-calendar-days',
  to: '/events',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Settings',
  icon: 'i-lucide-settings',
  type: 'trigger',
  children: [{
    label: 'Company',
    to: '/settings/company',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Roles & Permissions',
    to: '/settings/roles-permissions',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Billing',
    to: '/settings/billing',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Integrations',
    to: '/settings/integrations',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Activity Log',
    to: '/settings/activity',
    onSelect: () => {
      open.value = false
    }
  }]
}], [{
  label: 'Help & Support',
  icon: 'i-lucide-info',
  to: '/support'
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          type="single"
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
