<script setup lang="ts">
import { talentNetworkService } from '~~/services/talent-network.service'
import { parseApiError } from '~/utils/parseApiError'

definePageMeta({ layout: 'default' })

const route = useRoute()
const toast = useToast()

const { data, pending, refresh } = await useAsyncData(
  `hiring-talent-${String(route.params.id)}`,
  () => talentNetworkService.getTalentNetworkById(String(route.params.id)),
)

const talent = computed(() => (data.value as Record<string, any> | null) ?? {})

async function scoreDocument(id: string | number | undefined, score: number) {
  if (!id) {
    return
  }
  try {
    await talentNetworkService.rateTalentDocuments({
      body: { id, score }
    })
    toast.add({ title: 'Document score updated', color: 'success' })
    await refresh()
  } catch (error: unknown) {
    toast.add({
      title: 'Could not update document score',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  }
}
</script>

<template>
  <HiringPanel id="hiring-talent-detail" :title="`${talent.firstname || ''} ${talent.lastname || ''}`.trim() || 'Talent Profile'" description="Review profile details, uploaded documents, experience, and education scores.">
    <UCard v-if="pending">
      <div class="flex justify-center py-8">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>
    </UCard>

    <template v-else>
      <UCard :ui="{ body: 'space-y-4' }">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p class="text-xs uppercase tracking-wide text-muted">Email</p>
            <p class="mt-1 font-medium">{{ talent.email || '—' }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-muted">Phone</p>
            <p class="mt-1 font-medium">{{ talent.phone || '—' }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-muted">Gender</p>
            <p class="mt-1 font-medium">{{ talent.gender || '—' }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-muted">Industry</p>
            <p class="mt-1 font-medium">{{ talent.industry || '—' }}</p>
          </div>
        </div>
      </UCard>

      <div class="grid gap-6 xl:grid-cols-3">
        <UCard :ui="{ body: 'space-y-4' }">
          <template #header><h3 class="font-semibold">Documents</h3></template>
          <div v-if="!(talent.documents || []).length" class="text-sm text-muted">No documents uploaded.</div>
          <div v-else class="space-y-3">
            <div v-for="document in talent.documents || []" :key="document.id" class="rounded-lg border border-default px-4 py-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-medium">{{ document.name || 'Document' }}</p>
                  <a v-if="document.document" :href="document.document" target="_blank" class="mt-1 inline-block text-sm text-primary hover:underline">Open file</a>
                </div>
                <USelect :model-value="Number(document.score || 0)" :items="[0,1,2,3,4,5]" class="w-20" @update:model-value="scoreDocument(document.id, Number($event))" />
              </div>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'space-y-4' }">
          <template #header><h3 class="font-semibold">Experience</h3></template>
          <div v-if="!(talent.experiences || []).length" class="text-sm text-muted">No experience records.</div>
          <div v-else class="space-y-3">
            <div v-for="experience in talent.experiences || []" :key="experience.id" class="rounded-lg border border-default px-4 py-3">
              <p class="font-medium">{{ experience.job_title || 'Role' }}</p>
              <p class="mt-1 text-sm text-muted">{{ experience.company_name || 'Company' }} · {{ experience.location || '—' }}</p>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'space-y-4' }">
          <template #header><h3 class="font-semibold">Education</h3></template>
          <div v-if="!(talent.education || []).length" class="text-sm text-muted">No education records.</div>
          <div v-else class="space-y-3">
            <div v-for="education in talent.education || []" :key="education.id" class="rounded-lg border border-default px-4 py-3">
              <p class="font-medium">{{ education.school_name || 'Institution' }}</p>
              <p class="mt-1 text-sm text-muted">{{ education.degree_level || 'Qualification' }} · {{ education.major || '—' }}</p>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </HiringPanel>
</template>
