import { useApi, type UseApiOptions } from '~/composables/useApi'

type ApiOptions = UseApiOptions<Record<string, unknown>>

export const affiliateService = {
  trackAffiliateClick
}

function trackAffiliateClick(affiliateCode: string, options: ApiOptions = {}) {
  return useApi(`/affiliates/track-click/${affiliateCode}/`, {
    ...options,
    method: 'GET',
    secured: false
  })
}