<script setup lang="ts">
import { formatHiringStatusLabel, hiringStatusColor } from '~/utils/hiring'

const props = defineProps<{
  status?: string | null
}>()
</script>

<template>
  <UBadge :color="hiringStatusColor(props.status)" variant="subtle">
    {{ formatHiringStatusLabel(props.status) }}
  </UBadge>
</template>
