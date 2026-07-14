import { lazy, Suspense, useMemo } from 'react';
import { AuthProvider, useAuth } from './auth';
import { Login } from './components/Login';

// Code-split the two dashboards so only the relevant experience loads.
const FanDashboard = lazy(() =>
  import('./components/fan/FanDashboard').then((m) => ({ default: m.FanDashboard })),
);
const VolunteerCommandNode = lazy(() =>
  import('./components/volunteer/VolunteerCommandNode').then((m) => ({
    default: m.VolunteerCommandNode,
  })),
);

/**
 * Minimal loading fallback shown while a dashboard chunk is fetched.
 */
function DashboardFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-field-500" aria-hidden="true" />
        <span className="text-sm text-ink-400">Loading your station…</span>
      </div>
    </div>
  );
}

/**
 * Dynamic router — no static routes. Based on the authenticated user's role,
 * renders the Fan or Volunteer experience. Unauthenticated users see Login.
 */
function Gate() {
  const { user } = useAuth();

  // Memoise the routed node so it only re-renders when the user changes.
  const node = useMemo(() => {
    if (!user) return <Login />;

    return (
      <Suspense fallback={<DashboardFallback />}>
        {user.role === 'fan' ? <FanDashboard /> : <VolunteerCommandNode />}
      </Suspense>
    );
  }, [user]);

  return node;
}

/**
 * Root component. Wraps the app in an AuthProvider so authentication state
 * is available everywhere, then delegates to the dynamic Gate router.
 */
export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
