export const useGlobalStore = () => {
  const { globalState, setRoleSelected, resetGlobalState } = useGlobalState()

  const roleSelected = computed({
    get: () => globalState.value.roleSelected,
    set: (value: Record<string, unknown>) => setRoleSelected(value)
  })

  return {
    roleSelected,
    setRoleSelected,
    resetGlobalState
  }
}
