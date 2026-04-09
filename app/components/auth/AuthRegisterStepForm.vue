<script setup lang="ts">
import * as z from 'zod'
import { ROUTE_LIST } from '~/constants/routeList'

const props = defineProps<{
  loading: boolean
  initialEmail?: string
  initialReferralCode?: string | null
  initialState?: Record<string, unknown> | null
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  submit: [payload: Record<string, unknown>]
}>()

const schema = z.object({
  first_name: z.string().min(1, 'First name is required.'),
  last_name: z.string().min(1, 'Last name is required.'),
  email: z.email('Enter a valid email address.'),
  company_name: z.string().min(1, 'Company name is required.'),
  title: z.string().min(1, 'Job title is required.'),
  phone_number: z.string().min(5, 'Phone number is required.'),
  country: z.string().min(1, 'Country is required.'),
  company_size: z.string().min(1, 'Company size is required.')
})

type RegisterSchema = z.output<typeof schema>

const companySizeOptions = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1001-5000 employees',
  '5001-10000 employees',
  '10001+ employees'
]

const countryOptions = [
  'Kenya',
  'Uganda',
  'Tanzania',
  'Rwanda',
  'Nigeria',
  'South Africa',
  'Ghana'
]

const state = reactive<Partial<RegisterSchema>>({
  first_name: String(props.initialState?.first_name || ''),
  last_name: String(props.initialState?.last_name || ''),
  email: String(props.initialState?.email || props.initialEmail || ''),
  company_name: String(props.initialState?.company_name || ''),
  title: String(props.initialState?.title || ''),
  phone_number: String(props.initialState?.phone_number || ''),
  country: String(props.initialState?.country || 'Kenya'),
  company_size: String(props.initialState?.company_size || '1-10 employees')
})

const onSubmit = () => {
  emit('submit', {
    ...state,
    is_admin: true,
    free_trial: true,
    referred_by: props.initialReferralCode || undefined
  })
}

const inputUi = {
  base: 'placeholder:text-slate-400 dark:placeholder:text-slate-500'
}
</script>

<template>
  <AuthFormShell
    title="Create your workspace"
    description="Get started in under two minutes. You can refine details after setup."
  >
    <UForm :schema="schema" :state="state" class="space-y-4 sm:space-y-5" @submit="onSubmit">

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField name="first_name" label="First name">
          <UInput v-model="state.first_name" size="lg" placeholder="First name" class="w-full min-w-0" :ui="inputUi" />
        </UFormField>

        <UFormField name="last_name" label="Last name">
          <UInput v-model="state.last_name" size="lg" placeholder="Last name" class="w-full min-w-0" :ui="inputUi" />
        </UFormField>
      </div>

      <UFormField name="email" label="Business email">
        <UInput v-model="state.email" size="lg" type="email" placeholder="you@company.com" class="w-full min-w-0" :ui="inputUi" />
      </UFormField>

      <UFormField name="company_name" label="Company name">
        <UInput v-model="state.company_name" size="lg" placeholder="Company name" class="w-full min-w-0" :ui="inputUi" />
      </UFormField>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField name="title" label="Job title">
          <UInput v-model="state.title" size="lg" placeholder="HR Manager" class="w-full min-w-0" :ui="inputUi" />
        </UFormField>

        <UFormField name="phone_number" label="Phone number">
          <UInput v-model="state.phone_number" size="lg" placeholder="+254 700 000 000" class="w-full min-w-0" :ui="inputUi" />
        </UFormField>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField name="country" label="Country">
          <USelect v-model="state.country" size="lg" :items="countryOptions" placeholder="Select country" class="w-full min-w-0" :ui="inputUi" />
        </UFormField>

        <UFormField name="company_size" label="Company size">
          <USelect v-model="state.company_size" size="lg" :items="companySizeOptions" placeholder="Select company size" class="w-full min-w-0" :ui="inputUi" />
        </UFormField>
      </div>

      <UAlert
        v-if="props.errorMessage"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="props.errorMessage"
      />

      <UButton type="submit" block :loading="props.loading">
        Continue
      </UButton>

      <div class="flex items-center justify-between gap-3">
        <NuxtLink class="text-sm text-primary hover:underline" :to="ROUTE_LIST.auth.login">
          Already registered? Sign in
        </NuxtLink>

        <NuxtLink class="text-sm text-primary hover:underline" :to="ROUTE_LIST.auth.forgotPassword">
          Forgot password?
        </NuxtLink>
      </div>
      
    </UForm>
  </AuthFormShell>
</template>
