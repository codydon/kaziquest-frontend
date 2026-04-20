<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { companyService } from '~~/services/company.service'
import { parseApiError } from '~/utils/parseApiError'
import { useAuthStore } from '~/stores/auth'

const toast = useToast()
const config = useRuntimeConfig()
const { user } = useAuthStore()
const { setUser } = useAuthSession()

const MAX_FILE_SIZE = 1024 * 1024

const COMPANY_SIZE_OPTIONS = [
  { name: '1-10 employees', value: '1-10 employees' },
  { name: '11-50 employees', value: '11-50 employees' },
  { name: '51-200 employees', value: '51-200 employees' },
  { name: '201-500 employees', value: '201-500 employees' },
  { name: '501-1,000 employees', value: '501-1,000 employees' },
  { name: '5,001-10,000 employees', value: '5,001-10,000 employees' },
  { name: '10,001 or more employees', value: '10,001 or more employees' }
]

const profileSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  display_name: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().min(1, 'Company size is required'),
  location: z.string().min(1, 'Location is required'),
  headquarters_address: z.string().min(1, 'HQ address is required'),
  website_uri: z.string().optional(),
  career_site_uri: z.string().optional(),
  kwsjca: z.string().optional(),
  suspended: z.string().optional(),
  is_hiring_agency: z.boolean()
})

type ProfileSchema = z.output<typeof profileSchema>

function companyFromUser() {
  const c = (user.value as Record<string, unknown>)?.company as Record<string, unknown> | undefined
  return c && typeof c === 'object' ? c : {}
}

const company = computed(() => companyFromUser())

const state = reactive<ProfileSchema>({
  name: '',
  display_name: '',
  description: '',
  industry: '',
  size: '',
  location: '',
  headquarters_address: '',
  website_uri: '',
  career_site_uri: '',
  kwsjca: '',
  suspended: '',
  is_hiring_agency: false
})

const logoFiles = ref<FileList | null>(null)
const bannerFiles = ref<FileList | null>(null)
const fileErrorOpen = ref(false)
const fileErrorMessage = ref('')

function syncFromCompany() {
  const c = companyFromUser()
  state.name = String(c.name ?? '')
  state.display_name = String(c.display_name ?? '')
  state.description = String(c.description ?? '')
  state.industry = String(c.industry ?? '')
  state.size = String(c.size ?? '')
  state.location = String(c.location ?? '')
  state.headquarters_address = String(c.headquarters_address ?? '')
  state.website_uri = String(c.website_uri ?? '')
  state.career_site_uri = String(c.career_site_uri ?? '')
  state.kwsjca = String(c.kwsjca ?? '')
  state.suspended = c.suspended !== undefined && c.suspended !== null ? String(c.suspended) : ''
  state.is_hiring_agency = Boolean(c.is_hiring_agency)
}

watch(
  () => (user.value as Record<string, unknown>)?.company,
  () => syncFromCompany(),
  { deep: true, immediate: true }
)

const saving = ref(false)

function validateFiles(e: Event, kind: 'logo' | 'banner') {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (files?.[0] && files[0].size > MAX_FILE_SIZE) {
    fileErrorMessage.value = 'The selected file exceeds the maximum allowed size of 1MB.'
    fileErrorOpen.value = true
    input.value = ''
    return
  }
  if (kind === 'logo') {
    logoFiles.value = files
  } else {
    bannerFiles.value = files
  }
}

async function onSubmit(_event: FormSubmitEvent<ProfileSchema>) {
  const id = company.value?.id
  if (id == null || id === '') {
    toast.add({ title: 'Missing company', description: 'No company id on your account.', color: 'error' })
    return
  }

  saving.value = true
  try {
    const formData = new FormData()
    const keysToInclude = Object.keys(state).filter(k => k !== 'is_hiring_agency')
    for (const key of keysToInclude) {
      const v = (state as Record<string, unknown>)[key]
      if (v !== undefined && v !== null && String(v).length > 0) {
        formData.append(key, String(v))
      }
    }
    formData.append('is_hiring_agency', state.is_hiring_agency ? 'true' : 'false')

    if (logoFiles.value?.[0]) {
      formData.append('logo', logoFiles.value[0])
    }
    if (bannerFiles.value?.[0]) {
      formData.append('banner', bannerFiles.value[0])
    }

    const res = await companyService.updateCompany(String(id), {
      handler: '$fetch',
      method: 'PATCH',
      body: formData
    }) as Record<string, unknown>

    if (res?.id) {
      const prev = (user.value as Record<string, unknown>) || {}
      setUser({ ...prev, company: res } as never)
      logoFiles.value = null
      bannerFiles.value = null
      toast.add({ title: 'Company profile updated', color: 'success' })
      return
    }

    toast.add({ title: 'Update failed', description: 'Unexpected response from server.', color: 'error' })
  } catch (err: unknown) {
    toast.add({
      title: 'Update failed',
      description: parseApiError(err, 'Something went wrong.'),
      color: 'error'
    })
    if (config.public.currentEnvironment !== 'production') {
      void 0
    }
  } finally {
    saving.value = false
  }
}

const careerPageUrl = computed(() => {
  const sub = company.value?.subdomain_name
  if (!sub || typeof sub !== 'string') {
    return ''
  }
  return `https://${sub}.kaziquest.com`
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <UModal v-model:open="fileErrorOpen" title="File size exceeded" :description="fileErrorMessage">
      <template #footer>
        <UButton label="OK" class="ms-auto" @click="fileErrorOpen = false" />
      </template>
    </UModal>

    <div class="grid gap-6 lg:grid-cols-2">
      <UPageCard variant="subtle" title="Company banner" description="PNG or JPG, up to 1MB.">
        <img
          v-if="company?.banner"
          :src="String(company.banner)"
          alt="Banner"
          class="mb-3 h-48 w-full rounded-lg border border-default object-cover"
        >
        <label class="mb-1 block text-sm font-medium text-default">Upload banner</label>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.gif"
          class="block w-full text-sm file:me-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium"
          @change="(e: Event) => validateFiles(e, 'banner')"
        >
      </UPageCard>

      <UPageCard variant="subtle" title="Company logo" description="PNG or JPG, up to 1MB.">
        <img
          v-if="company?.logo"
          :src="String(company.logo)"
          alt="Logo"
          class="mb-3 size-48 rounded-lg border border-default object-cover"
        >
        <label class="mb-1 block text-sm font-medium text-default">Upload logo</label>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.gif"
          class="block w-full text-sm file:me-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium"
          @change="(e: Event) => validateFiles(e, 'logo')"
        >
      </UPageCard>
    </div>

    <UForm
      id="company-profile-form"
      :schema="profileSchema"
      :state="state"
      class="flex flex-col gap-6"
      @submit="onSubmit"
    >
      <UPageCard variant="subtle" title="Details">
        <div class="flex flex-col gap-4">
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Company name" name="name" required>
              <UInput v-model="state.name" placeholder="e.g. KaziQuest Hiring Limited" />
            </UFormField>
            <UFormField label="Display name" name="display_name" required>
              <UInput v-model="state.display_name" placeholder="e.g. KaziQuest" />
            </UFormField>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Website" name="website_uri">
              <UInput v-model="state.website_uri" type="url" placeholder="https://example.com" />
            </UFormField>
            <UFormField label="Company size" name="size" required>
              <USelect
                v-model="state.size"
                :items="COMPANY_SIZE_OPTIONS"
                value-key="value"
                label-key="name"
                placeholder="Select size"
              />
            </UFormField>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField label="Location" name="location" required>
              <UInput v-model="state.location" placeholder="e.g. Nairobi" />
            </UFormField>
            <UFormField label="HQ address" name="headquarters_address" required>
              <UInput v-model="state.headquarters_address" placeholder="Street, city" />
            </UFormField>
          </div>
          <UFormField label="Short description" name="description">
            <UTextarea
              v-model="state.description"
              :rows="6"
              autoresize
              class="w-full"
            />
          </UFormField>
          <UFormField
            name="kwsjca"
            label="Keyword searchable attributes"
            description="Comma-separated keywords that help discovery."
          >
            <UTextarea
              v-model="state.kwsjca"
              :rows="4"
              autoresize
              class="w-full"
            />
          </UFormField>
          <div class="flex flex-wrap items-center gap-6">
            <UFormField name="is_hiring_agency">
              <UCheckbox v-model="state.is_hiring_agency" label="Hiring agency" />
            </UFormField>
            <div v-if="careerPageUrl" class="text-sm">
              <span class="text-muted">Career site:</span>
              <NuxtLink
                :to="careerPageUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="ms-1 font-medium text-primary underline"
              >
                {{ company?.subdomain_name }}.kaziquest.com
              </NuxtLink>
            </div>
          </div>
        </div>
      </UPageCard>

      <div class="flex flex-wrap gap-3">
        <UButton
          type="submit"
          form="company-profile-form"
          :loading="saving"
          label="Save changes"
        />
        <UButton
          v-if="careerPageUrl"
          :to="careerPageUrl"
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          color="neutral"
          icon="i-lucide-external-link"
          label="View career page"
        />
      </div>
    </UForm>
  </div>
</template>
