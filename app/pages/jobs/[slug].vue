<script setup lang="ts">
import type { HiringJobPosting } from '~/types/hiring'
import { applicationService } from '~~/services/applications.service'
import { useApi } from '~/composables/useApi'
import { parseApiError } from '~/utils/parseApiError'

definePageMeta({ layout: false })

const route = useRoute()
const toast = useToast()
const loading = ref(false)

const { data, pending } = await useAsyncData(
  `public-job-${String(route.params.slug)}`,
  () => useApi('/jobs', {
    handler: '$fetch',
    secured: false,
    params: {
      slug: route.params.slug,
      published: true
    }
  })
)

const job = computed(() => (data.value as HiringJobPosting | null) ?? {})

const form = reactive({
  name: '',
  salutation: '',
  yob: '',
  gender: '',
  phone: '',
  email: '',
  linkedin_url: '',
  source: '',
  cv: null as File | null,
  cover_letter: null as File | null
})

const questionAnswers = ref<Record<string, string>>({})
const extraDocuments = ref<Record<string, File | null>>({})

function onFileChange(event: Event, key: 'cv' | 'cover_letter') {
  const target = event.target as HTMLInputElement
  form[key] = target.files?.[0] ?? null
}

function onDocumentChange(event: Event, documentId: string) {
  const target = event.target as HTMLInputElement
  extraDocuments.value[documentId] = target.files?.[0] ?? null
}

async function submitApplication() {
  if (!job.value.id) {
    return
  }

  loading.value = true
  try {
    const payload = new FormData()
    payload.append('job', job.value.id)
    payload.append('name', form.name)
    payload.append('salutation', form.salutation)
    payload.append('yob', form.yob)
    payload.append('gender', form.gender)
    payload.append('phone', form.phone)
    payload.append('email', form.email)
    payload.append('linkedin_url', form.linkedin_url)
    payload.append('source', form.source)

    if (form.cv) {
      payload.append('cv', form.cv)
    }
    if (form.cover_letter) {
      payload.append('cover_letter', form.cover_letter)
    }

    const answers = (job.value.questions || []).map((question) => ({
      question: question.id,
      answer: questionAnswers.value[String(question.id || '')] || ''
    }))
    payload.append('answers', JSON.stringify(answers))

    let documentIndex = 0
    for (const document of job.value.documents || []) {
      const file = extraDocuments.value[String(document.id || '')]
      if (file && document.id) {
        payload.append(`documents[${documentIndex}][jobdocument_id]`, String(document.id))
        payload.append(`documents[${documentIndex}][file]`, file)
        documentIndex += 1
      }
    }
    if (documentIndex === 0) {
      payload.append('documents', JSON.stringify([]))
    }

    await applicationService.applyJob({
      handler: '$fetch',
      secured: false,
      body: payload
    })
    toast.add({
      title: 'Application submitted',
      description: 'Your application has been sent successfully.',
      color: 'success'
    })
  } catch (error: unknown) {
    toast.add({
      title: 'Could not submit application',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-neutral-50 to-white px-4 py-10 sm:px-6 lg:px-10">
    <div class="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <UCard :ui="{ body: 'space-y-5' }">
        <div class="flex items-start gap-4">
          <UAvatar :src="job.company?.logo || undefined" :alt="job.company?.name || 'Company'" size="3xl" />
          <div>
            <p class="text-sm text-muted">{{ job.company?.name || 'Hiring company' }}</p>
            <h1 class="mt-1 text-3xl font-semibold">{{ job.title || 'Job opening' }}</h1>
            <p class="mt-2 text-sm text-muted">
              {{ job.job_location || 'Location not specified' }} · {{ job.employment_type || 'Employment type not set' }}
            </p>
          </div>
        </div>

        <div v-if="pending" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
        </div>
        <div v-else class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Deadline</p>
              <p class="mt-1 font-medium">{{ job.valid_through || '—' }}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-muted">Level</p>
              <p class="mt-1 font-medium">{{ job.job_level || '—' }}</p>
            </div>
          </div>

          <div>
            <h2 class="font-semibold">Job Description</h2>
            <p class="mt-2 whitespace-pre-line text-sm text-muted">
              {{ job.description || 'No description available.' }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard :ui="{ body: 'space-y-4' }">
        <template #header>
          <div>
            <h2 class="text-xl font-semibold">Apply Now</h2>
            <p class="text-sm text-muted">Complete the form below to submit your application.</p>
          </div>
        </template>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Salutation">
            <USelect v-model="form.salutation" :items="['Mr', 'Ms', 'Mrs', 'Dr', 'Prof', 'Eng']" class="w-full" />
          </UFormField>
          <UFormField label="Full name" required>
            <UInput v-model="form.name" />
          </UFormField>
          <UFormField label="Year of birth">
            <UInput v-model="form.yob" />
          </UFormField>
          <UFormField label="Gender">
            <USelect v-model="form.gender" :items="['male', 'female', 'other', 'prefer_not_to_say']" class="w-full" />
          </UFormField>
          <UFormField label="Phone" required>
            <UInput v-model="form.phone" />
          </UFormField>
          <UFormField label="Email" required>
            <UInput v-model="form.email" type="email" />
          </UFormField>
        </div>

        <UFormField label="LinkedIn profile">
          <UInput v-model="form.linkedin_url" />
        </UFormField>
        <UFormField label="Source">
          <UInput v-model="form.source" placeholder="LinkedIn, referral, website..." />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="CV / resume">
            <UInput type="file" accept=".pdf,.doc,.docx" @change="onFileChange($event, 'cv')" />
          </UFormField>
          <UFormField label="Cover letter">
            <UInput type="file" accept=".pdf,.doc,.docx" @change="onFileChange($event, 'cover_letter')" />
          </UFormField>
        </div>

        <div v-if="(job.questions || []).length" class="space-y-4">
          <div>
            <h3 class="font-semibold">Screening Questions</h3>
            <p class="text-sm text-muted">Answer the role-specific questions below.</p>
          </div>
          <div v-for="question in job.questions || []" :key="question.id" class="space-y-2">
            <UFormField :label="question.question || 'Question'">
              <UTextarea
                :model-value="questionAnswers[String(question.id || '')] || ''"
                :rows="3"
                @update:model-value="questionAnswers[String(question.id || '')] = String($event)"
              />
            </UFormField>
          </div>
        </div>

        <div v-if="(job.documents || []).length" class="space-y-4">
          <div>
            <h3 class="font-semibold">Additional Documents</h3>
            <p class="text-sm text-muted">Upload any requested supporting files.</p>
          </div>
          <div v-for="document in job.documents || []" :key="document.id" class="space-y-2">
            <UFormField :label="document.name || 'Document'">
              <UInput type="file" @change="onDocumentChange($event, String(document.id || ''))" />
            </UFormField>
          </div>
        </div>

        <div class="flex justify-end">
          <UButton :loading="loading" icon="i-lucide-send" @click="submitApplication">
            Submit application
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
