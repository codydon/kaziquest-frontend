<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { RoleItem } from '~/composables/useRolePermissions'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()
const { data: roles, status, refresh } = await useFetch<RoleItem[]>('/api/roles', {
  default: () => []
})

const duplicateOpen = ref(false)
const deleteOpen = ref(false)
const selectedRole = ref<RoleItem | null>(null)
const duplicateName = ref('')
const duplicateDescription = ref('')
const duplicatePending = ref(false)
const deletePending = ref(false)
const deleteError = ref('')

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { statusMessage?: string } }).data
    if (data?.statusMessage) {
      return data.statusMessage
    }
  }

  return fallback
}

const columns: TableColumn<RoleItem>[] = [
  {
    accessorKey: 'name',
    header: 'Role Name'
  },
  {
    accessorKey: 'userCount',
    header: 'Users'
  },
  {
    accessorKey: 'description',
    header: 'Description'
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => h(UBadge, {
      color: row.original.type === 'system' ? 'neutral' : 'primary',
      variant: 'subtle',
      label: row.original.type === 'system' ? 'System' : 'Custom'
    })
  },
  {
    id: 'actions',
    cell: ({ row }) => h('div', { class: 'text-right' }, h(UDropdownMenu, {
      content: { align: 'end' },
      items: getRowActions(row.original)
    }, () => h(UButton, {
      icon: 'i-lucide-ellipsis-vertical',
      color: 'neutral',
      variant: 'ghost'
    })))
  }
]

function getRowActions(role: RoleItem) {
  return [[
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      disabled: !role.canEdit,
      to: role.canEdit ? `/settings/roles-permissions/${role.id}/edit` : undefined
    },
    {
      label: 'Duplicate',
      icon: 'i-lucide-copy',
      onSelect: () => openDuplicate(role)
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error',
      disabled: role.type === 'system',
      onSelect: () => openDelete(role)
    }
  ]]
}

function openDuplicate(role: RoleItem) {
  selectedRole.value = role
  duplicateName.value = `${role.name} Copy`
  duplicateDescription.value = role.description
  duplicateOpen.value = true
}

function openDelete(role: RoleItem) {
  selectedRole.value = role
  deleteError.value = ''
  deleteOpen.value = true
}

async function submitDuplicate() {
  const role = selectedRole.value
  if (!role || !duplicateName.value.trim()) {
    return
  }

  duplicatePending.value = true
  try {
    await $fetch(`/api/roles/${role.id}/duplicate`, {
      method: 'POST',
      body: {
        name: duplicateName.value.trim(),
        description: duplicateDescription.value.trim()
      }
    })

    duplicateOpen.value = false
    toast.add({ title: 'Role duplicated', color: 'success' })
    await refresh()
  } catch (error: unknown) {
    toast.add({
      title: 'Duplicate failed',
      description: getErrorMessage(error, 'Unable to duplicate role.'),
      color: 'error'
    })
  } finally {
    duplicatePending.value = false
  }
}

async function submitDelete() {
  const role = selectedRole.value
  if (!role) {
    return
  }

  deletePending.value = true
  deleteError.value = ''

  try {
    await $fetch(`/api/roles/${role.id}`, { method: 'DELETE' })
    deleteOpen.value = false
    toast.add({ title: 'Role deleted', color: 'success' })
    await refresh()
  } catch (error: unknown) {
    deleteError.value = getErrorMessage(error, 'Unable to delete role.')
  } finally {
    deletePending.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-end">
      <UButton
        label="Create Role"
        icon="i-lucide-plus"
        to="/settings/roles-permissions/create"
      />
    </div>

    <UPageCard
      title="Roles & Permissions"
      description="Manage what users can access and do in the system"
      variant="naked"
    />

    <UTable
      :data="roles"
      :columns="columns"
      :loading="status === 'pending'"
    />
  </div>

  <UModal v-model:open="duplicateOpen" :title="'Duplicate Role'">
    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-muted">
          Source Role: <span class="font-medium text-highlighted">{{ selectedRole?.name }}</span>
        </p>

        <UFormField label="New Role Name" required>
          <UInput v-model="duplicateName" :maxlength="60" placeholder="Enter new role name" />
        </UFormField>

        <UFormField label="Description">
          <UInput v-model="duplicateDescription" placeholder="Enter role description" />
        </UFormField>

        <p class="text-xs text-muted">
          Permissions will be copied.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          @click="duplicateOpen = false"
        />
        <UButton
          label="Duplicate Role"
          :loading="duplicatePending"
          :disabled="!duplicateName.trim()"
          @click="submitDuplicate"
        />
      </div>
    </template>
  </UModal>

  <UModal v-model:open="deleteOpen" :title="`Delete ${selectedRole?.name || 'Role'}?`">
    <template #body>
      <div class="space-y-3">
        <template v-if="selectedRole && selectedRole.userCount > 0">
          <p class="text-sm text-muted">
            This role is assigned to {{ selectedRole.userCount }} users.
            Reassign them before deleting.
          </p>
          <UButton
            label="View Users"
            color="neutral"
            variant="outline"
            to="/employees"
          />
        </template>

        <template v-else>
          <p class="text-sm text-muted">
            Are you sure you want to delete this role?
          </p>
        </template>

        <UAlert
          v-if="deleteError"
          color="error"
          variant="subtle"
          :description="deleteError"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          @click="deleteOpen = false"
        />
        <UButton
          label="Delete"
          color="error"
          :loading="deletePending"
          :disabled="!!selectedRole && selectedRole.userCount > 0"
          @click="submitDelete"
        />
      </div>
    </template>
  </UModal>
</template>
