<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

await navigateTo('/payroll', { replace: true })
</script>

<template>
  <div class="p-6 text-sm text-muted">
    Redirecting…
  </div>
</template>
