import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  Circle,
  Plus,
  MoreVertical,
  Cloud,
  CloudCheck,
  Bell,
  Trash2,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePartner } from '../../context/PartnerContext';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
  completed_at?: string;
  due_date?: string;
  partner_id: string;
}

const STORAGE_KEY_PREFIX = 'xpenser_todos_';
const SYNC_BANNER_KEY = 'xpenser_todos_banner_dismissed';

export const TodosView: React.FC = () => {
  const { activePartnerId } = usePartner();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoDueDate, setNewTodoDueDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Initial load from localStorage & Supabase
  useEffect(() => {
    setTodos([]);
    const isDismissed = localStorage.getItem(`${SYNC_BANNER_KEY}_${activePartnerId}`) === 'true';
    setBannerDismissed(isDismissed);

    const savedAutoSync = localStorage.getItem(`xpenser_todos_autosync_${activePartnerId}`);
    if (savedAutoSync !== null) {
      setAutoSync(savedAutoSync === 'true');
    }

    loadTodos();
  }, [activePartnerId]);

  // Close 3-dots menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (showAddModal) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [showAddModal]);

  const loadTodos = async () => {
    setLoading(true);
    setTodos([]); // Immediate zero-state on partner change
    const storageKey = `${STORAGE_KEY_PREFIX}${activePartnerId}`;
    let localItems: TodoItem[] = [];
    const raw = localStorage.getItem(storageKey);
    const hasLocal = raw !== null;

    // 1. Try local storage first for 0ms render
    if (hasLocal) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          localItems = parsed.filter((t: TodoItem) => t && t.partner_id === activePartnerId);
          setTodos(localItems);
        }
      } catch (e) {
        console.warn('Failed to parse local todos', e);
      }
    }

    // 2. Sync from Supabase settings_json.notesTodos strictly for this activePartnerId
    try {
      setIsSyncing(true);
      const { data } = await supabase
        .from('expense_settings')
        .select('settings_json')
        .eq('partner_id', activePartnerId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (data?.settings_json?.notesTodos !== undefined && Array.isArray(data.settings_json.notesTodos)) {
        const cloudTodos: TodoItem[] = data.settings_json.notesTodos.filter(
          (t: any) => t && t.partner_id === activePartnerId
        );
        setTodos(cloudTodos);
        localStorage.setItem(storageKey, JSON.stringify(cloudTodos));
      } else if (!hasLocal) {
        setTodos([]);
        localStorage.setItem(storageKey, JSON.stringify([]));
      }
    } catch (err) {
      console.warn('Supabase todos sync fallback to localStorage', err);
    } finally {
      setIsSyncing(false);
      setLoading(false);
    }
  };

  const persistTodos = async (updated: TodoItem[]) => {
    const sanitized = updated
      .filter(t => t && (!t.partner_id || t.partner_id === activePartnerId))
      .map(t => ({ ...t, partner_id: activePartnerId }));

    setTodos(sanitized);
    const storageKey = `${STORAGE_KEY_PREFIX}${activePartnerId}`;
    localStorage.setItem(storageKey, JSON.stringify(sanitized));

    if (!autoSync) return;

    try {
      setIsSyncing(true);
      const { data: row } = await supabase
        .from('expense_settings')
        .select('*')
        .eq('partner_id', activePartnerId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (row) {
        const newSettings = { ...(row.settings_json || {}), notesTodos: sanitized };
        await supabase
          .from('expense_settings')
          .update({ settings_json: newSettings, updated_at: new Date().toISOString() })
          .eq('id', row.id)
          .eq('partner_id', activePartnerId);
      } else {
        await supabase
          .from('expense_settings')
          .insert({
            partner_id: activePartnerId,
            settings_json: { notesTodos: sanitized },
            updated_at: new Date().toISOString()
          });
      }
    } catch (err) {
      console.warn('Failed to sync todos to Supabase', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleComplete = (id: string) => {
    const updated = todos.map(t => {
      if (t.id === id) {
        const willBeComplete = !t.completed;
        return {
          ...t,
          completed: willBeComplete,
          completed_at: willBeComplete ? new Date().toISOString() : undefined
        };
      }
      return t;
    });
    persistTodos(updated);
  };

  const handleSaveTodo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTodoText.trim();
    if (!trimmed) return;

    if (editingTodo) {
      const updated = todos.map(t =>
        t.id === editingTodo.id
          ? { ...t, text: trimmed, due_date: newTodoDueDate || undefined }
          : t
      );
      persistTodos(updated);
      setEditingTodo(null);
    } else {
      const newItem: TodoItem = {
        id: 'todo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        text: trimmed,
        completed: false,
        created_at: new Date().toISOString(),
        due_date: newTodoDueDate || undefined,
        partner_id: activePartnerId
      };
      persistTodos([newItem, ...todos]);
    }

    setNewTodoText('');
    setNewTodoDueDate('');
    setShowDatePicker(false);
    setShowAddModal(false);
  };

  const handleOpenEdit = (todo: TodoItem) => {
    setEditingTodo(todo);
    setNewTodoText(todo.text);
    setNewTodoDueDate(todo.due_date || '');
    setShowAddModal(true);
  };

  const handleDeleteTodo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = todos.filter(t => t.id !== id);
    persistTodos(updated);
  };

  const handleClearCompleted = () => {
    const updated = todos.filter(t => !t.completed);
    persistTodos(updated);
    setMenuOpen(false);
  };

  const handleMarkAllComplete = () => {
    const allCompleted = todos.every(t => t.completed);
    const updated = todos.map(t => ({
      ...t,
      completed: !allCompleted,
      completed_at: !allCompleted ? new Date().toISOString() : undefined
    }));
    persistTodos(updated);
    setMenuOpen(false);
  };

  const handleToggleAutoSync = () => {
    const nextVal = !autoSync;
    setAutoSync(nextVal);
    localStorage.setItem(`xpenser_todos_autosync_${activePartnerId}`, String(nextVal));
    if (nextVal) {
      persistTodos(todos);
    }
    setMenuOpen(false);
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem(`${SYNC_BANNER_KEY}_${activePartnerId}`, 'true');
  };

  const handleTurnOnSync = () => {
    setAutoSync(true);
    localStorage.setItem(`xpenser_todos_autosync_${activePartnerId}`, 'true');
    setBannerDismissed(true);
    localStorage.setItem(`${SYNC_BANNER_KEY}_${activePartnerId}`, 'true');
    persistTodos(todos);
  };

  const activeTodos = todos.filter(t => t.partner_id === activePartnerId && !t.completed);
  const completedTodos = todos.filter(t => t.partner_id === activePartnerId && t.completed);
  const totalPartnerTodos = activeTodos.length + completedTodos.length;

  return (
    <div className="bg-white min-h-[500px] w-full rounded-2xl p-4 sm:p-6 transition-all">
      {/* ── Top Header (Exact Match to Screenshot) ── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
            To-dos
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1.5 flex items-center gap-1.5">
            <span>{totalPartnerTodos} to-dos</span>
            {isSyncing && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                <Cloud size={11} className="animate-pulse" /> Syncing...
              </span>
            )}
          </p>
        </div>

        {/* 3-dots Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition active:scale-95 cursor-pointer"
            aria-label="To-do options"
          >
            <MoreVertical size={20} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-40 text-xs font-semibold text-slate-700 animate-fadeIn">
              <button
                type="button"
                onClick={handleMarkAllComplete}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <CheckCheck size={14} className="text-amber-500" />
                <span>Toggle all complete</span>
              </button>
              {completedTodos.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCompleted}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Clear completed ({completedTodos.length})</span>
                </button>
              )}
              <div className="h-px bg-slate-100 my-1" />
              <button
                type="button"
                onClick={handleToggleAutoSync}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <Cloud size={14} className={autoSync ? 'text-emerald-500' : 'text-slate-400'} />
                <span>Auto sync: {autoSync ? 'On' : 'Off'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  loadTodos();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={14} className="text-amber-500" />
                <span>Sync with cloud now</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Auto Sync Banner (Exact Match to Screenshot) ── */}
      {!bannerDismissed && (
        <div className="mb-4 bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 transition shadow-xs">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <Cloud size={17} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-slate-700 leading-snug">
                Turn on Auto sync for Notes to keep your notes and to-dos secure across devices.
              </p>
              <div className="flex items-center justify-end gap-3 mt-2.5">
                <button
                  type="button"
                  onClick={handleDismissBanner}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleTurnOnSync}
                  className="text-xs font-extrabold text-amber-600 hover:text-amber-700 cursor-pointer"
                >
                  Turn on
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Active To-dos List ── */}
      <div className="space-y-2.5">
        {activeTodos.map(todo => (
          <div
            key={todo.id}
            onClick={() => handleToggleComplete(todo.id)}
            className="group bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 transition flex items-center gap-3.5 cursor-pointer shadow-xs active:scale-[0.99]"
          >
            {/* Uncompleted Round Checkbox */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleToggleComplete(todo.id);
              }}
              className="w-6 h-6 rounded-full border-2 border-slate-300 hover:border-amber-500 flex items-center justify-center shrink-0 transition-colors bg-white"
              aria-label="Mark completed"
            >
              <Circle size={14} className="text-transparent" />
            </button>

            {/* To-do Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[0.95rem] font-medium text-slate-850 leading-snug break-words">
                {todo.text}
              </p>
              {todo.due_date && (
                <div className="mt-1 flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                    <Calendar size={10} />
                    {new Date(todo.due_date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Actions on hover/touch */}
            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => handleOpenEdit(todo)}
                className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                title="Edit to-do"
                aria-label="Edit to-do"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={e => handleDeleteTodo(todo.id, e)}
                className="w-7 h-7 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                title="Delete to-do"
                aria-label="Delete to-do"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {activeTodos.length === 0 && (
          <div className="text-center py-8 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <span className="text-3xl mb-1 inline-block">✨</span>
            <p className="text-sm font-bold text-slate-700">All tasks completed!</p>
            <p className="text-xs text-slate-400 mt-0.5">Tap the + button below to add a new to-do</p>
          </div>
        )}
      </div>

      {/* ── Completed Section (Exact Match to Screenshot) ── */}
      {completedTodos.length > 0 && (
        <div className="mt-6 pt-3">
          <button
            type="button"
            onClick={() => setCompletedCollapsed(!completedCollapsed)}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 mb-2.5 px-1 cursor-pointer"
          >
            <span>Completed ({completedTodos.length})</span>
            {completedCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {!completedCollapsed && (
            <div className="space-y-2.5">
              {completedTodos.map(todo => (
                <div
                  key={todo.id}
                  onClick={() => handleToggleComplete(todo.id)}
                  className="group bg-slate-50/70 border border-slate-200/70 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 transition cursor-pointer active:scale-[0.99]"
                >
                  {/* Amber Checked Circle (Exact Match to Screenshot!) */}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleToggleComplete(todo.id);
                    }}
                    className="w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs transition"
                    aria-label="Mark uncompleted"
                  >
                    <Check size={14} strokeWidth={3} />
                  </button>

                  {/* Strikethrough Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.95rem] font-normal text-slate-400 line-through leading-snug break-words">
                      {todo.text}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={e => handleDeleteTodo(todo.id, e)}
                    className="w-7 h-7 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                    title="Delete to-do"
                    aria-label="Delete to-do"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Floating Action Button (FAB - Amber Circle with White +) ── */}
      <button
        type="button"
        onClick={() => {
          setEditingTodo(null);
          setNewTodoText('');
          setNewTodoDueDate('');
          setShowDatePicker(false);
          setShowAddModal(true);
        }}
        className="fixed bottom-24 right-5 sm:right-8 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-xl shadow-amber-500/35 flex items-center justify-center transition z-40 cursor-pointer"
        aria-label="Add new to-do"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* ── New To-Do Modal / Bottom Sheet (Screenshot 2) ── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 p-5 sm:p-6 animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header: Cancel | New To-Do | Save */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-sm font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
              >
                Cancel
              </button>
              <h2 className="text-base font-extrabold text-slate-900">
                {editingTodo ? 'Edit To-Do' : 'New To-Do'}
              </h2>
              <button
                type="button"
                onClick={handleSaveTodo}
                disabled={!newTodoText.trim()}
                className="text-sm font-extrabold text-amber-600 hover:text-amber-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Save
              </button>
            </div>

            {/* Input field (Rounded box with Amber focus) */}
            <form onSubmit={handleSaveTodo} className="space-y-3">
              <div className="bg-slate-100/90 border border-slate-200 rounded-2xl px-4 py-3 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/15 transition">
                <input
                  ref={inputRef}
                  type="text"
                  value={newTodoText}
                  onChange={e => setNewTodoText(e.target.value)}
                  placeholder="New to-do"
                  className="w-full bg-transparent text-slate-900 font-medium text-base outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Action tools: Reminder / Due Date */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${newTodoDueDate
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    <Bell size={13} className={newTodoDueDate ? 'text-amber-600' : 'text-slate-500'} />
                    <span>
                      {newTodoDueDate
                        ? new Date(newTodoDueDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric'
                        })
                        : 'Reminder'}
                    </span>
                  </button>

                  {newTodoDueDate && (
                    <button
                      type="button"
                      onClick={() => setNewTodoDueDate('')}
                      className="w-6 h-6 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Quick Due Dates */}
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setNewTodoDueDate(today);
                    }}
                    className="px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                      setNewTodoDueDate(tomorrow);
                    }}
                    className="px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>

              {/* Date Input Toggle */}
              {showDatePicker && (
                <div className="pt-2">
                  <input
                    type="date"
                    value={newTodoDueDate}
                    onChange={e => setNewTodoDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodosView;

