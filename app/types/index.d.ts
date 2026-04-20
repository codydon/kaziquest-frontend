import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface User {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  location: string
}

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export type AuthMethod = 'password' | 'whmcs_sso' | 'impersonation'
export type RegistrationStep = 'register' | 'verify' | 'password'

export type AuthUser = Record<string, unknown> & {
  id?: number | string
  email?: string
  name?: string
  first_name?: string
  last_name?: string
  full_name?: string
  profile_pic?: string | null
  profile_picture?: string | null
  photo?: string | null
  avatar?: string | null
  company?: Record<string, unknown> | null
  group?: Record<string, unknown> | null
}

export interface AuthSessionState {
  user: AuthUser | null
  authMethod: AuthMethod
  otpEmail: string
  otpSessionId: string
  otpExpiry: string | null
  fromRoute: string | null
  isRedirected: boolean
}

export interface RegistrationFlowState {
  email: string
  currentStep: RegistrationStep
  affiliateCode: string | null
  registerDraft: Record<string, unknown> | null
  verifyCodeExpiry: string | null
  isCompleted: boolean
}

export interface BreadcrumbLink {
  text: string
  to?: string
}

export interface GlobalUiState {
  roleSelected: Record<string, unknown>
}

export interface PaymentState {
  response: unknown | null
  error: unknown | null
}

export interface AffiliateState {
  accessToken: string
  refreshToken: string
  affiliate: Record<string, unknown> | null
  isAffiliateActive: boolean
  affiliateCode: string | null
  affiliateClicks: number
  affiliateId: string | number | null
  affiliates: unknown[]
  referralCode: string | null
  referralLink: string | null
  referrals: unknown[]
  referralAffiliateId: string | number | null
  referralId: string
  companyId: string | number | null
}

export interface CompanyState {
  company: Record<string, unknown> | null
  providers: unknown[]
  companyId: string
  companyInfo: Record<string, unknown>
  referredCompany: string
  noWorkdays: unknown[]
  departments: unknown[]
  positions: unknown[]
  currentCurrency: string
  selectedPlan: Record<string, unknown> | null
  selectedBillingCycle: string
}

export interface ApplicationStatusItem {
  name: string
  hidden?: boolean
  [key: string]: unknown
}

export interface ApplicationFormState {
  job: string
  status: string
  name: string
  salutation: string
  yob: string
  gender: string
  phone: string
  email: string
  linkedin_url: string
  seen: string
  cover_letter: string
  cv: string
}

export interface JobFiltersState {
  status: string
  search: string
}

export interface ProfileCompletionTask {
  name: string
  value: number
  isCompleted: boolean
  link: string
}

export type BillingCycle = 'MONTHLY' | 'HALF_YEARLY' | 'YEARLY'

export interface IRole {
  id: number | string
  name: string
  permissions?: Array<Record<string, unknown>>
  [key: string]: unknown
}

export interface IApplication {
  id?: string | number
  job?: string | number
  status?: string
  [key: string]: unknown
}
