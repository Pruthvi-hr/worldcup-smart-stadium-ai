import { type ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  describedBy?: string;
}

/**
 * Named section wrapper providing a consistent card chrome (header + body)
 * and correct <section> + aria semantics for screen readers.
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
