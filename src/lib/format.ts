/** "$1,234" — rounds to whole dollars. Always go through this, never inline math. */
export function money(cents: number): string {
  const dollars = Math.round(cents / 100);
  return `$${dollars.toLocaleString('en-US')}`;
}

/** "56%" — ratio is 0..1. */
export function percent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** "Aug 26" */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Two-letter team avatar abbreviations, matching the spec mockup exactly. */
const TEAM_ABBREV: Record<string, string> = {
  engineering: 'EN',
  design: 'DS',
  marketing: 'MK',
  sales: 'SL',
  'people-ops': 'PO',
  finance: 'FN',
};

export function teamInitials(teamId: string): string {
  return TEAM_ABBREV[teamId] ?? teamId.slice(0, 2).toUpperCase();
}
