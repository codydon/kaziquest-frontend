<script setup lang="ts">
import { companyService } from '~~/services/company.service'
import { authService } from '~/services/auth.service'
import { parseApiError } from '~/utils/parseApiError'
import { useAuthStore } from '~/stores/auth'

const toast = useToast()
const { user } = useAuthStore()
const { setUser } = useAuthSession()

const DIRECTORY_KEY = 'company_directory_info'

const infoOptions = [
  { label: 'Department', value: 'department' },
  { label: 'Position', value: 'position' },
  { label: 'Social links', value: 'social_links' },
  { label: 'Reports to', value: 'reports_to' },
  { label: 'Address', value: 'address' },
  { label: 'Phone', value: 'phone' },
  { label: 'Email', value: 'email' },
  { label: 'Date of birth', value: 'dob' }
]

function readDirectoryMetaFromUser(): string[] {
  const company = (user.value as Record<string, unknown>)?.company as Record<string, unknown> | undefined
  const metaArray = company?.company_meta as Array<{ key?: string, value?: string }> | undefined
  if (!Array.isArray(metaArray)) {
    return infoOptions.map(o => o.value)
  }
  const row = metaArray.find(m => m.key === DIRECTORY_KEY)
  if (!row?.value) {
    return infoOptions.map(o => o.value)
  }
  try {
    const parsed = JSON.parse(row.value) as unknown
    return Array.isArray(parsed) ? parsed.map(String) : infoOptions.map(o => o.value)
  } catch {
    return infoOptions.map(o => o.value)
  }
}

const selectedInfo = ref<string[]>([...readDirectoryMetaFromUser()])
const loading = ref(false)

watch(
  () => (user.value as Record<string, unknown>)?.company,
  () => {
    selectedInfo.value = [...readDirectoryMetaFromUser()]
  },
  { deep: true }
)

async function refreshAuthUserInSession() {
  const response = await authService.fetchAuthUser({ handler: '$fetch' })
  const payload = (response as Record<string, unknown>)?.data ?? response
  const userData = (payload as Record<string, unknown>)?.data ?? payload
  if (!userData || typeof userData !== 'object') {
    return
  }
  const { access: _a, refresh: _r, ...rest } = userData as Record<string, unknown>
  setUser(rest as never)
}

function toggleField(value: string, on: boolean) {
  const set = new Set(selectedInfo.value)
  if (on) {
    set.add(value)
  } else {
    set.delete(value)
  }
  selectedInfo.value = Array.from(set)
}

async function saveDirectory() {
  if (!selectedInfo.value.length) {
    return
  }

  loading.value = true
  try {
    const payload = {
      category: 'company_directory',
      key: DIRECTORY_KEY,
      value: JSON.stringify(selectedInfo.value)
    }
    const res = await companyService.saveCompanyMeta({
      handler: '$fetch',
      method: 'POST',
      body: payload
    }) as Record<string, unknown>

    const success = res?.success === true
      || (res as { data?: { success?: boolean } })?.data?.success === true
    const valueStr = (res as { data?: { value?: string } })?.data?.value

    if (success && typeof valueStr === 'string' && valueStr.length) {
      try {
        selectedInfo.value = JSON.parse(valueStr) as string[]
      } catch {
        /* keep selection */
      }
      await refreshAuthUserInSession()
      toast.add({ title: 'Directory settings saved', color: 'success' })
      return
    }

    toast.add({ title: 'Save failed', description: 'Unexpected response from server.', color: 'error' })
  } catch (err: unknown) {
    toast.add({
      title: 'Save failed',
      description: parseApiError(err, 'Request failed.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <UAlert
      color="info"
      variant="subtle"
      title="Visibility note"
      description="Everyone will see the fields you include here, regardless of access level."
    />

    <UPageCard variant="subtle" title="Information to display">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <UCheckbox
          v-for="option in infoOptions"
          :key="option.value"
          :model-value="selectedInfo.includes(option.value)"
          :label="option.label"
          @update:model-value="(v: boolean | 'indeterminate') => toggleField(option.value, v === true)"
        />
      </div>
    </UPageCard>

    <UPageCard variant="subtle" title="Preview" description="Illustrative layout only; real directory uses live employee data.">
      <div class="flex flex-col gap-4 rounded-lg border border-dashed border-default p-4 sm:flex-row">
        <div class="flex flex-col items-center gap-2">
          <UAvatar size="3xl" alt="Preview" />
          <p class="text-sm font-semibold text-muted">
            Sample card
          </p>
          <div v-if="selectedInfo.includes('department')" class="flex items-center gap-2 text-sm text-muted">
            <UIcon name="i-lucide-building-2" class="size-4 shrink-0" />
            <span>Department</span>
          </div>
          <div v-if="selectedInfo.includes('social_links')" class="mt-1 flex gap-2 text-muted">
            <UIcon name="i-lucide-link" class="size-5" />
          </div>
        </div>
        <div class="grid flex-1 gap-2 text-sm sm:grid-cols-2">
          <div v-if="selectedInfo.includes('position')" class="flex items-center gap-2">
            <UIcon name="i-lucide-briefcase" class="size-4 shrink-0 text-muted" />
            <span>Job title</span>
          </div>
          <div v-if="selectedInfo.includes('address')" class="flex items-center gap-2">
            <UIcon name="i-lucide-map-pin" class="size-4 shrink-0 text-muted" />
            <span>Address</span>
          </div>
          <div v-if="selectedInfo.includes('phone')" class="flex items-center gap-2">
            <UIcon name="i-lucide-phone" class="size-4 shrink-0 text-muted" />
            <span>Phone</span>
          </div>
          <div v-if="selectedInfo.includes('email')" class="flex items-center gap-2">
            <UIcon name="i-lucide-mail" class="size-4 shrink-0 text-muted" />
            <span>Email</span>
          </div>
          <div v-if="selectedInfo.includes('dob')" class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar" class="size-4 shrink-0 text-muted" />
            <span>Date of birth</span>
          </div>
          <div v-if="selectedInfo.includes('reports_to')" class="flex items-center gap-2 sm:col-span-2">
            <UIcon name="i-lucide-users" class="size-4 shrink-0 text-muted" />
            <span>Reports to</span>
          </div>
        </div>
      </div>
    </UPageCard>

    <div class="flex justify-end">
      <UButton label="Save updates" :loading="loading" @click="() => void saveDirectory()" />
    </div>
  </div>
</template>
