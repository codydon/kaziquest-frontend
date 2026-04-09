import type { UseApiOptions } from "~/composables/useApi"

type ServiceBody = Record<string, any>

const OPTION_KEYS = new Set([
  "baseURL",
  "body",
  "cache",
  "credentials",
  "deep",
  "dedupe",
  "default",
  "handler",
  "headers",
  "immediate",
  "key",
  "lazy",
  "method",
  "onRequest",
  "onRequestError",
  "onResponse",
  "onResponseError",
  "params",
  "pick",
  "query",
  "responseType",
  "retry",
  "retryStatusCodes",
  "secured",
  "server",
  "timeout",
  "transform",
  "watch",
])

function isOptionsObject(value: unknown): value is UseApiOptions<ServiceBody> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  return Object.keys(value).some((key) => OPTION_KEYS.has(key))
}

export function asCollectionOptions<T extends ServiceBody = ServiceBody>(
  optionsOrBody: UseApiOptions<T> | T = {},
  defaults: UseApiOptions<T> = {},
) {
  if (isOptionsObject(optionsOrBody)) {
    return {
      ...defaults,
      ...optionsOrBody,
    }
  }

  return {
    ...defaults,
    body: optionsOrBody,
  }
}

export function asResourceOptions<T extends ServiceBody = ServiceBody>(
  optionsOrBody: UseApiOptions<T> | T = {},
  defaults: UseApiOptions<T> = {},
) {
  return asCollectionOptions(optionsOrBody, defaults)
}
