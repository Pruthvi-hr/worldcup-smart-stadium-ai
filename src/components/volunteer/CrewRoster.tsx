import { memo, useMemo } from 'react';
import { Radio, Users } from 'lucide-react';
import { SectionCard } from '../SectionCard';
import { Badge } from '../Badge';
import { volunteers, type Volunteer } from '../../data/stadiumData';

/** Maps volunteer status to badge tone, indicator dot class, and label. */
const STATUS_META: Record<
  Volunteer['status'],
  { tone: 'field' | 'warning' | 'ink'; dot: string; label: string }
> = {
  active: { tone: 'field', dot: 'bg-field-400', label: 'Active' },
  break: { tone: 'warning', dot: 'bg-warning-400', label: 'On Break' },
  offline: { tone: 'ink', dot: 'bg-ink-500', label: 'Offline' },
};

/**
 * Displays the volunteer crew roster, sorted by status (active first).
 * Memoised to prevent unnecessary re-renders.
 *
 * @returns A section card listing volunteers with status indicators.
 */
function CrewRosterBase() {
  // Sort volunteers so active crew appear first, then on-break, then offline.
  const sorted = useMemo(
    () => [...volunteers].sort((a, b) => {
      const order: Record<Volunteer['status'], number> = { active: 0, break: 1, offline: 2 };
      return order[a.status] - order[b.status];
    }),
    [],
  );

  // Summarise active vs total volunteer counts for the header badge.
  const summary = useMemo(
    () => ({
      active: volunteers.filter((v) => v.status === 'active').length,
      total: volunteers.length,
    }),
    [],
  );

  return (
    <SectionCard
      title="Volunteer Crew Roster"
      icon={<Users className="h-4 w-4" />}
      action={<Badge tone="field">{summary.active}/{summary.total} active</Badge>}
    >
      <ul className="space-y-2.5" aria-label="Volunteer crew roster">
        {sorted.map((v) => {
          const meta = STATUS_META[v.status];
          return (
            <li
              key={v.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-ink-800 bg-ink-900/40 p-3 transition-colors hover:border-ink-700"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-800 text-xs font-bold text-ink-200" aria-hidden="true">
                  {v.name.split(' ').map((n) => n[0]).join('')}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-100">{v.name}</p>
                  <p className="text-xs text-ink-400">{v.role} · {v.zone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Radio
                  className={`h-4 w-4 ${v.status === 'active' ? 'text-field-400' : 'text-ink-600'}`}
                  aria-hidden="true"
                />
                <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} aria-hidden="true" />
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

export const CrewRoster = memo(CrewRosterBase);
