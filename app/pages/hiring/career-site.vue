<script setup lang="ts">
import type { HiringJobPosting } from '~/types/hiring'
import { useApi } from '~/composables/useApi'

definePageMeta({ layout: 'default' })

const { session } = useAuthSession()
const company = computed(() => (session.value.user?.company as Record<string, unknown> | undefined) ?? {})
const search = ref('')
const page = ref(1)
const pageSize = ref(10)

const { data, pending, refresh } = await useAsyncData(
  'hiring-career-site-jobs',
  () => useApi('/jobs', {
    handler: '$fetch',
    params: {
      page: page.value,
      page_size: pageSize.value,
      search_str: search.value,
      published: true
    }
  }),
  { watch: [search, page, pageSize] }
)

const rows = computed(() => ((data.value as { results?: HiringJobPosting[] } | null)?.results ?? []))
const publicCareerUrl = computed(() => {
  const subdomain = String(company.value.subdomain_name || '').trim()
  return subdomain ? `https://${subdomain}.kaziquest.com` : ''
})

async function copyLink(value: string) {
  if (!value) {
    return
  }
  await navigator.clipboard.writeText(value)
}
</script>

<template>
  <HiringPanel id="hiring-career-site" title="Career Site" description="Manage the public-facing hiring experience and preview live job links.">
    <template #actions>
      <div class="flex items-center gap-2">
        <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" :loading="pending" @click="() => refresh()" />
        <UButton v-if="publicCareerUrl" color="neutral" variant="outline" icon="i-lucide-copy" @click="copyLink(publicCareerUrl)">
          Copy live URL
        </UButton>
        <UButton v-if="publicCareerUrl" :to="publicCareerUrl" external target="_blank" icon="i-lucide-arrow-up-right">
          Open site
        </UButton>
      </div>
    </template>

    <div class="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <UCard :ui="{ body: 'space-y-4' }">
        <div class="flex items-center gap-4">
          <UAvatar :src="String(company.logo || '') || undefined" :alt="String(company.name || 'Company')" size="3xl" />
          <div>
            <h2 class="text-xl font-semibold">
              {{ company.name || 'Company career site' }}
            </h2>
            <p class="mt-1 text-sm text-muted">
              {{ company.description || 'Publish your open roles and direct candidates to your branded hiring experience.' }}
            </p>
            <p v-if="publicCareerUrl" class="mt-3 text-sm text-primary">
              {{ publicCareerUrl }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="space-y-3">
          <h3 class="font-semibold">
            Talent Network Join Link
          </h3>
          <p class="text-sm text-muted">
            Share this link to let candidates join your talent network even when no role is open.
          </p>
          <code class="block rounded-lg bg-elevated px-3 py-2 text-sm">
            {{ publicCareerUrl ? `${publicCareerUrl}/talent-network/join-talent-network` : 'Unavailable until subdomain is configured' }}
          </code>
          <UButton
            v-if="publicCareerUrl"
            color="neutral"
            variant="outline"
            icon="i-lucide-copy"
            @click="copyLink(`${publicCareerUrl}/talent-network/join-talent-network`)"
          >
            Copy talent link
          </UButton>
        </div>
      </UCard>
    </div>

    <UCard :ui="{ body: 'space-y-4' }">
      <div class="grid gap-3 lg:grid-cols-[1.2fr_120px]">
        <UInput v-model="search" icon="i-lucide-search" placeholder="Search public job posts" />
        <USelect v-model="pageSize" :items="[10, 20, 30, 50]" class="w-full" />
      </div>

      <div v-if="pending" class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>
      <div v-else-if="!rows.length" class="rounded-lg border border-dashed border-default px-4 py-8 text-center text-sm text-muted">
        No published jobs found.
      </div>
      <div v-else class="space-y-3">
        <div v-for="job in rows" :key="job.id" class="rounded-lg border border-default px-4 py-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="font-semibold">
                {{ job.title || 'Untitled job' }}
              </h3>
              <p class="mt-1 text-sm text-muted">
                {{ job.job_location || 'Location not specified' }} · {{ job.employment_type || 'Employment type not set' }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <HiringStatusBadge :status="job.status" />
              <UButton :to="`/jobs/${job.slug}`" target="_blank" color="neutral" variant="outline">
                Public view
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </HiringPanel>
</template>
