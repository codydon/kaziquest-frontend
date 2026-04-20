import { payrollService } from '~~/services/payroll.service'

interface DataExportOptions {
  dataGenerator: () => Record<string, unknown>[]
  fileNamePrefix: string
  name: string
  fileType: 'csv' | 'xls'
}

function stampFileName(prefix: string, ext: string) {
  const currentDate = new Date()
  const day = currentDate.getDate().toString().padStart(2, '0')
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  const year = currentDate.getFullYear()
  const hours = currentDate.getHours().toString().padStart(2, '0')
  const minutes = currentDate.getMinutes().toString().padStart(2, '0')
  const seconds = currentDate.getSeconds().toString().padStart(2, '0')
  return `${day}-${month}-${year}_${hours}${minutes}${seconds}_${prefix}.${ext}`
}

function objectsToDelimited(rows: Record<string, unknown>[], delimiter: string) {
  if (!rows.length) {
    return ''
  }
  const headers = Object.keys(rows[0] as Record<string, unknown>)
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    if (s.includes('"') || s.includes(delimiter) || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  return [
    headers.join(delimiter),
    ...rows.map(r => headers.map(h => esc((r as Record<string, unknown>)[h])).join(delimiter)),
  ].join('\n')
}

function triggerDownload(content: string, fileName: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  URL.revokeObjectURL(link.href)
  document.body.removeChild(link)
}

export async function dataExport({
  dataGenerator,
  fileNamePrefix,
  name,
  fileType,
}: DataExportOptions): Promise<void> {
  const toast = useToast()
  if (!import.meta.client) {
    return
  }
  if (!confirm(`Export ${name} data?`)) {
    return
  }
  try {
    const data = dataGenerator()
    if (!data?.length) {
      throw new Error('No data available to export')
    }
    const delimiter = fileType === 'xls' ? '\t' : ','
    const content = objectsToDelimited(data, delimiter)
    const ext = fileType === 'xls' ? 'xls' : 'csv'
    const mime = fileType === 'xls' ? 'application/vnd.ms-excel;charset=utf-8;' : 'text/csv;charset=utf-8;'
    triggerDownload(content, stampFileName(fileNamePrefix, ext), mime)
    toast.add({ title: 'Exported successfully', color: 'success' })
  }
  catch (error: unknown) {
    toast.add({
      title: 'Export failed',
      description: error instanceof Error ? error.message : String(error),
      color: 'error',
    })
  }
}

export async function exportP10Data(payslipIds: string[] | number[], isForDisability: boolean): Promise<void> {
  const toast = useToast()
  if (!import.meta.client) {
    return
  }
  if (!confirm(`Export P10 data${isForDisability ? ' for person with disability' : ''}?`)) {
    return
  }
  try {
    const response: any = await payrollService.generateP10(payslipIds.map(String))
    if (!response?.success || !response?.data) {
      throw new Error('Invalid data received from server')
    }
    const p10Data = response.data as any[]
    const csvContent = p10Data.map(item => [
      item.pin,
      item.name,
      item.resident_status,
      item.type_of_employee,
      item.basic_salary,
      item.housing_allowance,
      item.transport_allowance,
      item.leave_pay,
      item.over_time_allowance,
      item.directors_fee,
      item.lump_sum_payment,
      item.other_allowance, '',
      item.value_of_car_benefit,
      item.other_non_cash_benefits, '',
      item.value_of_meals,
      isForDisability ? item.global_income : item.type_of_housing,
      item.rent_of_house, '',
      item.rent_recovered_from_employee, '', '',
      item.social_health_insurance_fund,
      item.actual_contribution,
      item.post_retirement_medical_fund,
      item.mortgage_interest,
      item.affordable_housing_levy, '', '', '',
      item.monthly_personal_relief,
      item.amount_of_insurance_relief, '',
      item.self_assessed_paye_tax,
    ].join(',')).join('\n')

    triggerDownload(csvContent, stampFileName('P10_PWD', 'csv'), 'text/csv;charset=utf-8;')
    toast.add({ title: 'Exported successfully', color: 'success' })
  }
  catch (error: unknown) {
    toast.add({
      title: 'Export failed',
      description: error instanceof Error ? error.message : String(error),
      color: 'error',
    })
  }
}

export async function exportP10DataForAHL(data: any[]): Promise<void> {
  const toast = useToast()
  if (!import.meta.client) {
    return
  }
  if (!confirm('Export P10 for Affordable Housing Levy?')) {
    return
  }
  try {
    const csvContent = data.map(item => [
      item.employee.national_id,
      item.employee.full_name,
      item.employee.kra_pin,
      typeof item.gross_pay === 'number' ? item.gross_pay.toString() : String(item.gross_pay).replace(',', ''),
    ].join(',')).join('\n')

    triggerDownload(csvContent, stampFileName('P10_AHL', 'csv'), 'text/csv;charset=utf-8;')
    toast.add({ title: 'Exported successfully', color: 'success' })
  }
  catch (error: unknown) {
    toast.add({
      title: 'Export failed',
      description: error instanceof Error ? error.message : String(error),
      color: 'error',
    })
  }
}
