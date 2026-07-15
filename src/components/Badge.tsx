import PropTypes from 'prop-types';

/** Props for the Badge component. */
interface BadgeProps {
  /** The content displayed inside the pill. */
  children: React.ReactNode;
  /** Colour tone for the pill background and text. */
  tone?: 'field' | 'aqua' | 'gold' | 'danger' | 'warning' | 'ink';
  /** Whether to show a pulsing live indicator dot. */
  pulse?: boolean;
}

/** Maps tone keys to Tailwind background + text classes. */
const TONE: Record<NonNullable<BadgeProps['tone']>, string> = {
  field: 'bg-field-500/15 text-field-300',
  aqua: 'bg-aqua-500/15 text-aqua-300',
  gold: 'bg-gold-500/15 text-gold-300',
  danger: 'bg-danger-500/15 text-danger-300',
  warning: 'bg-warning-500/15 text-warning-300',
  ink: 'bg-ink-700/60 text-ink-300',
};

/**
 * Small status pill with optional pulsing live indicator.
 *
 * @param props - The Badge component props.
 * @returns A styled span element acting as a status badge.
 */
export function Badge({ children, tone = 'ink', pulse = false }: BadgeProps) {
  return (
    <span className={`pill ${TONE[tone]}`}>
      {pulse && <span className="live-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['field', 'aqua', 'gold', 'danger', 'warning', 'ink']),
  pulse: PropTypes.bool,
};
