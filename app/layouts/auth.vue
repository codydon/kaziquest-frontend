<script setup lang="ts">
const route = useRoute()

const isAuthRoute = computed(() => route.path.startsWith('/auth/'))

const heroCopy = {
  eyebrow: 'KaziQuest operating system for people teams',
  title: 'Hiring, payroll, and people changes on one shared desk',
  description: 'Move from vacancy to offer, from attendance to payout, and from onboarding to records without bouncing between tools.',
  highlights: [
    'Every approval, handoff, and status change in one place',
    'Payroll runs stay clean because records stay current',
    'Hiring and HR teams work from the same source of truth'
  ]
}
</script>

<template>
  <div v-if="isAuthRoute" class="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#f6f0e6_0%,#f4f6f8_38%,#e7edf5_100%)] text-default">
    <div class="grid h-screen w-full md:grid-cols-[1.1fr_0.9fr]">
      <AuthHeroPanel
        :eyebrow="heroCopy.eyebrow"
        :title="heroCopy.title"
        :description="heroCopy.description"
        :highlights="heroCopy.highlights"
      />

      <main class="relative flex h-screen items-center justify-center overflow-y-auto bg-[linear-gradient(180deg,#fbfbfa_0%,#f1f4f7_100%)] px-4 py-5 sm:px-6 lg:px-8 [@media(max-height:820px)]:py-3">
        <div class="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(13,110,253,0.08),transparent_68%)]" />
        <div class="w-full max-w-lg">
          <slot />

          <div class="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 [@media(max-height:820px)]:hidden">
            <span>2026 KaziQuest</span>
            <NuxtLink to="/support" class="transition hover:text-slate-700">Support</NuxtLink>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </main>
    </div>
  </div>

  <div v-else class="min-h-screen bg-default text-default flex flex-col">
    <header class="border-b border-default bg-default/95 backdrop-blur">
      <div class="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
        <NuxtLink to="/" class="text-sm font-semibold tracking-wide text-highlighted">
          KaziQuest
        </NuxtLink>
      </div>
    </header>

    <main class="flex-1">
      <div class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>

    <footer class="border-t border-default">
      <div class="mx-auto w-full max-w-7xl px-4 py-4 text-xs text-muted sm:px-6 lg:px-8">
        KaziQuest
      </div>
    </footer>
  </div>
</template>
