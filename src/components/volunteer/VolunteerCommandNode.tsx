import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Gauge,
  Radio,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AppShell } from '../AppShell';
import { StatCard } from '../StatCard';
import { IncidentBoard } from './IncidentBoard';
import { CrewRoster } from './CrewRoster';
import { ZoneMonitor } from './ZoneMonitor';
import { BroadcastConsole } from './BroadcastConsole';
import { initialIncidents, stadiumZones, volunteers, transitRoutes } from '../../data/stadiumData';
import { useAuth } from '../../auth/useAuth';

/**
 * Volunteer command-node: incident triage, zone monitoring, crew coordination,
 * and broadcast messaging. Live KPIs tick to simulate a real-time operations feed.
 *
 * @returns The full volunteer command dashboard wrapped in an AppShell.
 */
export function VolunteerCommandNode() {
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());

  // Live clock — updates every second.
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Derived operational KPIs — memoised so they only recompute when data changes.
  const kpis = useMemo(() => {
    const openIncidents = initialIncidents.filter((i) => i.status === 'open').length;
    const enRoute = initialIncidents.filter((i) => i.status === 'en-route').length;
    const criticalZones = stadiumZones.filter((z) => z.status === 'critical').length;
    const activeCrew = volunteers.filter((v) => v.status === 'active').length;
    const disruptedTransit = transitRoutes.filter((t) => t.status === 'disrupted').length;
    const overallOccupancy = Math.round(
      stadiumZones.reduce((s, z) => s + (z.occupancy * z.capacity) / 100, 0) /
        stadiumZones.reduce((s, z) => s + z.capacity, 0) * 100,
    );
    return { openIncidents, enRoute, criticalZones, activeCrew, disruptedTransit, overallOccupancy };
  }, []);

  const formattedTime = useMemo(
    () => now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    [now],
  );

  const systemHealth = useMemo(() => {
    // Composite score: penalise open incidents, critical zones, disrupted transit.
    let score = 100;
    score -= kpis.openIncidents * 12;
    score -= kpis.criticalZones * 15;
    score -= kpis.disruptedTransit * 8;
    return Math.max(0, Math.min(100, score));
  }, [kpis]);

  const healthTone = systemHealth > 75 ? 'field' : systemHealth > 50 ? 'warning' : 'danger';

  // Static class maps — Tailwind can't purge dynamically-constructed class names.
  const HEALTH_STYLE: Record<typeof healthTone, { border: string; bg: string; text: string }> = {
    field: { border: 'border-field-500/30', bg: 'bg-field-500/10', text: 'text-field-400' },
    warning: { border: 'border-warning-500/30', bg: 'bg-warning-500/10', text: 'text-warning-400' },
    danger: { border: 'border-danger-500/30', bg: 'bg-danger-500/10', text: 'text-danger-400' },
  };
  const hs = HEALTH_STYLE[healthTone];

  const alertItems = useMemo(
    () => [
      { id: 'a1', text: 'Gate B crowd density critical — redirect to Gate C', time: '17:50', sev: 'high' as const },
      { id: 'a2', text: 'Medical response en route to Block 112', time: '17:42', sev: 'medium' as const },
      { id: 'a3', text: 'Metro Line 7 signal disruption reported', time: '17:30', sev: 'medium' as const },
      { id: 'a4', text: 'Trophy Bar queue exceeds 40 — vendor opened', time: '16:55', sev: 'low' as const },
    ],
    [],
  );

  const handleAcknowledge = useCallback(() => {
    // In a full build this would mark alerts as acknowledged in the backend.
    void undefined;
  }, []);

  return (
    <AppShell roleLabel="Volunteer Command" roleTone="aqua">
      {/* Command header */}
      <section className="mb-6 animate-fade-up" aria-labelledby="command-title">
        <div className="relative overflow-hidden rounded-2xl border border-ink-800 bg-gradient-to-br from-ink-900 via-ink-900 to-aqua-950/40 p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-20" aria-hidden="true">
            <div className="absolute right-8 top-8 h-40 w-40 rounded-full bg-aqua-500/40 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-aqua-300">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Operations Command · {user?.name.split(' ')[0]}
              </p>
              <h1 id="command-title" className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                Stadium operations, under control.
              </h1>
              <p className="mt-1.5 text-sm text-ink-400">
                Real-time incident triage, zone monitoring, and crew coordination.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-ink-800 bg-ink-950/50 px-4 py-2.5">
                <Clock3 className="h-5 w-5 text-aqua-400" aria-hidden="true" />
                <span className="font-display text-lg font-bold text-white tabular-nums" aria-label="Current time">
                  {formattedTime}
                </span>
              </div>
              <div
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 ${hs.border} ${hs.bg}`}
                aria-label={`System health score: ${systemHealth} out of 100`}
              >
                <Activity className={`h-5 w-5 ${hs.text}`} aria-hidden="true" />
                <span className={`font-display text-lg font-bold ${hs.text}`}>{systemHealth}</span>
                <span className="text-xs text-ink-400">health</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI row */}
      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Operational metrics">
        <StatCard
          label="Open Incidents"
          value={kpis.openIncidents}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="danger"
          ariaLabel={`${kpis.openIncidents} open incidents requiring triage`}
        />
        <StatCard
          label="Critical Zones"
          value={kpis.criticalZones}
          icon={<Gauge className="h-5 w-5" />}
          accent="warning"
          ariaLabel={`${kpis.criticalZones} zones at critical occupancy`}
        />
        <StatCard
          label="Active Crew"
          value={kpis.activeCrew}
          unit={`/ ${volunteers.length}`}
          icon={<Users className="h-5 w-5" />}
          accent="field"
          ariaLabel={`${kpis.activeCrew} of ${volunteers.length} volunteers active`}
        />
        <StatCard
          label="Overall Occupancy"
          value={kpis.overallOccupancy}
          unit="%"
          icon={<Radio className="h-5 w-5" />}
          accent="aqua"
          ariaLabel={`Overall stadium occupancy: ${kpis.overallOccupancy} percent`}
        />
      </section>

      {/* Priority alerts banner */}
      <section className="mb-6 animate-fade-up" aria-labelledby="alerts-title">
        <h2 id="alerts-title" className="sr-only">Priority alerts</h2>
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink-800 bg-danger-500/5 px-5 py-3">
            <AlertTriangle className="h-4 w-4 text-danger-400" aria-hidden="true" />
            <span className="text-sm font-bold text-danger-300">Priority Alerts</span>
          </div>
          <ul className="divide-y divide-ink-800">
            {alertItems.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      a.sev === 'high' ? 'bg-danger-400' : a.sev === 'medium' ? 'bg-warning-400' : 'bg-field-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-ink-200">{a.text}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-ink-500">{a.time}</span>
                  <button
                    type="button"
                    onClick={handleAcknowledge}
                    aria-label={`Acknowledge alert: ${a.text}`}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-400 transition-colors hover:bg-ink-800 hover:text-field-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Ack
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Incident board + Zone monitor */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <IncidentBoard />
        <ZoneMonitor />
      </div>

      {/* Crew + Broadcast */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CrewRoster />
        <BroadcastConsole />
      </div>
    </AppShell>
  );
}
