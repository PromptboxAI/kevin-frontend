# Setting up the `avatars` storage bucket

**Status: NOT CREATED.** Profile photo upload fails on the live project with
*"Photo storage isn't set up on this project yet — nothing to upload to."*
That message is the frontend reporting Supabase's `bucket not found`; there is
no frontend fix for it, and no code change makes it work. Someone with access
to the Supabase project has to create the bucket.

Reported by the owner, 2026-10-08, from **Settings → My profile → Profile
photo**.

---

## What the code already does

`src/lib/profile.ts` uploads **straight from the browser to Supabase Storage**.
The image never passes through the FastAPI backend — there is no route for it,
and none is wanted.

| | |
|---|---|
| Bucket name | **`avatars`** (exact, lowercase) |
| Object path | `{auth user id}/avatar.{ext}` — e.g. `3f0c…/avatar.jpg` |
| Write mode | `upsert: true` — replacing a photo overwrites rather than accumulating |
| Content type | set from the file (`image/png`, `image/jpeg`, `image/webp`) |
| Read | `getPublicUrl(path)`, with `?v={timestamp}` appended so a replacement is not served from cache |
| Delete | `remove([path])` when the adjuster clears their photo |

The URL that `getPublicUrl` returns is written to the user's profile
(`avatar_url`) and rendered wherever the avatar appears.

## What to create

1. **A bucket named `avatars`.**
2. **Public reads.** The frontend calls `getPublicUrl` and stores that URL on
   the profile, so a private bucket would hand back a URL that 400s for every
   viewer. If reads must be private instead, that is a code change on our side
   (signed URLs, re-signed on read, and the stored `avatar_url` stops being
   durable) — say so and we will do it, but it is not a bucket setting.
3. **Size limit: 8 MB or more.** The client refuses anything larger
   (`AVATAR_MAX_BYTES` in `src/lib/avatar-rules.ts`). A bucket limit *below*
   that turns a clean client-side message into a server error.
4. **Allowed MIME types** (if the bucket restricts them): `image/png`,
   `image/jpeg`, `image/webp`. These are exactly what the client permits.
   HEIC is deliberately refused client-side — most browsers cannot decode it in
   an `<img>`, so it would upload cleanly and render as a broken tile.

## Policies

Uploads run **as the signed-in user**, so RLS on `storage.objects` must allow
it. The path's first segment is the user's id, which is what scopes them to
their own object:

```sql
-- INSERT and UPDATE: a user may write only inside their own folder.
create policy "avatars: write own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars: update own"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: clearing a profile photo removes the object.
create policy "avatars: delete own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT: public, matching getPublicUrl.
create policy "avatars: public read"
on storage.objects for select to public
using (bucket_id = 'avatars');
```

`upsert: true` issues an **update** against an existing object, so the update
policy matters as much as insert — without it the first upload succeeds and
every replacement fails.

## How to verify it worked

Settings → My profile → Profile photo → pick a JPEG or PNG. It should appear
immediately, and again after a reload (the URL is stored on the profile, so a
photo that vanishes on reload means the write to `avatar_url` failed rather
than the upload).

Then replace it with a different image: the second upload exercises the update
policy and the cache-busting `?v=` parameter, which is where a working-looking
setup usually breaks.

## Related, unfixed

Nothing else uses this bucket. The **business logo** (Settings → Business) is a
separate path through the API (`PUT /v1/me/logo`) and is unaffected.
