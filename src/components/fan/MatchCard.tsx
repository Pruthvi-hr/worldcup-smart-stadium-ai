import { memo } from 'react';
import PropTypes from 'prop-types';
import { MapPin } from 'lucide-react';
import { Badge } from '../Badge';
import type { Match } from '../../data/stadiumData';

/** Props for the MatchCard component. */
interface MatchCardProps {
  /** The match data to render. */
  match: Match;
}

/**
 * Render a single fixture with live score / minute, memoised to avoid
 * unnecessary re-renders when the parent re-renders.
 *
 * @param props - The MatchCard component props.
 * @returns An article element displaying the match fixture and score.
 */
function MatchCardBase({ match }: MatchCardProps) {
  const isLive = match.status === 'live';

  return (
    <article
      className={`card card-hover overflow-hidden ${
        isLive ? 'border-field-500/40 shadow-glow' : ''
      }`}
      aria-label={`Match: ${match.home.name} versus ${match.away.name}, ${match.status}`}
    >
      <div className="flex items-center justify-between border-b border-ink-800 px-4 py-2.5">
        <span className="text-xs font-medium text-ink-400">
          {match.stage} · {match.group}
        </span>
        {match.status === 'live' && (
          <Badge tone="danger" pulse>
            LIVE · {match.minute}&apos;
          </Badge>
        )}
        {match.status === 'upcoming' && <Badge tone="field">Kick-off {match.kickoff}</Badge>}
        {match.status === 'finished' && <Badge tone="ink">Full Time</Badge>}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-5">
        {/* Home */}
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <span className="text-4xl" aria-hidden="true">{match.home.flag}</span>
          <span className="font-display text-sm font-bold text-white">{match.home.code}</span>
          <span className="text-xs text-ink-400">{match.home.name}</span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center">
          {match.status === 'upcoming' ? (
            <span className="font-display text-2xl font-bold text-ink-500">VS</span>
          ) : (
            <span className="font-display text-3xl font-bold text-white tabular-nums">
              {match.score.home} <span className="text-ink-600">-</span> {match.score.away}
            </span>
          )}
          <span className="mt-1 text-xs text-ink-500">{match.kickoff}</span>
        </div>

        {/* Away */}
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <span className="text-4xl" aria-hidden="true">{match.away.flag}</span>
          <span className="font-display text-sm font-bold text-white">{match.away.code}</span>
          <span className="text-xs text-ink-400">{match.away.name}</span>
        </div>
      </div>

      <footer className="flex items-center justify-center gap-1.5 border-t border-ink-800 px-4 py-2.5 text-xs text-ink-400">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        {match.venue} · {match.city}
      </footer>
    </article>
  );
}

MatchCardBase.propTypes = {
  match: PropTypes.shape({
    id: PropTypes.string.isRequired,
    stage: PropTypes.string.isRequired,
    group: PropTypes.string.isRequired,
    home: PropTypes.shape({
      name: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      flag: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    }).isRequired,
    away: PropTypes.shape({
      name: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      flag: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    }).isRequired,
    venue: PropTypes.string.isRequired,
    city: PropTypes.string.isRequired,
    kickoff: PropTypes.string.isRequired,
    minute: PropTypes.number.isRequired,
    status: PropTypes.oneOf(['upcoming', 'live', 'finished']).isRequired,
    score: PropTypes.shape({
      home: PropTypes.number.isRequired,
      away: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
};

export const MatchCard = memo(MatchCardBase);
