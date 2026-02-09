import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, X, Plus, Check, Clock, Trash2 } from 'lucide-react';
import { useEditMode } from '@/contexts/EditModeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminTask {
  id: string;
  title: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

type Tab = 'pending' | 'done';

const FloatingTaskManager = () => {
  const { editMode } = useEditMode();
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [tab, setTab] = useState<Tab>('pending');
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('admin_tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTasks(data as AdminTask[]);
  };

  useEffect(() => {
    if (editMode && open) fetchTasks();
  }, [editMode, open]);

  if (!editMode) return null;

  const pending = tasks.filter(t => t.status === 'pending');
  const done = tasks.filter(t => t.status === 'done');
  const displayed = tab === 'pending' ? pending : done;

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { error } = await supabase.from('admin_tasks').insert({ title, created_by: user.id });
    if (error) toast.error('Erreur');
    else { setNewTitle(''); await fetchTasks(); }
    setLoading(false);
  };

  const handleToggle = async (task: AdminTask) => {
    const newStatus = task.status === 'pending' ? 'done' : 'pending';
    const { error } = await supabase.from('admin_tasks').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    }).eq('id', task.id);
    if (error) toast.error('Erreur');
    else await fetchTasks();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('admin_tasks').delete().eq('id', id);
    if (error) toast.error('Erreur');
    else await fetchTasks();
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) +
      ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-20 z-[9999] w-12 h-12 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            title="Tâches admin"
          >
            <ClipboardList size={20} />
            {pending.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-body flex items-center justify-center">
                {pending.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-20 z-[9999] w-[340px] max-h-[70vh] bg-background text-foreground border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-primary" />
                <span className="text-xs tracking-[0.15em] uppercase font-body font-medium">Tâches</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setTab('pending')}
                className={`flex-1 py-2 text-[10px] tracking-[0.12em] uppercase font-body transition-colors ${tab === 'pending' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                En cours ({pending.length})
              </button>
              <button
                onClick={() => setTab('done')}
                className={`flex-1 py-2 text-[10px] tracking-[0.12em] uppercase font-body transition-colors ${tab === 'done' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Traitées ({done.length})
              </button>
            </div>

            {/* Add new task (only on pending tab) */}
            {tab === 'pending' && (
              <div className="flex gap-2 px-4 py-3 border-b border-border">
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="Nouvelle tâche…"
                  className="flex-1 text-xs font-body bg-transparent border border-border rounded px-3 py-2 focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={handleAdd}
                  disabled={loading || !newTitle.trim()}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            {/* Task list */}
            <div className="flex-1 overflow-y-auto">
              {displayed.length === 0 && (
                <p className="text-center text-xs text-muted-foreground font-body py-8">
                  {tab === 'pending' ? 'Aucune tâche en cours' : 'Aucune tâche traitée'}
                </p>
              )}
              <AnimatePresence mode="popLayout">
                {displayed.map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors group"
                  >
                    <button
                      onClick={() => handleToggle(task)}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        task.status === 'done'
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      {task.status === 'done' && <Check size={12} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-body leading-snug ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-body">
                        <Clock size={10} />
                        {task.status === 'done' && task.completed_at
                          ? `Traitée le ${formatDate(task.completed_at)}`
                          : formatDate(task.created_at)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingTaskManager;
