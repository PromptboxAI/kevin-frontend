import { useQuery } from '@tanstack/react-query'
import { ApiError, api } from './api'
import { accountsQuery } from './admin-accounts-rules'
import type { AdminAccount, AdminAccountsResponse } from './admin-accounts-rules'

/**
 * The Accounts half of the back office — prompt 4 §4.1, built against the
 * shapes the backend wrote `feat/admin-accounts` to.
 *
 * ⚠️ THESE ROUTES ARE NOT ON PRODUCTION YET. As of 2026-10-05 the live API
 * serves 86 paths and the only admin ones are `/v1/admin/errors` and two
 * demo-preset routes, so every call here 404s until that branch merges and
 * migration 0064 is applied. That is deliberate: the screens are built against
 * the agreed shape so the merge turns them on rather than starting a build.
 *
 * What it must NOT do while that is true is look broken or, worse, look empty.
 * An empty table reads as "this customer has no accounts"; a 404 means "this
 * endpoint does not exist". `accountsUnavailable()` tells them apart so the
 * screen can say which.
 */

export type { AdminAccount, AdminAccountsResponse }

/** One account plus everything hanging off it (prompt 4 §4.1, second route). */
export type AdminAccountClaim = {
  claim_id: string
  name: string | null
  status: string | null
  item_count: number | null
  photo_count: number | null
  total_rcv: number | null
  total_acv: number | null
  created_at: string | null
  updated_at: string | null
}

export type AdminAccountActivity = {
  at: string | null
  kind: string | null
  summary: string | null
}

export type AdminAccountDetail = AdminAccount & {
  claims?: AdminAccountClaim[] | null
  recent_activity?: AdminAccountActivity[] | null
}

export const ACCOUNTS_PAGE = 50

/**
 * Why a read failed, in the only three ways that change what the screen says.
 * Anything else is a real error and is shown as one.
 */
export type Unavailable = 'not_built' | 'forbidden' | null

export function unavailableFrom(err: unknown): Unavailable {
  if (!(err instanceof ApiError)) return null
  if (err.status === 404) return 'not_built'
  if (err.status === 403 || err.status === 401) return 'forbidden'
  return null
}

export function useAdminAccounts(q: string, offset = 0, limit = ACCOUNTS_PAGE) {
  return useQuery({
    queryKey: ['admin', 'accounts', q, offset, limit],
    queryFn: () =>
      api.get<AdminAccountsResponse>(`/v1/admin/accounts${accountsQuery({ q, limit, offset })}`),
    /* A missing endpoint and a forbidden one are both answers, not blips --
       retrying either just delays the message by a few seconds. */
    retry: (count, err) => unavailableFrom(err) === null && count < 1,
    // The previous page stays on screen while a new search runs, so typing
    // does not blank the table on every keystroke.
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  })
}

export function useAdminAccount(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ['admin', 'account', userId],
    queryFn: () =>
      api.get<AdminAccountDetail>(`/v1/admin/accounts/${encodeURIComponent(userId as string)}`),
    retry: (count, err) => unavailableFrom(err) === null && count < 1,
    staleTime: 15_000,
  })
}

/**
 * Their dead-letter rows (prompt 4 §4.2). Two shapes were offered -- a nested
 * route or `?actor_id=` on the existing one -- and the backend has not said
 * which it built, so this tries the nested route and treats a 404 as "not that
 * one" rather than an error. The failures panel simply stays quiet.
 */
export function useAdminAccountFailures(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryKey: ['admin', 'account-failures', userId],
    queryFn: () =>
      api.get<{ count: number; jobs: unknown[] }>(
        `/v1/admin/accounts/${encodeURIComponent(userId as string)}/jobs/failed`,
      ),
    retry: false,
    staleTime: 30_000,
  })
}
