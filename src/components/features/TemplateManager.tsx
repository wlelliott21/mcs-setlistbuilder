import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTemplateStore } from '@/stores/templateStore';
import { useSongStore } from '@/stores/songStore';
import { formatDuration } from '@/lib/helpers';
import { showToast } from '@/lib/toast';
import type { SetlistTemplate } from '@/types';
import { cn } from '@/lib/utils';

export default function TemplateManager() {
  const { templates, deleteTemplate, updateTemplate } = useTemplateStore();
  const songs = useSongStore((s) => s.songs);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startEdit = (t: SetlistTemplate) => { setEditingId(t.id); setEditName(t.name); setEditDesc(t.description || ''); };
  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateTemplate(editingId, { name: editName.trim(), description: editDesc.trim() || undefined });
    showToast('Template updated'); setEditingId(null);
  };
  const handleDelete = (id: string) => { deleteTemplate(id); showToast('Template deleted'); setConfirmDeleteId(null); if (expandedId === id) setExpandedId(null); };

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-xl">
        <p className="text-3xl mb-3 opacity-30">📋</p>
        <p className="text-sm text-muted-foreground mb-1">No setlist templates yet</p>
        <p className="text-xs text-muted-foreground/70">Open a gig and click "Save as Template" to create one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((t) => {
        const isExpanded = expandedId === t.id;
        const isEditing = editingId === t.id;
        const totalSongs = t.sets.reduce((a, s) => a + s.entries.length, 0);

        return (
          <div key={t.id} className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <button type="button" className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                {isExpanded ? '▼' : '▶'}
              </button>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 text-sm font-semibold" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveEdit()} />
                    <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description (optional)" className="h-7 text-xs" />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={saveEdit}>✓ Save</Button>
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="text-left w-full" onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                    <p className="font-bold text-sm truncate" style={{ fontFamily: 'Syne, sans-serif' }}>{t.name}</p>
                    {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
                  </button>
                )}
              </div>
              {!isEditing && (
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground font-mono">{t.sets.length} sets · {totalSongs} songs</span>
                  <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-muted-foreground text-xs" onClick={() => startEdit(t)}>✏️</button>
                  {confirmDeleteId === t.id ? (
                    <div className="flex items-center gap-1">
                      <Button variant="destructive" size="sm" className="h-6 text-xs" onClick={() => handleDelete(t.id)}>Delete</Button>
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setConfirmDeleteId(null)}>No</Button>
                    </div>
                  ) : (
                    <button className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-accent text-xs" onClick={() => setConfirmDeleteId(t.id)}>🗑️</button>
                  )}
                </div>
              )}
            </div>
            {isExpanded && !isEditing && (
              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/50">
                {t.sets.map((s, si) => {
                  const setDur = s.entries.reduce((a, e) => { const song = songs.find((x) => x.id === e.songId); return a + (song?.defaultDuration || 0); }, 0);
                  return (
                    <div key={si}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-foreground">{s.name}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{formatDuration(setDur)} / {s.targetDuration}m · {s.entries.length} songs</span>
                      </div>
                      {s.entries.length > 0 ? (
                        <div className="space-y-0.5">
                          {s.entries.map((entry, ei) => {
                            const song = songs.find((x) => x.id === entry.songId);
                            return (
                              <div key={ei} className="flex items-center gap-2 px-2 py-1 rounded text-xs bg-muted/30">
                                <span className="text-muted-foreground font-mono w-5 text-right">{ei + 1}</span>
                                <span className={cn('flex-1 truncate', !song && 'text-destructive')}>
                                  {song ? `${song.title} — ${song.artist}` : 'Unknown song (deleted)'}
                                </span>
                                {entry.keyOverride && <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[10px]">{entry.keyOverride}</span>}
                              </div>
                            );
                          })}
                        </div>
                      ) : <p className="text-[11px] text-muted-foreground italic px-2">Empty set</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
