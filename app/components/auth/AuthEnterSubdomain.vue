<script setup lang="ts">
import * as z from 'zod'
import { authService } from '~/services/auth.service'
import { ROUTE_LIST } from '~/constants/routeList'
import { parseApiError } from '~/utils/parseApiError'
import { parseExcludedSubdomains, workspaceHostSuffix } from '~/utils/subdomain'

const subdomainSchema = z.object({
  subdomain: z
    .string()
    .trim()
    .min(1, 'Enter your workspace subdomain.')
    .regex(/^[a-zA-Z0-9-]+$/, 'Use only letters, numbers, and hyphens.')
})

type SubdomainSchema = z.output<typeof subdomainSchema>

const state = reactive<Partial<SubdomainSchema>>({
  subdomain: ''
})

const loading = ref(false)
const showHelp = ref(false)
const toast = useToast()
const config = useRuntimeConfig()
const { protocol, hostname, port } = useRequestURL()

const hostSuffix = computed(() => workspaceHostSuffix(hostname))

const navigateToSignup = async () => {
  const parts = hostname.split('.')
  let targetHostname = hostname
  const reservedSubdomains = parseExcludedSubdomains(String(config.public.excludedSubdomains ?? ''))

  if (hostname.includes('localhost')) {
    targetHostname = hostname
    if (parts.length > 1) {
      targetHostname = parts.slice(1).join('.')
    }
  } else if (parts.length > 2) {
    const firstLabel = parts[0]?.toLowerCase() ?? ''
    if (!reservedSubdomains.includes(firstLabel)) {
      targetHostname = parts.slice(1).join('.')
    }
  }

  const portPart = port ? `:${port}` : ''
  const targetUrl = `${protocol}//${targetHostname}${portPart}${ROUTE_LIST.auth.register}`
  await navigateTo(targetUrl, { external: true })
}

const handleSubmit = async () => {
  loading.value = true

  try {
    const raw = String(state.subdomain ?? '').trim().toLowerCase()
    const response = await authService.verifyDomain({
      handler: '$fetch',
      body: { subdomain: raw }
    })

    const payload = (response as Record<string, unknown>)?.data ?? response
    const inner = (payload as Record<string, unknown>)?.data ?? payload
    const siteUrl =
      typeof (inner as Record<string, unknown>)?.site_url === 'string'
        ? String((inner as Record<string, unknown>).site_url)
        : ''

    if (siteUrl) {
      await navigateTo(`${siteUrl}${ROUTE_LIST.auth.login}`, { external: true })
      return
    }

    toast.add({
      title: 'Workspace not found',
      description: 'We could not resolve that subdomain. Check the spelling and try again.',
      color: 'error'
    })
  } catch (error: unknown) {
    const message = parseApiError(error, 'Unable to verify that workspace.')

    toast.add({
      title: 'Unable to continue',
      description: message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthFormShell
    title="Find your workspace"
    description="Enter the subdomain your organization uses on KaziQuest, then continue to sign in."
  >
    <UForm :schema="subdomainSchema" :state="state" class="space-y-4" @submit="handleSubmit">
      <UFormField name="subdomain" label="Workspace subdomain">
        <div class="flex w-full min-w-0 items-stretch rounded-md shadow-sm">
          <UInput
            v-model="state.subdomain"
            type="text"
            class="min-w-0 flex-1 rounded-e-none"
            placeholder="yourcompany"
            autocapitalize="none"
            autocomplete="organization"
            spellcheck="false"
          />
          <span
            class="inline-flex items-center border border-s-0 border-slate-300 bg-slate-100 px-3 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            .{{ hostSuffix }}
          </span>
        </div>
      </UFormField>

      <UButton type="submit" block :loading="loading" :disabled="loading">
        Continue to sign in
      </UButton>
    </UForm>

    <div class="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-400">
      <button
        type="button"
        class="text-primary font-medium underline-offset-2 hover:underline"
        @click="showHelp = !showHelp"
      >
        What is my workspace subdomain?
      </button>

      <div
        v-if="showHelp"
        class="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/50"
      >
        <p>
          When you are signed in, look at the address bar: the word just before
          <span class="font-medium">.{{ hostSuffix }}</span>
          is your workspace subdomain. You can also ask a colleague or admin.
        </p>
        <UButton class="mt-3" size="sm" color="neutral" variant="soft" @click="showHelp = false">
          OK
        </UButton>
      </div>

      <div class="flex flex-wrap items-center gap-1">
        <span>Need an account?</span>
        <UButton variant="link" class="px-0" @click.prevent="() => void navigateToSignup()">
          Create account
        </UButton>
      </div>
    </div>
  </AuthFormShell>
</template>
