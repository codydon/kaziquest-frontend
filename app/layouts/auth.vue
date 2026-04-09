<script setup lang="ts">
const route = useRoute()

const isAuthRoute = computed(() => route.path.startsWith('/auth/'))

const heroCopy = {
  eyebrow: 'Simplify HR and Payroll. Empower Your Business.',
  title: 'Streamline HR And Payroll,\nA Smarter, Simpler Solution',
  description: 'Manage payroll, time-off, benefits, recruiting and employee data effortlessly—all in one place, from any device.',
  highlights: [
    'Every approval, handoff, and status change in one place',
    'Payroll runs stay clean because records stay current',
    'Hiring and HR teams work from the same source of truth'
  ]
}
</script>

<template>
  <div v-if="isAuthRoute" class="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#f6f0e6_0%,#f4f6f8_38%,#e7edf5_100%)] text-default xl:h-screen xl:overflow-hidden">
    <div class="grid min-h-screen w-full xl:grid-cols-2">
      <AuthHeroPanel
        :eyebrow="heroCopy.eyebrow"
        :title="heroCopy.title"
        :description="heroCopy.description"
        :highlights="heroCopy.highlights"
      />

      <main id="auth-form-anchor" class="relative flex min-h-[56vh] items-start justify-center overflow-y-auto bg-white px-5 pb-6 pt-16 sm:px-8 sm:pb-8 sm:pt-16 lg:px-10 lg:pb-10 lg:pt-16 xl:h-screen xl:min-h-0 dark:bg-slate-950">
        <div class="flex min-h-full w-full max-w-xl flex-col py-1">
          <slot />

          <div class="mt-auto border-t border-slate-200 pt-3 dark:border-white/10">
            <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 sm:text-[11px] lg:text-xs dark:text-slate-300">
              <span>2026 KaziQuest</span>
              <NuxtLink to="/support" class="transition hover:text-slate-800 dark:hover:text-white">Support</NuxtLink>
              <span>Privacy</span>
              <span>Terms</span>
            </div>
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
