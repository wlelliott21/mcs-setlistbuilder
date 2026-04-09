import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useSongStore } from '@/stores/songStore';
import { useGigStore } from '@/stores/gigStore';
import { fetchSongs, fetchGigs } from '@/lib/db';

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { user } = useAuth();
  const setSongs = useSongStore((s) => s.setSongs);
  const setGigs = useGigStore((s) => s.setGigs);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    async function load() {
      try {
        const [songs, gigs] = await Promise.all([
          fetchSongs(user!.id),
          fetchGigs(user!.id),
        ]);
        if (mounted) {
          setSongs(songs);
          setGigs(gigs);
          setDataLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
        if (mounted) setDataLoaded(true);
      }
    }
    load();
    return () => { mounted = false; };
  }, [user, setSongs, setGigs]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!dataLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden lg:flex w-64 flex-col border-r border-border shrink-0">
        <Sidebar />
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
          <button onClick={() => setOpen(true)} className="p-2.5 -ml-1 active:bg-accent hover:bg-accent rounded-md min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Setlist Builder</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/80" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-background border-r border-border shadow-lg" onClick={(e) => e.stopPropagation()}>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
