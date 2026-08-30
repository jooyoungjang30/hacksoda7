import { money } from '../../lib/format';

export function Money({ cents }: { cents: number }) {
  return <>{money(cents)}</>;
}
