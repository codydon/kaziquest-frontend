<script setup lang="ts">
import { applicationService } from '~~/services/applications.service'
import { useApplicationsStore } from '~/stores/applications'
import { parseApiError } from '~/utils/parseApiError'

definePageMeta({ layout: 'default' })

const route = useRoute()
const toast = useToast()
const applicationsStore = useApplicationsStore()
const status = ref('')
const comment = ref('')

const { data, pending, refresh } = await useAsyncData(
  `hiring-application-${String(route.params.id)}`,
  () => applicationService.getApplication(String(route.params.id)),
)

const application = computed(() => (data.value as Record<string, any> | null) ?? {})

watchEffect(() => {
  status.value = String(application.value.status || '')
})

async function saveStatus() {
  if (!application.value.id) {
    return
  }
  try {
    await applicationService.changeApplicationStatus(status.value, String(application.value.id))
    toast.add({ title: 'Status updated', color: 'success' })
    await refresh()
  } catch (error: unknown) {
    toast.add({
      title: 'Could not update status',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  }
}

async function addComment() {
  if (!application.value.id || !comment.value.trim()) {
    return
  }
  try {
    await applicationsStore.addComment(comment.value.trim(), String(application.value.id))
    comment.value = ''
    toast.add({ title: 'Comment added', color: 'success' })
    await refresh()
  } catch (error: unknown) {
    toast.add({
      title: 'Could not add comment',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  }
}
</script>

<template>
  <HiringPanel id="hiring-applicant-detail" :title="String(application.job_seeker_name || 'Applicant Detail')" description="Review application history, answers, documents, comments, and communication.">
    <template #actions>
      <div class="flex items-center gap-2">
        <UButton v-if="application.prev_appl" variant="outline" color="neutral" :to="`/hiring/applicants/${application.prev_appl}`">
          Previous
        </UButton>
        <UButton v-if="application.next_appl" variant="outline" color="neutral" :to="`/hiring/applicants/${application.next_appl}`">
          Next
        </UButton>
      </div>
    </template>

    <UCard v-if="pending">
      <div class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>
    </UCard>

    <template v-else>
      <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <UCard :ui="{ body: 'space-y-4' }">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Job</p>
              <p class="mt-1 font-medium">{{ application.job_title || '—' }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Email</p>
              <p class="mt-1 font-medium">{{ application.job_seeker_email || application.job_seeker_info?.email || '—' }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Phone</p>
              <p class="mt-1 font-medium">{{ application.phone || '—' }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Source</p>
              <p class="mt-1 font-medium">{{ application.source || '—' }}</p>
            </div>
          </div>

          <div class="grid gap-3 md:grid-cols-[1fr_auto]">
            <USelect
              v-model="status"
              :items="applicationsStore.applicationStatuses.value.map((stage: { description?: string, name?: string }) => ({ label: stage.description || stage.name || '', value: stage.name || '' }))"
              placeholder="Select status"
            />
            <UButton @click="saveStatus">Save status</UButton>
          </div>
        </UCard>

        <UCard :ui="{ body: 'space-y-4' }">
          <template #header>
            <div>
              <h3 class="font-semibold">Comments</h3>
              <p class="text-sm text-muted">Internal recruiter notes for this applicant.</p>
            </div>
          </template>

          <UTextarea v-model="comment" :rows="4" placeholder="Add a comment" />
          <div class="flex justify-end">
            <UButton @click="addComment">Add comment</UButton>
          </div>

          <div v-if="!(application.app_comments || []).length" class="text-sm text-muted">
            No comments yet.
          </div>
          <div v-else class="space-y-3">
            <div v-for="item in application.app_comments || []" :key="item.id" class="rounded-lg border border-default px-4 py-3">
              <p class="text-sm font-medium">{{ item.user_info?.employee?.user?.full_name || 'Team member' }}</p>
              <p class="mt-1 text-sm text-muted">{{ item.comment || '' }}</p>
              <p class="mt-2 text-xs text-muted">{{ item.timestamp || '—' }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <UCard :ui="{ body: 'space-y-4' }">
          <template #header>
            <div>
              <h3 class="font-semibold">Answers</h3>
              <p class="text-sm text-muted">Screening question responses and ratings.</p>
            </div>
          </template>

          <div v-if="!(application.answers || []).length" class="text-sm text-muted">
            No answers submitted.
          </div>
          <div v-else class="space-y-3">
            <div v-for="answer in application.answers || []" :key="answer.id" class="rounded-lg border border-default px-4 py-3">
              <p class="font-medium">{{ answer.question_data?.question || 'Question' }}</p>
              <p class="mt-2 text-sm text-muted">{{ answer.answer || answer.chosen_choices || 'No response recorded' }}</p>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'space-y-4' }">
          <template #header>
            <div>
              <h3 class="font-semibold">Communication</h3>
              <p class="text-sm text-muted">Emails previously sent to this applicant.</p>
            </div>
          </template>

          <div v-if="!(application.app_emails || []).length" class="text-sm text-muted">
            No emails recorded.
          </div>
          <div v-else class="space-y-3">
            <div v-for="email in application.app_emails || []" :key="email.id" class="rounded-lg border border-default px-4 py-3">
              <p class="font-medium">{{ email.subject || 'No subject' }}</p>
              <p class="mt-1 text-sm text-muted">{{ email.message || '' }}</p>
              <p class="mt-2 text-xs text-muted">{{ email.timestamp || '—' }}</p>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </HiringPanel>
</template>
