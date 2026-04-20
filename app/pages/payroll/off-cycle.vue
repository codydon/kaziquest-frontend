<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { payrollService } from '~~/services/payroll.service'
import { ROUTE_LIST } from '~/constants/routeList'

definePageMeta({
  layout: 'default'
})

const router = useRouter()
const toast = useToast()
const { toYYYYMMDD } = usePayrollDates()

const errorMsg = ref('')

const schema = z.object({
  name: z.string().min(3, 'Payroll name must be at least 3 characters').trim(),
  pay_date: z.string().min(1, 'Pay date is required'),
  from_date: z.string().min(1, 'Start date is required'),
  to_date: z.string().min(1, 'End date is required')
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  name: '',
  pay_date: '',
  from_date: '',
  to_date: ''
})

const selectedEmployeeIds = ref<string[]>([])

const onEmployeesSelected = (value: unknown) => {
  const list = Array.isArray(value) ? value : value && typeof value === 'object' ? [value] : []
  selectedEmployeeIds.value = (list as { id?: string, user?: { id?: string } }[])
    .map(e => String(e.id ?? e.user?.id ?? ''))
    .filter(Boolean)
}

const startPayroll = ref(false)

const payload = reactive({
  name: state.name,
  pay_date: state.pay_date,
  from_date: state.from_date,
  to_date: state.to_date,
  start_payroll: startPayroll.value,
  is_off_cycle: true,
  employee_ids: [] as string[]
})

const {
  data: runPayrollData,
  error: runPayrollError,
  status: runPayrollStatus,
  execute: runPayrollExecute
} = payrollService.runPayroll({ body: payload, immediate: false }) as {
  data: Ref<{ success?: boolean } | null>
  error: Ref<{ stack?: { data?: { issues?: unknown[] } } } | null>
  status: Ref<string>
  execute: () => Promise<void>
}

const runningPayroll = computed(() => runPayrollStatus.value === 'pending')

const onSubmit = async (_event: FormSubmitEvent<Schema>) => {
  errorMsg.value = ''
  if (!selectedEmployeeIds.value.length) {
    errorMsg.value = 'Select at least one employee to pay'
    return
  }

  payload.name = state.name
  payload.pay_date = toYYYYMMDD(state.pay_date)
  payload.from_date = toYYYYMMDD(state.from_date)
  payload.to_date = toYYYYMMDD(state.to_date)
  payload.start_payroll = startPayroll.value
  payload.employee_ids = selectedEmployeeIds.value

  await runPayroll()
}

const runPayroll = async () => {
  try {
    await runPayrollExecute()
    if (runPayrollData.value?.success) {
      if (startPayroll.value) {
        toast.add({
          title: 'Success',
          description: 'Payroll has been successfully started',
          color: 'success'
        })
        await navigateTo(ROUTE_LIST.payroll.history)
      } else {
        toast.add({
          title: 'Success',
          description: 'Payroll data validated successfully. Click “Start payroll” to proceed.',
          color: 'success'
        })
        startPayroll.value = true
      }
    } else if (runPayrollError.value) {
      toast.add({
        title: 'Error',
        description: 'Failed to run payroll. Please try again.',
        color: 'error'
      })
    }
  } catch {
    toast.add({
      title: 'Error',
      description: 'An unexpected error occurred. Please try again.',
      color: 'error'
    })
  }
}

watch(startPayroll, (v) => {
  payload.start_payroll = v
})
</script>

<template>
  <UCard>
    <UButton
      class="mb-4"
      label="Back"
      icon="i-heroicons-chevron-left"
      variant="link"
      @click="router.back()"
    />

    <h2 class="text-xl font-semibold text-highlighted">
      Off-cycle payroll
    </h2>

    <div class="mt-4 space-y-4">
      <UAlert
        v-if="!startPayroll && runPayrollError"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        title="Issues detected"
      />
      <UAlert
        v-if="errorMsg"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        title="Fix these issues"
        :description="errorMsg"
      />
    </div>

    <UForm :state="state" :schema="schema" class="flex flex-col gap-4 py-4" @submit="onSubmit">
      <div class="grid gap-4 md:grid-cols-2">
        <UFormField label="Payroll name" name="name" required>
          <UInput v-model="state.name" placeholder="Payroll name" />
        </UFormField>
        <UFormField label="Pay date" name="pay_date" required>
          <UInput v-model="state.pay_date" type="date" />
        </UFormField>
        <UFormField label="Period start" name="from_date" required>
          <UInput v-model="state.from_date" type="date" />
        </UFormField>
        <UFormField label="Period end" name="to_date" required>
          <UInput v-model="state.to_date" type="date" />
        </UFormField>
      </div>

      <UFormField label="Employees to pay" required>
        <EmployeeSelect
          title="Select employees"
          placeholder="Search employees"
          @selected="onEmployeesSelected"
        />
      </UFormField>

      <div class="flex justify-end gap-2">
        <UButton
          type="button"
          label="Back to payroll"
          color="neutral"
          variant="outline"
          size="lg"
          :disabled="runningPayroll"
          @click="router.back()"
        />
        <UButton
          type="submit"
          size="lg"
          :loading="runningPayroll"
          :disabled="runningPayroll"
          :label="startPayroll ? 'Start payroll' : 'Validate'"
        />
      </div>
    </UForm>
  </UCard>
</template>
