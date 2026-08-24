/** Lifted from US_STATES in design/components/data.jsx. */
export const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

/**
 * The loss ZIP resolves the jurisdiction, and the jurisdiction sets the rate --
 * address and tax must always agree, so the rate is never free-typed. Lifted
 * from TAX_BY_ZIP in design/components/intake.jsx. In production this is a
 * lookup service; the shape is what matters.
 */
export type Jurisdiction = { label: string; rate: number; county?: string }

export const TAX_BY_ZIP: Record<string, Jurisdiction> = {
  '11787': { label: 'Smithtown, NY', rate: 8.625, county: 'Suffolk County' },
  '11788': { label: 'Hauppauge, NY', rate: 8.625, county: 'Suffolk County' },
  '11501': { label: 'Mineola, NY', rate: 8.625, county: 'Nassau County' },
  '10001': { label: 'New York, NY', rate: 8.875, county: 'New York City' },
  '18501': { label: 'Scranton, PA', rate: 6.0, county: 'Lackawanna County' },
}

/** Policies name contents coverage differently -- never hardcode "Coverage C". */
export const COVERAGE_LABELS = [
  'Coverage C — Personal Property',
  'Personal Property',
  'Contents',
  'Coverage B — Contents (renters)',
  'Business Personal Property',
  'Unscheduled Personal Property',
]

export type TaxOption = { label: string; rate: number }

/** The options the Local tax rate select offers for a resolved ZIP. */
export function taxOptionsFor(zip: string, found: Jurisdiction | null): TaxOption[] {
  if (!found) {
    return [
      { label: `No jurisdiction on file for ${zip || '—'}`, rate: 0 },
      { label: 'No tax · 0%', rate: 0 },
    ]
  }
  return [
    { label: `${found.label} (${zip}) · ${found.rate}%`, rate: found.rate },
    ...(found.county ? [{ label: `${found.county} · ${found.rate}%`, rate: found.rate }] : []),
    { label: 'State only · 4%', rate: 4 },
    { label: 'No tax · 0%', rate: 0 },
  ]
}
