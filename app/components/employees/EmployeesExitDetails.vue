<script setup lang="ts">
const props = defineProps<{
  employee: { id: string; full_name: string }
  exitDetails: Record<string, unknown>
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:exitDetails': [Record<string, unknown>]
}>()

const formData = ref<Record<string, unknown>>({ ...props.exitDetails })

watch(() => props.exitDetails, (newDetails) => {
  if (newDetails) {
    formData.value = { ...newDetails }
  }
}, { deep: true })

watch(formData, () => {
  emit('update:exitDetails', { ...formData.value })
}, { deep: true })

const exitTypeItems = [
  { label: 'Resignation', value: 'resignation' },
  { label: 'Termination', value: 'termination' },
  { label: 'Retirement', value: 'retirement' },
  { label: 'Voluntary Termination', value: 'voluntary' },
  { label: 'End of Contract', value: 'end_of_contract' }
]

function onExitTypeChange(val: string | undefined) {
  formData.value.exit_type = val
}

function onReasonChange(val: string | undefined) {
  formData.value.reason_for_exit = val
}

const lastWorkingDay = computed({
  get: () => String(formData.value.last_working_day ?? ''),
  set: (v: string) => {
    formData.value.last_working_day = v
  }
})

const officialExitDate = computed({
  get: () => String(formData.value.official_exit_date ?? ''),
  set: (v: string) => {
    formData.value.official_exit_date = v
  }
})
</script>

<template>
  <div class="space-y-4">
    <UFormField label="Exit Type" required>
      <USelect
        v-if="!readonly"
        :model-value="String(formData.exit_type ?? '')"
        :items="exitTypeItems"
        value-key="value"
        label-key="label"
        placeholder="Select exit type"
        class="w-full"
        @update:model-value="onExitTypeChange"
      />
      <div v-else class="rounded border border-default bg-elevated/30 p-2">
        <p class="text-sm font-medium">
          {{ exitTypeItems.find(opt => opt.value === formData.exit_type)?.label || formData.exit_type }}
        </p>
        <p class="mt-1 text-xs text-muted">
          Exit type cannot be changed after exit is processed
        </p>
      </div>
    </UFormField>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <UFormField label="Last Working Day" required>
        <UInput
          v-model="lastWorkingDay"
          type="date"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Official Exit Date" required>
        <UInput
          v-model="officialExitDate"
          type="date"
          class="w-full"
        />
      </UFormField>
    </div>
    <UFormField label="Reason for Exit">
      <UTextarea
        :model-value="String(formData.reason_for_exit ?? '')"
        placeholder="Enter reason for exit"
        :rows="3"
        class="w-full"
        @update:model-value="onReasonChange"
      />
    </UFormField>
  </div>
</template>
