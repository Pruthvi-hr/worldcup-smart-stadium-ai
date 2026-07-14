interface BadgeProps {
  children: React.ReactNode;
  tone?: 'field' | 'aqua' | 'gold' | 'danger' | 'warning' | 'ink';
  pulse?: boolean;
}

const TONE: Record<NonNullable<BadgeProps['tone']>, string> = {
  field: 'bg-field-500/15 text-field-300',
  aqua: 'bg-aqua-500/15 text-aqua-300',
  gold: 'bg-gold-500/15 text-gold-300',
  danger: 'bg-danger-500/15 text-danger-300',
  warning: 'bg-warning-500/15 text-warning-300',
  ink: 'bg-ink-700/60 text-ink-300',
};

/** Small status pill with optional pulsing live indicator. */
export function Badge({ children, tone = 'ink', pulse = false }: BadgeProps) {
  return (
    <span className={`pill ${TONE[tone]}`}>
      {pulse && <span className="live-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
