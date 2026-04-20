/**
 * Lightweight cross-page Time Off signals (replaces missing legacy `~/stores/timeoff`).
 * Pinia is not used elsewhere in this app; this follows existing `useState` patterns.
 */
export function useTimeOffShared() {
  const requestsTick = useState('kq-timeoff-requests-tick', () => 0)
  const balancesTick = useState('kq-timeoff-balances-tick', () => 0)

  function bumpRequestsRefresh() {
    requestsTick.value += 1
  }

  function bumpBalancesRefresh() {
    balancesTick.value += 1
  }

  return {
    requestsTick,
    balancesTick,
    bumpRequestsRefresh,
    bumpBalancesRefresh,
  }
}
