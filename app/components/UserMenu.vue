<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { ROUTE_LIST } from '~/constants/routeList'

const props = defineProps<{
  /** Sidebar collapsed: compact trigger + narrow menu. */
  collapsed?: boolean
  /** Navbar / toolbar: avatar only (no name), does not stretch full width. */
  avatarOnly?: boolean
}>()

const compactTrigger = computed(() => Boolean(props.collapsed || props.avatarOnly))

const colorMode = useColorMode()
const appConfig = useAppConfig()

const colors = ['kaziquest', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'] as const
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const

const toast = useToast()
const { logout } = useAuthSession()

const logoutLoading = ref(false)
const logoutConfirmOpen = ref(false)

const menuUser = useUserAvatarModel()

const openLogoutConfirm = (e: Event) => {
  e.preventDefault()
  logoutConfirmOpen.value = true
}

const performLogout = async () => {
  if (logoutLoading.value) {
    return
  }

  logoutLoading.value = true
  try {
    await logout()
    logoutConfirmOpen.value = false
    toast.add({
      title: 'Signed out',
      description: 'You have been logged out successfully.',
      color: 'success'
    })
    await navigateTo(ROUTE_LIST.auth.login)
  } catch {
    logoutConfirmOpen.value = false
    toast.add({
      title: 'Sign out failed',
      description: 'You were signed out locally. Try again if something still looks wrong.',
      color: 'warning'
    })
    await navigateTo(ROUTE_LIST.auth.login)
  } finally {
    logoutLoading.value = false
  }
}

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: menuUser.value.name,
  avatar: menuUser.value.avatar
}], [{
  label: 'Profile',
  icon: 'i-lucide-user',
  to: ROUTE_LIST.profile
}, {
  label: 'Settings',
  icon: 'i-lucide-settings',
  to: '/settings/company'
}], [{
  label: 'Theme',
  icon: 'i-lucide-palette',
  children: [{
    label: 'Primary',
    slot: 'chip',
    chip: appConfig.ui.colors.primary,
    content: {
      align: 'center',
      collisionPadding: 16
    },
    children: colors.map(color => ({
      label: color === 'kaziquest' ? 'KaziQuest' : color,
      chip: color,
      slot: 'chip',
      checked: appConfig.ui.colors.primary === color,
      type: 'checkbox',
      onSelect: (e) => {
        e.preventDefault()

        appConfig.ui.colors.primary = color
      }
    }))
  }, {
    label: 'Neutral',
    slot: 'chip',
    chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
    content: {
      align: 'end',
      collisionPadding: 16
    },
    children: neutrals.map(color => ({
      label: color,
      chip: color === 'neutral' ? 'old-neutral' : color,
      slot: 'chip',
      type: 'checkbox',
      checked: appConfig.ui.colors.neutral === color,
      onSelect: (e) => {
        e.preventDefault()

        appConfig.ui.colors.neutral = color
      }
    }))
  }]
}, {
  label: 'Appearance',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: 'Light',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()

      colorMode.preference = 'light'
    }
  }, {
    label: 'Dark',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onUpdateChecked(checked: boolean) {
      if (checked) {
        colorMode.preference = 'dark'
      }
    },
    onSelect(e: Event) {
      e.preventDefault()
    }
  }]
}], [/* {
  label: 'Documentation',
  icon: 'i-lucide-book-open',
  to: 'https://ui.nuxt.com/docs/getting-started/installation/nuxt',
  target: '_blank'
}, */{
    label: 'Log out',
    icon: 'i-lucide-log-out',
    onSelect: (e: Event) => {
      openLogoutConfirm(e)
    }
  }]]))
</script>

<template>
  <UModal
    v-model:open="logoutConfirmOpen"
    title="Sign out?"
    description="You will need to sign in again to access your workspace."
  >
    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          :disabled="logoutLoading"
          @click="logoutConfirmOpen = false"
        />
        <UButton
          label="Sign out"
          color="error"
          :loading="logoutLoading"
          @click="() => void performLogout()"
        />
      </div>
    </template>
  </UModal>

  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: compactTrigger ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :avatar="menuUser.avatar"
      :label="compactTrigger ? undefined : menuUser.name"
      :trailing-icon="compactTrigger ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      :block="!props.avatarOnly"
      :square="compactTrigger"
      class="data-[state=open]:bg-elevated"
      :class="[!compactTrigger && 'py-2']"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
