<script setup lang="ts">
import * as z from 'zod'
import { ROUTE_LIST } from '~/constants/routeList'

const props = defineProps<{
  loading: boolean
  initialEmail?: string
  initialReferralCode?: string | null
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
  first_name: '',
  last_name: '',
  email: props.initialEmail || '',
  company_name: '',
  title: '',
  phone_number: '',
  country: 'Kenya',
  company_size: '1-10 employees'
})

const onSubmit = () => {
  emit('submit', {
    ...state,
    is_admin: true,
    free_trial: true,
    referred_by: props.initialReferralCode || undefined
  })
}
</script>

<template>
  <AuthFormShell
    title="Create your workspace"
    description="Get started in under two minutes. You can refine details after setup."
  >
    <UForm :schema="schema" :state="state" class="space-y-3 [@media(max-height:820px)]:space-y-2" @submit="onSubmit">
      <div class="rounded-lg border border-cyan-200/70 bg-cyan-50 px-3 py-2 text-xs text-cyan-700 [@media(max-height:820px)]:hidden">
        Your account starts with secure defaults and guided onboarding.
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UFormField name="first_name" label="First name">
          <UInput v-model="state.first_name" placeholder="First name" class="w-full" />
        </UFormField>

        <UFormField name="last_name" label="Last name">
          <UInput v-model="state.last_name" placeholder="Last name" class="w-full" />
        </UFormField>
      </div>

      <UFormField name="email" label="Business email">
        <UInput v-model="state.email" type="email" placeholder="you@company.com" class="w-full" />
      </UFormField>

      <UFormField name="company_name" label="Company name">
        <UInput v-model="state.company_name" placeholder="Company name" class="w-full" />
      </UFormField>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UFormField name="title" label="Job title">
          <UInput v-model="state.title" placeholder="HR Manager" class="w-full" />
        </UFormField>

        <UFormField name="phone_number" label="Phone number">
          <UInput v-model="state.phone_number" placeholder="+254 700 000 000" class="w-full" />
        </UFormField>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UFormField name="country" label="Country">
          <USelect v-model="state.country" :items="countryOptions" placeholder="Select country" class="w-full" />
        </UFormField>

        <UFormField name="company_size" label="Company size">
          <USelect v-model="state.company_size" :items="companySizeOptions" placeholder="Select company size" class="w-full" />
        </UFormField>
      </div>

      <UAlert
        v-if="props.errorMessage"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :title="props.errorMessage"
      />

      <div class="flex items-center justify-between gap-3">
        <NuxtLink class="text-sm text-primary hover:underline" :to="ROUTE_LIST.auth.login">
          Already registered? Sign in
        </NuxtLink>

        <NuxtLink class="text-sm text-primary hover:underline" :to="ROUTE_LIST.auth.forgotPassword">
          Forgot password?
        </NuxtLink>
      </div>

      <UButton type="submit" block :loading="props.loading">
        Continue
      </UButton>
    </UForm>
  </AuthFormShell>
</template>
