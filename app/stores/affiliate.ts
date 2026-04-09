export const useAffiliateStore = () => {
  const {
    affiliateState,
    setAccessAndRefreshTokens,
    setAffiliate,
    setAffiliateCode,
    setAffiliateActive,
    setReferralData,
    incrementAffiliateClicks,
    resetAffiliateState
  } = useAffiliateState()

  const accessToken = computed(() => affiliateState.value.accessToken)
  const refreshToken = computed(() => affiliateState.value.refreshToken)
  const affiliate = computed(() => affiliateState.value.affiliate)
  const isAffiliateActive = computed(() => affiliateState.value.isAffiliateActive)
  const affiliateCode = computed(() => affiliateState.value.affiliateCode)
  const affiliateClicks = computed(() => affiliateState.value.affiliateClicks)
  const affiliateId = computed(() => affiliateState.value.affiliateId)
  const affiliates = computed(() => affiliateState.value.affiliates)
  const referralCode = computed(() => affiliateState.value.referralCode)
  const referralLink = computed(() => affiliateState.value.referralLink)
  const referrals = computed(() => affiliateState.value.referrals)
  const referralAffiliateId = computed(() => affiliateState.value.referralAffiliateId)
  const referralId = computed(() => affiliateState.value.referralId)
  const companyId = computed(() => affiliateState.value.companyId)

  const logout = () => {
    resetAffiliateState()
  }

  return {
    accessToken,
    refreshToken,
    affiliate,
    isAffiliateActive,
    affiliateCode,
    affiliateClicks,
    affiliateId,
    affiliates,
    referralCode,
    referralLink,
    referrals,
    referralAffiliateId,
    referralId,
    companyId,
    setAccessAndRefreshTokens,
    setAffiliate,
    setAffiliateCode,
    setAffiliateActive,
    setReferralData,
    incrementAffiliateClicks,
    logout,
    resetAffiliateState
  }
}
