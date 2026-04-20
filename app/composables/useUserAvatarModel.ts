import type { AvatarProps } from '@nuxt/ui'
import type { AuthUser } from '~/types'
import { getAvatarFallbackHexColorForName, getAvatarInitials } from '~/utils/userAvatarColor'

export interface UserAvatarModel {
  name: string
  avatar: AvatarProps
}

export interface UseUserAvatarModelOptions {
  initialsMax?: 1 | 2
}

/** Applied to `UAvatar` `ui.root` for consistent focus across the app */
const USER_AVATAR_RING_ROOT = 'ring-2 ring-default ring-offset-1 ring-offset-bg shrink-0'

function withRing(avatar: AvatarProps): AvatarProps {
  const ui = avatar.ui
  const rootFromUi
    = ui && typeof ui === 'object' && 'root' in ui && ui.root != null
      ? String(ui.root)
      : ''
  return {
    ...avatar,
    ui: {
      ...(typeof ui === 'object' && ui ? ui : {}),
      root: [USER_AVATAR_RING_ROOT, rootFromUi].filter(Boolean).join(' ')
    }
  }
}

function resolveRecord(
  sessionUser: AuthUser | null,
  explicit: AuthUser | Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (explicit === undefined) {
    return sessionUser as Record<string, unknown> | null
  }
  if (explicit === null) {
    return null
  }
  return explicit as Record<string, unknown>
}

function buildModel(record: Record<string, unknown> | null, initialsMax: 1 | 2): UserAvatarModel {
  if (!record) {
    const name = 'Account'
    const bg = getAvatarFallbackHexColorForName(name)
    return {
      name,
      avatar: withRing({
        alt: name,
        text: getAvatarInitials(null, name, initialsMax),
        style: { backgroundColor: bg },
        ui: { fallback: 'text-white font-semibold' }
      })
    }
  }

  const first = String(record.first_name ?? '').trim()
  const last = String(record.last_name ?? '').trim()
  const combined = `${first} ${last}`.trim()
  const name
    = combined
      || String(record.full_name ?? '').trim()
      || String(record.name ?? '').trim()
      || String(record.email ?? '').trim()
      || 'Account'

  const picture
    = record.profile_pic
      ?? record.profile_picture
      ?? record.avatar
      ?? record.photo
  const src = typeof picture === 'string' && picture.trim() ? picture.trim() : ''

  const initialsText = getAvatarInitials(record, name, initialsMax)

  // Always set `text` so a broken/missing image still shows the right count of initials.
  // `UAvatar` otherwise derives up to two letters from `alt` only (ignores `initialsMax`).
  const base: AvatarProps = src
    ? { src, alt: name, text: initialsText }
    : {
        alt: name,
        text: initialsText,
        style: { backgroundColor: getAvatarFallbackHexColorForName(name) },
        ui: { fallback: 'text-white font-semibold' }
      }

  return {
    name,
    avatar: withRing(base)
  }
}

/**
 * Display name and `UAvatar` props (including ring on `ui.root`) for the signed-in user
 * or an explicit `user` record. Reuse in menus, tables, and `UserAvatar`.
 *
 * - No argument: uses `session.user`.
 * - Getter returns `undefined`: uses `session.user` (handy for optional `user` props).
 * - Getter returns `null`: placeholder ("Account") state.
 * @param options `initialsMax` — fallback label length when there is no photo (default `1`).
 */
export function useUserAvatarModel(
  source?: MaybeRefOrGetter<AuthUser | Record<string, unknown> | null | undefined>,
  options?: MaybeRefOrGetter<UseUserAvatarModelOptions | undefined>
) {
  const { session } = useAuthSession()

  return computed<UserAvatarModel>(() => {
    const opts = options !== undefined ? toValue(options) : undefined
    const initialsMax: 1 | 2 = opts?.initialsMax === 2 ? 2 : 1

    if (source === undefined) {
      return buildModel(session.value.user as Record<string, unknown> | null, initialsMax)
    }

    const value = toValue(source)
    const record = resolveRecord(session.value.user, value)
    return buildModel(record, initialsMax)
  })
}
