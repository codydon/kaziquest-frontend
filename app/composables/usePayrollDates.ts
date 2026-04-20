import {
  addDays,
  endOfMonth,
  format,
  getDate,
  isValid,
  parseISO,
  startOfMonth
} from 'date-fns'

/**
 * Date helpers for payroll flows — mirrors legacy `useDayjsUtils` outputs used by employer payroll.
 * Display strings in templates should prefer `<NuxtTime>` where a single ISO date is shown.
 */
export function usePayrollDates() {
  const parse = (input: string | Date) => {
    if (input instanceof Date) return input
    const d = parseISO(String(input))
    return isValid(d) ? d : new Date(String(input))
  }

  const formartToLongDayMonthDate = (date: string | Date) => {
    const d = parse(date)
    return isValid(d) ? format(d, 'd, MMMM, yyyy') : String(date)
  }

  const formatToMonthAndYear = (date: string | Date) => {
    const d = parse(date)
    return isValid(d) ? format(d, 'MMMM, yyyy') : String(date)
  }

  const formatToLongDate = (date: string | Date) => {
    const d = parse(date)
    return isValid(d) ? format(d, 'MMMM, yyyy') : String(date)
  }

  const toYYYYMMDD = (date: string | Date, separator = '-') => {
    const d = parse(date)
    return isValid(d) ? format(d, `yyyy${separator}MM${separator}dd`) : String(date)
  }

  const toDDMMYYYY = (date: string | Date, separator = '/') => {
    const d = parse(date)
    return isValid(d) ? format(d, `dd${separator}MM${separator}yyyy`) : String(date)
  }

  const getStartOfMonth = (date: Date) => format(startOfMonth(date), 'yyyy-MM-dd')

  const getEndOfMonth = (date: Date) => format(endOfMonth(date), 'yyyy-MM-dd')

  const getDayDate = (date: string | Date) => getDate(parse(date))

  const getDateForDayOfMonth = (day: number) => {
    const base = new Date()
    base.setDate(day)
    if (getDate(base) !== day) {
      return `Invalid date: ${day}`
    }
    return base
  }

  const toMMDD = (date: Date) => {
    const d = parse(date)
    return isValid(d) ? format(d, 'd, MMMM') : String(date)
  }

  const toDateTime = (date: string) => {
    const d = parse(date)
    return isValid(d) ? format(d, 'yyyy-MM-dd HH:mm:ss') : String(date)
  }

  const getMonthName = (month: number) => {
    const d = new Date(2000, month - 1, 1)
    return format(d, 'MMMM')
  }

  const getMonth = (date: string) => parse(date).getMonth()

  const getYYYYMM = (date: string) => {
    const d = parse(date)
    return isValid(d) ? format(d, 'yyyy-MM') : String(date)
  }

  const getCurrentYear = () => new Date().getFullYear()

  return {
    formartToLongDayMonthDate,
    formatToMonthAndYear,
    formatToLongDate,
    toYYYYMMDD,
    toDDMMYYYY,
    getStartOfMonth,
    getEndOfMonth,
    getDayDate,
    getDateForDayOfMonth,
    toMMDD,
    toDateTime,
    getMonthName,
    getMonth,
    getYYYYMM,
    getCurrentYear,
    addDays: (date: Date, amount: number) => addDays(date, amount)
  }
}
