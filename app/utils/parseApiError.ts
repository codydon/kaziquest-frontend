export const parseApiError = (error: unknown, fallbackMessage = 'An error occurred.'): string => {
  if (typeof error === 'object' && error && 'data' in error) {
    const payload = (error as { data?: Record<string, unknown> }).data
    const message = payload?.message
    if (typeof message === 'string' && message.trim()) {
      return message
    }

    const statusMessage = payload?.statusMessage
    if (typeof statusMessage === 'string' && statusMessage.trim()) {
      return statusMessage
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallbackMessage
}
