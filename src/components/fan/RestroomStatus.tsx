import { memo } from 'react';
import { ShowerHead } from 'lucide-react';
import { SectionCard } from '../SectionCard';
import { Badge } from '../Badge';
import { ProgressBar } from '../ProgressBar';
import { restrooms } from '../../data/stadiumData';

/** Maps restroom status to badge tone and display label. */
const STATUS_META = {
  ok: { tone: 'field' as const, label: 'Clean' },
  attention: { tone: 'warning' as const, label: 'Needs Attention' },
  cleaning: { tone: 'aqua' as const, label: 'Cleaning' },
};

/**
 * Displays restroom cleanliness status across all stadium blocks.
 * Memoised to prevent unnecessary re-renders.
 *
 * @returns A section card listing restroom blocks with cleanliness bars.
 */
function RestroomStatusBase() {
  return (
    <SectionCard title="Restroom Status" icon={<ShowerHead className="h-4 w-4" />}>
      <ul className="space-y-3" aria-label="Restroom cleanliness status by block">
        {restrooms.map((r) => {
          const meta = STATUS_META[r.status];
          return (
            <li key={r.id} className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-100">{r.name}</span>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
              <ProgressBar value={r.cleanliness} label="Cleanliness" tone={meta.tone} />
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

export const RestroomStatus = memo(RestroomStatusBase);
