<script setup lang="ts">
import { jobService } from '~~/services/jobs.service'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/parseApiError'
import { createEmptyHiringJobForm } from '~/utils/hiring'

definePageMeta({ layout: 'default' })

const route = useRoute()
const toast = useToast()
const state = reactive(createEmptyHiringJobForm())
const loading = ref(false)

const { data, pending } = await useAsyncData(
  `hiring-job-${String(route.params.slug)}-edit`,
  () => useApi('/jobs', {
    handler: '$fetch',
    params: { slug: route.params.slug }
  })
)

watchEffect(() => {
  const job = data.value as Record<string, any> | null | undefined
  if (!job) {
    return
  }
  state.title = String(job.title || '')
  state.description = String(job.description || '')
  state.employment_type = String(job.employment_type || '')
  state.experience = String(job.experience || '')
  state.job_level = String(job.job_level || '')
  state.education_level = String(job.education_level || '')
  state.currency = String(job.currency || '')
  state.min_salary = job.min_salary == null ? null : Number(job.min_salary)
  state.max_salary = job.max_salary == null ? null : Number(job.max_salary)
  state.category = String(job.category || '')
  state.country = String(job.country || '')
  state.job_location = String(job.job_location || '')
  state.valid_through = String(job.valid_through || '').slice(0, 10)
  state.status = String(job.status || 'DRAFT')
  state.published = Boolean(job.published)
  state.questions = Array.isArray(job.questions) ? job.questions : []
  state.documents = Array.isArray(job.documents) ? job.documents : []
})

async function save(status: string) {
  const job = data.value as { id?: string, slug?: string } | null | undefined
  if (!job?.id) {
    return
  }
  loading.value = true
  try {
    await jobService.editJob(job.id, {
      handler: '$fetch',
      body: {
        ...state,
        status,
        published: status === 'OPEN'
      }
    })
    toast.add({ title: 'Job updated', color: 'success' })
    await navigateTo(job.slug ? `/hiring/postings/${job.slug}` : '/hiring/postings')
  } catch (error: unknown) {
    toast.add({
      title: 'Could not update job',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <HiringPanel id="hiring-postings-edit" title="Edit Job Posting" description="Update the details, questions, and publication state of this role.">
    <UCard v-if="pending">
      <div class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>
    </UCard>
    <UCard v-else>
      <HiringJobForm
        :state="state"
        :loading="loading"
        submit-label="Save changes"
        :show-status-actions="true"
        @submit="save(state.status || 'DRAFT')"
        @save-draft="save('DRAFT')"
        @preview="save('FUTURE OPPORTUNITY')"
        @publish="save('OPEN')"
      />
    </UCard>
  </HiringPanel>
</template>
