import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useGigStore } from '@/stores/gigStore';
import { useAuth, signOut } from '@/hooks/useAuth';
import { showToast } from '@/lib/toast';

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const gigs = useGigStore((s) => s.gigs);
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      logout();
    } catch (err: any) {
      showToast(err.message || 'Sign out failed', 'error');
    }
  };

  const navItem = (to: string, label: string, badge?: number) => {
    const active = location.pathname === to;
    return (
      <Link to={to} onClick={onNavigate}
        className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}>
        <span className="flex-1">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-mono">{badge}</span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <span className="text-primary text-sm">♪</span>
        </div>
        <span className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Setlist Builder</span>
      </div>
      <div className="h-px bg-border" />
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItem('/', 'Dashboard')}
        {navItem('/library', 'Song Library')}
        <div className="pt-5 pb-2">
          <p className="text-[11px] font-semibold text-muted-foreground px-3 uppercase tracking-widest">Gigs</p>
        </div>
        {gigs.length === 0 && <p className="text-xs text-muted-foreground px-3 py-2">No gigs yet</p>}
        {gigs
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((gig) => {
            const active = location.pathname === `/gig/${gig.id}`;
            return (
              <Link key={gig.id} to={`/gig/${gig.id}`} onClick={onNavigate}
                className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors', active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}>
                <span className="truncate flex-1">{gig.name}</span>
                {gig.isLocked && <span className="text-amber-400 text-xs">🔒</span>}
              </Link>
            );
          })}
      </nav>
      <div className="h-px bg-border" />
      <div className="p-3 space-y-2">
        {user && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button onClick={handleSignOut}
          className="w-full text-xs h-8 rounded-md font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}
