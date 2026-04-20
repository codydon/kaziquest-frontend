<script setup lang="ts">
import { jobService } from '~~/services/jobs.service'
import { useAuthStore } from '~/stores/auth'
import { parseApiError } from '~/utils/parseApiError'
import { createEmptyHiringJobForm } from '~/utils/hiring'

definePageMeta({ layout: 'default' })

const toast = useToast()
const authStore = useAuthStore()
const loading = ref(false)
const state = reactive(createEmptyHiringJobForm())

async function submitWithStatus(status: 'DRAFT' | 'OPEN' | 'FUTURE OPPORTUNITY') {
  if (authStore.isJobPostLimitReached.value) {
    toast.add({
      title: 'Job posting limit reached',
      description: 'Upgrade your plan to create more job postings.',
      color: 'warning'
    })
    return
  }

  loading.value = true
  try {
    const response = await jobService.addJob({
      handler: '$fetch',
      body: {
        ...state,
        status,
        published: status === 'OPEN'
      }
    }) as { slug?: string }
    toast.add({ title: 'Job created', color: 'success' })
    await navigateTo(response?.slug ? `/hiring/postings/${response.slug}` : '/hiring/postings')
  } catch (error: unknown) {
    toast.add({
      title: 'Could not create job',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <HiringPanel id="hiring-postings-new" title="Create Job Posting" description="Build a new job opening and publish it to your hiring pipeline.">
    <UCard>
      <HiringJobForm
        :state="state"
        :loading="loading"
        submit-label="Create job"
        :show-status-actions="true"
        @submit="submitWithStatus('DRAFT')"
        @save-draft="submitWithStatus('DRAFT')"
        @preview="submitWithStatus('FUTURE OPPORTUNITY')"
        @publish="submitWithStatus('OPEN')"
      />
    </UCard>
  </HiringPanel>
</template>
