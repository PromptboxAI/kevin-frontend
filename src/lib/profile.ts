import { getSupabase } from './supabase'
import { SUPABASE_URL } from './env'

/**
 * The adjuster's own details.
 *
 * Stored on the AUTH USER's metadata, not in our API: there is still no
 * profile write route (BACKEND-ASKS 35), but Supabase already holds the user
 * record and `updateUser` writes to it. That makes Save real today — the
 * values survive a reload, a new tab and a different machine — without
 * inventing a local-only store that looks saved and isn't.
 *
 * Deliberately small. Nothing here is a claim field: "Prepared by" on a
 * document is the estimator picked on that claim, and rule 22's point-in-time
 * guarantee means a later profile edit must never rewrite a filed document.
 */
export type Profile = {
  first_name: string
  last_name: string
  title: string
  phone: string
  timezone: string
  avatar_url: string
}

export const EMPTY_PROFILE: Profile = {
  first_name: '',
  last_name: '',
  title: '',
  phone: '',
  timezone: '',
  avatar_url: '',
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Reads what is stored, ignoring anything of the wrong shape. */
export function profileFrom(meta: Record<string, unknown> | undefined): Profile {
  if (!meta) return EMPTY_PROFILE
  return {
    first_name: str(meta.first_name),
    last_name: str(meta.last_name),
    title: str(meta.title),
    phone: str(meta.phone),
    timezone: str(meta.timezone),
    avatar_url: str(meta.avatar_url),
  }
}

export async function saveProfile(next: Partial<Profile>): Promise<void> {
  const { error } = await getSupabase().auth.updateUser({ data: next })
  if (error) throw new Error(error.message)
}

/** Where a profile photo lives. One object per user, overwritten on replace. */
const AVATAR_BUCKET = 'avatars'

export class AvatarStorageMissing extends Error {
  constructor() {
    super('Photo storage is not set up yet.')
  }
}

/**
 * Uploads the photo and records its URL on the user.
 *
 * Straight to Supabase Storage from the browser — the image never passes
 * through our API, which has no route for it. `upsert` so replacing a photo
 * overwrites rather than accumulating, and the URL carries the upload time so
 * a replacement is not served from cache.
 *
 * Throws AvatarStorageMissing when the bucket does not exist, so the screen
 * can say that plainly instead of reporting a generic failure.
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const supabase = getSupabase()
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${userId}/avatar.${ext}`

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) {
    if (/bucket not found/i.test(error.message)) throw new AvatarStorageMissing()
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  const url = `${data.publicUrl}?v=${Date.now()}`
  await saveProfile({ avatar_url: url })
  return url
}

export async function removeAvatar(avatarUrl: string): Promise<void> {
  const supabase = getSupabase()
  const path = avatarUrl.split(`${SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/`)[1]
  if (path) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path.split('?')[0]])
  }
  await saveProfile({ avatar_url: '' })
}
