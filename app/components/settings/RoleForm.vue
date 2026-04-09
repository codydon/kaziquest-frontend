<script setup lang="ts">
import {
  ROLE_NAME_MAX_LENGTH,
  ROLE_PERMISSION_MODULES,
  applyPermissionDependency,
  clonePermissions,
  createEmptyPermissions,
  type RolePermissions
} from '~/composables/useRolePermissions'

const props = withDefaults(defineProps<{
  mode: 'create' | 'edit'
  title: string
  submitLabel: string
  initialName?: string
  initialDescription?: string
  initialPermissions?: RolePermissions
  roleLocked?: boolean
  pending?: boolean
}>(), {
  initialName: '',
  initialDescription: '',
  initialPermissions: () => createEmptyPermissions(),
  roleLocked: false,
  pending: false
})

const emit = defineEmits<{
  submit: [payload: { name: string, description: string, permissions: RolePermissions }]
}>()

const toast = useToast()

const name = ref(props.initialName)
const description = ref(props.initialDescription)
const permissions = ref(clonePermissions(props.initialPermissions))

const canSubmit = computed(() => {
  const value = name.value.trim()
  return value.length > 0 && value.length <= ROLE_NAME_MAX_LENGTH
})

const allSelected = computed(() => {
  return ROLE_PERMISSION_MODULES.every((module) => {
    const modulePerms = permissions.value[module.key] || {}
    return module.actions.every(action => modulePerms[action.key])
  })
})

function togglePermission(moduleKey: string, actionKey: string, checked: boolean) {
  if (props.roleLocked) {
    return
  }
  permissions.value = applyPermissionDependency(permissions.value, moduleKey, actionKey, checked)
}

function selectAllGlobal(checked: boolean) {
  if (props.roleLocked) {
    return
  }

  const next = clonePermissions(permissions.value)

  for (const module of ROLE_PERMISSION_MODULES) {
    const modulePermissions = (next[module.key] ??= {})
    for (const action of module.actions) {
      modulePermissions[action.key] = checked
    }
  }

  permissions.value = next
}

function clearAllGlobal() {
  selectAllGlobal(false)
}

function selectAllModule(moduleKey: string, checked: boolean) {
  if (props.roleLocked) {
    return
  }

  const module = ROLE_PERMISSION_MODULES.find(item => item.key === moduleKey)
  if (!module) {
    return
  }

  let next = clonePermissions(permissions.value)

  for (const action of module.actions) {
    next = applyPermissionDependency(next, moduleKey, action.key, checked)
  }

  permissions.value = next
}

function onSubmit() {
  if (!canSubmit.value || props.pending || props.roleLocked) {
    if (props.roleLocked) {
      toast.add({
        title: 'Role locked',
        description: 'This role cannot be edited.',
        color: 'warning'
      })
    }
    return
  }

  emit('submit', {
    name: name.value.trim(),
    description: description.value.trim(),
    permissions: clonePermissions(permissions.value)
  })
}

const helperText = computed(() => {
  return props.mode === 'create'
    ? 'Define what users with this role can do.'
    : 'Update what users with this role can do.'
})
</script>

<template>
  <div class="w-full space-y-4 sm:space-y-5">
    <div>
      <h1 class="text-xl font-semibold text-highlighted">
        {{ title }}
      </h1>
      <p class="mt-1 text-sm text-muted">
        {{ helperText }}
      </p>
    </div>

    <UCard>
      <div class="grid gap-4 md:grid-cols-2">
        <UFormField label="Role Name" required>
          <UInput
            v-model="name"
            :maxlength="ROLE_NAME_MAX_LENGTH"
            placeholder="Enter role name"
            :disabled="roleLocked"
          />
        </UFormField>

        <UFormField label="Description">
          <UInput
            v-model="description"
            placeholder="Enter role description"
            :disabled="roleLocked"
          />
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-semibold text-highlighted">
            Permissions
          </h3>

          <div class="flex items-center gap-2">
            <UButton
              label="Select All"
              variant="outline"
              color="neutral"
              size="sm"
              :disabled="roleLocked || allSelected"
              @click="selectAllGlobal(true)"
            />
            <UButton
              label="Clear All"
              variant="outline"
              color="neutral"
              size="sm"
              :disabled="roleLocked"
              @click="clearAllGlobal"
            />
          </div>
        </div>
      </template>

      <div class="grid gap-3 lg:grid-cols-2">
        <div
          v-for="module in ROLE_PERMISSION_MODULES"
          :key="module.key"
          class="rounded-lg border border-default p-3"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <h4 class="text-sm font-medium text-highlighted">
              {{ module.label }}
            </h4>
            <UButton
              label="Select All"
              variant="ghost"
              color="neutral"
              size="xs"
              :disabled="roleLocked"
              @click="selectAllModule(module.key, true)"
            />
          </div>

          <div class="grid grid-cols-2 gap-2 xl:grid-cols-3">
            <UCheckbox
              v-for="action in module.actions"
              :key="`${module.key}-${action.key}`"
              :label="action.label"
              :model-value="permissions[module.key]?.[action.key] || false"
              :disabled="roleLocked"
              @update:model-value="(value) => togglePermission(module.key, action.key, !!value)"
            />
          </div>
        </div>
      </div>
    </UCard>

    <div class="flex items-center justify-between gap-3 pt-1">
      <UButton
        label="Cancel"
        color="neutral"
        variant="outline"
        to="/settings/roles-permissions"
      />
      <UButton
        :label="submitLabel"
        color="primary"
        :loading="pending"
        :disabled="!canSubmit || roleLocked"
        @click="onSubmit"
      />
    </div>
  </div>
</template>
