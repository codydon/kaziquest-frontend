const TALENT_STATE_KEY = 'kq-talent-state'

function createDefaultTalentState() {
  return {
    talentNetwork: null as Record<string, unknown> | null,
    talentNetworks: {} as Record<string, Record<string, unknown>>
  }
}

export const useTalentState = () => {
  const talentState = useState(TALENT_STATE_KEY, createDefaultTalentState)

  const setTalentNetwork = (talentNetwork: Record<string, unknown> | null) => {
    talentState.value.talentNetwork = talentNetwork
  }

  const setTalentNetworks = (talentNetworks: Record<string, Record<string, unknown>>) => {
    talentState.value.talentNetworks = talentNetworks
  }

  const getTalentNetworkById = (id: string) => {
    return talentState.value.talentNetworks[id] ?? null
  }

  const resetTalentState = () => {
    talentState.value = createDefaultTalentState()
  }

  return {
    talentState: readonly(talentState),
    setTalentNetwork,
    setTalentNetworks,
    getTalentNetworkById,
    resetTalentState
  }
}