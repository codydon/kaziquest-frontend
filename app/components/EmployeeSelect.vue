<script setup lang="ts">
import type { Employee } from '~/types/employee'
import { employeeService } from '~~/services/employee.service'

interface MinUser {
  id?: string
  full_name: string
}

const props = withDefaults(
  defineProps<{
    title?: string
    placeholder?: string
    multiple?: boolean
    required?: boolean
    extraOptions?: Employee[]
    removeSelected?: string[]
    selectedEmployees?: MinUser[]
  }>(),
  {
    title: 'Reports To',
    placeholder: 'Select or search employees',
    multiple: true,
    required: false,
    extraOptions: () => [],
    removeSelected: () => [],
    selectedEmployees: () => []
  }
)

const emit = defineEmits<{
  selected: [value: Employee | Employee[] | Record<string, never>]
}>()

const urlParams = reactive({
  page_size: 20,
  page: 1,
  paginate: false
})

const { data, status, refresh: refreshEmployees } = await employeeService.getEmployees({
  params: urlParams
}) as {
  data: Ref<{ results?: Employee[] } | null>
  status: Ref<string>
  refresh: () => Promise<void>
}

const loading = computed(() => status.value === 'pending')

const employees = computed(() => {
  const base = data.value?.results ?? []
  return [...props.extraOptions, ...base]
})

const employeeItems = computed(() =>
  employees.value.map((e) => {
    const id = String(e.id ?? e.user?.id ?? '')
    const label = [e.user?.full_name, e.employee_number].filter(Boolean).join(' · ') || id || 'Employee'
    return { value: id, label, employee: e }
  })
)

const selectedKeys = ref<string[]>([])

function emitSelection() {
  const keys = new Set(selectedKeys.value)
  const picked = employeeItems.value.filter(i => keys.has(i.value)).map(i => i.employee)
  if (props.multiple) {
    emit('selected', picked)
  } else {
    emit('selected', picked[0] ?? {})
  }
}

watch(selectedKeys, () => {
  emitSelection()
})

watch(
  () => props.removeSelected,
  (ids) => {
    if (!ids?.length) return
    selectedKeys.value = selectedKeys.value.filter(k => !ids.includes(k))
  },
  { deep: true }
)

function syncFromSelectedEmployees() {
  if (!props.selectedEmployees?.length) return
  const want = new Set(props.selectedEmployees.map(s => s.id).filter(Boolean) as string[])
  selectedKeys.value = employeeItems.value.filter(i => want.has(i.value)).map(i => i.value)
}

watch(
  () => props.selectedEmployees,
  () => {
    syncFromSelectedEmployees()
  },
  { deep: true }
)

onMounted(async () => {
  await refreshEmployees()
  syncFromSelectedEmployees()
  emitSelection()
})
</script>

<template>
  <UFormField :label="title" :required="required">
    <USelectMenu
      v-model="selectedKeys"
      :items="employeeItems"
      value-key="value"
      label-key="label"
      :multiple="multiple"
      searchable
      class="w-full"
      :loading="loading"
      :placeholder="loading ? 'Loading…' : placeholder"
    />
  </UFormField>
</template>
