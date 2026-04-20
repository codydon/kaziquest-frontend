export function urlParamsExtensionUtil(
  urlParams: Record<string, string | number | boolean | Date>,
): string {
  const keys = Object.keys(urlParams)
  if (keys.length < 1) {
    return ''
  }
  let queryParams = ''
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(urlParams, key) && urlParams[key]) {
      queryParams += `${queryParams ? '&' : '?'}${key}=${String(urlParams[key])}`
    }
  }
  return queryParams
}
