import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth.context';
import { LoadingScreen } from '@/components/shared/LoadingScreen';

/**
 * AdminGuard: Protects routes that require authentication.
 * If loading, shows a spinner. If unauthenticated, redirects to /login.
 *
 * SECURITY NOTE: This component only hides the UI. The backend remains the
 * authoritative permission enforcement layer for all API operations.
 */
export function AdminGuard() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Extra guard: if user's role is not admin, show denied message
  const userRole = String(user?.role ?? '').toLowerCase();
  if (user && userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground text-sm">
            This panel is restricted to administrators only. You are signed in as{' '}
            <span className="font-semibold text-foreground">{user.email}</span> (role:{' '}
            <span className="font-mono">{user.role}</span>).
          </p>
          <div className="pt-2">
            <button
              onClick={() => logout()}
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              Sign Out &amp; Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
