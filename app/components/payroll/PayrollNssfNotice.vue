<script setup lang="ts">
/** Banner valid until end of March 2026 */
const BANNER_VALID_UNTIL = new Date(2026, 2, 31)

const visible = ref(true)
const withinValidityPeriod = ref(true)

onMounted(() => {
  if (import.meta.client) {
    const now = new Date()
    withinValidityPeriod.value = now <= BANNER_VALID_UNTIL
  }
})

function dismiss() {
  visible.value = false
}
</script>

<template>
  <ClientOnly>
    <div
      v-if="withinValidityPeriod && visible"
      class="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-default leading-snug"
    >
      <UIcon
        name="i-lucide-info"
        class="shrink-0 size-5 text-primary"
        aria-hidden="true"
      />
      <p class="flex-1 min-w-0 py-0.5">
        <span class="font-medium">New NSSF rates</span> apply from February 2026.
        <a
          href="https://kaziquest.com/new-nssf-rates-february-2026-the-ultimate-guide-for-employers-hr-in-kenya"
          target="_blank"
          rel="noopener noreferrer"
          class="underline font-medium hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >View details</a>
      </p>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="xs"
        square
        aria-label="Close notice"
        class="shrink-0"
        @click="dismiss"
      />
    </div>
  </ClientOnly>
</template>
