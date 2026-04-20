export interface EmployeeUser {
  id?: string
  full_name?: string
  email?: string
  phone_number?: string
  title?: string
  location?: string
  email_verified?: boolean
  is_active?: boolean
}

export interface Employee {
  id?: string
  user?: EmployeeUser
  status?: string | null
  first_name?: string
  last_name?: string
  employee_number?: string
  self_service_access?: boolean
  reports_to?: { id?: string; full_name?: string }[]
  position_and_count?: { position?: string; total_count?: string }
  next_employee?: string
  previous_employee?: string
  current_job_data?: Record<string, unknown> | null
  social_media_accounts?: string[]
  addresses?: string[]
  contacts?: string[]
  educations?: string[]
  documents?: string[]
  next_of_kins?: string[]
  assigned_assets?: string[]
  deductions?: string[]
  gender?: string | null
  date_of_birth?: string | null
  marital_status?: string | null
  national_id_no?: string | null
  kra_pin_no?: string | null
  nhif_no?: string | null
  nssf_no?: string | null
  residential_status?: string | null
  work_email?: string | null
  pwd?: boolean
  excemption_cert_no?: string | null
  employee_type?: string | null
  employment_arrangement?: string | null
  start_date?: string | null
  end_date?: string | null
  work_from?: string | null
  work_to?: string | null
  work_hours?: number | null
  full_name?: string | null
  salary?: number | null
  department?: string | null
  position?: string | null
  statutory_deductions?: {
    paye?: number
    nssf?: number
    shif?: number
    ahl?: number
  }
}

export interface EmployeeListRow extends Employee {
  id: string
  user?: EmployeeUser
}

export interface EmployeeRole {
  id: number | string
  name?: string
  description?: string
}

export interface EmployeeNextOfKin {
  id?: string
  name?: string
  relation?: string
  phone?: string
  email?: string
  is_dependent?: boolean
  comments?: string
  employee?: string
}

export interface EmployeeEducation {
  id?: string
  institution?: string
  study_field?: string
  certification?: string
  grade?: string | null
  points?: string | null
  start_date?: string | null
  end_date?: string | null
  employee?: string
}

export interface EmployeeDocument {
  id?: string
  name?: string
  document_name?: string
  document_type?: string
  description?: string
  file?: string
  employee?: string
}

export interface EmployeeSocial {
  id?: number | string
  name?: string
  link?: string
  employee?: string
}

export interface EmployeeAddress {
  id?: number | string
  city?: string
  street_1?: string
  street_2?: string
  country?: string
  county?: string
  zip_code?: string | number
  employee?: string
}

export interface EmployeePaymentMethod {
  id?: string
  employee?: string
  account_number?: string | null
  account_name?: string
  account_type?: string
  bank_name?: string
  bank_branch?: string
  currency?: string
  is_primary?: boolean
  is_active?: boolean
  comments?: string
}

export interface EmployeeExtraPay {
  id?: string | number
  employee?: string
  category?: string
  name?: string
  amount?: number | null
  start_date?: string | null
  end_date?: string | null
  recurring?: boolean
  proration_type?: string | null
  active?: boolean
  included_in_salary?: boolean
  description?: string | null
  comments?: string | null
  housing_benefit?: {
    house_market_value?: number | null
    housing_type?: string | null
    rent_covered?: number | null
  } | null
  car_benefit?: {
    registration_number?: string | null
    make?: string | null
    cost_type?: string | null
    body_type?: string | null
    cc_rating?: number | null
  } | null
  gratuity?: Record<string, unknown> | null
}

export interface EmployeeAsset {
  id?: string
  asset_category?: string
  asset_name?: string
  asset_description?: string | null
  serial_number?: string
  date_assigned?: string
  date_returned?: string | null
  created_at?: string
  updated_at?: string
  employee_assigned?: string
  assigned_by?: string
  amount?: number | null
  is_holding?: boolean
}

export interface IDepartment {
  id?: string | number
  name?: string
}

export interface IPosition {
  id?: string | number
  job_title?: string
  department?: IDepartment
}

export interface IEmployeeJob {
  id?: number | string
  hire_date?: string
  end_date?: string | null
  location?: string | null
  is_current?: boolean
  position?: IPosition
  created_at?: string
  employment_status?: string
  job_title?: string
  employee?: { id?: string }
}

/** Job row passed to edit-job modal (requires stable id). */
export interface EmployeeJobRow {
  id: string | number
  hire_date?: string
  end_date?: string | null
  location?: string | null
  is_current?: boolean
  employment_status?: string
  job_title?: string
  position?: IPosition
  employee?: { id?: string }
}

/** Mass-deduction template (subset of employer `interfaces/Employee` `Deduction`). */
export interface Deduction {
  id?: string
  name?: string
  employee?: string
  total_amount?: string | number
  amount?: string | number
  amount_remaining?: string | number
  amount_paid?: string | number
  percentage?: string | number | null
  type?: string
  frequency?: string
  start_date?: string
  end_date?: string | null
  recurring_type?: string
  payment_progress?: {
    total_amount?: number
    amount_paid?: number
    amount_remaining?: number
    percentage_paid?: number
    payments_made?: number
    estimated_periods_remaining?: number
  } | null
  payments_ledger?: DeductionLedgerEntry[]
  is_taxable?: boolean
  tax_rate?: string | number | null
  taxable_threshold?: string | number | null
  description?: string | null
  comments?: string | null
  active?: boolean
  pay_in_full_next_payroll?: boolean
  status?: string
  completed_at?: string | null
  amount_paid_by_employer?: string | number | null
  percentage_paid_by_employer?: number | null
  pension_upper_limit?: string | number
  added_by?: string
  created_at?: string
  updated_at?: string
  insurance?: unknown
  mass_deduction?: string | null
  is_mass_deduction?: boolean
  mass_deduction_id?: string | null
}

export interface DeductionLedgerEntry {
  id?: string
  deduction?: string
  deduction_name?: string
  payslip?: string
  payslip_id?: string
}
