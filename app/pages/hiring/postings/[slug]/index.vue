<script setup lang="ts">
import type { HiringApplication } from '~/types/hiring'
import { jobService } from '~~/services/jobs.service'
import { applicationService } from '~~/services/applications.service'
import { useApi } from '~/composables/useApi'

definePageMeta({ layout: 'default' })

const route = useRoute()
const applicantQuery = reactive({
  page: 1,
  page_size: 10,
  appl_status: '',
  search_str: ''
})

const { data: jobData, pending: loadingJob, refresh: refreshJob } = await useAsyncData(
  `hiring-job-${String(route.params.slug)}`,
  () => useApi('/jobs', {
    handler: '$fetch',
    params: { slug: route.params.slug }
  })
)

const jobId = computed(() => String((jobData.value as { id?: string } | null)?.id || ''))

const { data: statsData, pending: loadingStats, refresh: refreshStats } = await useAsyncData(
  `hiring-job-stats-${String(route.params.slug)}`,
  () => jobId.value
    ? useApi(`/jobs/${jobId.value}/statistics/`, { handler: '$fetch' })
    : Promise.resolve({}),
  { watch: [jobId] }
)

const { data: applicantsData, pending: loadingApplicants, refresh: refreshApplicants } = await useAsyncData(
  `hiring-job-applicants-${String(route.params.slug)}`,
  () => jobId.value
    ? useApi(`/jobs/${jobId.value}/applications`, {
        handler: '$fetch',
        params: applicantQuery
      })
    : Promise.resolve({ results: [] }),
  { watch: [jobId, () => ({ ...applicantQuery })] }
)

const job = computed(() => (jobData.value as Record<string, any> | null) ?? {})
const stats = computed(() => (statsData.value as Record<string, any> | null) ?? {})
const applicants = computed(() => ((applicantsData.value as { results?: HiringApplication[] } | null)?.results ?? []))
</script>

<template>
  <HiringPanel id="hiring-postings-detail" :title="String(job.title || 'Job Detail')" description="Overview, applicants, and performance for this job posting.">
    <template #actions>
      <div class="flex items-center gap-2">
        <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" :loading="loadingJob || loadingStats || loadingApplicants" @click="() => { refreshJob(); refreshStats(); refreshApplicants() }" />
        <UButton variant="outline" color="neutral" :to="`/hiring/postings/${job.slug}/edit`">
          Edit
        </UButton>
      </div>
    </template>

    <div class="grid gap-4 md:grid-cols-3">
      <UCard>
        <p class="text-sm text-muted">Status</p>
        <div class="mt-2">
          <HiringStatusBadge :status="String(job.status || '')" />
        </div>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Applicants</p>
        <p class="mt-2 text-3xl font-semibold">{{ Number(job.applications_count || 0) }}</p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Deadline</p>
        <p class="mt-2 text-lg font-semibold">{{ String(job.valid_through || '—') }}</p>
      </UCard>
    </div>

    <UCard :ui="{ body: 'space-y-4' }">
      <div>
        <h3 class="font-semibold">Role Summary</h3>
        <p class="mt-2 text-sm text-muted whitespace-pre-line">
          {{ String(job.description || 'No description available.') }}
        </p>
      </div>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-muted">Location</p>
          <p class="mt-1 font-medium">{{ String(job.job_location || '—') }}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-muted">Employment Type</p>
          <p class="mt-1 font-medium">{{ String(job.employment_type || '—') }}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-muted">Level</p>
          <p class="mt-1 font-medium">{{ String(job.job_level || '—') }}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-muted">Education</p>
          <p class="mt-1 font-medium">{{ String(job.education_level || '—') }}</p>
        </div>
      </div>
    </UCard>

    <div class="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <UCard :ui="{ body: 'space-y-4' }">
        <template #header>
          <div>
            <h3 class="font-semibold">Applicants</h3>
            <p class="text-sm text-muted">Applications received for this role.</p>
          </div>
        </template>

        <div class="grid gap-3 md:grid-cols-[1.2fr_220px]">
          <UInput v-model="applicantQuery.search_str" icon="i-lucide-search" placeholder="Search job applicants" />
          <USelect v-model="applicantQuery.page_size" :items="[10, 20, 30, 50]" class="w-full" />
        </div>

        <div v-if="loadingApplicants" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
        </div>
        <div v-else-if="!applicants.length" class="rounded-lg border border-dashed border-default px-4 py-8 text-center text-sm text-muted">
          No applicants yet.
        </div>
        <div v-else class="space-y-3">
          <div v-for="applicant in applicants" :key="applicant.id" class="rounded-lg border border-default px-4 py-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <NuxtLink :to="`/hiring/applicants/${applicant.id}`" class="font-medium text-primary hover:underline">
                  {{ applicant.job_seeker_name || 'Unnamed applicant' }}
                </NuxtLink>
                <p class="mt-1 text-sm text-muted">
                  {{ applicant.job_seeker_email || applicant.phone || 'No contact details' }}
                </p>
              </div>
              <HiringStatusBadge :status="applicant.status" />
            </div>
          </div>
        </div>
      </UCard>

      <UCard :ui="{ body: 'space-y-4' }">
        <template #header>
          <div>
            <h3 class="font-semibold">Statistics</h3>
            <p class="text-sm text-muted">Backend-provided metrics for this job.</p>
          </div>
        </template>

        <div v-if="loadingStats" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
        </div>
        <div v-else class="space-y-3">
          <div class="rounded-lg border border-default px-4 py-3">
            <p class="text-sm text-muted">Gender breakdown</p>
            <pre class="mt-2 overflow-x-auto text-xs">{{ stats.genderStats || {} }}</pre>
          </div>
          <div class="rounded-lg border border-default px-4 py-3">
            <p class="text-sm text-muted">Status breakdown</p>
            <pre class="mt-2 overflow-x-auto text-xs">{{ stats.statusStats || [] }}</pre>
          </div>
        </div>
      </UCard>
    </div>
  </HiringPanel>
</template>
