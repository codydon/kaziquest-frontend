<script setup lang="ts">
const props = defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.09)] sm:p-6 [@media(max-height:820px)]:p-4">
    <div class="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.03em] text-cyan-700 [@media(max-height:820px)]:mb-2 [@media(max-height:820px)]:hidden">
      <UIcon name="i-lucide-lock" class="size-3.5" />
      Secure authentication session
    </div>

    <div class="mb-4 flex items-start gap-3 [@media(max-height:820px)]:mb-3">
      <div class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
        <UIcon name="i-lucide-shield-check" class="size-5" />
      </div>

      <div>
        <h2 class="text-xl font-semibold leading-tight text-slate-900">
          {{ props.title }}
        </h2>
        <p class="mt-1 text-sm text-slate-600">
          {{ props.description }}
        </p>
      </div>
    </div>

    <div class="mb-4 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500 [@media(max-height:820px)]:hidden">
      <div class="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">Encrypted</div>
      <div class="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">Audited</div>
      <div class="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">Protected</div>
    </div>

    <slot />

    <p class="mt-4 text-center text-[11px] text-slate-500 [@media(max-height:820px)]:hidden">
      Need assistance? Reach support from the footer links below.
    </p>
  </div>
</template>