import { useEffect, useMemo, useState } from 'react';
import { Radio } from 'lucide-react';
import { newsFeed, type NewsItem } from '../../data/stadiumData';

const CATEGORY_COLOR: Record<NewsItem['category'], string> = {
  match: 'text-field-300',
  stadium: 'text-aqua-300',
  transit: 'text-gold-300',
  fan: 'text-warning-300',
};

/**
 * Horizontally scrolling live-update ticker. Duplicates its content so the
 * CSS keyframe loop is seamless. Pauses on hover/keyboard focus.
 *
 * @returns A scrolling ticker element showing live stadium updates.
 */
export function LiveTicker() {
  const [items, setItems] = useState<NewsItem[]>(newsFeed);

  // Periodically rotate a new synthetic update to the front.
  useEffect(() => {
    const id = window.setInterval(() => {
      setItems((prev) => {
        const next = [...prev];
        const moved = next.pop();
        if (moved) {
          next.unshift({ ...moved, time: 'NOW' });
        }
        return next;
      });
    }, 12000);
    return () => window.clearInterval(id);
  }, []);

  const loop = useMemo(() => [...items, ...items], [items]);

  return (
    <div
      className="group flex items-center gap-3 overflow-hidden rounded-xl border border-ink-800 bg-ink-900/60 px-4 py-2.5"
      aria-label="Live stadium updates ticker"
    >
      <span className="flex shrink-0 items-center gap-2 rounded-lg bg-danger-500/15 px-2.5 py-1 text-xs font-bold text-danger-300">
        <Radio className="h-3.5 w-3.5" aria-hidden="true" />
        LIVE
      </span>
      <div className="relative flex-1 overflow-hidden">
        <div
          className="flex w-max animate-ticker gap-8 whitespace-nowrap group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
          aria-label="Scrolling live updates"
        >
          {loop.map((item, i) => (
            <span key={`${item.id}-${i}`} className="flex items-center gap-2 text-sm">
              <span className={`font-semibold ${CATEGORY_COLOR[item.category]}`} aria-hidden="true">
                {item.category.toUpperCase()}
              </span>
              <span className="text-ink-200">{item.text}</span>
              <span className="text-ink-600">·</span>
              <span className="text-ink-500">{item.time}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
