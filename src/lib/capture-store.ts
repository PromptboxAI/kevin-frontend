/**
 * The phone's local photo queue, in IndexedDB.
 *
 * Why IndexedDB and not something simpler: these are multi-megabyte Blobs.
 * localStorage is strings and about 5 MB, and holding Files in memory loses
 * them on a reload — which is exactly the moment someone needs them most,
 * because a phone in a basement with 40 photos queued is one accidental
 * navigation away from a second trip to the property.
 *
 * A record lives here only while the photo is NOT yet on the server. Once it
 * uploads, the blob is deleted: it is safely on the claim, and keeping a copy
 * would fill a phone with duplicates of evidence it no longer owns.
 *
 * Everything degrades to "no persistence" rather than throwing. Private mode
 * and a full disk both take IndexedDB away, and a capture app that refuses to
 * open because it cannot cache is worse than one that simply uploads live.
 */

const DB = 'kevin-capture'
const STORE = 'pending'
const VERSION = 1

export type PendingShot = {
  key: string
  claimId: string
  name: string
  type: string
  size: number
  room: string | null
  note: string
  takenAt?: number
  /** Attempts already made. Drives the backoff, and survives a reload. */
  attempts: number
  blob: Blob
}

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB, VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'key' })
          // Queried per claim: a phone can only be paired to one at a time,
          // but a credential swap must not resurrect the previous claim's queue.
          store.createIndex('claimId', 'claimId', { unique: false })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
      request.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return open().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null)
        try {
          const request = run(db.transaction(STORE, mode).objectStore(STORE))
          request.onsuccess = () => resolve(request.result)
          request.onerror = () => resolve(null)
        } catch {
          resolve(null)
        }
      }),
  )
}

/** Save a photo before anything is attempted, so a crash cannot lose it. */
export function savePending(shot: PendingShot): Promise<unknown> {
  return tx('readwrite', (store) => store.put(shot))
}

/** Everything still waiting for this claim, oldest first. */
export async function loadPending(claimId: string): Promise<PendingShot[]> {
  const all = (await tx<PendingShot[]>('readonly', (store) => store.getAll())) ?? []
  return all.filter((s) => s.claimId === claimId)
}

/** It reached the server -- the phone does not need to hold it any more. */
export function dropPending(key: string): Promise<unknown> {
  return tx('readwrite', (store) => store.delete(key))
}

/** Record an attempt so the backoff survives a reload. */
export async function bumpAttempts(key: string): Promise<number> {
  const found = await tx<PendingShot | undefined>('readonly', (store) => store.get(key))
  if (!found) return 0
  const next = { ...found, attempts: found.attempts + 1 }
  await tx('readwrite', (store) => store.put(next))
  return next.attempts
}

/** Keep an edited note/room with the bytes, so a reload does not lose it. */
export async function patchPending(
  key: string,
  fields: Partial<Pick<PendingShot, 'room' | 'note'>>,
): Promise<void> {
  const found = await tx<PendingShot | undefined>('readonly', (store) => store.get(key))
  if (!found) return
  await tx('readwrite', (store) => store.put({ ...found, ...fields }))
}

/**
 * Forget this claim's queue.
 *
 * Used when a phone pairs to a DIFFERENT claim: those bytes belong to a claim
 * this credential can no longer upload to, so holding them would be a queue
 * that retries forever into a 403.
 */
export async function clearClaim(claimId: string): Promise<void> {
  const mine = await loadPending(claimId)
  for (const shot of mine) await dropPending(shot.key)
}

/** Is persistence actually available? Private mode and a full disk both say no. */
export async function storeAvailable(): Promise<boolean> {
  return (await open()) !== null
}
