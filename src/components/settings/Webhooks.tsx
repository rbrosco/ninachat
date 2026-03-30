import React, { useEffect, useState } from 'react';
import { generateId } from '@/services/api';
import { Trash, PlusCircle, Play, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

type Webhook = {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  created_at: string;
};

const AVAILABLE_EVENTS = ['message.created', 'message.delivered', 'contact.created', 'conversation.started'];

const Webhooks: React.FC = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE || '/api';
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/global_webhooks`);
        if (res.ok) {
          const json = await res.json();
          const data = json?.data ?? json;
          setWebhooks(Array.isArray(data) ? data : []);
          return;
        }
      } catch {}
      setWebhooks([]);
    })();
  }, []);

  const save = (list: Webhook[]) => {
    const API_BASE = import.meta.env.VITE_API_BASE || '/api';
    (async () => {
      try {
        await fetch(`${API_BASE}/global_webhooks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(list) });
      } catch (err) {
        console.error('Failed to save webhooks to backend', err);
      }
      setWebhooks(list);
    })();
  };

  const handleCreate = () => {
    const id = generateId();
    const newW: Webhook = { id, name: `webhook-${id.slice(0,6)}`, url: '', events: ['message.created'], enabled: false, created_at: new Date().toISOString() };
    setEditing(newW);
    setSheetOpen(true);
  };

  const handleSaveEditing = (w: Webhook) => {
    const exists = webhooks.some(x => x.id === w.id);
    const next = exists ? webhooks.map(x => x.id === w.id ? w : x) : [w, ...webhooks];
    save(next);
    setEditing(null);
    setSheetOpen(false);
    // small flash to highlight new item
    setCreating(true);
    setTimeout(() => setCreating(false), 200);
  };

  const handleDelete = (id: string) => {
    const next = webhooks.filter(w => w.id !== id);
    save(next);
  };

  const toggleEnabled = (id: string) => {
    const next = webhooks.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
    save(next);
  };

  const updateField = (id: string, patch: Partial<Webhook>) => {
    const next = webhooks.map(w => w.id === id ? { ...w, ...patch } : w);
    save(next);
  };

  const testWebhook = async (url: string) => {
    try {
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ test: true, ts: new Date().toISOString() }) });
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      toast.success('Teste enviado com sucesso');
    } catch (err: any) {
      console.error('Webhook test failed', err);
      toast.error('Falha no teste: ' + (err?.message || String(err)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Integração Webhooks (Global)</h3>
        <div>
          <button type="button" onClick={handleCreate} className="px-3 py-2 bg-gray-200/40 dark:bg-slate-800/40 rounded text-sm flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Nova</button>
        </div>
      </div>

      <div className="space-y-3">
        {webhooks.length === 0 && <div className="p-4 rounded bg-gray-100/40 dark:bg-slate-900/40 text-gray-500 dark:text-slate-400">Nenhum webhook configurado.</div>}

        {webhooks.map(w => (
          <div key={w.id} className="p-4 rounded border border-gray-200 dark:border-slate-800 bg-gray-100/30 dark:bg-slate-900/30 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <input className="bg-gray-200/40 dark:bg-slate-800/40 rounded px-2 py-1 text-sm text-gray-900 dark:text-white" value={w.name} onChange={(e) => updateField(w.id, { name: e.target.value })} />
                <span className={`text-xs px-2 py-0.5 rounded ${w.enabled ? 'bg-emerald-600 text-gray-900 dark:text-white' : 'bg-gray-300 dark:bg-slate-700 text-gray-700 dark:text-slate-200'}`}>{w.enabled ? 'Ativo' : 'Inativo'}</span>
              </div>
              <div className="mt-2">
                <input className="w-full bg-gray-200/40 dark:bg-slate-800/40 rounded px-3 py-2 text-sm text-gray-900 dark:text-white" placeholder="https://example.com/webhook" value={w.url} onChange={(e) => updateField(w.id, { url: e.target.value })} />
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">Eventos:</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {AVAILABLE_EVENTS.map(ev => {
                  const active = w.events.includes(ev);
                  return (
                    <button
                      key={ev}
                      type="button"
                      onClick={() => {
                        const nextEvents = active ? w.events.filter(x => x !== ev) : [...w.events, ev];
                        updateField(w.id, { events: nextEvents });
                      }}
                      className={`inline-flex items-center gap-2 text-sm select-none rounded px-2 py-1 transition-colors ${active ? 'bg-emerald-600 text-white' : 'bg-gray-200/30 dark:bg-slate-800/30 text-gray-700 dark:text-slate-200'}`}
                    >
                      {active ? <Check className="w-4 h-4" /> : <span className="w-4 h-4" />}
                      <span className="leading-none">{ev}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <button type="button" onClick={() => toggleEnabled(w.id)} className="px-3 py-1 rounded bg-gray-200/40 dark:bg-slate-800/40 text-sm">Toggle</button>
              <button type="button" onClick={() => { setEditing(w); setSheetOpen(true); }} className="px-3 py-1 rounded bg-gray-200/40 dark:bg-slate-800/40 text-sm">Editar</button>
              <button type="button" onClick={() => testWebhook(w.url)} className="px-3 py-1 rounded bg-gray-200/40 dark:bg-slate-800/40 text-sm flex items-center gap-2"><Play className="w-4 h-4" /> Testar</button>
              <button type="button" onClick={() => handleDelete(w.id)} className="px-3 py-1 rounded bg-rose-700/20 text-rose-300 text-sm flex items-center gap-2"><Trash className="w-4 h-4" /> Deletar</button>
            </div>
          </div>
        ))}
      </div>
      {/* Drawer for create / edit */}
      <Sheet open={sheetOpen} onOpenChange={(v: boolean) => { if (!v) setEditing(null); setSheetOpen(v); }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{editing ? (webhooks.some(x => x.id === editing.id) ? 'Editar Webhook' : 'Novo Webhook') : 'Webhook'}</SheetTitle>
            <SheetDescription>Configure o webhook e selecione os eventos.</SheetDescription>
          </SheetHeader>

          {editing && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-slate-300">Nome</label>
                <input className="w-full bg-gray-200/40 dark:bg-slate-800/40 rounded px-3 py-2 text-sm text-gray-900 dark:text-white" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-slate-300">URL</label>
                <input className="w-full bg-gray-200/40 dark:bg-slate-800/40 rounded px-3 py-2 text-sm text-gray-900 dark:text-white" placeholder="https://example.com/webhook" value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-slate-300">Eventos</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AVAILABLE_EVENTS.map(ev => {
                    const active = editing.events.includes(ev);
                    return (
                      <button
                        key={ev}
                        type="button"
                        onClick={() => {
                          const nextEvents = active ? editing.events.filter(x => x !== ev) : [...editing.events, ev];
                          setEditing({ ...editing, events: nextEvents });
                        }}
                        className={`inline-flex items-center gap-2 text-sm select-none rounded px-2 py-1 transition-colors ${active ? 'bg-emerald-600 text-white' : 'bg-gray-200/30 dark:bg-slate-800/30 text-gray-700 dark:text-slate-200'}`}
                      >
                        {active ? <Check className="w-4 h-4" /> : <span className="w-4 h-4" />}
                        <span className="leading-none">{ev}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => { setEditing(null); setSheetOpen(false); }} className="px-4 py-2 rounded bg-gray-200/40 dark:bg-slate-800/40">Cancelar</button>
                  <button type="button" onClick={() => editing && handleSaveEditing(editing)} className="px-4 py-2 rounded bg-emerald-600 text-white">Salvar</button>
                </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Webhooks;
