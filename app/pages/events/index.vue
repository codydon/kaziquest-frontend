<script setup lang="ts">
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import type { EventRecord } from '~/types/events'
import { eventService } from '~~/services/events.service'
import { parseApiError } from '~/utils/parseApiError'

definePageMeta({
  layout: 'default'
})

const toast = useToast()
const { session } = useAuthSession()
const { isAdmin, isManager } = useRolePermissionGuard()

const modalOpen = ref(false)
const deleteOpen = ref(false)
const viewOnly = ref(false)
const selectedEvent = ref<EventRecord | null>(null)
const deleteLoading = ref(false)
const statusUpdatingId = ref<string | null>(null)
const loadError = ref('')

const range = ref({
  start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
})

const calendarRange = computed({
  get: () => ({
    start: new CalendarDate(
      range.value.start.getFullYear(),
      range.value.start.getMonth() + 1,
      range.value.start.getDate()
    ),
    end: new CalendarDate(
      range.value.end.getFullYear(),
      range.value.end.getMonth() + 1,
      range.value.end.getDate()
    )
  }),
  set: (value: { start: CalendarDate | null, end: CalendarDate | null }) => {
    range.value = {
      start: value.start ? value.start.toDate(getLocalTimeZone()) : new Date(),
      end: value.end ? value.end.toDate(getLocalTimeZone()) : new Date()
    }
  }
})

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

function toIsoDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${year}-${month}-${day}T00:00:00`
}

const queryString = computed(() => {
  const endDate = new Date(range.value.end)
  endDate.setDate(endDate.getDate() + 1)
  return urlParamsExtensionUtil({
    start: toIsoDate(range.value.start),
    end: toIsoDate(endDate)
  })
})

function normalizeEvents(payload: unknown): EventRecord[] {
  if (Array.isArray(payload)) {
    return payload as EventRecord[]
  }
  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>
    if (Array.isArray(data.results)) {
      return data.results as EventRecord[]
    }
    if (data.data && typeof data.data === 'object' && Array.isArray((data.data as Record<string, unknown>).results)) {
      return (data.data as { results: EventRecord[] }).results
    }
  }
  return []
}

const {
  data: eventsData,
  status,
  refresh
} = await useAsyncData(
  () => `events:${queryString.value}`,
  async () => {
    loadError.value = ''
    try {
      const response = await eventService.getEvents(queryString.value)
      return normalizeEvents(response)
    }
    catch (error: unknown) {
      loadError.value = parseApiError(error, 'Unable to load events.')
      return []
    }
  },
  {
    watch: [queryString],
    default: () => [],
    server: false
  }
)

const events = computed(() => eventsData.value ?? [])
const loading = computed(() => status.value === 'pending')
const canManageEvents = computed(() => isAdmin.value || isManager.value)

const companyName = computed(() => {
  return String((session.value.user?.company as { name?: string } | undefined)?.name || 'KaziQuest')
})

useSeoMeta({
  title: `${companyName.value} - Events`,
  ogTitle: `${companyName.value} - Events`
})

function openCreate() {
  selectedEvent.value = null
  viewOnly.value = false
  modalOpen.value = true
}

function openView(event: EventRecord) {
  selectedEvent.value = event
  viewOnly.value = true
  modalOpen.value = true
}

function openEdit(event: EventRecord) {
  selectedEvent.value = event
  viewOnly.value = false
  modalOpen.value = true
}

function askDelete(event: EventRecord) {
  selectedEvent.value = event
  deleteOpen.value = true
}

async function confirmDelete() {
  if (!selectedEvent.value?.id) {
    return
  }
  deleteLoading.value = true
  try {
    await eventService.deleteEvent(String(selectedEvent.value.id))
    toast.add({ title: 'Event deleted', color: 'success' })
    deleteOpen.value = false
    await refresh()
  }
  catch (error: unknown) {
    toast.add({
      title: 'Could not delete event',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  }
  finally {
    deleteLoading.value = false
  }
}

async function toggleStatus(event: EventRecord) {
  if (!event.id) {
    return
  }
  const nextStatus = event.status === 'done' ? 'undone' : 'done'
  statusUpdatingId.value = String(event.id)
  try {
    await eventService.updateEvent(String(event.id), {
      body: {
        status: nextStatus
      }
    })
    toast.add({
      title: nextStatus === 'done' ? 'Event marked complete' : 'Event marked incomplete',
      color: 'success'
    })
    await refresh()
  }
  catch (error: unknown) {
    toast.add({
      title: 'Could not update status',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  }
  finally {
    statusUpdatingId.value = null
  }
}

function resetRange() {
  range.value = {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  }
}
</script>

<template>
  <UDashboardPanel id="events">
    <template #header>
      <DashboardPageHeader
        title="Events"
        breadcrumb="Dashboard / Events"
      >
        <template #right>
          <UButton
            v-if="canManageEvents"
            icon="i-lucide-plus"
            label="Add new event"
            @click="openCreate"
          />
          <UserMenu avatar-only class="shrink-0" />
        </template>
      </DashboardPageHeader>
    </template>

    <template #body>
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div class="space-y-6">
          <UCard>
            <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div class="space-y-2">
                <UBadge color="primary" variant="soft" label="Schedule" />
                <div class="space-y-1">
                  <h1 class="text-2xl font-semibold text-highlighted">
                    Keep every event on track
                  </h1>
                  <p class="max-w-2xl text-sm text-muted">
                    Review upcoming sessions, internal meetings, and employer touchpoints in one place.
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <UBadge color="neutral" variant="soft">
                  {{ events.length }} scheduled
                </UBadge>
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-refresh-cw"
                  :loading="loading"
                  @click="() => refresh()"
                >
                  Refresh
                </UButton>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div class="space-y-1">
                <p class="text-sm font-medium text-highlighted">
                  Active range
                </p>
                <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span>{{ formatShortDate(range.start) }}</span>
                  <UIcon name="i-lucide-arrow-right" class="size-4" />
                  <span>{{ formatShortDate(range.end) }}</span>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-rotate-ccw"
                  @click="resetRange"
                >
                  Reset range
                </UButton>
              </div>
            </div>
          </UCard>

          <UAlert
            v-if="loadError"
            color="error"
            variant="soft"
            title="Unable to load events"
            :description="loadError"
          />

          <div v-if="loading" class="grid gap-4">
            <USkeleton v-for="n in 3" :key="n" class="h-40 w-full rounded-xl" />
          </div>

          <div
            v-else-if="!events.length"
            class="rounded-2xl border border-dashed border-default bg-muted/20 px-6 py-16 text-center"
          >
            <div class="mx-auto flex max-w-md flex-col items-center gap-3">
              <div class="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UIcon name="i-lucide-calendar-days" class="size-7" />
              </div>
              <h2 class="text-lg font-semibold text-highlighted">
                No events for this date range
              </h2>
              <p class="text-sm text-muted">
                Adjust the range or add a new event to keep your team informed.
              </p>
              <UButton
                v-if="canManageEvents"
                icon="i-lucide-plus"
                label="Add new event"
                @click="openCreate"
              />
            </div>
          </div>

          <div v-else class="grid gap-4">
            <UCard
              v-for="event in events"
              :key="String(event.id)"
              class="overflow-hidden"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div class="flex items-start gap-3">
                  <UCheckbox
                    :model-value="event.status === 'done'"
                    :disabled="statusUpdatingId === String(event.id)"
                    @update:model-value="() => void toggleStatus(event)"
                  />

                  <div class="space-y-3">
                    <div class="flex flex-wrap items-center gap-2">
                      <h2 class="text-lg font-semibold text-highlighted">
                        {{ event.name }}
                      </h2>
                      <UBadge
                        v-if="event.status === 'done'"
                        color="success"
                        variant="soft"
                        label="Completed"
                      />
                      <UBadge
                        v-if="event.frequency"
                        color="neutral"
                        variant="soft"
                      >
                        {{ event.frequency }}
                      </UBadge>
                    </div>

                    <div class="flex flex-wrap items-center gap-3 text-sm text-muted">
                      <span class="inline-flex items-center gap-2">
                        <UIcon name="i-lucide-clock-3" class="size-4" />
                        {{ formatDateTime(event.start_date_time) }}
                      </span>
                      <span class="text-muted">to</span>
                      <span>{{ formatDateTime(event.end_date_time) }}</span>
                    </div>

                    <div v-if="event.location || event.link" class="flex flex-wrap items-center gap-4 text-sm text-muted">
                      <span v-if="event.location" class="inline-flex items-center gap-2">
                        <UIcon name="i-lucide-map-pin" class="size-4" />
                        {{ event.location }}
                      </span>
                      <a
                        v-if="event.link"
                        :href="event.link"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <UIcon name="i-lucide-link" class="size-4" />
                        Event link
                      </a>
                    </div>

                    <div v-if="event.cohosts?.length" class="flex flex-wrap gap-2">
                      <UBadge
                        v-for="email in event.cohosts"
                        :key="email"
                        color="neutral"
                        variant="soft"
                      >
                        {{ email }}
                      </UBadge>
                    </div>

                    <p v-if="event.text" class="text-sm text-toned">
                      {{ event.text }}
                    </p>
                  </div>
                </div>

                <div class="flex shrink-0 flex-wrap gap-2 lg:ml-auto">
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-eye"
                    @click="openView(event)"
                  >
                    View
                  </UButton>
                  <UButton
                    v-if="canManageEvents"
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-pencil"
                    @click="openEdit(event)"
                  >
                    Edit
                  </UButton>
                  <UButton
                    v-if="canManageEvents"
                    color="error"
                    variant="outline"
                    icon="i-lucide-trash-2"
                    @click="askDelete(event)"
                  >
                    Delete
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <div class="space-y-6">
          <UCard>
            <template #header>
              <div class="space-y-1">
                <h2 class="text-base font-semibold text-highlighted">
                  Date range
                </h2>
                <p class="text-sm text-muted">
                  Select the period to filter scheduled events.
                </p>
              </div>
            </template>

            <UCalendar
              v-model="calendarRange"
              class="w-full"
              range
            />
          </UCard>

          <UCard>
            <div class="space-y-3">
              <h2 class="text-base font-semibold text-highlighted">
                Quick notes
              </h2>
              <ul class="space-y-2 text-sm text-muted">
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-check-check" class="mt-0.5 size-4 text-primary" />
                  Mark events done directly from the list.
                </li>
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-users" class="mt-0.5 size-4 text-primary" />
                  Review hosts and co-hosts before sending updates.
                </li>
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-calendar-range" class="mt-0.5 size-4 text-primary" />
                  Use the calendar to focus on the current planning window.
                </li>
              </ul>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <EventsCreateUpdateModal
    v-model:open="modalOpen"
    :event="selectedEvent"
    :view-only="viewOnly"
    @success="() => refresh()"
  />

  <UModal
    v-model:open="deleteOpen"
    :title="`Delete ${selectedEvent?.name || 'event'}?`"
    description="This action cannot be undone."
  >
    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancel"
          :disabled="deleteLoading"
          @click="deleteOpen = false"
        />
        <UButton
          color="error"
          label="Delete event"
          :loading="deleteLoading"
          @click="void confirmDelete()"
        />
      </div>
    </template>
  </UModal>
</template>
