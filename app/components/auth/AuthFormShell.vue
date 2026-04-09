<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="mx-auto w-full max-w-xl">
    <div class="px-1 py-1 sm:px-2">
      <header class="mb-4 sm:mb-5">
        <h2 class="text-2xl font-semibold leading-tight text-slate-900 sm:text-[1.9rem] dark:text-white">
          {{ title }}
        </h2>
        <p v-if="description" class="mt-2 text-sm text-slate-600 sm:text-base dark:text-slate-300">
          {{ description }}
        </p>

        <p class="mt-2 inline-flex items-center gap-2 text-xs font-medium text-cyan-700 dark:text-cyan-300">
          <UIcon name="i-lucide-lock" class="size-3.5" />
          Secure authentication session
        </p>
      </header>

      <div class="min-h-0">
        <slot />
      </div>

      <p class="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
        Need help? Email
        <a href="mailto:support@kaziquest.com" class="font-medium text-cyan-700 underline-offset-2 hover:underline dark:text-cyan-300">support@kaziquest.com</a>
      </p>
    </div>
  </section>
</template>