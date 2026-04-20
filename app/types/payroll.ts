export interface EmpCoverageItem {
  id: string
  name: string
  employee_number: string
  department: string
  position: string
  salary: number
  jobs_during_period: unknown
  has_multiple_jobs: boolean
  hire_date: string
  can_exclude: boolean
}

export interface PayrollCoverageReport {
  period: string | null
  summary: Record<string, unknown>
  employees: {
    included: EmpCoverageItem[]
    excluded: EmpCoverageItem[]
  }
  validation: {
    issues: Record<string, unknown>[]
    has_issues: boolean
    can_run: boolean
  }
}
