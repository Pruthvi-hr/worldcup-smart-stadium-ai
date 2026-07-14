import { type ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: ReactNode;
  accent?: 'field' | 'aqua' | 'gold' | 'danger' | 'warning';
  trend?: { value: string; positive?: boolean };
  ariaLabel?: string;
}

const ACCENT_MAP: Record<NonNullable<StatCardProps['accent']>, string> = {
  field: 'text-field-400 bg-field-500/10',
  aqua: 'text-aqua-400 bg-aqua-500/10',
  gold: 'text-gold-400 bg-gold-500/10',
  danger: 'text-danger-400 bg-danger-500/10',
  warning: 'text-warning-400 bg-warning-500/10',
};

/**
 * Compact KPI tile used across both dashboards. Renders a labelled metric with
 * optional icon, accent colour, and trend delta.
 */
export function StatCard({
  label,
  value,
  unit,
  icon,
  accent = 'field',
  trend,
  ariaLabel,
}: StatCardProps) {
  return (
    <article
      className="stat-card card-hover animate-fade-up"
      aria-label={ariaLabel ?? `${label}: ${value}${unit ?? ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-400">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-white">
            {value}
            {unit && <span className="ml-1 text-base font-semibold text-ink-400">{unit}</span>}
          </p>
        </div>
        {icon && (
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${ACCENT_MAP[accent]}`}>
            {icon}
          </span>
        )}
      </div>
      {trend && (
        <p
          className={`mt-3 text-xs font-semibold ${
            trend.positive ? 'text-field-400' : 'text-danger-400'
          }`}
        >
          {trend.value}
        </p>
      )}
    </article>
  );
}
