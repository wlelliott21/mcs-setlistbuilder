import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/lib/toast';
import {
  fetchMyCollaborators,
  fetchInvitationsForMe,
  inviteCollaborator,
  acceptInvitation,
  declineInvitation,
  removeCollaborator,
} from '@/lib/collaborators';
import type { Collaborator } from '@/types';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    accepted: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    declined: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${colors[status] || 'border-border text-muted-foreground'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function Collaborators() {
  const { user } = useAuth();
  const [myCollaborators, setMyCollaborators] = useState<Collaborator[]>([]);
  const [invitations, setInvitations] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [collabs, invites] = await Promise.all([
        fetchMyCollaborators(user.id),
        fetchInvitationsForMe(user.email),
      ]);
      setMyCollaborators(collabs);
      // Filter out invitations that are from ourselves (we don't show our own sent invites here)
      setInvitations(invites.filter((inv) => inv.ownerId !== user.id));
    } catch (err: any) {
      console.error('Failed to load collaborators:', err);
      showToast('Failed to load collaborators', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleInvite = async () => {
    if (!user) return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    if (trimmed === user.email.toLowerCase()) {
      showToast("You can't invite yourself", 'error');
      return;
    }
    setSending(true);
    try {
      const collab = await inviteCollaborator(user.id, trimmed);
      setMyCollaborators((prev) => [collab, ...prev]);
      setEmail('');
      showToast(`Invitation sent to ${trimmed}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to send invitation', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (inv: Collaborator) => {
    if (!user) return;
    setActionLoading(inv.id);
    try {
      await acceptInvitation(inv.id, user.id);
      setInvitations((prev) => prev.map((i) => (i.id === inv.id ? { ...i, status: 'accepted' } : i)));
      showToast(`You now have access to ${inv.ownerName}'s library`);
    } catch (err: any) {
      showToast(err.message || 'Failed to accept', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (inv: Collaborator) => {
    setActionLoading(inv.id);
    try {
      await declineInvitation(inv.id);
      setInvitations((prev) => prev.map((i) => (i.id === inv.id ? { ...i, status: 'declined' } : i)));
      showToast('Invitation declined');
    } catch (err: any) {
      showToast(err.message || 'Failed to decline', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (collab: Collaborator) => {
    setActionLoading(collab.id);
    try {
      await removeCollaborator(collab.id);
      setMyCollaborators((prev) => prev.filter((c) => c.id !== collab.id));
      showToast('Collaborator removed');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 sm:pb-6 max-w-3xl">
      <div>
        <h1 className="font-bold text-lg sm:text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>Collaborators</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Invite others to view, edit, and manage your songs and gigs.</p>
      </div>

      {/* Invite form */}
      <div className="border border-border rounded-xl p-4 bg-card space-y-3">
        <h2 className="font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Invite a Collaborator</h2>
        <p className="text-xs text-muted-foreground">They will receive access to your song library and gigs once they accept.</p>
        <div className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="collaborator@email.com"
            className="flex-1 h-10"
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
          />
          <Button onClick={handleInvite} disabled={sending} className="h-10 min-w-[44px]">
            {sending ? 'Sending…' : 'Invite'}
          </Button>
        </div>
      </div>

      {/* Received invitations */}
      {invitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Invitations Received</h2>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="border border-border rounded-xl p-4 bg-card flex items-center gap-3 flex-wrap">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {inv.ownerName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.ownerName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{inv.ownerEmail}</p>
                </div>
                <StatusBadge status={inv.status} />
                {inv.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <Button size="sm" className="h-8 text-xs min-w-[44px]" onClick={() => handleAccept(inv)} disabled={actionLoading === inv.id}>
                      Accept
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs min-w-[44px]" onClick={() => handleDecline(inv)} disabled={actionLoading === inv.id}>
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My collaborators (people I invited) */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
          People with Access to Your Library
          {myCollaborators.length > 0 && <span className="text-muted-foreground font-normal ml-2">({myCollaborators.length})</span>}
        </h2>
        {myCollaborators.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <p className="text-2xl mb-2 opacity-30">👥</p>
            <p className="text-sm text-muted-foreground">No collaborators yet. Invite someone above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myCollaborators.map((collab) => (
              <div key={collab.id} className="border border-border rounded-xl p-4 bg-card flex items-center gap-3 flex-wrap">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {(collab.collaboratorName || collab.collaboratorEmail).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{collab.collaboratorName || collab.collaboratorEmail}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{collab.collaboratorEmail}</p>
                </div>
                <StatusBadge status={collab.status} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:text-destructive min-w-[44px]"
                  onClick={() => handleRemove(collab)}
                  disabled={actionLoading === collab.id}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
