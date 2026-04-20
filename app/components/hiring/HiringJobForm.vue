<script setup lang="ts">
import * as z from 'zod'
import { COUNTRIES } from '~~/constants/countries'
import type { HiringJobDocument, HiringJobFormState } from '~/types/hiring'
import {
  HIRING_CURRENCY_OPTIONS,
  HIRING_EDUCATION_LEVEL_OPTIONS,
  HIRING_EMPLOYMENT_TYPE_OPTIONS,
  HIRING_JOB_LEVEL_OPTIONS
} from '~/utils/hiring'

const props = defineProps<{
  state: HiringJobFormState
  loading?: boolean
  submitLabel?: string
  showStatusActions?: boolean
}>()

const emit = defineEmits<{
  submit: [HiringJobFormState]
  saveDraft: []
  publish: []
  preview: []
}>()

const documentName = ref('')

const schema = z.object({
  title: z.string().min(1, 'Job title is required'),
  description: z.string().min(1, 'Job description is required'),
  employment_type: z.string().min(1, 'Employment type is required'),
  job_level: z.string().min(1, 'Job level is required'),
  education_level: z.string().min(1, 'Education level is required'),
  currency: z.string().min(1, 'Currency is required'),
  category: z.string().min(1, 'Category is required'),
  country: z.string().min(1, 'Country is required'),
  valid_through: z.string().min(1, 'Closing date is required')
})

function addDocument() {
  if (!documentName.value.trim()) {
    return
  }

  props.state.documents.push({ name: documentName.value.trim() } as HiringJobDocument)
  documentName.value = ''
}

function removeDocument(index: number) {
  props.state.documents.splice(index, 1)
}

function onSubmit() {
  emit('submit', { ...props.state })
}
</script>

<template>
  <UForm :schema="schema" :state="props.state" class="space-y-6" @submit="onSubmit">
    <div class="grid gap-4 lg:grid-cols-2">
      <UFormField label="Job title" name="title" required>
        <UInput v-model="props.state.title" placeholder="Senior Product Designer" />
      </UFormField>

      <UFormField label="Employment type" name="employment_type" required>
        <USelect v-model="props.state.employment_type" :items="HIRING_EMPLOYMENT_TYPE_OPTIONS" class="w-full" />
      </UFormField>

      <UFormField label="Job level" name="job_level" required>
        <USelect v-model="props.state.job_level" :items="HIRING_JOB_LEVEL_OPTIONS" class="w-full" />
      </UFormField>

      <UFormField label="Education level" name="education_level" required>
        <USelect v-model="props.state.education_level" :items="HIRING_EDUCATION_LEVEL_OPTIONS" class="w-full" />
      </UFormField>

      <UFormField label="Experience" name="experience">
        <UInput v-model="props.state.experience" placeholder="3+ years" />
      </UFormField>

      <UFormField label="Industry category" name="category" required>
        <UInput v-model="props.state.category" placeholder="Technology" />
      </UFormField>

      <UFormField label="Country" name="country" required>
        <USelect v-model="props.state.country" :items="COUNTRIES" class="w-full" />
      </UFormField>

      <UFormField label="Location" name="job_location">
        <UInput v-model="props.state.job_location" placeholder="Nairobi / Remote" />
      </UFormField>

      <UFormField label="Currency" name="currency" required>
        <USelect v-model="props.state.currency" :items="HIRING_CURRENCY_OPTIONS" class="w-full" />
      </UFormField>

      <UFormField label="Application deadline" name="valid_through" required>
        <UInput v-model="props.state.valid_through" type="date" />
      </UFormField>

      <UFormField label="Minimum salary" name="min_salary">
        <UInput v-model="props.state.min_salary" type="number" />
      </UFormField>

      <UFormField label="Maximum salary" name="max_salary">
        <UInput v-model="props.state.max_salary" type="number" />
      </UFormField>
    </div>

    <UFormField label="Job description" name="description" required>
      <UTextarea v-model="props.state.description" :rows="10" placeholder="Describe the role, team, and responsibilities." />
    </UFormField>

    <UCard :ui="{ body: 'space-y-4' }">
      <template #header>
        <div>
          <h3 class="font-semibold">
            Screening Questions
          </h3>
          <p class="text-sm text-muted">
            Add optional questions to help shortlist applicants.
          </p>
        </div>
      </template>

      <HiringQuestionsEditor v-model="props.state.questions" />
    </UCard>

    <UCard :ui="{ body: 'space-y-4' }">
      <template #header>
        <div>
          <h3 class="font-semibold">
            Required Documents
          </h3>
          <p class="text-sm text-muted">
            List optional supporting documents applicants should upload.
          </p>
        </div>
      </template>

      <div class="flex gap-2">
        <UInput v-model="documentName" class="flex-1" placeholder="Portfolio, certificate, license..." />
        <UButton icon="i-lucide-plus" label="Add" variant="outline" @click="addDocument" />
      </div>

      <div v-if="!props.state.documents.length" class="text-sm text-muted">
        No additional documents required.
      </div>

      <div v-else class="flex flex-wrap gap-2">
        <UBadge
          v-for="(document, index) in props.state.documents"
          :key="`${document.name}-${index}`"
          color="neutral"
          variant="subtle"
          class="gap-2"
        >
          {{ document.name }}
          <button type="button" class="inline-flex" @click="removeDocument(index)">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
        </UBadge>
      </div>
    </UCard>

    <div class="flex flex-wrap items-center justify-end gap-3">
      <UButton
        v-if="props.showStatusActions"
        type="button"
        variant="outline"
        icon="i-lucide-save"
        :loading="props.loading"
        @click="emit('saveDraft')"
      >
        Save draft
      </UButton>
      <UButton
        v-if="props.showStatusActions"
        type="button"
        variant="outline"
        icon="i-lucide-eye"
        :loading="props.loading"
        @click="emit('preview')"
      >
        Preview
      </UButton>
      <UButton type="submit" icon="i-lucide-check" :loading="props.loading">
        {{ props.submitLabel || 'Save job' }}
      </UButton>
      <UButton
        v-if="props.showStatusActions"
        type="button"
        icon="i-lucide-send"
        :loading="props.loading"
        @click="emit('publish')"
      >
        Publish
      </UButton>
    </div>
  </UForm>
</template>
