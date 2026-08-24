import { BlobReader, BlobWriter, ZipReader } from '@zip.js/zip.js'

/**
 * A .zip is expanded in the BROWSER -- the archive itself is never posted.
 *
 * Extraction is SEQUENTIAL. A ZipReader holds a file position, so concurrent
 * getData() calls on one reader corrupt the stream and the library reports
 * "Overlapped entries / possible zip bomb" -- which reads like a malicious
 * archive but is our own concurrency bug. Use for..of with await, never
 * Promise.all. (Upload, downstream of this, is what parallelises.)
 */

/** Junk the OS stores beside photos. Filtered locally, never sent. */
const JUNK = /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$|\._)/i
const IMAGE = /\.(jpe?g|png|webp|gif|heic|heif)$/i

export type ZipProgress = { name: string; read: number; total: number }

export type ZipResult = {
  files: File[]
  /** OS junk dropped locally -- counted so the tally can stay honest. */
  junk: number
}

export async function expandZip(
  archive: File,
  onProgress?: (p: ZipProgress) => void,
): Promise<ZipResult> {
  const reader = new ZipReader(new BlobReader(archive))
  try {
    const entries = (await reader.getEntries()).filter((e) => !e.directory)
    const wanted = entries.filter((e) => !JUNK.test(e.filename) && IMAGE.test(e.filename))
    const junk = entries.length - wanted.length

    const files: File[] = []
    let read = 0
    // Sequential by contract -- see the note above.
    for (const entry of wanted) {
      onProgress?.({ name: archive.name, read, total: wanted.length })
      if (!entry.getData) continue
      const blob = await entry.getData(new BlobWriter())
      const base = entry.filename.split('/').pop() || entry.filename
      files.push(new File([blob], base, { type: blobTypeFor(base) }))
      read += 1
    }
    onProgress?.({ name: archive.name, read, total: wanted.length })
    return { files, junk }
  } finally {
    await reader.close()
  }
}

function blobTypeFor(name: string): string {
  const ext = name.toLowerCase().split('.').pop()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'heic' || ext === 'heif') return 'image/heic'
  return 'image/jpeg'
}

/** Same local filter, applied to a folder pick. */
export function keepPhotos(files: File[]): { kept: File[]; junk: number } {
  const kept = files.filter((f) => !JUNK.test(f.webkitRelativePath || f.name) && IMAGE.test(f.name))
  return { kept, junk: files.length - kept.length }
}
