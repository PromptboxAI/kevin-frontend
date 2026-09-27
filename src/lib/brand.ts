import { useCallback, useEffect, useState } from 'react'
import { browserStore } from './recent-values'
import { BRAND_DEFAULT, normalizeHex } from './directory-rules'
import { loadDirectory } from './directory'

/**
 * The accent colour the app is painted in — a DISPLAY preference, not part of
 * the firm profile.
 *
 * It lives in this browser because the backend has no column for it: the
 * letterhead the documents print is the firm's text and logo, and a colour is
 * neither. Keeping it out of the profile is what stops Settings writing two
 * copies of the same firm to two different places, which is exactly how the
 * local name and the saved name drift apart.
 *
 * It used to hang off the first saved directory company, so anyone who set a
 * colour before this module existed is read from there once and carried over.
 */
const KEY = 'kevin.brand.v1'

export function loadBrand(): string {
  const store = browserStore()
  if (!store) return BRAND_DEFAULT
  try {
    const raw = store.getItem(KEY)
    const hex = raw ? normalizeHex(raw) : null
    if (hex) return hex
  } catch {
    /* blocked storage: the default is a complete answer */
  }
  // Pre-2026-09-26 colours, set when this lived on the directory company.
  try {
    const legacy = loadDirectory().companies.find((c) => c.brandColor)?.brandColor
    return (legacy && normalizeHex(legacy)) || BRAND_DEFAULT
  } catch {
    return BRAND_DEFAULT
  }
}

export function saveBrand(hex: string): void {
  const store = browserStore()
  if (!store) return
  try {
    store.setItem(KEY, normalizeHex(hex) ?? BRAND_DEFAULT)
  } catch {
    /* it still applies for this session */
  }
}

export function useBrand() {
  const [brand, setBrand] = useState(BRAND_DEFAULT)

  // Read once on mount rather than during render: storage is an outside system.
  useEffect(() => setBrand(loadBrand()), [])

  const commit = useCallback((hex: string) => {
    const next = normalizeHex(hex) ?? BRAND_DEFAULT
    saveBrand(next)
    setBrand(next)
  }, [])

  return { brand, commit }
}
