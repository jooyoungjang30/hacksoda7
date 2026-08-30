import { daysUntilReset } from '../../lib/clock';
import { money, shortDate } from '../../lib/format';
import type { MemberStats } from '../../lib/types';

function firstName(fullName: string): string {
  return fullName.split(' ')[0];
}

export function unusedBudgetMessage(s: MemberStats): string {
  const remainingCents = s.allowanceCents - s.givenCents;
  return (
    `Hi ${firstName(s.person.name)} 👋 You still have ${money(remainingCents)} of your ` +
    `${money(s.allowanceCents)} Kudos budget left to give, and there are ${daysUntilReset()} days ` +
    `before it resets on Dec 31. Unspent budget doesn't roll over.\n\n` +
    `Someone help you out recently? Say thanks.`
  );
}

export function unclaimedGiftMessage(s: MemberStats): string {
  const cardWord = s.unclaimedCount === 1 ? 'gift card' : 'gift cards';
  const expiryClause = s.nearestExpiryAt
    ? `One of them expires ${shortDate(s.nearestExpiryAt)}.`
    : "Don't let them expire unused.";
  return (
    `Hi ${firstName(s.person.name)} 👋 You have ${s.unclaimedCount} unclaimed Kudos ${cardWord} worth ` +
    `${money(s.unclaimedCents)} waiting for you. ${expiryClause}\n\n` +
    `Your colleagues sent these to thank you — don't let them lapse.`
  );
}
