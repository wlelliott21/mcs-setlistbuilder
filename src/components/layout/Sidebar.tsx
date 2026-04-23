import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useGigStore } from '@/stores/gigStore';
import { useAuth, signOut } from '@/hooks/useAuth';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { fetchAccessibleWorkspaces } from '@/lib/collaborators';
import { showToast } from '@/lib/toast';

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const gigs = useGigStore((s) => s.gigs);
  const { user, logout } = useAuth();
  const { activeOwnerId, activeOwnerName, isOwnWorkspace, setWorkspace } = useWorkspaceStore();
  const [workspaces, setWorkspaces] = useState<{ ownerId: string; ownerName: string }[]>([]);
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    if (!user) return;
    try {
      const ws = await fetchAccessibleWorkspaces(user.email);
      setWorkspaces(ws);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  }, [user]);

  useEffect(() => { loadWorkspaces(); }, [loadWorkspaces]);

  // Initialize workspace to own on first load
  useEffect(() => {
    if (user && !activeOwnerId) {
      setWorkspace(user.id, user.username, true);
    }
  }, [user, activeOwnerId, setWorkspace]);

  const handleSignOut = async () => {
    try {
      await signOut();
      logout();
    } catch (err: any) {
      showToast(err.message || 'Sign out failed', 'error');
    }
  };

  const switchWorkspace = (ownerId: string, ownerName: string, isOwn: boolean) => {
    setWorkspace(ownerId, ownerName, isOwn);
    setShowWorkspacePicker(false);
    navigate('/');
    onNavigate?.();
  };

  const navItem = (to: string, label: string, badge?: number) => {
    const active = location.pathname === to;
    return (
      <Link to={to} onClick={onNavigate}
        className={cn('flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] lg:min-h-0', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground active:text-foreground hover:text-foreground active:bg-accent hover:bg-accent')}>
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

      {/* Workspace Switcher */}
      {(workspaces.length > 0 || !isOwnWorkspace) && (
        <div className="px-3 pb-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWorkspacePicker(!showWorkspacePicker)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-medium transition-colors hover:bg-accent min-h-[44px]"
            >
              <div className={cn('w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0', isOwnWorkspace ? 'bg-primary/15 text-primary' : 'bg-violet-500/15 text-violet-400')}>
                {(activeOwnerName || '?').charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 text-left truncate">
                {isOwnWorkspace ? 'My Library' : `${activeOwnerName}'s Library`}
              </span>
              <span className="text-muted-foreground text-xs">▾</span>
            </button>
            {showWorkspacePicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowWorkspacePicker(false)} />
                <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg p-1 max-h-64 overflow-y-auto">
                  {/* Own workspace */}
                  <button
                    type="button"
                    onClick={() => user && switchWorkspace(user.id, user.username, true)}
                    className={cn('w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-colors min-h-[40px]', isOwnWorkspace ? 'bg-accent font-semibold' : 'hover:bg-accent')}
                  >
                    <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                      {user?.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">My Library</span>
                  </button>
                  {workspaces.length > 0 && <div className="h-px bg-border my-1" />}
                  {workspaces.map((ws) => (
                    <button
                      key={ws.ownerId}
                      type="button"
                      onClick={() => switchWorkspace(ws.ownerId, ws.ownerName, false)}
                      className={cn('w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-colors min-h-[40px]', activeOwnerId === ws.ownerId && !isOwnWorkspace ? 'bg-accent font-semibold' : 'hover:bg-accent')}
                    >
                      <div className="w-5 h-5 rounded-md bg-violet-500/15 flex items-center justify-center text-[9px] font-bold text-violet-400 shrink-0">
                        {ws.ownerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{ws.ownerName}'s Library</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="h-px bg-border" />
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItem('/', 'Dashboard')}
        {navItem('/library', 'Song Library')}
        {navItem('/collaborators', 'Collaborators')}
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
                className={cn('flex items-center gap-2 px-3 py-3 lg:py-2 rounded-lg text-sm transition-colors min-h-[44px] lg:min-h-0', active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground active:text-foreground hover:text-foreground active:bg-accent hover:bg-accent')}>
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
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button onClick={handleSignOut}
          className="w-full text-xs h-10 lg:h-8 rounded-md font-medium text-muted-foreground active:text-foreground hover:text-foreground active:bg-accent hover:bg-accent transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}
