<script setup lang="ts">
const props = withDefaults(defineProps<{
  eyebrow?: string
  title: string
  description: string
}>(), {
  eyebrow: 'Simplify HR and Payroll. Empower Your Business.',
  title: 'Streamline HR And Payroll,\nA Smarter, Simpler Solution',
  description: 'Manage payroll, time-off, benefits, recruiting and employee data effortlessly—all in one place, from any device.'
})

const heroStats = [
  '253+ active teams',
  '99.95% platform uptime',
  'SOC-2 ready'
]

const products = [
  {
    title: 'People Ops Workspace',
    icon: '/images/svgs/teamwork.svg',
    accent: 'from-[#a55eea] to-[#8854d0]',
    metric: 'Complete employee records in one place',
    chips: ['Personal Info', 'Next of Kin', 'Disciplinary', 'Documents', 'Asset Management']
  },
  {
    title: 'Payroll Desk',
    icon: '/images/svgs/pay.svg',
    accent: 'from-[#26de81] to-[#20bf6b]',
    metric: 'Accurate monthly and off-cycle processing',
    chips: ['Monthly Payroll', 'Off-Cycle Payroll', 'Payslips', 'P9/P10', 'NSSF/HELB/SHIF Reports']
  },
  {
    title: 'Hiring Pipeline',
    icon: '/images/svgs/interview.svg',
    accent: 'from-[#ff9f43] to-[#ff6b35]',
    metric: 'From job posting to hiring insights',
    chips: ['Job Posting', 'Google Indexing', 'Applicant Management', 'Hiring Reports', 'Talent Network']
  }
]
</script>

<template>
  <section class="relative isolate flex h-full min-h-[44vh] flex-col justify-start gap-6 overflow-y-auto overflow-x-hidden bg-[linear-gradient(136deg,#041536_0%,#0a2f73_36%,#1763c8_68%,#3aa8ff_100%)] p-6 pt-7 text-white sm:gap-7 sm:p-8 sm:pt-9 lg:gap-8 lg:p-10 lg:pt-10 xl:h-screen xl:pt-11 xl:pb-9">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_20%,rgba(116,226,255,0.2),transparent_52%)]" />
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_84%,rgba(59,164,255,0.16),transparent_48%)]" />
    <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[40px_40px]" />

    <div class="relative z-10 w-full max-w-2xl">
      <UBadge
        color="neutral"
        variant="soft"
        class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.04em] text-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-sm sm:text-sm"
      >
        <UIcon name="i-lucide-sparkles" class="size-4 text-[#7edbff]" />
        {{ props.eyebrow }}
      </UBadge>

      <img
        src="/logo-primary.png"
        alt="KaziQuest"
        class="mt-4 h-11 w-auto rounded-lg bg-white px-4 py-2 shadow-[0_16px_30px_rgba(0,0,0,0.35)] sm:h-12"
      >

      <h1 class="mt-5 max-w-xl whitespace-pre-line text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl xl:text-[2.7rem]">
        {{ props.title }}
      </h1>

      <p class="mt-4 max-w-lg text-base text-white/80 sm:text-lg">
        {{ props.description }}
      </p>

      <div class="mt-5 flex flex-wrap items-center gap-2.5 text-[11px] sm:mt-6 sm:text-xs">
        <span
          v-for="stat in heroStats"
          :key="stat"
          class="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-white/85"
        >
          {{ stat }}
        </span>
      </div>

    </div>

    <div class="relative z-10 pb-2 sm:pb-3">
      <UCarousel
        :items="products"
        :autoplay="{ delay: 4000, stopOnInteraction: false }"
        :dots="true"
        align="start"
        contain-scroll="trimSnaps"
        :loop="true"
        :slides-to-scroll="1"
        class="pb-1"
        :ui="{
          viewport: 'overflow-hidden pe-2',
          container: 'flex gap-3 lg:gap-4',
          item: 'basis-[84%] md:basis-[calc((100%-1rem)/2)] xl:basis-[calc((100%-2rem)/3)] self-stretch',
          controls: 'mt-3 flex items-center justify-center sm:mt-4',
          dots: 'flex items-center justify-center gap-2',
          dot: 'h-2 w-2 rounded-full border border-white/30 bg-white/20 transition data-[state=active]:w-6 data-[state=active]:bg-white data-[state=active]:border-white'
        }"
      >
        <template #default="{ item }">
          <article class="group relative h-full min-h-49.5 overflow-hidden rounded-xl border border-white/12 bg-linear-to-br from-white/8 via-white/4 to-transparent p-3 backdrop-blur-xl transition-all duration-300 hover:border-white/25 sm:rounded-2xl sm:p-3.5 lg:p-4">
            <div class="absolute inset-x-0 top-0 h-1 bg-linear-to-r" :class="item.accent" />

            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 p-1.5 sm:h-9 sm:w-9">
                  <img :src="item.icon" :alt="item.title" class="h-full w-full">
                </div>
                <h3 class="max-w-46 text-sm font-semibold leading-tight text-white">
                  {{ item.title }}
                </h3>
              </div>
            </div>

            <p class="mt-3 text-xs font-semibold tracking-wide text-white/90 sm:text-[13px]">
              {{ item.metric }}
            </p>

            <div class="mt-3 flex flex-wrap gap-1.5">
              <UBadge
                v-for="chip in item.chips"
                :key="chip"
                color="neutral"
                variant="soft"
                class="rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-[10px] font-medium text-white/75"
              >
                {{ chip }}
              </UBadge>
            </div>
          </article>
        </template>
      </UCarousel>
    </div>
  </section>
</template>