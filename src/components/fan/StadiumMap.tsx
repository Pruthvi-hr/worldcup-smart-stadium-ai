import { memo, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { SectionCard } from '../SectionCard';
import { Badge } from '../Badge';
import { stadiumZones, type StadiumZone } from '../../data/stadiumData';

const STATUS_META: Record<
  StadiumZone['status'],
  { tone: 'field' | 'warning' | 'danger'; label: string; dot: string }
> = {
  calm: { tone: 'field', label: 'Calm', dot: 'bg-field-400' },
  busy: { tone: 'warning', label: 'Busy', dot: 'bg-warning-400' },
  critical: { tone: 'danger', label: 'Critical', dot: 'bg-danger-400' },
};

/** Simplified top-down stadium occupancy map. */
function StadiumMapBase() {
  const totalOccupancy = useMemo(
    () => Math.round(
      stadiumZones.reduce((sum, z) => sum + (z.occupancy * z.capacity) / 100, 0) /
        stadiumZones.reduce((sum, z) => sum + z.capacity, 0) *
        100,
    ),
    [],
  );

  return (
    <SectionCard
      title="Stadium Occupancy Map"
      icon={<MapPin className="h-4 w-4" />}
      action={<Badge tone="aqua">{totalOccupancy}% overall</Badge>}
    >
      {/* Pitch */}
      <div className="relative mx-auto mb-4 aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl border border-field-700/40 bg-field-950/40">
        <div className="absolute inset-6 rounded-lg border-2 border-field-600/40" aria-hidden="true" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-field-600/40" aria-hidden="true" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-field-600/40" aria-hidden="true" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-xs font-bold text-field-300/60">
          PITCH
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Stadium zone occupancy levels">
        {stadiumZones.map((z) => {
          const meta = STATUS_META[z.status];
          return (
            <li
              key={z.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-ink-800 bg-ink-900/40 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />
                <span className="truncate text-sm text-ink-200">{z.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-semibold text-ink-100 tabular-nums">{z.occupancy}%</span>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

export const StadiumMap = memo(StadiumMapBase);
