import { useCallback, useEffect, useMemo, useState } from 'react';
import { Armchair, Clock3, Coffee, Droplets, MapPin, Sparkles, ThermometerSun, Trophy } from 'lucide-react';
import { AppShell } from '../AppShell';
import { StatCard } from '../StatCard';
import { LiveTicker } from './LiveTicker';
import { MatchCard } from './MatchCard';
import { Wayfinder } from './Wayfinder';
import { TransitPanel } from './TransitPanel';
import { RestroomStatus } from './RestroomStatus';
import { StadiumMap } from './StadiumMap';
import { SmartStadiumAssistant } from './SmartStadiumAssistant';
import { matches, stadiumZones, concessions } from '../../data/stadiumData';
import { useAuth } from '../../auth/useAuth';

/**
 * Fan-facing experience: wayfinding, live match, amenities, and transit.
 * Live KPIs tick on an interval to simulate a real-time data feed.
 */
export function FanDashboard() {
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());

  // Live clock — updates every second.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const liveMatch = useMemo(() => matches.find((m) => m.status === 'live'), []);
  const upcomingMatch = useMemo(() => matches.find((m) => m.status === 'upcoming'), []);

  // Derived KPIs — memoised so they only recompute when source data changes.
  const kpis = useMemo(() => {
    const avgWait = Math.round(
      concessions.reduce((s, c) => s + c.waitMin, 0) / concessions.length,
    );
    const nearestRestroom = 'Block 124';
    const avgOccupancy = Math.round(
      stadiumZones.reduce((s, z) => s + z.occupancy, 0) / stadiumZones.length,
    );
    const shortestConcession = concessions.reduce((min, c) => (c.waitMin < min.waitMin ? c : min));
    return { avgWait, nearestRestroom, avgOccupancy, shortestConcession };
  }, []);

  // Greeting based on the hour of day.
  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, [now]);

  const formattedTime = useMemo(
    () =>
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    [now],
  );

  const quickActions = useMemo(
    () => [
      { id: 'qa1', label: 'Find Nearest Restroom', icon: Droplets, value: kpis.nearestRestroom },
      { id: 'qa2', label: 'Shortest Concession', icon: Coffee, value: kpis.shortestConcession.name },
      { id: 'qa3', label: 'Next Match', icon: Trophy, value: upcomingMatch ? `${upcomingMatch.home.code} v ${upcomingMatch.away.code}` : '—' },
      { id: 'qa4', label: 'My Seat Zone', icon: Armchair, value: 'Block 124, Row J' },
    ],
    [kpis, upcomingMatch],
  );

  // No-op handler kept stable with useCallback for the quick-action buttons.
  const handleQuickAction = useCallback((label: string) => {
    // In a full build this would open a modal with turn-by-turn directions.
    void label;
  }, []);

  return (
    <AppShell roleLabel="Fan Access" roleTone="field">
      {/* Hero banner */}
      <section className="mb-6 animate-fade-up" aria-labelledby="fan-welcome">
        <div className="relative overflow-hidden rounded-2xl border border-ink-800 bg-gradient-to-br from-ink-900 via-ink-900 to-field-950/40 p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-20" aria-hidden="true">
            <div className="absolute right-8 top-8 h-40 w-40 rounded-full bg-field-500/40 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-field-300">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {greeting}, {user?.name.split(' ')[0]}
              </p>
              <h1 id="fan-welcome" className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                Your matchday, made effortless.
              </h1>
              <p className="mt-1.5 text-sm text-ink-400">
                Real-time wayfinding, amenities, and live match updates for {liveMatch?.venue ?? 'MetLife Stadium'}.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-ink-800 bg-ink-950/50 px-4 py-2.5">
              <Clock3 className="h-5 w-5 text-field-400" aria-hidden="true" />
              <span className="font-display text-lg font-bold text-white tabular-nums" aria-label="Current time">
                {formattedTime}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Live ticker */}
      <div className="mb-6">
        <LiveTicker />
      </div>

      {/* KPI row */}
      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Fan quick stats">
        <StatCard
          label="Avg. Concession Wait"
          value={kpis.avgWait}
          unit="min"
          icon={<Coffee className="h-5 w-5" />}
          accent="gold"
          ariaLabel={`Average concession wait time: ${kpis.avgWait} minutes`}
        />
        <StatCard
          label="Stadium Occupancy"
          value={kpis.avgOccupancy}
          unit="%"
          icon={<MapPin className="h-5 w-5" />}
          accent="aqua"
          ariaLabel={`Current stadium occupancy: ${kpis.avgOccupancy} percent`}
        />
        <StatCard
          label="Pitch Temperature"
          value="22"
          unit="°C"
          icon={<ThermometerSun className="h-5 w-5" />}
          accent="field"
          ariaLabel="Pitch temperature: 22 degrees Celsius"
        />
        <StatCard
          label="Shortest Queue"
          value={kpis.shortestConcession.waitMin}
          unit="min"
          icon={<Armchair className="h-5 w-5" />}
          accent="field"
          ariaLabel={`Shortest queue: ${kpis.shortestConcession.name} at ${kpis.shortestConcession.waitMin} minutes`}
        />
      </section>

      {/* Quick actions */}
      <section className="mb-6" aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" className="sr-only">
          Quick actions
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <li key={qa.id}>
                <button
                  type="button"
                  onClick={() => handleQuickAction(qa.label)}
                  aria-label={`${qa.label}: ${qa.value}`}
                  className="card card-hover flex w-full flex-col items-start gap-2 p-4 text-left"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-field-500/15 text-field-300">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
                    {qa.label}
                  </span>
                  <span className="font-display text-sm font-bold text-white">{qa.value}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Matches */}
      <section className="mb-6" aria-labelledby="matches-title">
        <h2 id="matches-title" className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-white">
          <Trophy className="h-5 w-5 text-gold-400" aria-hidden="true" />
          Today&apos;s Fixtures
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </section>

      {/* AI Assistant */}
      <section className="mb-6" aria-labelledby="assistant-section-title">
        <h2 id="assistant-section-title" className="sr-only">AI Smart Stadium Assistant</h2>
        <SmartStadiumAssistant />
      </section>

      {/* Map + Wayfinder */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StadiumMap />
        <Wayfinder />
      </div>

      {/* Transit + Restrooms */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TransitPanel />
        <RestroomStatus />
      </div>
    </AppShell>
  );
}
