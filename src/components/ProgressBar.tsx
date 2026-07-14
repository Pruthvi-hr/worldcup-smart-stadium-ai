interface ProgressBarProps {
  value: number; // 0-100
  label: string;
  tone?: 'field' | 'aqua' | 'gold' | 'danger' | 'warning';
  showValue?: boolean;
}

const TONE_BAR: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  field: 'bg-field-500',
  aqua: 'bg-aqua-500',
  gold: 'bg-gold-500',
  danger: 'bg-danger-500',
  warning: 'bg-warning-500',
};

/**
 * Accessible determinate progress bar with role="progressbar" and an
 * aria-valuenow/aria-valuemin/aria-valuemax triplet.
 */
export function ProgressBar({ value, label, tone = 'field', showValue = true }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm text-ink-300">{label}</span>
        {showValue && <span className="text-sm font-semibold text-ink-100">{clamped}%</span>}
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-ink-800"
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${TONE_BAR[tone]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
