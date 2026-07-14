import { useCallback, useMemo, useState } from 'react';
import { Clock, Coffee, Droplets, ShoppingBag } from 'lucide-react';
import { SectionCard } from '../SectionCard';
import { Badge } from '../Badge';
import { concessions, type Concession } from '../../data/stadiumData';

const CATEGORY_META: Record<
  Concession['category'],
  { icon: typeof Coffee; label: string; iconClass: string }
> = {
  food: { icon: Coffee, label: 'Food', iconClass: 'bg-gold-500/15 text-gold-300' },
  drink: { icon: Droplets, label: 'Drink', iconClass: 'bg-aqua-500/15 text-aqua-300' },
  retail: { icon: ShoppingBag, label: 'Retail', iconClass: 'bg-field-500/15 text-field-300' },
};

/**
 * Lets a fan pick a category and instantly see the best (shortest-wait)
 * concession for that category. Memoised filtering + sorting keeps the
 * derived list stable across unrelated re-renders.
 */
export function Wayfinder() {
  const [category, setCategory] = useState<Concession['category'] | 'all'>('all');

  const filtered = useMemo(() => {
    const list = category === 'all' ? concessions : concessions.filter((c) => c.category === category);
    return [...list].sort((a, b) => a.waitMin - b.waitMin);
  }, [category]);

  const best = filtered[0];

  const selectCategory = useCallback((cat: Concession['category'] | 'all') => {
    setCategory(cat);
  }, []);

  const filters: { key: Concession['category'] | 'all'; label: string }[] = useMemo(
    () => [
      { key: 'all', label: 'All' },
      { key: 'food', label: 'Food' },
      { key: 'drink', label: 'Drinks' },
      { key: 'retail', label: 'Retail' },
    ],
    [],
  );

  return (
    <SectionCard
      title="Concession Wayfinder"
      icon={<Coffee className="h-4 w-4" />}
      describedBy="wayfinder-desc"
    >
      <p id="wayfinder-desc" className="sr-only">
        Filter concessions by category. Results are sorted by shortest wait time.
      </p>

      {/* Category filter group */}
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Concession category filter">
        {filters.map((f) => {
          const active = category === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => selectCategory(f.key)}
              aria-pressed={active}
              aria-label={`Filter concessions by ${f.label}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-field-500 text-ink-950'
                  : 'border border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-100'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {best && (
        <div
          className="mb-4 rounded-xl border border-field-500/30 bg-field-500/10 p-4"
          aria-label={`Recommended: ${best.name} with ${best.waitMin} minute wait`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-field-300">Fastest option</p>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="font-display text-lg font-bold text-white">{best.name}</span>
            <span className="flex items-center gap-1.5 font-semibold text-field-300">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {best.waitMin} min
            </span>
          </div>
        </div>
      )}

      <ul className="space-y-2.5" aria-label="All concessions matching filter">
        {filtered.map((c) => {
          const meta = CATEGORY_META[c.category];
            const Icon = meta.icon;
          return (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-ink-800 bg-ink-900/40 p-3 transition-colors hover:border-ink-700"
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.iconClass}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-100">{c.name}</p>
                  <p className="text-xs text-ink-400">{c.queue} in queue</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={c.waitMin <= 5 ? 'field' : c.waitMin <= 10 ? 'warning' : 'danger'}>
                  {c.waitMin} min
                </Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
