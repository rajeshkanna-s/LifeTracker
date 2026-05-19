import React, { useState, useEffect, useRef } from 'react';
import { StickyNote, Plus, Trash2, Pencil, Pin, PinOff, Search, Clock, X, Save, ChevronRight, BookOpen, FileText, Star, StarOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DailyNote {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  tags: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '🤔', label: 'Thoughtful' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🔥', label: 'Motivated' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🎉', label: 'Excited' },
  { emoji: '💡', label: 'Inspired' },
];

const NOTE_COLORS = [
  '#7c3aed', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'
];

const NotesTracker: React.FC = () => {
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState<DailyNote | null>(null);
  const [sidebarView, setSidebarView] = useState<'all' | 'pinned' | 'recent'>('all');
  const [quickNote, setQuickNote] = useState('');

  const [form, setForm] = useState({
    title: '', content: '', mood: '', tags: '',
    date: new Date().toISOString().split('T')[0],
  });

  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('daily_notes').select('*')
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });
    if (data) setNotes(data);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ title: '', content: '', mood: '', tags: '', date: new Date().toISOString().split('T')[0] });
    setEditId(null);
  };

  const openEditor = (note?: DailyNote) => {
    if (note) {
      setForm({ title: note.title, content: note.content, mood: note.mood || '', tags: note.tags || '', date: note.date });
      setEditId(note.id);
    } else { resetForm(); }
    setShowEditor(true);
    setTimeout(() => contentRef.current?.focus(), 200);
  };

  const handleSave = async () => {
    if (!form.content.trim() && !form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      mood: form.mood, tags: form.tags.trim(),
      date: form.date, updated_at: new Date().toISOString(),
    };
    if (editId) { await supabase.from('daily_notes').update(payload).eq('id', editId); }
    else { await supabase.from('daily_notes').insert(payload); }
    setShowEditor(false); resetForm(); fetchNotes();
  };

  const handleQuickSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickNote.trim()) return;
    const payload = {
      title: '',
      content: quickNote.trim(),
      date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    };
    await supabase.from('daily_notes').insert(payload);
    setQuickNote('');
    fetchNotes();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('daily_notes').delete().eq('id', id);
    if (selectedNote?.id === id) setSelectedNote(null);
    fetchNotes();
  };

  const togglePin = async (note: DailyNote, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('daily_notes').update({ is_pinned: !note.is_pinned, updated_at: new Date().toISOString() }).eq('id', note.id);
    fetchNotes();
  };

  // Filtering
  const filtered = notes.filter(n => {
    const matchSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.toLowerCase().includes(search.toLowerCase());
    if (sidebarView === 'pinned') return matchSearch && n.is_pinned;
    if (sidebarView === 'recent') {
      const diff = (Date.now() - new Date(n.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      return matchSearch && diff <= 7;
    }
    return matchSearch;
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getColor = (title: string) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
    return NOTE_COLORS[Math.abs(hash) % NOTE_COLORS.length];
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="notes-app">
      {/* ── Sidebar ── */}
      <div className="notes-sidebar">
        <button onClick={() => openEditor()} className="notes-sidebar-btn notes-new-btn">
          <div className="notes-sidebar-icon"><Plus size={18} /></div>
          <span>New</span>
        </button>
        <button onClick={() => setSidebarView('recent')} className={`notes-sidebar-btn ${sidebarView === 'recent' ? 'active' : ''}`}>
          <div className="notes-sidebar-icon"><Clock size={18} /></div>
          <span>Recent</span>
        </button>
        <button onClick={() => setSidebarView('pinned')} className={`notes-sidebar-btn ${sidebarView === 'pinned' ? 'active' : ''}`}>
          <div className="notes-sidebar-icon"><Pin size={18} /></div>
          <span>Pinned</span>
        </button>
        <button onClick={() => setSidebarView('all')} className={`notes-sidebar-btn ${sidebarView === 'all' ? 'active' : ''}`}>
          <div className="notes-sidebar-icon"><BookOpen size={18} /></div>
          <span>All</span>
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="notes-main">
        {/* Search Bar */}
        <div className="notes-search-bar">
          <Search size={15} className="notes-search-icon" />
          <input
            className="notes-search-input"
            placeholder="Search all notes..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="notes-search-clear"><X size={14} /></button>
          )}
          <div className="notes-count">{filtered.length} notes</div>
        </div>

        {/* Quick Add Bar */}
        <div className="notes-quick-add">
          <form onSubmit={handleQuickSave} className="notes-quick-form">
            <input
              type="text"
              className="notes-quick-input"
              placeholder="Write a quick note..."
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
            />
            <button type="submit" disabled={!quickNote.trim()} className="notes-quick-btn">
              <Plus size={16} /> <span>Add</span>
            </button>
          </form>
        </div>

        {/* Notes List */}
        {filtered.length === 0 ? (
          <div className="notes-empty">
            <div className="notes-empty-icon">📝</div>
            <h4>No notes found</h4>
            <p>{search ? 'Try a different search term' : 'Tap "New" to create your first note'}</p>
            {!search && (
              <button onClick={() => openEditor()} className="notes-empty-btn">
                <Plus size={16} /> Create Note
              </button>
            )}
          </div>
        ) : (
          <div className="notes-list">
            {filtered.map((note, i) => {
              const color = getColor(note.title || note.content || 'Note');
              const tags = note.tags ? note.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
              const isActive = selectedNote?.id === note.id;

              return (
                <div
                  key={note.id}
                  className={`notes-row ${isActive ? 'active' : ''} ${note.is_pinned ? 'pinned' : ''}`}
                  onClick={() => setSelectedNote(isActive ? null : note)}
                >
                  {/* Note Icon */}
                  <div className="notes-row-icon" style={{ background: `${color}15`, color }}>
                    <FileText size={20} />
                  </div>

                  {/* Note Info */}
                  <div className="notes-row-info">
                    <div className="notes-row-title">
                      {note.mood && <span className="notes-row-mood">{note.mood}</span>}
                      {note.title ? note.title : (note.content.length > 60 ? note.content.slice(0, 60) + '...' : note.content)}
                    </div>
                    {note.title && (
                      <div className="notes-row-subtitle">
                        {note.content.length > 60 ? note.content.slice(0, 60) + '...' : note.content || 'No content'}
                      </div>
                    )}
                    {tags.length > 0 && (
                      <div className="notes-row-tags">
                        {tags.slice(0, 3).map(t => <span key={t} className="notes-tag">#{t}</span>)}
                        {tags.length > 3 && <span className="notes-tag-more">+{tags.length - 3}</span>}
                      </div>
                    )}
                  </div>

                  {/* Right side: date + actions */}
                  <div className="notes-row-right">
                    <span className="notes-row-date">{formatDate(note.updated_at)}</span>
                    <div className="notes-row-actions">
                      <button onClick={(e) => togglePin(note, e)} className={`notes-action-btn ${note.is_pinned ? 'pinned' : ''}`} title={note.is_pinned ? 'Unpin' : 'Pin'}>
                        {note.is_pinned ? <PinOff size={13} /> : <Pin size={13} />}
                      </button>
                      <button onClick={() => { openEditor(note); }} className="notes-action-btn"><Pencil size={13} /></button>
                      <button onClick={(e) => handleDelete(note.id, e)} className="notes-action-btn delete"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Expanded Note Preview */}
        {selectedNote && (
          <div className="notes-preview">
            <div className="notes-preview-header">
              <div>
                {selectedNote.title && (
                  <h3 className="notes-preview-title">
                    {selectedNote.mood && <span>{selectedNote.mood} </span>}
                    {selectedNote.title}
                  </h3>
                )}
                <p className="notes-preview-meta">
                  {new Date(selectedNote.date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  {selectedNote.mood && ` · ${selectedNote.mood}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEditor(selectedNote)} className="notes-preview-edit">
                  <Pencil size={14} /> Edit
                </button>
                <button onClick={() => setSelectedNote(null)} className="notes-preview-close"><X size={16} /></button>
              </div>
            </div>
            <div className="notes-preview-body">
              <p className="whitespace-pre-wrap">{selectedNote.content}</p>
            </div>
            {selectedNote.tags && (
              <div className="notes-preview-tags">
                {selectedNote.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                  <span key={t} className="notes-tag">#{t}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Editor Modal ── */}
      {showEditor && (
        <div className="modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Note' : 'New Note'}</h3>
              <button className="modal-close" onClick={() => setShowEditor(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-control-custom" placeholder="Note title..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control-custom" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group full">
                  <label className="form-label">Your thoughts *</label>
                  <textarea
                    ref={contentRef} className="form-control-custom" rows={6}
                    placeholder="Write your thoughts, key notes, ideas..."
                    value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                    style={{ resize: 'vertical', minHeight: '130px', width: '100%' }}
                  />
                </div>
                <div className="form-group full">
                  <label className="form-label">Mood</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {MOODS.map(m => (
                      <button key={m.emoji} type="button"
                        onClick={() => setForm({ ...form, mood: form.mood === m.emoji ? '' : m.emoji })}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '6px 12px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600,
                          border: form.mood === m.emoji ? '2px solid #d97706' : '1px solid #e5e7eb',
                          background: form.mood === m.emoji ? '#fffbeb' : '#fafafa',
                          color: form.mood === m.emoji ? '#92400e' : '#6b7280',
                          cursor: 'pointer', transition: 'all 0.15s',
                          boxShadow: form.mood === m.emoji ? '0 2px 8px rgba(217,119,6,0.15)' : 'none',
                        }}
                      >{m.emoji} {m.label}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group full">
                  <label className="form-label">Tags (comma separated)</label>
                  <input className="form-control-custom" placeholder="e.g. work, personal, idea, important" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditor(false)}>Cancel</button>
              <button className="btn-submit amber" onClick={handleSave}>
                <Save size={14} /> {editId ? 'Update' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesTracker;
