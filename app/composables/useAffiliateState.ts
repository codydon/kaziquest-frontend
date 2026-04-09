import type { AffiliateState } from '~/types'

const AFFILIATE_STATE_KEY = 'kq-affiliate-state'

function createDefaultAffiliateState(): AffiliateState {
  return {
    accessToken: '',
    refreshToken: '',
    affiliate: null,
    isAffiliateActive: false,
    affiliateCode: null,
    affiliateClicks: 0,
    affiliateId: null,
    affiliates: [],
    referralCode: null,
    referralLink: null,
    referrals: [],
    referralAffiliateId: null,
    referralId: '',
    companyId: null
  }
}

export const useAffiliateState = () => {
  const affiliateState = useState<AffiliateState>(AFFILIATE_STATE_KEY, createDefaultAffiliateState)

  const setAccessAndRefreshTokens = (accessToken: string, refreshToken: string) => {
    affiliateState.value.accessToken = accessToken
    affiliateState.value.refreshToken = refreshToken
  }

  const setAffiliate = (affiliate: Record<string, unknown> | null) => {
    affiliateState.value.affiliate = affiliate
  }

  const setAffiliateCode = (affiliateCode: string | null) => {
    affiliateState.value.affiliateCode = affiliateCode
  }

  const setAffiliateActive = (isActive: boolean) => {
    affiliateState.value.isAffiliateActive = isActive
  }

  const setReferralData = (payload: {
    referralCode?: string | null
    referralLink?: string | null
    referralId?: string
    referralAffiliateId?: string | number | null
    companyId?: string | number | null
  }) => {
    affiliateState.value.referralCode = payload.referralCode ?? affiliateState.value.referralCode
    affiliateState.value.referralLink = payload.referralLink ?? affiliateState.value.referralLink
    affiliateState.value.referralId = payload.referralId ?? affiliateState.value.referralId
    affiliateState.value.referralAffiliateId = payload.referralAffiliateId ?? affiliateState.value.referralAffiliateId
    affiliateState.value.companyId = payload.companyId ?? affiliateState.value.companyId
  }

  const incrementAffiliateClicks = () => {
    affiliateState.value.affiliateClicks += 1
  }

  const resetAffiliateState = () => {
    affiliateState.value = createDefaultAffiliateState()
  }

  return {
    affiliateState: readonly(affiliateState),
    setAccessAndRefreshTokens,
    setAffiliate,
    setAffiliateCode,
    setAffiliateActive,
    setReferralData,
    incrementAffiliateClicks,
    resetAffiliateState
  }
}