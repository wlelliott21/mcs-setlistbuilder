import { supabase } from '@/lib/supabase';
import type { Collaborator } from '@/types';

/** Fetch all collaborators where the current user is the owner (people I invited) */
export async function fetchMyCollaborators(userId: string): Promise<Collaborator[]> {
  const { data, error } = await supabase
    .from('collaborators')
    .select('*, collaborator:user_profiles!collaborators_collaborator_id_fkey(username, email), owner:user_profiles!collaborators_owner_id_fkey(username, email)')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    ownerId: row.owner_id,
    ownerEmail: row.owner?.email || '',
    ownerName: row.owner?.username || row.owner?.email?.split('@')[0] || '',
    collaboratorId: row.collaborator_id,
    collaboratorEmail: row.collaborator_email,
    collaboratorName: row.collaborator?.username || row.collaborator?.email?.split('@')[0] || null,
    status: row.status,
    createdAt: row.created_at,
  }));
}

/** Fetch invitations sent to the current user (where I'm the collaborator) */
export async function fetchInvitationsForMe(userEmail: string): Promise<Collaborator[]> {
  const { data, error } = await supabase
    .from('collaborators')
    .select('*, owner:user_profiles!collaborators_owner_id_fkey(username, email)')
    .eq('collaborator_email', userEmail)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    ownerId: row.owner_id,
    ownerEmail: row.owner?.email || '',
    ownerName: row.owner?.username || row.owner?.email?.split('@')[0] || '',
    collaboratorId: row.collaborator_id,
    collaboratorEmail: row.collaborator_email,
    collaboratorName: null,
    status: row.status,
    createdAt: row.created_at,
  }));
}

/** Send invitation email via Edge Function (fire-and-forget) */
async function sendInviteEmail(inviteeEmail: string, ownerName: string, ownerEmail: string) {
  try {
    const { error } = await supabase.functions.invoke('send-invite-email', {
      body: { inviteeEmail, ownerName, ownerEmail },
    });
    if (error) console.error('Failed to send invite email:', error);
    else console.log('Invite email sent to', inviteeEmail);
  } catch (err) {
    console.error('Email notification error:', err);
  }
}

/** Invite a collaborator by email */
export async function inviteCollaborator(ownerId: string, email: string, ownerName?: string, ownerEmail?: string): Promise<Collaborator> {
  // First check if the user exists in user_profiles
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('id, username, email')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  const insertData: any = {
    owner_id: ownerId,
    collaborator_email: email.toLowerCase().trim(),
    status: 'pending',
  };

  if (existingUser) {
    insertData.collaborator_id = existingUser.id;
  }

  const { data, error } = await supabase
    .from('collaborators')
    .insert(insertData)
    .select('*, owner:user_profiles!collaborators_owner_id_fkey(username, email)')
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('This user has already been invited');
    throw error;
  }

  const result: Collaborator = {
    id: data.id,
    ownerId: data.owner_id,
    ownerEmail: data.owner?.email || '',
    ownerName: data.owner?.username || '',
    collaboratorId: data.collaborator_id,
    collaboratorEmail: data.collaborator_email,
    collaboratorName: existingUser?.username || null,
    status: data.status,
    createdAt: data.created_at,
  };

  // Fire-and-forget email notification
  if (ownerName && ownerEmail) {
    sendInviteEmail(email, ownerName, ownerEmail);
  }

  return result;
}

/** Accept an invitation */
export async function acceptInvitation(invitationId: string, userId: string) {
  const { error } = await supabase
    .from('collaborators')
    .update({ status: 'accepted', collaborator_id: userId, updated_at: new Date().toISOString() })
    .eq('id', invitationId);
  if (error) throw error;
}

/** Decline an invitation */
export async function declineInvitation(invitationId: string) {
  const { error } = await supabase
    .from('collaborators')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('id', invitationId);
  if (error) throw error;
}

/** Remove a collaborator (owner action) */
export async function removeCollaborator(invitationId: string) {
  const { error } = await supabase
    .from('collaborators')
    .delete()
    .eq('id', invitationId);
  if (error) throw error;
}

/** Get workspaces the user has access to (accepted collaborations where they are collaborator) */
export async function fetchAccessibleWorkspaces(userEmail: string): Promise<{ ownerId: string; ownerName: string }[]> {
  const { data, error } = await supabase
    .from('collaborators')
    .select('owner_id, owner:user_profiles!collaborators_owner_id_fkey(username, email)')
    .eq('collaborator_email', userEmail)
    .eq('status', 'accepted');
  if (error) throw error;

  return (data || []).map((row: any) => ({
    ownerId: row.owner_id,
    ownerName: row.owner?.username || row.owner?.email?.split('@')[0] || 'Unknown',
  }));
}
