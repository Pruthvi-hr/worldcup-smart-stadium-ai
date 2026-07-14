import { memo, useMemo, useState } from 'react';
import { Gauge, MapPin, ThermometerSun } from 'lucide-react';
import { SectionCard } from '../SectionCard';
import { Badge } from '../Badge';
import { ProgressBar } from '../ProgressBar';
import { stadiumZones, type StadiumZone } from '../../data/stadiumData';

const STATUS_META: Record<StadiumZone['status'], { tone: 'field' | 'warning' | 'danger'; label: string }> = {
  calm: { tone: 'field', label: 'Calm' },
  busy: { tone: 'warning', label: 'Busy' },
  critical: { tone: 'danger', label: 'Critical' },
};

function ZoneMonitorBase() {
  const [sortBy, setSortBy] = useState<'occupancy' | 'temp'>('occupancy');

  const sorted = useMemo(
    () => [...stadiumZones].sort((a, b) => (sortBy === 'occupancy' ? b.occupancy - a.occupancy : b.tempC - a.tempC)),
    [sortBy],
  );

  const criticalCount = useMemo(
    () => stadiumZones.filter((z) => z.status === 'critical').length,
    [],
  );

  return (
    <SectionCard
      title="Zone Occupancy Monitor"
      icon={<Gauge className="h-4 w-4" />}
      action={
        <div className="flex items-center gap-2">
          <Badge tone="danger" pulse={criticalCount > 0}>{criticalCount} critical</Badge>
          <div className="flex overflow-hidden rounded-lg border border-ink-700" role="group" aria-label="Sort zones">
            <button
              type="button"
              onClick={() => setSortBy('occupancy')}
              aria-pressed={sortBy === 'occupancy'}
              aria-label="Sort zones by occupancy"
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                sortBy === 'occupancy' ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-100'
              }`}
            >
              Occupancy
            </button>
            <button
              type="button"
              onClick={() => setSortBy('temp')}
              aria-pressed={sortBy === 'temp'}
              aria-label="Sort zones by temperature"
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                sortBy === 'temp' ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-100'
              }`}
            >
              Temp
            </button>
          </div>
        </div>
      }
    >
      <ul className="space-y-3" aria-label="Stadium zones with occupancy and temperature">
        {sorted.map((z) => {
          const meta = STATUS_META[z.status];
          return (
            <li key={z.id} className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-ink-400" aria-hidden="true" />
                  <span className="text-sm font-semibold text-ink-100">{z.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-ink-400" aria-label={`Temperature ${z.tempC} degrees Celsius`}>
                    <ThermometerSun className="h-3.5 w-3.5" aria-hidden="true" />
                    {z.tempC}°C
                  </span>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
              </div>
              <ProgressBar
                value={z.occupancy}
                label={`${z.name} occupancy of ${z.capacity.toLocaleString()} capacity`}
                tone={meta.tone}
              />
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

export const ZoneMonitor = memo(ZoneMonitorBase);
