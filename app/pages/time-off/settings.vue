<script setup lang="ts">
/**
 * Back-compat: time off configuration moved to company settings `#timeoffs`.
 */
definePageMeta({
  layout: 'default',
})

await navigateTo('/settings#timeoffs', { replace: true })
</script>

<template>
  <div />
</template>
