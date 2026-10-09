/**
 * What a PROFILE PHOTO may be — which is not what a logo may be.
 *
 * The profile screen was validating with `logoProblem`, and the two jobs have
 * different shapes. A logo is an asset someone exports deliberately: PNG or
 * JPEG, and 2 MB is generous for it. A profile photo is taken on a phone and
 * handed over as-is, where 2 MB is below the typical capture (the storage
 * model in data.jsx assumes 4.2 MB) — so the honest result of reusing the
 * logo rule is that most real photographs are refused for being photographs.
 *
 * Import-free so it compiles and runs standalone under node for its tests.
 */

export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

/**
 * HEIC is what an iPhone produces by default, so it is the single most likely
 * thing to arrive here — and it is called out rather than lumped into "wrong
 * type", because the fix is specific and the generic message does not hint at
 * it. It is NOT accepted: Chrome, Firefox and Edge cannot decode HEIC in an
 * <img>, so storing one would produce an avatar that uploads cleanly and then
 * renders as a broken tile everywhere it appears.
 */
export const HEIC_TYPES = ['image/heic', 'image/heif'] as const

/** 8 MB. Above a phone capture, below anything that would be a mistake. */
export const AVATAR_MAX_BYTES = 8 * 1024 * 1024

export type AvatarProblem = 'heic' | 'type' | 'empty' | 'too_large' | null

export function avatarProblem(file: { name?: string; type: string; size: number }): AvatarProblem {
  const type = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()
  /* Some browsers hand over an empty `type` for HEIC, so the extension is
     checked too -- otherwise it falls through to a "use a PNG or JPEG"
     message that never mentions the format the person actually picked. */
  if (
    (HEIC_TYPES as readonly string[]).includes(type) ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  ) {
    return 'heic'
  }
  if (!(AVATAR_TYPES as readonly string[]).includes(type)) return 'type'
  if (file.size === 0) return 'empty'
  if (file.size > AVATAR_MAX_BYTES) return 'too_large'
  return null
}

export const AVATAR_ERROR: Record<Exclude<AvatarProblem, null>, string> = {
  heic: 'That is an iPhone HEIC photo, which most browsers cannot display. Export it as JPEG, or set iPhone Settings → Camera → Formats to “Most Compatible”.',
  type: 'Use a PNG, JPEG or WebP image.',
  empty: 'That file is empty.',
  too_large: `That photo is over ${AVATAR_MAX_BYTES / (1024 * 1024)} MB. Use a smaller copy.`,
}
