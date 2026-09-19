import { useCallback, useEffect, useState } from 'react'
import { browserStore } from './recent-values'
import type { Company, Directory, Person } from './directory-rules'
import { EMPTY_DIRECTORY, parseDirectory, removeById, upsert } from './directory-rules'

/**
 * Where the saved people and companies live TODAY: this browser.
 *
 * There is no account-level route for a business profile or a contact list yet
 * (BACKEND-ASKS 33), so the directory is local. That is honest for a
 * convenience list — the claim still carries its own `estimator_name` /
 * `business_name` — but it is NOT enough for export branding, which has to
 * come from the account. When the route lands, swap this module's read/write
 * for it; every caller works from the returned shape, not from storage.
 */
const KEY = 'kevin.directory.v1'

export function loadDirectory(): Directory {
  const store = browserStore()
  if (!store) return EMPTY_DIRECTORY
  try {
    const raw = store.getItem(KEY)
    return raw ? parseDirectory(JSON.parse(raw)) : EMPTY_DIRECTORY
  } catch {
    return EMPTY_DIRECTORY
  }
}

function saveDirectory(next: Directory): void {
  const store = browserStore()
  if (!store) return
  try {
    store.setItem(KEY, JSON.stringify(next))
  } catch {
    // Quota or blocked storage: it still works for this session.
  }
}

export function useDirectory() {
  const [dir, setDir] = useState<Directory>(EMPTY_DIRECTORY)

  // Read once on mount rather than during render: storage is an outside system.
  useEffect(() => setDir(loadDirectory()), [])

  const savePerson = useCallback((person: Person) => {
    setDir((prev) => {
      const next = { ...prev, people: upsert(prev.people, person) }
      saveDirectory(next)
      return next
    })
  }, [])

  const saveCompany = useCallback((company: Company) => {
    setDir((prev) => {
      const next = { ...prev, companies: upsert(prev.companies, company) }
      saveDirectory(next)
      return next
    })
  }, [])

  const dropPerson = useCallback((id: string) => {
    setDir((prev) => {
      const next = { ...prev, people: removeById(prev.people, id) }
      saveDirectory(next)
      return next
    })
  }, [])

  const dropCompany = useCallback((id: string) => {
    setDir((prev) => {
      const next = { ...prev, companies: removeById(prev.companies, id) }
      saveDirectory(next)
      return next
    })
  }, [])

  return { dir, savePerson, saveCompany, dropPerson, dropCompany }
}
