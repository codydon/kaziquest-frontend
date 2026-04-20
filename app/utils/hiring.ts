import type {
  HiringApplication,
  HiringDashboardStatistics,
  HiringJobFormState,
  HiringPagination,
  HiringQuestionChoice
} from '~/types/hiring'

export const HIRING_JOB_STATUS_OPTIONS = [
  { label: 'All statuses', value: '' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Future Opportunity', value: 'FUTURE OPPORTUNITY' },
  { label: 'Closed', value: 'CLOSED' }
]

export const HIRING_EMPLOYMENT_TYPE_OPTIONS = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'TEMPORARY',
  'REMOTE'
]

export const HIRING_JOB_LEVEL_OPTIONS = [
  'ENTRY_LEVEL',
  'MID_LEVEL',
  'SENIOR_LEVEL',
  'LEAD',
  'DIRECTOR',
  'EXECUTIVE'
]

export const HIRING_EDUCATION_LEVEL_OPTIONS = [
  'CERTIFICATE',
  'DIPLOMA',
  'BACHELORS',
  'MASTERS',
  'PHD',
  'OTHER'
]

export const HIRING_CURRENCY_OPTIONS = [
  'KES',
  'USD',
  'UGX',
  'TZS',
  'EUR',
  'GBP',
  'CNY',
  'RWF',
  'NGN',
  'ETB'
]

export function formatHiringStatusLabel(status?: string | null) {
  if (!status) {
    return 'Unknown'
  }

  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
}

export function hiringStatusColor(status?: string | null) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'OPEN' || normalized === 'APPROVED' || normalized === 'SHORTLISTED') {
    return 'success'
  }
  if (normalized === 'DRAFT' || normalized === 'UNDER_REVIEW' || normalized === 'INTERVIEWED') {
    return 'warning'
  }
  if (normalized === 'REJECTED' || normalized === 'CLOSED') {
    return 'error'
  }
  return 'neutral'
}

export function coerceHiringPagination<T>(input: unknown): HiringPagination<T> {
  if (input && typeof input === 'object') {
    const data = input as HiringPagination<T> & { data?: HiringPagination<T> }
    if (data.results || data.count != null) {
      return data
    }
    if (data.data && (data.data.results || data.data.count != null)) {
      return data.data
    }
  }

  return {
    count: 0,
    results: []
  }
}

export function normalizeStatistics(input: unknown): HiringDashboardStatistics {
  if (input && typeof input === 'object') {
    const data = input as HiringDashboardStatistics & { data?: HiringDashboardStatistics }
    return data.data ?? data
  }
  return {}
}

export function createEmptyHiringJobForm(): HiringJobFormState {
  return {
    title: '',
    description: '',
    employment_type: '',
    experience: '',
    job_level: '',
    education_level: '',
    currency: '',
    min_salary: null,
    max_salary: null,
    category: '',
    other_category: '',
    country: '',
    job_location: '',
    valid_through: '',
    status: 'DRAFT',
    published: false,
    questions: [],
    documents: []
  }
}

export function applicationRecipientData(applications: HiringApplication[]) {
  return applications.map(application => ({
    id: application.id,
    sent_to: application.job_seeker_name || '',
    phone_number: application.phone || '',
    email: application.job_seeker_email || application.job_seeker_info?.email || ''
  }))
}

export function toCsvBlob(rows: Record<string, unknown>[]) {
  const headers = Array.from(new Set(rows.flatMap(row => Object.keys(row))))
  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const raw = row[header]
          const value = raw == null ? '' : String(raw)
          return `"${value.replace(/"/g, '""')}"`
        })
        .join(',')
    )
  ]

  return new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export function normalizeChoiceList(choices: HiringQuestionChoice[] | undefined) {
  return Array.isArray(choices)
    ? choices.map((choice): { id: string | number | undefined, name: string } => ({ id: choice.id, name: choice.name || '' }))
    : []
}
