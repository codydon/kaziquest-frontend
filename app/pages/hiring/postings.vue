<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { HiringJobPosting } from '~/types/hiring'
import { jobService } from '~~/services/jobs.service'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/parseApiError'
import { HIRING_JOB_STATUS_OPTIONS } from '~/utils/hiring'

definePageMeta({ layout: 'default' })

const toast = useToast()
const route = useRoute()

const query = reactive({
  page: Number(route.query.page || 1),
  page_size: 10,
  search: '',
  status: ''
})

const { data, pending, refresh } = await useAsyncData(
  'hiring-postings',
  () => useApi('/jobs', {
    handler: '$fetch',
    params: {
      page: query.page,
      page_size: query.page_size,
      search: query.search || undefined
    }
  }),
  { watch: [() => ({ ...query })] }
)

const pagination = computed(() => (data.value as { results?: HiringJobPosting[], count?: number } | null) ?? { results: [], count: 0 })
const rows = computed(() => {
  const all = pagination.value.results ?? []
  if (!query.status) {
    return all
  }
  return all.filter(row => row.status === query.status)
})

const columns: TableColumn<HiringJobPosting>[] = [
  { accessorKey: 'title', header: 'Job posting' },
  { accessorKey: 'job_location', header: 'Location' },
  { accessorKey: 'valid_through', header: 'Deadline' },
  { accessorKey: 'applications_count', header: 'Applicants' },
  { accessorKey: 'status', header: 'Status' },
  { id: 'actions', header: '' }
]

const deleting = ref<string | null>(null)

async function removeJob(job: HiringJobPosting) {
  if (!job.id) {
    return
  }
  deleting.value = job.id
  try {
    await jobService.deleteJob(job.id, { handler: '$fetch' })
    toast.add({ title: `${job.title || 'Job'} deleted`, color: 'success' })
    await refresh()
  } catch (error: unknown) {
    toast.add({
      title: 'Could not delete job',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    deleting.value = null
  }
}
</script>

<template>
  <HiringPanel id="hiring-postings" title="Job Postings" description="Search, filter, and manage hiring posts.">
    <template #actions>
      <div class="flex items-center gap-2">
        <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" :loading="pending" @click="() => refresh()" />
        <UButton icon="i-lucide-plus" to="/hiring/postings/new">
          New job
        </UButton>
      </div>
    </template>

    <UCard :ui="{ body: 'space-y-4' }">
      <div class="grid gap-3 md:grid-cols-[1.2fr_220px_140px]">
        <UInput v-model="query.search" icon="i-lucide-search" placeholder="Search jobs" />
        <USelect v-model="query.status" :items="HIRING_JOB_STATUS_OPTIONS" class="w-full" />
        <USelect v-model="query.page_size" :items="[10, 20, 30, 50]" class="w-full" />
      </div>

      <UTable :data="rows" :columns="columns" :loading="pending">
        <template #title-cell="{ row }">
          <div class="flex flex-col">
            <NuxtLink :to="`/hiring/postings/${row.original.slug}`" class="font-medium text-primary hover:underline">
              {{ row.original.title || 'Untitled job' }}
            </NuxtLink>
            <span class="text-xs text-muted">
              {{ row.original.company?.name || 'Company job posting' }}
            </span>
          </div>
        </template>

        <template #status-cell="{ row }">
          <HiringStatusBadge :status="row.original.status" />
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-2">
            <UButton size="xs" variant="outline" color="neutral" :to="`/hiring/postings/${row.original.slug}`">
              View
            </UButton>
            <UButton size="xs" variant="outline" color="neutral" :to="`/hiring/postings/${row.original.slug}/edit`">
              Edit
            </UButton>
            <UButton size="xs" color="error" variant="ghost" :loading="deleting === row.original.id" @click="removeJob(row.original)">
              Delete
            </UButton>
          </div>
        </template>
      </UTable>

      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-muted">
          {{ pagination.count || 0 }} total jobs
        </p>
        <UPagination v-model:page="query.page" :items-per-page="query.page_size" :total="pagination.count || 0" />
      </div>
    </UCard>
  </HiringPanel>
</template>
