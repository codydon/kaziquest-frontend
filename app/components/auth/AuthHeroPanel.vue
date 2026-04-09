<script setup lang="ts">
const props = withDefaults(defineProps<{
  eyebrow?: string
  title: string
  description: string
  highlights?: string[]
}>(), {
  eyebrow: 'Simplify HR and Payroll. Empower Your Business.',
  title: 'Welcome to KaziQuest',
  description: 'Manage your people, payroll, and hiring from one focused workspace.',
  highlights: () => [
    'Structured hiring pipelines and applicant collaboration',
    'Payroll workflows built for speed and compliance',
    'Team operations, approvals, and insights in one place'
  ]
})

const products = [
  {
    title: 'KaziQuest Hiring',
    description: 'Plan, post, and move candidates through every stage with shared visibility.',
    icon: '/images/svgs/interview.svg',
    tag: 'Live',
    accent: 'from-[#33c5ff] to-[#2f80ff]',
    metric: '52 open roles',
    chips: ['Pipelines', 'Scorecards']
  },
  {
    title: 'KaziQuest Payroll',
    description: 'Run payroll operations with approvals, records, and accurate outputs.',
    icon: '/images/svgs/pay.svg',
    tag: 'Secure',
    accent: 'from-[#2f80ff] to-[#1f6ad8]',
    metric: '99.95% payout accuracy',
    chips: ['Approvals', 'Compliance']
  },
  {
    title: 'KaziQuest People Ops',
    description: 'Coordinate team workflows, onboarding, and core HR administration.',
    icon: '/images/svgs/teamwork.svg',
    tag: 'Unified',
    accent: 'from-[#46d3be] to-[#2f80ff]',
    metric: '1,200 active employees',
    chips: ['Onboarding', 'Records']
  }
]
</script>

<template>
  <section class="relative isolate flex h-screen flex-col justify-center overflow-hidden bg-[linear-gradient(132deg,#06173d_0%,#0a285f_34%,#0f3f8e_62%,#1f77e9_100%)] p-6 text-white sm:p-8 lg:p-10 [@media(max-height:820px)]:p-5">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_84%_18%,rgba(112,228,255,0.3),transparent_42%)]" />
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_18%_88%,rgba(70,164,255,0.26),transparent_38%)]" />
    <div class="absolute inset-0 bg-[linear-gradient(175deg,rgba(4,20,55,0.52)_0%,transparent_45%,rgba(5,24,62,0.2)_100%)]" />
    <div class="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#77e3ff]/22 blur-3xl" />
    <div class="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[#2f80ff]/28 blur-3xl" />
    <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[32px_32px] opacity-20" />

    <div class="relative z-10 w-full max-w-2xl">
      <div class="inline-flex items-center gap-2 rounded-full border border-[#8ddfff]/45 bg-[#8ddfff]/14 px-3 py-1 text-xs font-semibold tracking-[0.04em] text-[#d8f4ff] shadow-[0_8px_24px_rgba(5,18,42,0.2)]">
        <UIcon name="i-lucide-sparkles" class="size-4" />
        {{ props.eyebrow }}
      </div>

      <img
        src="/logo-primary.png"
        alt="KaziQuest"
        class="mt-4 h-9 w-auto rounded-md bg-white px-2 py-1 shadow-[0_16px_30px_rgba(7,24,56,0.45)] [@media(max-height:820px)]:mt-2.5 [@media(max-height:820px)]:h-8"
      >

      <h1 class="mt-5 max-w-xl text-3xl font-semibold leading-[1.16] text-white sm:text-4xl [@media(max-height:820px)]:mt-3 [@media(max-height:820px)]:text-2xl">
        {{ props.title }}
      </h1>

      <p class="mt-3 max-w-lg text-sm text-[#d9f0ff] sm:text-base [@media(max-height:820px)]:mt-2 [@media(max-height:820px)]:text-sm">
        {{ props.description }}
      </p>

      <ul class="mt-5 space-y-2 [@media(max-height:820px)]:mt-3 [@media(max-height:820px)]:space-y-1.5">
        <li
          v-for="item in props.highlights"
          :key="item"
          class="flex items-start gap-2 text-sm text-[#d5edff] [@media(max-height:820px)]:text-xs"
        >
          <UIcon name="i-lucide-check-circle-2" class="mt-0.5 size-4 shrink-0 text-[#7edbff]" />
          <span>{{ item }}</span>
        </li>
      </ul>

      <div class="mt-6 flex flex-wrap items-center gap-2 text-xs text-[#d6efff] [@media(max-height:820px)]:hidden">
        <span class="rounded-full border border-[#9ed9ff]/35 bg-[#7ccfff]/16 px-3 py-1">8,000+ active teams</span>
        <span class="rounded-full border border-[#9ed9ff]/35 bg-[#7ccfff]/16 px-3 py-1">99.95% platform uptime</span>
        <span class="rounded-full border border-[#9ed9ff]/35 bg-[#7ccfff]/16 px-3 py-1">SOC-ready processes</span>
      </div>
    </div>

    <div class="relative z-10 mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 [@media(max-height:900px)]:mt-3 [@media(max-height:900px)]:gap-2 [@media(max-height:900px)]:grid-cols-3">
      <article
        v-for="product in products"
        :key="product.title"
        class="group relative overflow-hidden rounded-2xl border border-[#9bd8ff]/28 bg-[linear-gradient(150deg,rgba(141,219,255,0.19)_0%,rgba(28,95,193,0.24)_55%,rgba(10,47,113,0.42)_100%)] p-4 shadow-[0_18px_32px_rgba(3,18,52,0.36)] backdrop-blur-md [@media(max-height:900px)]:rounded-xl [@media(max-height:900px)]:p-2.5"
      >
        <div class="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r opacity-90 [@media(max-height:900px)]:h-1" :class="`bg-linear-to-r ${product.accent}`" />
        <div class="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/7 [@media(max-height:900px)]:rounded-xl" />
        <div class="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl transition group-hover:bg-white/20" />

        <div class="relative z-10 flex items-start justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-md bg-white/90 p-1.5 shadow-[0_8px_16px_rgba(10,40,95,0.25)] [@media(max-height:900px)]:h-6 [@media(max-height:900px)]:w-6 [@media(max-height:900px)]:p-1">
              <img :src="product.icon" :alt="product.title" class="h-full w-full">
            </div>
            <h3 class="text-sm font-semibold text-white [@media(max-height:900px)]:text-xs">{{ product.title }}</h3>
          </div>

          <span class="rounded-full border border-white/20 bg-white/16 px-2 py-0.5 text-[11px] font-medium text-[#d8f4ff] [@media(max-height:900px)]:hidden">{{ product.tag }}</span>
        </div>

        <div class="relative z-10 mt-3 [@media(max-height:900px)]:mt-2">
          <p class="text-[12px] font-semibold tracking-[0.02em] text-[#e4f7ff] [@media(max-height:900px)]:text-[11px]">
            {{ product.metric }}
          </p>

          <p class="mt-1.5 text-xs leading-relaxed text-[#d0ebff] [@media(max-height:900px)]:hidden">{{ product.description }}</p>

          <div class="mt-2.5 flex flex-wrap gap-1.5 [@media(max-height:900px)]:mt-2">
            <span
              v-for="chip in product.chips"
              :key="chip"
              class="rounded-full border border-white/20 bg-white/12 px-2 py-0.5 text-[10px] font-medium text-[#dff3ff]"
            >
              {{ chip }}
            </span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>