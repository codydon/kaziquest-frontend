import type { GlobalUiState } from '~/types'

const GLOBAL_STATE_KEY = 'kq-global-state'

function createDefaultGlobalState(): GlobalUiState {
  return {
    roleSelected: {}
  }
}

export const useGlobalState = () => {
  const globalState = useState<GlobalUiState>(GLOBAL_STATE_KEY, createDefaultGlobalState)

  const setRoleSelected = (roleSelected: Record<string, unknown>) => {
    globalState.value.roleSelected = roleSelected
  }

  const resetGlobalState = () => {
    globalState.value = createDefaultGlobalState()
  }

  return {
    globalState: readonly(globalState),
    setRoleSelected,
    resetGlobalState
  }
}