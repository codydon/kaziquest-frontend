<script setup lang="ts">
import type { RolePermissions } from '~/composables/useRolePermissions'

const toast = useToast()
const router = useRouter()
const pending = ref(false)

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { statusMessage?: string } }).data
    if (data?.statusMessage) {
      return data.statusMessage
    }
  }

  return fallback
}

async function handleSubmit(payload: { name: string, description: string, permissions: RolePermissions }) {
  pending.value = true
  try {
    await $fetch('/api/roles', {
      method: 'POST',
      body: payload
    })

    toast.add({
      title: 'Role created',
      color: 'success'
    })

    await router.push('/settings/roles-permissions')
  } catch (error: unknown) {
    toast.add({
      title: 'Create failed',
      description: getErrorMessage(error, 'Unable to create role.'),
      color: 'error'
    })
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-5xl">
    <div class="mb-3">
      <UButton
        label="Back to Roles"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        to="/settings/roles-permissions"
      />
    </div>

    <SettingsRoleForm
      mode="create"
      title="Create Role"
      submit-label="Create Role"
      :pending="pending"
      @submit="handleSubmit"
    />
  </div>
</template>
