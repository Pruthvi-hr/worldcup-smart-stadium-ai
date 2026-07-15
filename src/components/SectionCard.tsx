import { type ReactNode } from 'react';
import PropTypes from 'prop-types';

/** Props for the SectionCard component. */
interface SectionCardProps {
  /** The heading text shown in the card header. */
  title: string;
  /** Optional icon element rendered before the title. */
  icon?: ReactNode;
  /** Optional action element rendered on the right side of the header. */
  action?: ReactNode;
  /** The body content of the section. */
  children: ReactNode;
  /** Additional CSS classes to merge onto the section element. */
  className?: string;
  /** ID of an element that describes this section (for aria-describedby). */
  describedBy?: string;
}

/**
 * Named section wrapper providing a consistent card chrome (header + body)
 * and correct <section> + aria semantics for screen readers.
 *
 * @param props - The SectionCard component props.
 * @returns A semantic section element with header and body.
 */
export function SectionCard({ title, icon, action, children, className = '', describedBy }: SectionCardProps) {
  const sectionId = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section
      className={`card animate-fade-up ${className}`}
      aria-labelledby={`${sectionId}-title`}
      aria-describedby={describedBy}
    >
      <header className="flex items-center justify-between gap-3 border-b border-ink-800 px-5 py-4">
        <h2 className="flex items-center gap-2.5 font-display text-base font-semibold text-white">
          {icon && <span className="text-field-400">{icon}</span>}
          <span id={`${sectionId}-title`}>{title}</span>
        </h2>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

SectionCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  action: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  describedBy: PropTypes.string,
};
