<script setup lang="ts">
import { smsService } from '~~/services/sms.service'
import { parseApiError } from '~/utils/parseApiError'

definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'Settings — Integrations',
  description: 'Connected apps and SMS providers.'
})

const toast = useToast()

const providers = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const activeTab = ref<'viewAll' | 'sms'>('viewAll')

const detailsOpen = ref(false)
const selectedIntegration = ref<Record<string, unknown>>({})

const filteredProviders = computed(() => {
  if (activeTab.value === 'sms') {
    return providers.value.filter(item => (item as { type?: string }).type === 'sms')
  }
  return providers.value
})

async function loadProviders() {
  loading.value = true
  try {
    const response = await smsService.getSmsProviders() as unknown
    if (Array.isArray(response)) {
      providers.value = response as Record<string, unknown>[]
    } else if (response && typeof response === 'object' && Array.isArray((response as { results?: unknown[] }).results)) {
      providers.value = (response as { results: Record<string, unknown>[] }).results
    } else {
      providers.value = []
    }
  } catch (err: unknown) {
    toast.add({
      title: 'Could not load integrations',
      description: parseApiError(err, 'Request failed.'),
      color: 'error'
    })
    providers.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadProviders()
})

function requestIntegration() {
  window.location.href = 'mailto:hello@kaziquest.com?subject=Request%20for%20integration'
}

function openDetails(item: Record<string, unknown>) {
  selectedIntegration.value = item
  detailsOpen.value = true
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-lg font-semibold text-default">
          Integrations
        </h2>
        <p class="text-sm text-muted">
          Connect your account to other apps and services.
        </p>
      </div>
      <UButton
        color="neutral"
        label="Request integration"
        icon="i-lucide-mail"
        class="shrink-0"
        @click="requestIntegration"
      />
    </div>

    <div class="flex flex-wrap gap-2 border-b border-default pb-2">
      <UButton
        size="sm"
        :variant="activeTab === 'viewAll' ? 'solid' : 'ghost'"
        label="View all"
        @click="activeTab = 'viewAll'"
      />
      <UButton
        size="sm"
        :variant="activeTab === 'sms' ? 'solid' : 'ghost'"
        label="SMS"
        @click="activeTab = 'sms'"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
    </div>
    <div v-else class="flex flex-wrap gap-4">
      <UCard
        v-for="(item, index) in filteredProviders"
        :key="index"
        class="w-full max-w-sm flex-1"
        :ui="{ body: 'space-y-4' }"
      >
        <div class="flex items-center gap-4">
          <div class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
            <img
              v-if="(item as { logo_url?: string }).logo_url"
              :src="String((item as { logo_url?: string }).logo_url)"
              :alt="String((item as { name?: string }).name || '')"
              class="max-h-14 max-w-14 object-contain"
            >
          </div>
          <div class="min-w-0">
            <p class="truncate font-semibold">
              {{ (item as { name?: string }).name || '—' }}
            </p>
          </div>
        </div>
        <p class="text-sm text-muted">
          {{ (item as { description?: string }).description || '—' }}
        </p>
        <UButton
          variant="outline"
          icon="i-lucide-eye"
          label="View integration"
          block
          @click="openDetails(item)"
        />
      </UCard>
    </div>

    <SettingsIntegrationDetailsModal
      v-model:open="detailsOpen"
      :integration="selectedIntegration"
      @saved="() => void loadProviders()"
    />
  </div>
</template>
