import { memo, useMemo } from 'react';
import { Bus, Train, TramFront } from 'lucide-react';
import { SectionCard } from '../SectionCard';
import { Badge } from '../Badge';
import { ProgressBar } from '../ProgressBar';
import { transitRoutes, type TransitRoute } from '../../data/stadiumData';

/** Maps transit mode to its icon component and display label. */
const MODE_META: Record<TransitRoute['mode'], { icon: typeof Train; label: string }> = {
  metro: { icon: Train, label: 'Metro' },
  bus: { icon: Bus, label: 'Bus' },
  shuttle: { icon: TramFront, label: 'Shuttle' },
};

/** Maps transit status to badge tone. */
const STATUS_TONE: Record<TransitRoute['status'], 'field' | 'warning' | 'danger'> = {
  'on-time': 'field',
  delayed: 'warning',
  disrupted: 'danger',
};

/**
 * Displays transit routes serving the stadium, sorted by soonest arrival.
 * Memoised to prevent unnecessary re-renders.
 *
 * @returns A section card listing transit routes with arrival times and load.
 */
function TransitPanelBase() {
  // Sort so the soonest-arriving, least-loaded route surfaces first.
  const sorted = useMemo(
    () =>
      [...transitRoutes].sort((a, b) => {
        if (a.nextArrival === '—') return 1;
        if (b.nextArrival === '—') return -1;
        return parseInt(a.nextArrival) - parseInt(b.nextArrival);
      }),
    [],
  );

  return (
    <SectionCard title="Transit & Arrival" icon={<Train className="h-4 w-4" />}>
      <ul className="space-y-3" aria-label="Transit routes serving the stadium">
        {sorted.map((r) => {
          const meta = MODE_META[r.mode];
          const Icon = meta.icon;
          return (
            <li
              key={r.id}
              className="rounded-xl border border-ink-800 bg-ink-900/40 p-4 transition-colors hover:border-ink-700"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-aqua-500/15 text-aqua-300">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-100">{r.line}</p>
                    <p className="text-xs text-ink-400">{meta.label}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{r.nextArrival}</p>
                  <Badge tone={STATUS_TONE[r.status]}>{r.status.replace('-', ' ')}</Badge>
                </div>
              </div>
              <div className="mt-3">
                <ProgressBar
                  value={r.load}
                  label="Current load"
                  tone={r.load > 85 ? 'danger' : r.load > 65 ? 'warning' : 'field'}
                  showValue={false}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

export const TransitPanel = memo(TransitPanelBase);
