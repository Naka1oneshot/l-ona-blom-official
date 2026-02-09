import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Mail, Eye, Archive, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import LogoSpinner from '@/components/LogoSpinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ContactMessage {
  id: string;
  created_at: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: string;
  status: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-primary/10 text-primary border-primary/20',
  read: 'bg-muted text-muted-foreground border-border',
  archived: 'bg-secondary text-secondary-foreground border-border',
};

const statusLabels: Record<string, string> = {
  new: 'Nouveau',
  read: 'Lu',
  archived: 'Archivé',
};

const AdminMessages = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'archived'>('all');
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['admin-contact-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ContactMessage[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('contact_messages' as any)
        .update({ status } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-contact-messages'] });
      toast.success('Statut mis à jour');
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_messages' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-contact-messages'] });
      setSelected(null);
      toast.success('Message supprimé');
    },
  });

  const filtered = filter === 'all' ? messages : messages.filter(m => m.status === filter);
  const newCount = messages.filter(m => m.status === 'new').length;

  const openMessage = (msg: ContactMessage) => {
    setSelected(msg);
    if (msg.status === 'new') {
      updateStatus.mutate({ id: msg.id, status: 'read' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Mail size={18} />
          <h1 className="text-display text-xl tracking-wider">Messages</h1>
          {newCount > 0 && (
            <Badge variant="default" className="text-[10px]">{newCount} nouveau{newCount > 1 ? 'x' : ''}</Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'new', 'read', 'archived'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase font-body border transition-colors ${
              filter === f ? 'bg-foreground text-background border-foreground' : 'border-foreground/20 text-foreground/60 hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'Tous' : statusLabels[f]} ({f === 'all' ? messages.length : messages.filter(m => m.status === f).length})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LogoSpinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm font-body text-muted-foreground py-8 text-center">Aucun message.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(msg => (
            <div
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={`border border-foreground/10 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                msg.status === 'new' ? 'border-l-2 border-l-primary' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-body font-medium ${msg.status === 'new' ? 'text-foreground' : 'text-foreground/70'}`}>
                      {msg.name}
                    </span>
                    <span className="text-[10px] font-body text-muted-foreground">&lt;{msg.email}&gt;</span>
                    <Badge variant="outline" className={`text-[9px] ${statusColors[msg.status] || ''}`}>
                      {statusLabels[msg.status] || msg.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-body text-foreground/80 truncate">{msg.subject}</p>
                  <p className="text-xs font-body text-muted-foreground truncate mt-0.5">{msg.message}</p>
                </div>
                <span className="text-[10px] font-body text-muted-foreground whitespace-nowrap">
                  {format(new Date(msg.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message detail dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-display text-lg tracking-wider">{selected.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-4 text-xs font-body text-muted-foreground">
                  <span><strong className="text-foreground">{selected.name}</strong> &lt;{selected.email}&gt;</span>
                  <span>{format(new Date(selected.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</span>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-body tracking-wider bg-primary text-primary-foreground hover:bg-accent/80 transition-colors"
                  >
                    <Mail size={12} /> Répondre
                  </a>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-body tracking-wider border border-foreground/20 hover:bg-muted transition-colors">
                      Statut <ChevronDown size={12} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => updateStatus.mutate({ id: selected.id, status: 'new' })}>
                        <Eye size={12} className="mr-2" /> Nouveau
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateStatus.mutate({ id: selected.id, status: 'read' })}>
                        <Eye size={12} className="mr-2" /> Lu
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateStatus.mutate({ id: selected.id, status: 'archived' })}>
                        <Archive size={12} className="mr-2" /> Archiver
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button
                    onClick={() => { if (confirm('Supprimer ce message ?')) deleteMessage.mutate(selected.id); }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-body tracking-wider border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                  >
                    <Trash2 size={12} /> Supprimer
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMessages;
