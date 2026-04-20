<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import type { Employee } from '~/types/employee'
import type { EventFrequency as EventFrequencyValue, EventRecord } from '~/types/events'
import { EventFrequency } from '~/types/events'
import { employeeService } from '~~/services/employee.service'
import { eventService } from '~~/services/events.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  open: boolean
  event: EventRecord | null
  viewOnly?: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  success: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const toast = useToast()
const loading = ref(false)
const employeesLoading = ref(false)
const employees = ref<Employee[]>([])
const submitted = ref(false)
const formError = ref('')
const selectedHostId = ref('')
const stateCohosts = ref<string[]>([])
const persistedCohosts = ref<string[]>([])
const coHostInput = ref('')

const schema = z.object({
  name: z.string().min(1, 'Event name is required'),
  start_date_time: z.string().min(1, 'Start date and time is required'),
  end_date_time: z.string().min(1, 'End date and time is required'),
  link: z.string().optional(),
  location: z.string().optional(),
  text: z.string().optional(),
  frequency: z.nativeEnum(EventFrequency).optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Schema & { id?: string }>({
  id: '',
  name: '',
  start_date_time: '',
  end_date_time: '',
  link: '',
  location: '',
  text: '',
  frequency: EventFrequency.Once
})

const frequencyItems = [
  { label: 'Once', value: EventFrequency.Once },
  { label: 'Daily', value: EventFrequency.Daily },
  { label: 'Weekly', value: EventFrequency.Weekly },
  { label: 'Annual', value: EventFrequency.Annual },
  { label: 'Custom', value: EventFrequency.Custom }
]

function mergeInitialHost(records: Employee[]) {
  const initialHost = props.event?.hosts?.[0]
  if (!initialHost) {
    return records
  }

  const hostUserId = String(initialHost.user?.id || initialHost.id || '')
  if (!hostUserId) {
    return records
  }

  const exists = records.some(record => String(record.user?.id || record.id || '') === hostUserId)
  if (exists) {
    return records
  }

  return [initialHost as Employee, ...records]
}

const hostItems = computed(() =>
  employees.value.map(employee => ({
    label: employee.user?.full_name || employee.first_name || employee.work_email || 'Employee',
    value: String(employee.user?.id || employee.id || ''),
    employee
  })).filter(item => item.value)
)

const parsedCohosts = computed(() => {
  const seen = new Set<string>()
  return coHostInput.value
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter((email) => {
      if (!email) {
        return false
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return false
      }
      if (seen.has(email)) {
        return false
      }
      seen.add(email)
      return true
    })
})

const selectedHost = computed(() => {
  if (!selectedHostId.value) {
    return null
  }
  return hostItems.value.find(item => item.value === selectedHostId.value)?.employee ?? null
})

const hostError = computed(() => {
  if (selectedHost.value || !submitted.value) {
    return ''
  }
  return 'Please select an event host'
})

const dateTimeError = computed(() => {
  if (!submitted.value) {
    return ''
  }
  const start = new Date(state.start_date_time).getTime()
  const end = new Date(state.end_date_time).getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return ''
  }
  if (start > end) {
    return 'End date time should be greater than start date time'
  }
  return ''
})

watch(parsedCohosts, (emails) => {
  if (!props.viewOnly) {
    stateCohosts.value = [...emails]
  }
}, { immediate: true })

function formatDateTimeLocal(dateString?: string | null) {
  if (!dateString) {
    return ''
  }
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

function resetForm() {
  const event = props.event
  submitted.value = false
  formError.value = ''
  state.id = event?.id ? String(event.id) : ''
  state.name = event?.name ?? ''
  state.start_date_time = formatDateTimeLocal(event?.start_date_time)
  state.end_date_time = formatDateTimeLocal(event?.end_date_time)
  state.link = String(event?.link ?? '')
  state.location = String(event?.location ?? '')
  state.text = String(event?.text ?? '')
  state.frequency = (event?.frequency as EventFrequencyValue | null | undefined) ?? EventFrequency.Once
  stateCohosts.value = Array.isArray(event?.cohosts) ? [...event.cohosts] : []
  persistedCohosts.value = Array.isArray(event?.cohosts) ? [...event.cohosts] : []
  coHostInput.value = stateCohosts.value.join(', ')
  const initialHost = event?.hosts?.[0]
  selectedHostId.value = String(initialHost?.user?.id || initialHost?.id || '')
}

watch(
  () => [props.open, props.event, props.viewOnly] as const,
  ([open]) => {
    if (!open) {
      return
    }
    resetForm()
    if (!employees.value.length) {
      void loadEmployees()
    }
  },
  { immediate: true }
)

async function loadEmployees() {
  employeesLoading.value = true
  try {
    const res = await employeeService.getEmployees({
      handler: '$fetch',
      secured: true,
      query: {
        page: 1,
        page_size: 500,
        paginate: 'false',
        stats: 'false'
      }
    }) as Record<string, unknown>
    const inner = (res.data as Record<string, unknown> | undefined) ?? res
    const results = inner.results
    const items = Array.isArray(results) ? results as Employee[] : []
    employees.value = mergeInitialHost(items)
  }
  catch {
    employees.value = mergeInitialHost([])
  }
  finally {
    employeesLoading.value = false
  }
}

async function removeCohost(email: string) {
  stateCohosts.value = stateCohosts.value.filter(item => item !== email)
  coHostInput.value = stateCohosts.value.join(', ')

  if (!props.event?.id || !persistedCohosts.value.includes(email)) {
    return
  }

  try {
    await eventService.deleteCohost({
      body: {
        email,
        event_id: props.event.id
      }
    })
    persistedCohosts.value = persistedCohosts.value.filter(item => item !== email)
    toast.add({
      title: `Cohost ${email} deleted`,
      color: 'success'
    })
  }
  catch (error: unknown) {
    toast.add({
      title: 'Could not remove cohost',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  }
}

function buildPayload() {
  const hostPayload = selectedHost.value
    ? [{
        id: selectedHost.value.user?.id || selectedHost.value.id,
        user: selectedHost.value.user,
        full_name: selectedHost.value.user?.full_name || selectedHost.value.first_name || ''
      }]
    : []

  const payload: Record<string, unknown> = {
    name: state.name.trim(),
    hosts: hostPayload,
    cohosts: [...stateCohosts.value],
    start_date_time: state.start_date_time,
    end_date_time: state.end_date_time,
    frequency: state.frequency ?? EventFrequency.Once
  }

  if (state.id) {
    payload.id = state.id
  }
  if (state.link?.trim()) {
    payload.link = state.link.trim()
  }
  if (state.location?.trim()) {
    payload.location = state.location.trim()
  }
  if (state.text?.trim()) {
    payload.text = state.text.trim()
  }

  return payload
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  submitted.value = true
  formError.value = ''

  if (hostError.value || dateTimeError.value) {
    return
  }

  loading.value = true
  try {
    const payload = buildPayload()
    if (props.event?.id) {
      await eventService.updateEvent(String(props.event.id), {
        body: payload
      })
      toast.add({ title: 'Event updated', color: 'success' })
    }
    else {
      await eventService.addEvent({
        body: payload
      })
      toast.add({ title: 'Event created', color: 'success' })
    }

    emit('success')
    isOpen.value = false
  }
  catch (error: unknown) {
    formError.value = parseApiError(error, 'Request failed.')
    toast.add({
      title: props.event?.id ? 'Could not update event' : 'Could not create event',
      description: formError.value,
      color: 'error'
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="props.event ? (props.viewOnly ? 'View event details' : 'Edit event') : 'Create event'"
    :description="props.viewOnly ? 'Review event information.' : 'Complete the event details below.'"
  >
    <template #body>
      <UAlert
        v-if="formError"
        class="mb-4"
        color="error"
        variant="soft"
        :title="formError"
      />

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Event name" name="name" required>
          <UInput
            v-model="state.name"
            class="w-full"
            :disabled="props.viewOnly"
            placeholder="Enter event name"
          />
        </UFormField>

        <UFormField label="Event host" required>
          <template v-if="props.viewOnly">
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="host in props.event?.hosts || []"
                :key="String(host.user?.id || host.id || host.full_name)"
                color="neutral"
                variant="soft"
              >
                {{ host.full_name || host.user?.full_name || 'Unknown host' }}
              </UBadge>
            </div>
          </template>
          <template v-else>
            <USelectMenu
              v-model="selectedHostId"
              searchable
              value-key="value"
              label-key="label"
              class="w-full"
              :loading="employeesLoading"
              :items="hostItems"
              placeholder="Select event host"
            />
            <p v-if="hostError" class="mt-1 text-sm text-error">
              {{ hostError }}
            </p>
          </template>
        </UFormField>

        <UFormField label="Co-hosts">
          <template v-if="props.viewOnly">
            <div v-if="stateCohosts.length" class="flex flex-wrap gap-2">
              <UBadge
                v-for="email in stateCohosts"
                :key="email"
                color="neutral"
                variant="soft"
              >
                {{ email }}
              </UBadge>
            </div>
            <p v-else class="text-sm text-muted">
              No co-hosts
            </p>
          </template>
          <template v-else>
            <UInput
              v-model="coHostInput"
              class="w-full"
              icon="i-lucide-users"
              placeholder="cohost1@example.com, cohost2@example.com"
            />
            <div v-if="stateCohosts.length" class="mt-2 flex flex-wrap gap-2">
              <UButton
                v-for="email in stateCohosts"
                :key="email"
                type="button"
                color="neutral"
                variant="soft"
                size="sm"
                trailing-icon="i-lucide-x"
                @click="void removeCohost(email)"
              >
                {{ email }}
              </UButton>
            </div>
          </template>
        </UFormField>

        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Event link" name="link">
            <UInput
              v-model="state.link"
              class="w-full"
              icon="i-lucide-link"
              :disabled="props.viewOnly"
              placeholder="https://example.com/event"
            />
          </UFormField>

          <UFormField label="Location" name="location">
            <UInput
              v-model="state.location"
              class="w-full"
              icon="i-lucide-map-pin"
              :disabled="props.viewOnly"
              placeholder="Event location"
            />
          </UFormField>
        </div>

        <UFormField label="Frequency" name="frequency">
          <USelect
            v-model="state.frequency"
            class="w-full"
            :disabled="props.viewOnly"
            :items="frequencyItems"
            value-key="value"
            label-key="label"
          />
        </UFormField>

        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Start date and time" name="start_date_time" required>
            <UInput
              v-model="state.start_date_time"
              class="w-full"
              type="datetime-local"
              :disabled="props.viewOnly"
            />
          </UFormField>

          <UFormField label="End date and time" name="end_date_time" required>
            <UInput
              v-model="state.end_date_time"
              class="w-full"
              type="datetime-local"
              :disabled="props.viewOnly"
            />
          </UFormField>
        </div>

        <p v-if="dateTimeError" class="text-sm text-error">
          {{ dateTimeError }}
        </p>

        <UFormField label="Description" name="text">
          <UTextarea
            v-model="state.text"
            class="w-full"
            :disabled="props.viewOnly"
            :rows="4"
            placeholder="Event description"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Close"
            @click="isOpen = false"
          />
          <UButton
            v-if="!props.viewOnly"
            type="submit"
            :label="props.event ? 'Update event' : 'Create event'"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
