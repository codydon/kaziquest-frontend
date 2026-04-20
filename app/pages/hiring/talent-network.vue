<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { HiringTalentRecord } from '~/types/hiring'
import { talentNetworkService } from '~~/services/talent-network.service'
import { urlParamsExtensionUtil } from '~/utils/urlParams'
import { toCsvBlob, downloadBlob } from '~/utils/hiring'

definePageMeta({ layout: 'default' })

const query = reactive({
  page: 1,
  page_size: 10,
  search_str: '',
  gender: ''
})

const { session } = useAuthSession()
const company = computed(() => (session.value.user?.company as { id?: string } | undefined) ?? {})

const { data, pending, refresh } = await useAsyncData(
  'hiring-talent-network',
  () => talentNetworkService.getCompanyTalentNetwork({
    page: query.page,
    page_size: query.page_size,
    company: company.value.id || '',
    search_str: query.search_str,
    gender: query.gender
  }),
  { watch: [() => ({ ...query }), company] }
)

const pagination = computed(() => (data.value as { results?: HiringTalentRecord[], count?: number } | null) ?? { results: [], count: 0 })
const rows = computed(() => pagination.value.results ?? [])

const columns: TableColumn<HiringTalentRecord>[] = [
  { accessorKey: 'firstname', header: 'First name' },
  { accessorKey: 'lastname', header: 'Last name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'gender', header: 'Gender' },
  { accessorKey: 'industry', header: 'Industry' }
]

function exportRows() {
  const blob = toCsvBlob(rows.value.map((row) => ({
    first_name: row.firstname || '',
    last_name: row.lastname || '',
    email: row.email || '',
    gender: row.gender || '',
    industry: row.industry || ''
  })))
  downloadBlob(blob, `talent-network-${new Date().toISOString().slice(0, 10)}.csv`)
}
</script>

<template>
  <HiringPanel id="hiring-talent-network" title="Talent Network" description="Browse and score talent profiles collected in your network.">
    <template #actions>
      <div class="flex items-center gap-2">
        <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" :loading="pending" @click="() => refresh()" />
        <UButton color="neutral" variant="outline" icon="i-lucide-download" @click="exportRows">
          Export CSV
        </UButton>
      </div>
    </template>

    <UCard :ui="{ body: 'space-y-4' }">
      <div class="grid gap-3 lg:grid-cols-[1.2fr_220px_120px]">
        <UInput v-model="query.search_str" icon="i-lucide-search" placeholder="Search talent profiles" />
        <USelect v-model="query.gender" :items="[{ label: 'All genders', value: '' }, { label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }]" class="w-full" />
        <USelect v-model="query.page_size" :items="[10, 20, 30, 50]" class="w-full" />
      </div>

      <UTable :data="rows" :columns="columns" :loading="pending">
        <template #firstname-cell="{ row }">
          <NuxtLink :to="`/hiring/talent-network/${row.original.id}`" class="font-medium text-primary hover:underline">
            {{ row.original.firstname || 'Unknown' }}
          </NuxtLink>
        </template>
      </UTable>

      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-muted">
          {{ pagination.count || 0 }} profiles
        </p>
        <UPagination v-model:page="query.page" :items-per-page="query.page_size" :total="pagination.count || 0" />
      </div>
    </UCard>
  </HiringPanel>
</template>
