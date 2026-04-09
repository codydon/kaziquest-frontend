export const useTalentStore = () => {
  const { talentState, setTalentNetwork, setTalentNetworks, getTalentNetworkById, resetTalentState } = useTalentState()

  const talentNetwork = computed({
    get: () => talentState.value.talentNetwork,
    set: (value: Record<string, unknown> | null) => setTalentNetwork(value)
  })

  const talentNetworks = computed({
    get: () => talentState.value.talentNetworks,
    set: (value: Record<string, Record<string, unknown>>) => setTalentNetworks(value)
  })

  const fetchTalentNetworkById = async (id: string) => {
    return await useApi(`/talent-network/${id}/`, {
      handler: '$fetch',
      method: 'GET'
    })
  }

  const rateDocuments = async (payload: Record<string, unknown>) => {
    return await useApi(`/talent-network/talent-network-documents/${String((payload as any)?.id || '')}/`, {
      handler: '$fetch',
      method: 'PATCH',
      body: { score: (payload as any)?.score }
    })
  }

  const rateExperience = async (payload: Record<string, unknown>) => {
    return await useApi(`/talent-network/talent-network-experiences/${String((payload as any)?.id || '')}/`, {
      handler: '$fetch',
      method: 'PATCH',
      body: { score: (payload as any)?.score }
    })
  }

  const rateEducation = async (payload: Record<string, unknown>) => {
    return await useApi(`/talent-network/talent-network-education/${String((payload as any)?.id || '')}/`, {
      handler: '$fetch',
      method: 'PATCH',
      body: { score: (payload as any)?.score }
    })
  }

  const sendTalentEmail = async (payload: Record<string, unknown>) => {
    return await useApi('/talent-network/records/send_email/', {
      handler: '$fetch',
      method: 'POST',
      body: payload
    })
  }

  return {
    talentNetwork,
    talentNetworks,
    setTalentNetwork,
    setTalentNetworks,
    getTalentNetworkById,
    fetchTalentNetworkById,
    rateDocuments,
    rateExperience,
    rateEducation,
    sendTalentEmail,
    resetTalentState
  }
}
