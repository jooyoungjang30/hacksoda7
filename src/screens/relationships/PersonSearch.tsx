import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import type { Person, Team } from '../../lib/types';

const MAX_RESULTS = 8;

/** Search-to-navigate, reused in the directory header and on every person page —
 * the point of this tab is moving between people, so this never goes away.
 * ⌘K / Ctrl+K focuses it from anywhere it's mounted. */
export function PersonSearch({
  people,
  teams,
  placeholder = 'Search people…',
}: {
  people: Person[];
  teams: Team[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const teamName = (teamId: string) => teams.find((t) => t.id === teamId)?.name ?? teamId;
  const q = query.trim().toLowerCase();
  const matches = q
    ? people.filter((p) => `${p.name} ${p.role} ${teamName(p.teamId)}`.toLowerCase().includes(q)).slice(0, MAX_RESULTS)
    : [];

  function select(person: Person) {
    setQuery('');
    setOpen(false);
    navigate(`/kudos/relationships/${person.id}`);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1.5 text-[12.5px] focus-within:border-brand">
        <span className="text-muted">🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && matches[0]) select(matches[0]);
            if (e.key === 'Escape') {
              setQuery('');
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={placeholder}
          className="w-40 bg-transparent text-ink outline-none placeholder:text-muted"
        />
        <kbd className="rounded border border-line px-1 text-[10px] text-muted">⌘K</kbd>
      </div>

      {open && matches.length > 0 && (
        <div className="absolute top-full left-0 z-20 mt-1 w-72 overflow-hidden rounded-md border border-line bg-white shadow-lg">
          {matches.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                select(p);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-brand-soft"
            >
              <Avatar initials={p.initials} color={teams.find((t) => t.id === p.teamId)?.color ?? '#7C3AED'} size={26} />
              <div className="min-w-0">
                <b className="block truncate text-[12.5px] leading-tight font-semibold">{p.name}</b>
                <span className="truncate text-[11px] text-muted">
                  {p.role} · {teamName(p.teamId)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
