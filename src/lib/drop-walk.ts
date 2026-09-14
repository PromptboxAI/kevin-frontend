/**
 * Read a DROPPED folder's contents.
 *
 * `DataTransfer.files` holds only the top-level items. A dropped folder shows
 * up there as ONE entry -- the folder itself, not its photos -- so reading
 * `files` alone turned a 300-photo drop into "1 file skipped". The folder
 * PICKER (webkitdirectory) was never affected; this is the drag-and-drop path.
 *
 * The entries API walks the tree instead. Two rules keep it complete:
 *  - Depth-first and AWAITED, so every nested folder is read.
 *  - `readEntries()` PAGES (about 100 entries per call in Chromium), so it is
 *    called until it returns an empty batch. A single call silently truncates
 *    any folder over ~100 files.
 *
 * Import-free and typed structurally, so it runs under node with fake entries
 * for the tests, the same way the other *-rules modules do. The prototype
 * implemented this (design/components/intake.jsx readEntry); the port lost it.
 */

/** The slice of FileSystemEntry this walker uses. */
export type WalkEntry = {
  isFile: boolean
  isDirectory: boolean
  name: string
  file?: (ok: (f: File) => void, fail: (e: unknown) => void) => void
  createReader?: () => {
    readEntries: (ok: (batch: WalkEntry[]) => void, fail: (e: unknown) => void) => void
  }
}

export type WalkResult = {
  files: File[]
  /** Entries that could not be read (permissions, vanished files). Counted, never hidden. */
  unreadable: number
}

async function walk(entry: WalkEntry, out: File[], errors: { n: number }): Promise<void> {
  if (entry.isFile && entry.file) {
    try {
      out.push(await new Promise<File>((ok, fail) => entry.file!(ok, fail)))
    } catch {
      errors.n += 1
    }
    return
  }
  if (!entry.isDirectory || !entry.createReader) return
  const reader = entry.createReader()
  for (;;) {
    let batch: WalkEntry[]
    try {
      batch = await new Promise<WalkEntry[]>((ok, fail) => reader.readEntries(ok, fail))
    } catch {
      errors.n += 1
      return
    }
    if (batch.length === 0) return
    for (const child of batch) await walk(child, out, errors)
  }
}

/** Walk every dropped entry, files and folders alike, in drop order. */
export async function walkEntries(entries: WalkEntry[]): Promise<WalkResult> {
  const files: File[] = []
  const errors = { n: 0 }
  for (const entry of entries) await walk(entry, files, errors)
  return { files, unreadable: errors.n }
}

/** True when the drop contains at least one folder -- the only case that needs the walk. */
export function hasDirectory(entries: (WalkEntry | null)[]): boolean {
  return entries.some((e) => e?.isDirectory === true)
}
