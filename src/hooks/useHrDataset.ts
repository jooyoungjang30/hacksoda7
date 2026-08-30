import { useEffect, useState } from 'react';
import { db } from '../lib/supabase';
import type { Kudo, Office, Person, Team } from '../lib/types';

export interface HrDataset {
  people: Person[];
  teams: Team[];
  offices: Office[];
  kudos: Kudo[];
  loading: boolean;
}

/** The single source of the HR dashboard's data — employees, teams and kudos,
 * straight from Supabase. Refetches on every mount so a kudos sent earlier in
 * the session shows up next time an HR page is visited. */
export function useHrDataset(): HrDataset {
  const [data, setData] = useState<{
    people: Person[]; teams: Team[]; offices: Office[]; kudos: Kudo[];
  }>({ people: [], teams: [], offices: [], kudos: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      db.from('teams').select('*'),
      db.from('employees').select('*'),
      db.from('kudos').select('*'),
      db.from('offices').select('*'),
    ])
      .then(([teamsRes, employeesRes, kudosRes, officesRes]) => {
        if (cancelled) return;
        if (teamsRes.error) throw teamsRes.error;
        if (employeesRes.error) throw employeesRes.error;
        if (kudosRes.error) throw kudosRes.error;
        if (officesRes.error) throw officesRes.error;

        const offices: Office[] = (officesRes.data ?? []).map((o) => ({
          id: o.id, name: o.name, country: o.country,
          timezone: o.timezone, color: o.color,
        }));

        const teams: Team[] = teamsRes.data.map((t) => ({ id: t.id, name: t.name, color: t.color }));
        const people: Person[] = employeesRes.data.map((e) => ({
          id: e.id,
          name: e.name,
          initials: e.initials,
          role: e.title ?? '',
          teamId: e.team_id ?? '',
          slackLinked: e.slack_linked,
          managerId: e.manager_id,
          officeId: e.office_id ?? '',
          startedAt: e.started_at ?? null,
        }));
        const kudos: Kudo[] = kudosRes.data.map((k) => ({
          id: String(k.id),
          fromId: k.sender_id,
          toId: k.recipient_id,
          amountCents: k.amount_cents,
          message: k.message,
          sentAt: String(k.created_at).slice(0, 10),
          claimedAt: k.claimed_at ? String(k.claimed_at).slice(0, 10) : null,
          expiresAt: String(k.expires_at).slice(0, 10),
        }));

        setData({ people, teams, offices, kudos });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('useHrDataset:', err);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...data, loading };
}
