<script setup lang="ts">
import type { AvatarProps } from '@nuxt/ui'
import type { AuthUser } from '~/types'

const props = withDefaults(
  defineProps<{
    /** Omit to use the current session user; pass `null` for signed-out placeholder */
    user?: AuthUser | Record<string, unknown> | null
    size?: AvatarProps['size']
    /** Fallback initials count when there is no profile photo (only 1 or 2). */
    initialCount?: 1 | 2
  }>(),
  {
    initialCount: 1
  }
)

const model = useUserAvatarModel(
  () => props.user,
  () => ({ initialsMax: props.initialCount })
)

const bind = computed(() => {
  const { avatar } = model.value
  return props.size ? { ...avatar, size: props.size } : avatar
})
</script>

<template>
  <UAvatar v-bind="bind" />
</template>
