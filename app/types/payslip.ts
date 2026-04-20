export interface IPayslipItem {
  id?: number
  name?: string
  type?: string
  amount?: string
}

export interface IPayslipEmployee {
  id?: string
  full_name?: string
  employee_number?: string
  national_id?: string
  kra_pin?: string
  pwd?: boolean
  excemption_cert_no?: string
}

export interface IPayslip {
  id?: string
  employee?: IPayslipEmployee
  payslip_items?: IPayslipItem[]
  gross_pay?: string
  net_pay?: string
  status?: string
  /** Present when salary was prorated for the period */
  is_prorated?: boolean
}
