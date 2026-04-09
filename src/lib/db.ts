import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import type { Song, SongVersion, Gig, GigSet, SetlistEntry } from '@/types';

// Anonymous client for public shared views — no auth session interference
const anonClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ── SONGS ──────────────────────────────────────────────────

export async function fetchSongs(userId: string): Promise<Song[]> {
  const { data: songRows, error } = await supabase
    .from('songs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const songIds = (songRows || []).map((s: any) => s.id);
  let versionRows: any[] = [];
  if (songIds.length > 0) {
    const { data, error: vErr } = await supabase
      .from('song_versions')
      .select('*')
      .in('song_id', songIds);
    if (vErr) throw vErr;
    versionRows = data || [];
  }

  return (songRows || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    defaultKey: row.default_key,
    defaultDuration: row.default_duration,
    audioLink: row.audio_link || '',
    chartLink: row.chart_link || '',
    boardTapeLink: row.board_tape_link || '',
    choreoVideoLink: row.choreo_video_link || '',
    notes: row.notes || '',
    tags: (row.tags || []) as Song['tags'],
    versions: versionRows
      .filter((v: any) => v.song_id === row.id)
      .map((v: any) => ({
        id: v.id,
        name: v.name,
        key: v.key_override || undefined,
        duration: v.duration_override || undefined,
        notes: v.notes_override || undefined,
      })),
    createdAt: row.created_at,
  }));
}

export async function createSong(userId: string, song: Omit<Song, 'id' | 'createdAt'>): Promise<Song> {
  const { data, error } = await supabase
    .from('songs')
    .insert({
      user_id: userId,
      title: song.title,
      artist: song.artist,
      default_key: song.defaultKey,
      default_duration: song.defaultDuration,
      audio_link: song.audioLink || null,
      chart_link: song.chartLink || null,
      board_tape_link: song.boardTapeLink || null,
      choreo_video_link: song.choreoVideoLink || null,
      notes: song.notes || null,
      tags: song.tags,
    })
    .select()
    .single();
  if (error) throw error;

  let versions: SongVersion[] = [];
  if (song.versions && song.versions.length > 0) {
    const { data: vData, error: vErr } = await supabase
      .from('song_versions')
      .insert(
        song.versions.map((v) => ({
          song_id: data.id,
          name: v.name,
          key_override: v.key || null,
          duration_override: v.duration || null,
          notes_override: v.notes || null,
        }))
      )
      .select();
    if (vErr) throw vErr;
    versions = (vData || []).map((v: any) => ({
      id: v.id,
      name: v.name,
      key: v.key_override || undefined,
      duration: v.duration_override || undefined,
      notes: v.notes_override || undefined,
    }));
  }

  return {
    id: data.id,
    title: data.title,
    artist: data.artist,
    defaultKey: data.default_key,
    defaultDuration: data.default_duration,
    audioLink: data.audio_link || '',
    chartLink: data.chart_link || '',
    boardTapeLink: data.board_tape_link || '',
    choreoVideoLink: data.choreo_video_link || '',
    notes: data.notes || '',
    tags: data.tags as Song['tags'],
    versions,
    createdAt: data.created_at,
  };
}

export async function updateSongDb(songId: string, updates: Partial<Song>) {
  const dbUpdates: any = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.artist !== undefined) dbUpdates.artist = updates.artist;
  if (updates.defaultKey !== undefined) dbUpdates.default_key = updates.defaultKey;
  if (updates.defaultDuration !== undefined) dbUpdates.default_duration = updates.defaultDuration;
  if (updates.audioLink !== undefined) dbUpdates.audio_link = updates.audioLink || null;
  if (updates.chartLink !== undefined) dbUpdates.chart_link = updates.chartLink || null;
  if (updates.boardTapeLink !== undefined) dbUpdates.board_tape_link = updates.boardTapeLink || null;
  if (updates.choreoVideoLink !== undefined) dbUpdates.choreo_video_link = updates.choreoVideoLink || null;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

  if (Object.keys(dbUpdates).length > 0) {
    const { error } = await supabase.from('songs').update(dbUpdates).eq('id', songId);
    if (error) throw error;
  }

  if (updates.versions !== undefined) {
    // Delete existing versions and re-insert
    await supabase.from('song_versions').delete().eq('song_id', songId);
    if (updates.versions.length > 0) {
      const { error: vErr } = await supabase
        .from('song_versions')
        .insert(
          updates.versions.map((v) => ({
            song_id: songId,
            name: v.name,
            key_override: v.key || null,
            duration_override: v.duration || null,
            notes_override: v.notes || null,
          }))
        );
      if (vErr) throw vErr;
    }
  }
}

export async function deleteSongDb(songId: string) {
  const { error } = await supabase.from('songs').delete().eq('id', songId);
  if (error) throw error;
}

// ── GIGS ──────────────────────────────────────────────────

export async function fetchGigs(userId: string): Promise<Gig[]> {
  const { data: gigRows, error } = await supabase
    .from('gigs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw error;

  const gigIds = (gigRows || []).map((g: any) => g.id);
  if (gigIds.length === 0) return [];

  const { data: setRows, error: sErr } = await supabase
    .from('gig_sets')
    .select('*')
    .in('gig_id', gigIds)
    .order('sort_order', { ascending: true });
  if (sErr) throw sErr;

  const setIds = (setRows || []).map((s: any) => s.id);
  let entryRows: any[] = [];
  if (setIds.length > 0) {
    const { data, error: eErr } = await supabase
      .from('setlist_entries')
      .select('*')
      .in('set_id', setIds)
      .order('sort_order', { ascending: true });
    if (eErr) throw eErr;
    entryRows = data || [];
  }

  return (gigRows || []).map((row: any) => {
    const gigSets = (setRows || [])
      .filter((s: any) => s.gig_id === row.id)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        targetDuration: s.target_duration,
        entries: entryRows
          .filter((e: any) => e.set_id === s.id)
          .map((e: any) => ({
            id: e.id,
            songId: e.song_id,
            versionId: e.version_id || undefined,
            keyOverride: e.key_override || undefined,
          })),
        collapsed: false,
      }));

    return {
      id: row.id,
      name: row.name,
      date: row.date,
      venue: row.venue,
      client: row.client || undefined,
      notes: row.notes || undefined,
      bufferTime: row.buffer_time,
      isLocked: row.is_locked,
      shareToken: row.share_token,
      createdAt: row.created_at,
      sets: gigSets,
    };
  });
}

export async function createGig(
  userId: string,
  gig: { name: string; date: string; venue: string; client?: string; notes?: string; bufferTime: number; sets: { name: string; targetDuration: number; entries?: { songId: string; versionId?: string; keyOverride?: string }[] }[] }
): Promise<Gig> {
  const { data: gigRow, error } = await supabase
    .from('gigs')
    .insert({
      user_id: userId,
      name: gig.name,
      date: gig.date,
      venue: gig.venue,
      client: gig.client || null,
      notes: gig.notes || null,
      buffer_time: gig.bufferTime,
    })
    .select()
    .single();
  if (error) throw error;

  const sets: GigSet[] = [];
  for (let i = 0; i < gig.sets.length; i++) {
    const setData = gig.sets[i];
    const { data: setRow, error: sErr } = await supabase
      .from('gig_sets')
      .insert({
        gig_id: gigRow.id,
        name: setData.name,
        target_duration: setData.targetDuration,
        sort_order: i,
      })
      .select()
      .single();
    if (sErr) throw sErr;

    let entries: SetlistEntry[] = [];
    if (setData.entries && setData.entries.length > 0) {
      const { data: entryData, error: eErr } = await supabase
        .from('setlist_entries')
        .insert(
          setData.entries.map((e, ei) => ({
            set_id: setRow.id,
            song_id: e.songId,
            version_id: e.versionId || null,
            key_override: e.keyOverride || null,
            sort_order: ei,
          }))
        )
        .select();
      if (eErr) throw eErr;
      entries = (entryData || []).map((e: any) => ({
        id: e.id,
        songId: e.song_id,
        versionId: e.version_id || undefined,
        keyOverride: e.key_override || undefined,
      }));
    }

    sets.push({
      id: setRow.id,
      name: setRow.name,
      targetDuration: setRow.target_duration,
      entries,
      collapsed: false,
    });
  }

  return {
    id: gigRow.id,
    name: gigRow.name,
    date: gigRow.date,
    venue: gigRow.venue,
    client: gigRow.client || undefined,
    notes: gigRow.notes || undefined,
    bufferTime: gigRow.buffer_time,
    isLocked: gigRow.is_locked,
    shareToken: gigRow.share_token,
    createdAt: gigRow.created_at,
    sets,
  };
}

export async function updateGigDb(gigId: string, updates: { name?: string; date?: string; venue?: string; client?: string; notes?: string; buffer_time?: number; is_locked?: boolean }) {
  const { error } = await supabase.from('gigs').update(updates).eq('id', gigId);
  if (error) throw error;
}

export async function deleteGigDb(gigId: string) {
  const { error } = await supabase.from('gigs').delete().eq('id', gigId);
  if (error) throw error;
}

// ── SETS ──────────────────────────────────────────────────

export async function addSetDb(gigId: string, name: string, targetDuration: number, sortOrder: number): Promise<GigSet> {
  const { data, error } = await supabase
    .from('gig_sets')
    .insert({ gig_id: gigId, name, target_duration: targetDuration, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, targetDuration: data.target_duration, entries: [], collapsed: false };
}

export async function updateSetDb(setId: string, updates: { name?: string; target_duration?: number }) {
  const { error } = await supabase.from('gig_sets').update(updates).eq('id', setId);
  if (error) throw error;
}

export async function deleteSetDb(setId: string) {
  const { error } = await supabase.from('gig_sets').delete().eq('id', setId);
  if (error) throw error;
}

// ── SETLIST ENTRIES ──────────────────────────────────────

export async function addEntryDb(setId: string, songId: string, sortOrder: number, versionId?: string, keyOverride?: string): Promise<SetlistEntry> {
  const { data, error } = await supabase
    .from('setlist_entries')
    .insert({
      set_id: setId,
      song_id: songId,
      version_id: versionId || null,
      key_override: keyOverride || null,
      sort_order: sortOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, songId: data.song_id, versionId: data.version_id || undefined, keyOverride: data.key_override || undefined };
}

export async function updateEntryDb(entryId: string, updates: { version_id?: string | null; key_override?: string | null; sort_order?: number }) {
  const { error } = await supabase.from('setlist_entries').update(updates).eq('id', entryId);
  if (error) throw error;
}

export async function deleteEntryDb(entryId: string) {
  const { error } = await supabase.from('setlist_entries').delete().eq('id', entryId);
  if (error) throw error;
}

export async function reorderEntriesDb(entries: { id: string; sort_order: number }[]) {
  for (const entry of entries) {
    await supabase.from('setlist_entries').update({ sort_order: entry.sort_order }).eq('id', entry.id);
  }
}

export async function moveEntryToSetDb(entryId: string, newSetId: string, sortOrder: number) {
  const { error } = await supabase
    .from('setlist_entries')
    .update({ set_id: newSetId, sort_order: sortOrder })
    .eq('id', entryId);
  if (error) throw error;
}

// ── SHARED GIG (PUBLIC) ──────────────────────────────────

export async function fetchSharedGig(shareToken: string): Promise<{ gig: Gig; songs: Song[] } | null> {
  // Use anonymous client to avoid session/auth interference for public access
  const client = anonClient;

  const { data: gigRow, error } = await client
    .from('gigs')
    .select('*')
    .eq('share_token', shareToken)
    .single();
  if (error || !gigRow) return null;

  const { data: setRows } = await client
    .from('gig_sets')
    .select('*')
    .eq('gig_id', gigRow.id)
    .order('sort_order', { ascending: true });

  const setIds = (setRows || []).map((s: any) => s.id);
  let entryRows: any[] = [];
  if (setIds.length > 0) {
    const { data } = await client
      .from('setlist_entries')
      .select('*')
      .in('set_id', setIds)
      .order('sort_order', { ascending: true });
    entryRows = data || [];
  }

  const songIds = [...new Set(entryRows.map((e: any) => e.song_id))];
  let songRows: any[] = [];
  let versionRows: any[] = [];
  if (songIds.length > 0) {
    const { data: sData } = await client.from('songs').select('*').in('id', songIds);
    songRows = sData || [];
    const versionIds = entryRows.map((e: any) => e.version_id).filter(Boolean);
    if (versionIds.length > 0) {
      const { data: vData } = await client.from('song_versions').select('*').in('id', versionIds);
      versionRows = vData || [];
    }
  }

  const songs: Song[] = songRows.map((row: any) => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    defaultKey: row.default_key,
    defaultDuration: row.default_duration,
    audioLink: row.audio_link || '',
    chartLink: row.chart_link || '',
    boardTapeLink: row.board_tape_link || '',
    choreoVideoLink: row.choreo_video_link || '',
    notes: row.notes || '',
    tags: row.tags || [],
    versions: versionRows
      .filter((v: any) => v.song_id === row.id)
      .map((v: any) => ({ id: v.id, name: v.name, key: v.key_override || undefined, duration: v.duration_override || undefined, notes: v.notes_override || undefined })),
    createdAt: row.created_at,
  }));

  const gig: Gig = {
    id: gigRow.id,
    name: gigRow.name,
    date: gigRow.date,
    venue: gigRow.venue,
    client: gigRow.client || undefined,
    notes: gigRow.notes || undefined,
    bufferTime: gigRow.buffer_time,
    isLocked: gigRow.is_locked,
    shareToken: gigRow.share_token,
    createdAt: gigRow.created_at,
    sets: (setRows || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      targetDuration: s.target_duration,
      entries: entryRows
        .filter((e: any) => e.set_id === s.id)
        .map((e: any) => ({ id: e.id, songId: e.song_id, versionId: e.version_id || undefined, keyOverride: e.key_override || undefined })),
      collapsed: false,
    })),
  };

  return { gig, songs };
}
