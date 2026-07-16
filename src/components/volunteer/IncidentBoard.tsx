import { memo, useCallback, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Construction,
  HeartPulse,
  MapPin,
  Siren,
  Users,
  Wrench,
} from 'lucide-react';
import { SectionCard } from '../SectionCard';
import { Badge } from '../Badge';
import { initialIncidents, type Incident } from '../../data/stadiumData';

/**
 * Maps incident type to its icon component, display label, and icon class.
 * @internal
 */
const TYPE_META: Record<
  Incident['type'],
  { icon: typeof HeartPulse; label: string; iconClass: string }
> = {
  medical: { icon: HeartPulse, label: 'Medical', iconClass: 'bg-danger-500/15 text-danger-300' },
  security: { icon: Siren, label: 'Security', iconClass: 'bg-warning-500/15 text-warning-300' },
  facility: { icon: Wrench, label: 'Facility', iconClass: 'bg-aqua-500/15 text-aqua-300' },
  crowd: { icon: Users, label: 'Crowd', iconClass: 'bg-gold-500/15 text-gold-300' },
};

/**
 * Maps incident severity to badge tone.
 * @internal
 */
const SEVERITY_TONE: Record<Incident['severity'], 'field' | 'warning' | 'danger'> = {
  low: 'field',
  medium: 'warning',
  high: 'danger',
};

/**
 * Maps incident status to badge tone, display label, and the next lifecycle state.
 * @internal
 */
const STATUS_META: Record<
  Incident['status'],
  { tone: 'ink' | 'warning' | 'field' | 'aqua'; label: string; next: Incident['status'] | null }
> = {
  open: { tone: 'warning', label: 'Open', next: 'en-route' },
  'en-route': { tone: 'aqua', label: 'En Route', next: 'resolved' },
  resolved: { tone: 'field', label: 'Resolved', next: null },
};

/**
 * Incident command board. Volunteers can advance an incident through its
 * lifecycle (open → en-route → resolved). State is local to this component
 * so the simulation is self-contained.
 *
 * @returns A section card with status filters and a list of incident cards.
 */
function IncidentBoardBase() {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [filter, setFilter] = useState<Incident['status'] | 'all'>('all');

  const visible = useMemo(
    () => incidents.filter((i) => filter === 'all' || i.status === filter),
    [incidents, filter],
  );

  const openCount = useMemo(() => incidents.filter((i) => i.status === 'open').length, [incidents]);
  const activeCount = useMemo(
    () => incidents.filter((i) => i.status === 'en-route').length,
    [incidents],
  );
  const resolvedCount = useMemo(
    () => incidents.filter((i) => i.status === 'resolved').length,
    [incidents],
  );

  const advance = useCallback((id: string) => {
    setIncidents((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const meta = STATUS_META[i.status];
        if (!meta.next) return i;
        return { ...i, status: meta.next };
      }),
    );
  }, []);

  const filters: { key: Incident['status'] | 'all'; label: string }[] = useMemo(
    () => [
      { key: 'all', label: `All (${incidents.length})` },
      { key: 'open', label: `Open (${openCount})` },
      { key: 'en-route', label: `En Route (${activeCount})` },
      { key: 'resolved', label: `Resolved (${resolvedCount})` },
    ],
    [incidents.length, openCount, activeCount, resolvedCount],
  );

  return (
    <SectionCard
      title="Incident Command Board"
      icon={<AlertTriangle className="h-4 w-4" />}
      action={
        <div className="flex items-center gap-2 text-xs">
          <Badge tone="warning" pulse={openCount > 0}>{openCount} open</Badge>
          <Badge tone="aqua">{activeCount} en route</Badge>
        </div>
      }
    >
      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter incidents by status">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              aria-label={`Filter incidents: ${f.label}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-aqua-500 text-ink-950'
                  : 'border border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-100'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <ul className="space-y-3" aria-label="Active incidents">
        {visible.map((inc) => {
          const meta = TYPE_META[inc.type];
          const Icon = meta.icon;
          const sMeta = STATUS_META[inc.status];
          return (
            <li
              key={inc.id}
              className={`rounded-xl border bg-ink-900/40 p-4 transition-colors ${
                inc.severity === 'high' && inc.status !== 'resolved'
                  ? 'border-danger-500/40 shadow-glow-danger'
                  : 'border-ink-800 hover:border-ink-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.iconClass}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">{meta.label}</span>
                      <Badge tone={SEVERITY_TONE[inc.severity]}>{inc.severity}</Badge>
                      <Badge tone={sMeta.tone === 'aqua' ? 'aqua' : sMeta.tone}>{sMeta.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-ink-300">{inc.description}</p>
                    <p className="mt-1.5 flex items-center gap-3 text-xs text-ink-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden="true" /> {inc.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" /> {inc.reportedAt}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Lifecycle action button */}
                {sMeta.next ? (
                  <button
                    type="button"
                    onClick={() => advance(inc.id)}
                    aria-label={`Advance incident ${inc.id} to ${sMeta.next.replace('-', ' ')}`}
                    className="btn-ghost shrink-0 !px-3 !py-2 text-xs"
                  >
                    <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                    {sMeta.next === 'en-route' ? 'Dispatch' : 'Resolve'}
                  </button>
                ) : (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-field-400">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Closed
                  </span>
                )}
              </div>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className="flex flex-col items-center gap-2 rounded-xl border border-ink-800 bg-ink-900/40 py-10 text-center">
            <Construction className="h-8 w-8 text-ink-600" aria-hidden="true" />
            <p className="text-sm text-ink-400">No incidents in this view.</p>
          </li>
        )}
      </ul>
    </SectionCard>
  );
}

export const IncidentBoard = memo(IncidentBoardBase);
