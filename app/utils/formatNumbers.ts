
export const formatNumber = (num: number | string | null | undefined): string | undefined => {
  if (num === null || num === undefined || num === '') return
  const numStr = num.toString()
  const parts = numStr.split('.')
  const integerPart = parts[0] ?? ''
  const integerFormatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (parts.length > 1) {
    return `${integerFormatted}.${parts[1]}`
  }
  return integerFormatted
}

const commaSeparate = (number: number): string => {
  if (number === null || number === undefined || Number.isNaN(number)) return ''
  return parseFloat(String(number)).toLocaleString()
}

const toCurrency = (number: number): string => {
  if (number === null || number === undefined || Number.isNaN(number)) return '0.00'
  return parseFloat(String(number))
    .toFixed(2)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export default { commaSeparate, toCurrency }
