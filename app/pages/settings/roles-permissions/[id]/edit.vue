<script setup lang="ts">
import type { RoleItem, RolePermissions } from '~/composables/useRolePermissions'

const route = useRoute()
const toast = useToast()
const router = useRouter()

const roleId = computed(() => String(route.params.id || ''))
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

const { data: role, status } = await useFetch<RoleItem | null>(`/api/roles/${roleId.value}`, {
  default: () => null,
  key: `role-${roleId.value}`
})

async function handleSubmit(payload: { name: string, description: string, permissions: RolePermissions }) {
  pending.value = true
  try {
    await $fetch(`/api/roles/${roleId.value}`, {
      method: 'PATCH',
      body: payload
    })

    toast.add({
      title: 'Role updated',
      color: 'success'
    })

    await router.push('/settings/roles-permissions')
  } catch (error: unknown) {
    toast.add({
      title: 'Update failed',
      description: getErrorMessage(error, 'Unable to update role.'),
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

    <template v-if="status === 'pending'">
      <USkeleton class="h-28 w-full" />
    </template>

    <template v-else-if="role">
      <SettingsRoleForm
        mode="edit"
        :title="`Edit Role: ${role.name}`"
        submit-label="Save Changes"
        :initial-name="role.name"
        :initial-description="role.description"
        :initial-permissions="role.permissions"
        :role-locked="!role.canEdit"
        :pending="pending"
        @submit="handleSubmit"
      />
    </template>

    <template v-else>
      <UAlert
        color="warning"
        variant="subtle"
        title="Role not found"
        description="The requested role does not exist."
      />
    </template>
  </div>
</template>
