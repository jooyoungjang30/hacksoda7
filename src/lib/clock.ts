// Frozen clock — never call new Date() or Date.now() elsewhere in this app.
// Every figure in the spec is anchored to this instant.

export const TODAY = new Date('2026-08-29T12:00:00Z');
export const FY_START = new Date('2026-01-01T00:00:00Z');
export const FY_END = new Date('2026-12-31T23:59:59Z');
export const FISCAL_YEAR = FY_START.getUTCFullYear();

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Fraction of FY2026 elapsed as of TODAY. 0.663 on 2026-08-29. */
export function fiscalYearProgress(): number {
  const elapsed = TODAY.getTime() - FY_START.getTime();
  const total = FY_END.getTime() - FY_START.getTime();
  return elapsed / total;
}

/** Whole days from TODAY until the fiscal year resets (FY_END). 124 on 2026-08-29. */
export function daysUntilReset(): number {
  return Math.round((FY_END.getTime() - TODAY.getTime()) / MS_PER_DAY);
}

/** Whole days from TODAY until the given ISO date. Negative if already past. */
export function daysUntil(iso: string): number {
  const target = new Date(iso);
  return Math.round((target.getTime() - TODAY.getTime()) / MS_PER_DAY);
}
