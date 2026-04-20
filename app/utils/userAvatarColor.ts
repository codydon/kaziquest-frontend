/**
 * Initials-based avatar colors (ported from `kaziquest-employer-nuxt/utils/getBackgroundColor.ts`).
 */
const AVATAR_FALLBACK_HEX_COLORS = [
  '#FF4136',
  '#0d6efd',
  '#2ECC40',
  '#FFDC00',
  '#7F8C8D'
] as const

/** Same algorithm as legacy `getInitials` (up to three leading letters from words). */
export function getUserInitialsFromName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) {
    return ''
  }

  const nameArray = trimmed.split(/\s+/)
  let initials = ''

  for (const word of nameArray) {
    if (!word) {
      continue
    }
    const initial = word.charAt(0).toUpperCase()
    initials += initial
    if (initials.length >= 3) {
      break
    }
  }

  return initials
}

/** First letter used for palette index, matching legacy `getBackgroundColor(initials.charAt(0))`. */
export function getAvatarFallbackHexColor(initialLetter: string): string {
  if (!initialLetter) {
    return '#0d6efd'
  }

  const index = initialLetter.charCodeAt(0) % AVATAR_FALLBACK_HEX_COLORS.length
  return AVATAR_FALLBACK_HEX_COLORS[index] ?? '#0d6efd'
}

export function getAvatarFallbackHexColorForName(displayName: string): string {
  const initials = getUserInitialsFromName(displayName)
  const key = (initials.charAt(0) || displayName.trim().charAt(0) || '').toUpperCase()
  return getAvatarFallbackHexColor(key)
}

/**
 * Two-letter avatar label: first + last when both exist on `record`, otherwise first two
 * words of `displayName`, otherwise two chars from a single word, then email local-part heuristics.
 */
export function getTwoLetterAvatarInitials(
  record: Record<string, unknown> | null,
  displayName: string
): string {
  if (!record) {
    return '?'
  }

  const first = String(record.first_name ?? '').trim()
  const last = String(record.last_name ?? '').trim()
  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
  }

  const trimmed = displayName.trim()
  const parts = trimmed.split(/\s+/).filter(part => part.length > 0)
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase()
  }

  if (parts.length === 1) {
    const word = parts[0]!
    if (word.length >= 2) {
      return word.slice(0, 2).toUpperCase()
    }
    return word.charAt(0).toUpperCase()
  }

  const email = String(record.email ?? '').trim()
  if (email.includes('@')) {
    const local = email.split('@')[0] ?? ''
    const segs = local.split(/[._+-]/).filter(seg => seg.length > 0)
    if (segs.length >= 2) {
      return `${segs[0]!.charAt(0)}${segs[1]!.charAt(0)}`.toUpperCase()
    }
    if (local.length >= 2) {
      return local.slice(0, 2).toUpperCase()
    }
    if (local.length === 1) {
      return local.charAt(0).toUpperCase()
    }
  }

  if (trimmed.length >= 2) {
    return trimmed.slice(0, 2).toUpperCase()
  }

  return trimmed.charAt(0).toUpperCase() || '?'
}

/** Canonical two-letter (or shorter) initials, then trimmed to `max` (1 or 2 only). */
export function getAvatarInitials(
  record: Record<string, unknown> | null,
  displayName: string,
  max: 1 | 2
): string {
  const raw = getTwoLetterAvatarInitials(record, displayName)
  if (max === 2) {
    return raw
  }
  return raw.slice(0, 1) || '?'
}
