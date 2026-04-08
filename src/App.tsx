import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth, initAuth } from '@/hooks/useAuth';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const SongLibrary = lazy(() => import('@/pages/SongLibrary'));
const GigBuilder = lazy(() => import('@/pages/GigBuilder'));
const LiveMode = lazy(() => import('@/pages/LiveMode'));
const SharedView = lazy(() => import('@/pages/SharedView'));
const PrintView = lazy(() => import('@/pages/PrintView'));
const Login = lazy(() => import('@/pages/Login'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'hsl(240,15%,5%)' }}>
      <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4" style={{ background: 'hsl(240,15%,5%)' }}>
      <h1 className="text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>404</h1>
      <p className="text-gray-400">Page not found</p>
      <Link to="/" className="text-amber-500 hover:underline text-sm">Go to Dashboard</Link>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 p-6" style={{ background: 'hsl(240,15%,5%)' }}>
          <h1 className="text-2xl font-bold text-red-400" style={{ fontFamily: 'Syne, sans-serif' }}>Something went wrong</h1>
          <p className="text-gray-400 text-sm text-center max-w-md">{this.state.error?.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
            className="text-amber-500 hover:underline text-sm"
          >Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Suspense fallback={<LoadingSpinner />}><Login /></Suspense>;
  return <>{children}</>;
}

export default function App() {
  useEffect(() => { initAuth(); }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public share route — no auth required */}
            <Route path="/share/:token" element={<SharedView />} />
            {/* All other routes require auth */}
            <Route element={<AuthGate><AppLayout /></AuthGate>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/library" element={<SongLibrary />} />
              <Route path="/gig/:gigId" element={<GigBuilder />} />
            </Route>
            <Route path="/gig/:gigId/live" element={<AuthGate><LiveMode /></AuthGate>} />
            <Route path="/gig/:gigId/print" element={<AuthGate><PrintView /></AuthGate>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
