<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import { COUNTRIES } from '~~/constants/countries'
import type { Employee, EmployeeAddress, EmployeeSocial } from '~/types/employee'
import { employeeService } from '~~/services/employee.service'
import { parseApiError } from '~/utils/parseApiError'

const props = defineProps<{
  employee: Employee | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const toast = useToast()
const { isBaseLevelEmployee } = useRolePermissionGuard()
const loading = ref(false)
const socialsLoading = ref(false)
const addressesLoading = ref(false)
const socialSaving = ref(false)
const addressSaving = ref(false)
const deletingSocialId = ref<string | null>(null)
const deletingAddressId = ref<string | null>(null)
const socials = ref<EmployeeSocial[]>([])
const addresses = ref<EmployeeAddress[]>([])
const socialModalOpen = ref(false)
const addressModalOpen = ref(false)
const editingSocial = ref<EmployeeSocial | null>(null)
const editingAddress = ref<EmployeeAddress | null>(null)

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  employee_number: z.string().min(1, 'Required'),
  work_email: z.string(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  national_id_no: z.string().optional(),
  kra_pin_no: z.string().optional(),
  nhif_no: z.string().optional(),
  nssf_no: z.string().optional(),
  marital_status: z.string().optional(),
  user_email: z.string().email('Invalid email'),
  user_phone: z.string().optional(),
  user_title: z.string().optional(),
  user_location: z.string().optional()
})

const socialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  link: z.string().min(1, 'Link is required')
})

const addressSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  county: z.string().optional(),
  zip_code: z.string().min(1, 'Zip code is required'),
  street_1: z.string().min(1, 'Street 1 is required'),
  street_2: z.string().optional()
})

type Schema = z.output<typeof schema>
type SocialSchema = z.output<typeof socialSchema>
type AddressSchema = z.output<typeof addressSchema>

const state = reactive<Schema>({
  first_name: '',
  last_name: '',
  employee_number: '',
  work_email: '',
  gender: '',
  date_of_birth: '',
  national_id_no: '',
  kra_pin_no: '',
  nhif_no: '',
  nssf_no: '',
  marital_status: '',
  user_email: '',
  user_phone: '',
  user_title: '',
  user_location: ''
})

const socialState = reactive<SocialSchema>({
  name: '',
  link: ''
})

const addressState = reactive<AddressSchema>({
  country: '',
  city: '',
  county: '',
  zip_code: '',
  street_1: '',
  street_2: ''
})

const countryItems = COUNTRIES.map(country => ({
  label: country.name,
  value: country.name
}))

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) {
    return res as T[]
  }
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>
    if (Array.isArray(r.results)) {
      return r.results as T[]
    }
    if (r.data && typeof r.data === 'object' && Array.isArray((r.data as { results?: unknown[] }).results)) {
      return (r.data as { results: T[] }).results
    }
  }
  return []
}

function syncFromEmployee() {
  const e = props.employee
  if (!e) return
  state.first_name = String(e.first_name ?? '')
  state.last_name = String(e.last_name ?? '')
  state.employee_number = String(e.employee_number ?? '')
  state.work_email = String(e.work_email ?? '')
  state.gender = String(e.gender ?? '')
  state.date_of_birth = String(e.date_of_birth ?? '').slice(0, 10)
  state.national_id_no = String(e.national_id_no ?? '')
  state.kra_pin_no = String(e.kra_pin_no ?? '')
  state.nhif_no = String(e.nhif_no ?? '')
  state.nssf_no = String(e.nssf_no ?? '')
  state.marital_status = String(e.marital_status ?? '')
  state.user_email = String(e.user?.email ?? '')
  state.user_phone = String(e.user?.phone_number ?? '')
  state.user_title = String(e.user?.title ?? '')
  state.user_location = String(e.user?.location ?? '')
}

function resetSocialForm() {
  socialState.name = ''
  socialState.link = ''
}

function resetAddressForm() {
  addressState.country = ''
  addressState.city = ''
  addressState.county = ''
  addressState.zip_code = ''
  addressState.street_1 = ''
  addressState.street_2 = ''
}

function openCreateSocial() {
  editingSocial.value = null
  resetSocialForm()
  socialModalOpen.value = true
}

function openEditSocial(item: EmployeeSocial) {
  editingSocial.value = item
  socialState.name = String(item.name || '')
  socialState.link = String(item.link || '')
  socialModalOpen.value = true
}

function openCreateAddress() {
  editingAddress.value = null
  resetAddressForm()
  addressModalOpen.value = true
}

function openEditAddress(item: EmployeeAddress) {
  editingAddress.value = item
  addressState.country = String(item.country || '')
  addressState.city = String(item.city || '')
  addressState.county = String(item.county || '')
  addressState.zip_code = String(item.zip_code || '')
  addressState.street_1 = String(item.street_1 || '')
  addressState.street_2 = String(item.street_2 || '')
  addressModalOpen.value = true
}

async function loadSocials() {
  if (!props.employee?.id) {
    socials.value = []
    return
  }
  socialsLoading.value = true
  try {
    const res = await employeeService.getSocialsForEmployee(String(props.employee.id), {
      handler: '$fetch',
      secured: true
    })
    socials.value = unwrapList<EmployeeSocial>(res)
  } catch (error: unknown) {
    socials.value = []
    toast.add({
      title: 'Unable to load socials',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    socialsLoading.value = false
  }
}

async function loadAddresses() {
  if (!props.employee?.id) {
    addresses.value = []
    return
  }
  addressesLoading.value = true
  try {
    const res = await employeeService.getAddressesForEmployee(String(props.employee.id), {
      handler: '$fetch',
      secured: true
    })
    addresses.value = unwrapList<EmployeeAddress>(res)
  } catch (error: unknown) {
    addresses.value = []
    toast.add({
      title: 'Unable to load addresses',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    addressesLoading.value = false
  }
}

watch(() => props.employee, () => {
  syncFromEmployee()
  void Promise.all([loadSocials(), loadAddresses()])
}, { immediate: true, deep: true })

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  const e = props.employee
  if (!e?.id) return
  loading.value = true
  try {
    await employeeService.updateEmployee(String(e.id), {
      handler: '$fetch',
      secured: true,
      body: {
        first_name: state.first_name,
        last_name: state.last_name,
        employee_number: state.employee_number,
        work_email: state.work_email || null,
        gender: state.gender || null,
        date_of_birth: state.date_of_birth || null,
        national_id_no: state.national_id_no || null,
        kra_pin_no: state.kra_pin_no || null,
        nhif_no: state.nhif_no || null,
        nssf_no: state.nssf_no || null,
        marital_status: state.marital_status || null,
        user: {
          email: state.user_email,
          phone_number: state.user_phone || null,
          title: state.user_title || null,
          location: state.user_location || null
        }
      }
    })
    toast.add({ title: 'Profile updated', color: 'success' })
    emit('saved')
  } catch (error: unknown) {
    toast.add({
      title: 'Update failed',
      description: parseApiError(error, 'Unable to save profile.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function submitSocial(_event: FormSubmitEvent<SocialSchema>) {
  if (!props.employee?.id) {
    return
  }
  socialSaving.value = true
  try {
    const normalizedLink = socialState.link.startsWith('http://') || socialState.link.startsWith('https://')
      ? socialState.link
      : `https://${socialState.link}`
    const body = {
      name: socialState.name,
      link: normalizedLink,
      employee: String(props.employee.id)
    }
    if (editingSocial.value?.id != null) {
      await employeeService.updateSocialsForEmployee(Number(editingSocial.value.id), {
        handler: '$fetch',
        secured: true,
        body
      })
      toast.add({ title: 'Social updated', color: 'success' })
    } else {
      await employeeService.addSocials({
        handler: '$fetch',
        secured: true,
        body
      })
      toast.add({ title: 'Social added', color: 'success' })
    }
    socialModalOpen.value = false
    resetSocialForm()
    await loadSocials()
  } catch (error: unknown) {
    toast.add({
      title: editingSocial.value ? 'Update failed' : 'Create failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    socialSaving.value = false
  }
}

async function submitAddress(_event: FormSubmitEvent<AddressSchema>) {
  if (!props.employee?.id) {
    return
  }
  addressSaving.value = true
  try {
    const body = {
      country: addressState.country,
      city: addressState.city,
      county: addressState.county || '',
      zip_code: addressState.zip_code,
      street_1: addressState.street_1,
      street_2: addressState.street_2 || '',
      employee: String(props.employee.id)
    }
    if (editingAddress.value?.id != null) {
      await employeeService.updateAddressForEmployee(Number(editingAddress.value.id), {
        handler: '$fetch',
        secured: true,
        body
      })
      toast.add({ title: 'Address updated', color: 'success' })
    } else {
      await employeeService.addAddress({
        handler: '$fetch',
        secured: true,
        body
      })
      toast.add({ title: 'Address added', color: 'success' })
    }
    addressModalOpen.value = false
    resetAddressForm()
    await loadAddresses()
  } catch (error: unknown) {
    toast.add({
      title: editingAddress.value ? 'Update failed' : 'Create failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    addressSaving.value = false
  }
}

async function removeSocial(id: number | string | undefined) {
  if (id == null) {
    return
  }
  deletingSocialId.value = String(id)
  try {
    await employeeService.deleteSocial(Number(id), {
      handler: '$fetch',
      secured: true
    })
    toast.add({ title: 'Social deleted', color: 'success' })
    await loadSocials()
  } catch (error: unknown) {
    toast.add({
      title: 'Delete failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    deletingSocialId.value = null
  }
}

async function removeAddress(id: number | string | undefined) {
  if (id == null) {
    return
  }
  deletingAddressId.value = String(id)
  try {
    await employeeService.deleteAddress(Number(id), {
      handler: '$fetch',
      secured: true
    })
    toast.add({ title: 'Address deleted', color: 'success' })
    await loadAddresses()
  } catch (error: unknown) {
    toast.add({
      title: 'Delete failed',
      description: parseApiError(error, 'Request failed.'),
      color: 'error'
    })
  } finally {
    deletingAddressId.value = null
  }
}
</script>

<template>
  <div v-if="!employee" class="text-sm text-muted">
    Loading…
  </div>

  <div v-else class="space-y-6">
    <UPageCard variant="subtle" title="Personal information">
      <UForm
        :schema="schema"
        :state="state"
        class="mt-4 grid max-w-3xl gap-4 md:grid-cols-2"
        @submit="onSubmit"
      >
        <UFormField label="First name" name="first_name" required>
          <UInput v-model="state.first_name" class="w-full" />
        </UFormField>
        <UFormField label="Last name" name="last_name" required>
          <UInput v-model="state.last_name" class="w-full" />
        </UFormField>
        <UFormField label="Employee number" name="employee_number" required>
          <UInput v-model="state.employee_number" class="w-full" />
        </UFormField>
        <UFormField label="Work email" name="work_email">
          <UInput v-model="state.work_email" type="email" class="w-full" />
        </UFormField>
        <UFormField label="Gender" name="gender">
          <UInput v-model="state.gender" class="w-full" />
        </UFormField>
        <UFormField label="Date of birth" name="date_of_birth">
          <UInput v-model="state.date_of_birth" type="date" class="w-full" />
        </UFormField>
        <UFormField label="National ID" name="national_id_no">
          <UInput v-model="state.national_id_no" class="w-full" />
        </UFormField>
        <UFormField label="KRA PIN" name="kra_pin_no">
          <UInput v-model="state.kra_pin_no" class="w-full" />
        </UFormField>
        <UFormField label="SHIF / NHIF" name="nhif_no">
          <UInput v-model="state.nhif_no" class="w-full" />
        </UFormField>
        <UFormField label="NSSF" name="nssf_no">
          <UInput v-model="state.nssf_no" class="w-full" />
        </UFormField>
        <UFormField label="Marital status" name="marital_status">
          <UInput v-model="state.marital_status" class="w-full" />
        </UFormField>
        <UFormField
          label="Account email"
          name="user_email"
          class="md:col-span-2"
          required
        >
          <UInput v-model="state.user_email" type="email" class="w-full" />
        </UFormField>
        <UFormField label="Phone" name="user_phone">
          <UInput v-model="state.user_phone" type="tel" class="w-full" />
        </UFormField>
        <UFormField label="Job title" name="user_title">
          <UInput v-model="state.user_title" class="w-full" />
        </UFormField>
        <UFormField label="Location" name="user_location" class="md:col-span-2">
          <UInput v-model="state.user_location" class="w-full" />
        </UFormField>
        <div class="flex justify-end md:col-span-2">
          <UButton type="submit" label="Save changes" :loading="loading" />
        </div>
      </UForm>
    </UPageCard>

    <UPageCard variant="subtle" title="Socials" description="Employee social links and online profiles.">
      <template #trailing>
        <UButton
          size="sm"
          icon="i-lucide-plus"
          label="Add social"
          @click="openCreateSocial"
        />
      </template>

      <div v-if="socialsLoading" class="mt-4">
        <USkeleton class="h-24 w-full rounded-lg" />
      </div>
      <div v-else-if="socials.length" class="mt-4 space-y-3">
        <div
          v-for="social in socials"
          :key="social.id || `${social.name}-${social.link}`"
          class="flex items-start justify-between gap-4 rounded-lg border border-default p-4"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium text-muted">
              {{ social.name || 'Social profile' }}
            </p>
            <ULink
              :to="social.link || '#'"
              target="_blank"
              class="mt-1 block truncate text-sm text-primary"
            >
              {{ social.link || '—' }}
            </ULink>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-lucide-pencil"
              @click="openEditSocial(social)"
            />
            <UButton
              size="xs"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              :loading="deletingSocialId === String(social.id)"
              @click="() => void removeSocial(social.id)"
            />
          </div>
        </div>
      </div>
      <UAlert
        v-else
        class="mt-4"
        color="neutral"
        variant="subtle"
        title="No socials yet"
        description="Add the employee’s LinkedIn, portfolio, or other profile links."
      />
    </UPageCard>

    <UPageCard variant="subtle" title="Addresses" description="Home and postal addresses on file.">
      <template #trailing>
        <UButton
          v-if="!isBaseLevelEmployee"
          size="sm"
          icon="i-lucide-plus"
          label="Add address"
          @click="openCreateAddress"
        />
      </template>

      <div v-if="addressesLoading" class="mt-4">
        <USkeleton class="h-28 w-full rounded-lg" />
      </div>
      <div v-else-if="addresses.length" class="mt-4 space-y-3">
        <div
          v-for="(address, index) in addresses"
          :key="address.id || `${address.street_1}-${index}`"
          class="rounded-lg border border-default p-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <p class="text-xs uppercase tracking-wide text-muted">
                  Country
                </p>
                <p class="mt-1 text-sm">
                  {{ address.country || '—' }}
                </p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-muted">
                  City
                </p>
                <p class="mt-1 text-sm">
                  {{ address.city || '—' }}
                </p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-muted">
                  County
                </p>
                <p class="mt-1 text-sm">
                  {{ address.county || '—' }}
                </p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-muted">
                  Zip code
                </p>
                <p class="mt-1 text-sm">
                  {{ address.zip_code || '—' }}
                </p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-muted">
                  Street 1
                </p>
                <p class="mt-1 text-sm">
                  {{ address.street_1 || '—' }}
                </p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide text-muted">
                  Street 2
                </p>
                <p class="mt-1 text-sm">
                  {{ address.street_2 || '—' }}
                </p>
              </div>
            </div>
            <div v-if="!isBaseLevelEmployee" class="flex items-center gap-2">
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-lucide-pencil"
                @click="openEditAddress(address)"
              />
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                :loading="deletingAddressId === String(address.id)"
                @click="() => void removeAddress(address.id)"
              />
            </div>
          </div>
        </div>
      </div>
      <UAlert
        v-else
        class="mt-4"
        color="neutral"
        variant="subtle"
        title="No addresses yet"
        description="No address information has been added for this employee."
      />
    </UPageCard>

    <UModal
      v-model:open="socialModalOpen"
      :title="editingSocial ? 'Edit social' : 'Add social'"
    >
      <UForm
        id="employee-social-form"
        :schema="socialSchema"
        :state="socialState"
        class="space-y-4"
        @submit="submitSocial"
      >
        <UFormField label="Name" name="name" required>
          <UInput v-model="socialState.name" class="w-full" placeholder="LinkedIn" />
        </UFormField>
        <UFormField label="Link" name="link" required>
          <UInput
            v-model="socialState.link"
            class="w-full"
            placeholder="https://example.com/profile"
          />
        </UFormField>
      </UForm>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="socialModalOpen = false" />
          <UButton
            form="employee-social-form"
            type="submit"
            :loading="socialSaving"
            :label="editingSocial ? 'Save changes' : 'Add social'"
          />
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="addressModalOpen"
      :title="editingAddress ? 'Edit address' : 'Add address'"
    >
      <UForm
        id="employee-address-form"
        :schema="addressSchema"
        :state="addressState"
        class="space-y-4"
        @submit="submitAddress"
      >
        <UFormField label="Country" name="country" required>
          <USelect
            v-model="addressState.country"
            :items="countryItems"
            value-key="value"
            label-key="label"
            class="w-full"
            placeholder="Select country"
          />
        </UFormField>
        <UFormField label="City" name="city" required>
          <UInput v-model="addressState.city" class="w-full" />
        </UFormField>
        <UFormField label="County" name="county">
          <UInput v-model="addressState.county" class="w-full" />
        </UFormField>
        <UFormField label="Zip code / postal code" name="zip_code" required>
          <UInput v-model="addressState.zip_code" class="w-full" />
        </UFormField>
        <UFormField label="Street 1" name="street_1" required>
          <UInput v-model="addressState.street_1" class="w-full" />
        </UFormField>
        <UFormField label="Street 2" name="street_2">
          <UInput v-model="addressState.street_2" class="w-full" />
        </UFormField>
      </UForm>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton color="neutral" variant="outline" label="Cancel" @click="addressModalOpen = false" />
          <UButton
            form="employee-address-form"
            type="submit"
            :loading="addressSaving"
            :label="editingAddress ? 'Save changes' : 'Add address'"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
