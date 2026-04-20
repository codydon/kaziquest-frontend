<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { HiringActivityItem, HiringApplication, HiringDashboardStatistics, HiringJobPosting } from '~/types/hiring'
import { dashboardService } from '~~/services/dashboard.service'
import { applicationService } from '~~/services/applications.service'
import { jobService } from '~~/services/jobs.service'
import { useApi } from '~/composables/useApi'
import { normalizeStatistics } from '~/utils/hiring'
import { urlParamsExtensionUtil } from '~/utils/urlParams'

definePageMeta({ layout: 'default' })

const statsKey = computed(() => 'hiring-dashboard-statistics')
const latestJobsParams = reactive({ page: 1, page_size: 5, search: '' })
const applicantsParams = reactive({ page: 1, page_size: 5, appl_status: '' })
const applicantTabs = [
  { label: 'New', value: 'new_application' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Interviewed', value: 'interviewed' }
]

const activeApplicantTab = ref<'new_application' | 'shortlisted' | 'interviewed'>('new_application')

watch(activeApplicantTab, (value) => {
  applicantsParams.appl_status = value
}, { immediate: true })

const { session } = useAuthSession()
const company = computed(() => (session.value.user?.company as Record<string, unknown> | undefined) ?? {})

const { data: statisticsData, pending: loadingStatistics, refresh: refreshStatistics } = await useAsyncData(
  statsKey,
  () => dashboardService.getStatistics('', { handler: '$fetch' }),
)

const { data: activitiesData, pending: loadingActivities, refresh: refreshActivities } = await useAsyncData(
  'hiring-dashboard-activities',
  () => dashboardService.getActivities({ handler: '$fetch' }),
)

const { data: jobsData, pending: loadingJobs, refresh: refreshJobs } = await useAsyncData(
  'hiring-dashboard-jobs',
  () => useApi('/jobs', {
    handler: '$fetch',
    params: latestJobsParams
  }),
  { watch: [() => ({ ...latestJobsParams })] }
)

const { data: applicantsData, pending: loadingApplicants, refresh: refreshApplicants } = await useAsyncData(
  'hiring-dashboard-applicants',
  () => applicationService.getCompanyApplications(urlParamsExtensionUtil({
    page: applicantsParams.page,
    page_size: applicantsParams.page_size,
    appl_status: applicantsParams.appl_status
  })),
  { watch: [() => ({ ...applicantsParams })] }
)

const statistics = computed(() => normalizeStatistics(statisticsData.value) as HiringDashboardStatistics)
const activities = computed(() => {
  const raw = activitiesData.value as { results?: HiringActivityItem[] } | HiringActivityItem[] | null | undefined
  if (Array.isArray(raw)) {
    return raw
  }
  return raw?.results ?? []
})
const jobs = computed(() => ((jobsData.value as { results?: HiringJobPosting[] } | null)?.results ?? []))
const applicants = computed(() => ((applicantsData.value as { results?: HiringApplication[] } | null)?.results ?? []))

const statCards = computed(() => [
  {
    label: 'Applicants tracked',
    value: statistics.value.statusStats?.reduce((sum, item) => sum + Number(item.count || 0), 0) || 0
  },
  {
    label: 'Active job stats',
    value: Object.keys(statistics.value.jobStats || {}).length
  },
  {
    label: 'Gender groups',
    value: Object.keys(statistics.value.genderStats || {}).length
  }
])

const jobColumns: TableColumn<HiringJobPosting>[] = [
  { accessorKey: 'title', header: 'Job' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'applications_count', header: 'Applicants' }
]

const applicantColumns: TableColumn<HiringApplication>[] = [
  { accessorKey: 'job_seeker_name', header: 'Applicant' },
  { accessorKey: 'job_title', header: 'Job' },
  { accessorKey: 'status', header: 'Status' }
]
</script>

<template>
  <HiringPanel id="hiring-dashboard" title="Hiring Dashboard" description="Overview of your hiring pipeline, jobs, and recent applicant activity.">
    <template #actions>
      <div class="flex items-center gap-2">
        <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" :loading="loadingStatistics || loadingJobs || loadingApplicants" @click="() => { refreshStatistics(); refreshActivities(); refreshJobs(); refreshApplicants() }" />
        <UButton icon="i-lucide-plus" to="/hiring/postings/new">
          Create job
        </UButton>
      </div>
    </template>

    <div class="grid gap-4 md:grid-cols-3">
      <UCard v-for="card in statCards" :key="card.label">
        <p class="text-sm text-muted">
          {{ card.label }}
        </p>
        <p class="mt-2 text-3xl font-semibold">
          {{ card.value }}
        </p>
      </UCard>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <UCard :ui="{ body: 'space-y-4' }">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="font-semibold">
                Latest Job Postings
              </h3>
              <p class="text-sm text-muted">
                Recent jobs for {{ company.name || 'your company' }}.
              </p>
            </div>
            <UButton to="/hiring/postings" variant="outline" color="neutral">
              View all
            </UButton>
          </div>
        </template>

        <UTable :data="jobs" :columns="jobColumns" :loading="loadingJobs">
          <template #title-cell="{ row }">
            <NuxtLink :to="`/hiring/postings/${row.original.slug}`" class="font-medium text-primary hover:underline">
              {{ row.original.title || 'Untitled job' }}
            </NuxtLink>
          </template>
          <template #status-cell="{ row }">
            <HiringStatusBadge :status="row.original.status" />
          </template>
        </UTable>
      </UCard>

      <UCard :ui="{ body: 'space-y-3' }">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="font-semibold">
                Recent Activity
              </h3>
              <p class="text-sm text-muted">
                Hiring-related actions from your workspace.
              </p>
            </div>
          </div>
        </template>

        <div v-if="loadingActivities" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
        </div>
        <div v-else-if="!activities.length" class="text-sm text-muted">
          No activity yet.
        </div>
        <div v-else class="space-y-3">
          <div v-for="(item, index) in activities.slice(0, 6)" :key="item.id || index" class="rounded-lg border border-default px-4 py-3">
            <p class="text-sm font-medium">
              {{ item.message || item.action || 'Activity logged' }}
            </p>
            <p class="mt-1 text-xs text-muted">
              {{ item.actor?.full_name || 'System' }} · {{ item.created_at || item.timestamp || '—' }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <UCard :ui="{ body: 'space-y-4' }">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-semibold">
              Applicant Snapshot
            </h3>
            <p class="text-sm text-muted">
              Switch between key pipeline segments without leaving the dashboard.
            </p>
          </div>
          <div class="flex gap-2">
            <UButton
              v-for="tab in applicantTabs"
              :key="tab.value"
              :variant="activeApplicantTab === tab.value ? 'solid' : 'outline'"
              color="neutral"
              size="sm"
              @click="activeApplicantTab = tab.value as 'new_application' | 'shortlisted' | 'interviewed'"
            >
              {{ tab.label }}
            </UButton>
          </div>
        </div>
      </template>

      <UTable :data="applicants" :columns="applicantColumns" :loading="loadingApplicants">
        <template #job_seeker_name-cell="{ row }">
          <NuxtLink :to="`/hiring/applicants/${row.original.id}`" class="font-medium text-primary hover:underline">
            {{ row.original.job_seeker_name || 'Unnamed applicant' }}
          </NuxtLink>
        </template>
        <template #status-cell="{ row }">
          <HiringStatusBadge :status="row.original.status" />
        </template>
      </UTable>
    </UCard>
  </HiringPanel>
</template>
