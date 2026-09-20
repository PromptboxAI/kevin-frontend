/**
 * Fifty rows of traceback is not fifty problems.
 *
 * Import-free so it runs under node for the tests. Groups the dead-letter
 * queue by CAUSE, because that is the unit an admin acts on: one bug that
 * failed forty-eight photos is one thing to fix, and the forty-eight rows are
 * its evidence, not its description.
 *
 * The grouping key deliberately strips the varying part — row ids, claim ids,
 * paths — so "staging_photos row 88 not found" and "row 135 not found" land
 * in the same group. Keeping them apart is what made the queue unreadable.
 */

export type FailedJobLike = {
  job_id: string
  actor_id: string | null
  args: unknown[]
  enqueued_at: string | null
  ended_at: string | null
  exc_info: string | null
}

export type FailureGroup = {
  /** The stable part of the message, e.g. "RuntimeError: staging_photos row N not found." */
  cause: string
  count: number
  /** Distinct accounts touched. Empty when every row was a system job. */
  actors: string[]
  first: string | null
  last: string | null
  /** The rows themselves, newest first. */
  jobs: FailedJobLike[]
}

/** The last line of a traceback is the message; everything above is where. */
export function lastLine(exc: string | null | undefined): string {
  if (!exc) return 'No exception recorded'
  const lines = exc.trim().split('\n')
  return lines[lines.length - 1].trim()
}

/** Numbers, uuids and quoted paths vary per row; the shape does not. */
export function causeOf(exc: string | null | undefined): string {
  return lastLine(exc)
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<id>')
    .replace(/\b\d+\b/g, 'N')
    .replace(/'[^']*'/g, "'…'")
    .slice(0, 160)
}

const time = (iso: string | null) => (iso ? Date.parse(iso) : NaN)

export function groupFailures(jobs: FailedJobLike[]): FailureGroup[] {
  const byCause = new Map<string, FailureGroup>()

  for (const job of jobs) {
    const cause = causeOf(job.exc_info)
    const group = byCause.get(cause) ?? {
      cause,
      count: 0,
      actors: [],
      first: null,
      last: null,
      jobs: [],
    }
    group.count += 1
    group.jobs.push(job)
    if (job.actor_id && !group.actors.includes(job.actor_id)) group.actors.push(job.actor_id)
    if (job.ended_at) {
      if (!group.first || time(job.ended_at) < time(group.first)) group.first = job.ended_at
      if (!group.last || time(job.ended_at) > time(group.last)) group.last = job.ended_at
    }
    byCause.set(cause, group)
  }

  for (const group of byCause.values()) {
    group.jobs.sort((a, b) => (time(b.ended_at) || 0) - (time(a.ended_at) || 0))
  }

  // Biggest first: the thing that failed most is the thing to fix first.
  return [...byCause.values()].sort((a, b) => b.count - a.count)
}

/** Everything a backend needs to act, in the clipboard, with no tracebacks lost. */
export function summarize(groups: FailureGroup[]): string {
  if (groups.length === 0) return 'No failed jobs.'
  const lines = [`${groups.reduce((a, g) => a + g.count, 0)} failed jobs, ${groups.length} causes:`]
  for (const g of groups) {
    const when =
      g.first && g.last
        ? ` · ${g.first.slice(0, 10)}${g.first.slice(0, 10) === g.last.slice(0, 10) ? '' : ` to ${g.last.slice(0, 10)}`}`
        : ''
    const who = g.actors.length ? ` · ${g.actors.length} account${g.actors.length === 1 ? '' : 's'}` : ' · system'
    lines.push(`\n${g.count}x ${lastLine(g.jobs[0]?.exc_info)}${when}${who}`)
    lines.push(`  job ids: ${g.jobs.slice(0, 5).map((j) => j.job_id.slice(0, 8)).join(', ')}${g.count > 5 ? `, +${g.count - 5} more` : ''}`)
    if (g.actors.length) lines.push(`  accounts: ${g.actors.join(', ')}`)
  }
  return lines.join('\n')
}
