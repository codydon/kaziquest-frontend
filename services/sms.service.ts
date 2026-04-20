import type { UseApiOptions } from '~/composables/useApi'
import { useApi } from '~/composables/useApi'
import { asCollectionOptions, asResourceOptions } from './service-options'

export const smsService = {
  sendSMS,
  addSmsDriver,
  getSMSDrivers,
  updateSmsDriver,
  getSmsProviders
}

function sendSMS(options: UseApiOptions<Record<string, unknown>> | Record<string, unknown> = {}) {
  return useApi('/sms/messages/', asCollectionOptions(options, {
    handler: '$fetch',
    method: 'POST'
  }))
}

function updateSmsDriver(id: string, options: UseApiOptions<Record<string, unknown>> | Record<string, unknown> = {}) {
  return useApi(`/sms/drivers/${id}/`, asResourceOptions(options, {
    handler: '$fetch',
    method: 'PATCH'
  }))
}

function addSmsDriver(options: UseApiOptions<Record<string, unknown>> | Record<string, unknown> = {}) {
  return useApi('/sms/drivers/', asCollectionOptions(options, {
    handler: '$fetch',
    method: 'POST'
  }))
}

function getSMSDrivers(options: UseApiOptions<Record<string, unknown>> = {}) {
  return useApi('/sms/drivers', {
    handler: '$fetch',
    method: 'GET',
    secured: true,
    ...options
  })
}

function getSmsProviders() {
  return useApi('/sms/providers', {
    handler: '$fetch',
    method: 'GET'
  })
}
