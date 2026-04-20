<script setup lang="ts">
/**
 * Legacy navbar linked `/timeoff/leave-categories` without a dedicated page.
 * Category CRUD lives under Time off settings alongside calendars and CC.
 */
definePageMeta({ layout: 'default' })

await navigateTo('/settings#timeoffs', { replace: true })
</script>

<template>
  <div />
</template>
