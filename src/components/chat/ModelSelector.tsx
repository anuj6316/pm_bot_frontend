import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Zap, Info, Plus, Settings } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { ChatModel } from '@/src/lib/api';
import { ApiKeyModal } from './ApiKeyModal';

const PROVIDER_DOT: Record<string, string> = {
  Groq: 'bg-orange-500', OpenAI: 'bg-green-600',
  Anthropic: 'bg-violet-600', Google: 'bg-blue-500', Ollama: 'bg-gray-500',
};
const PROVIDER_TEXT: Record<string, string> = {
  Groq: 'text-orange-600', OpenAI: 'text-green-700',
  Anthropic: 'text-violet-700', Google: 'text-blue-700', Ollama: 'text-gray-600',
};

export function ModelSelector({ models, selected, onSelect, disabled, onRefresh }: {
  models: ChatModel[]; selected: ChatModel | null;
  onSelect: (m: ChatModel) => void; disabled?: boolean;
  onRefresh?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const byProvider: Record<string, ChatModel[]> = {};
  for (const m of models) { if (!byProvider[m.provider]) byProvider[m.provider] = []; byProvider[m.provider].push(m); }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen(!open)} disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm font-semibold transition-all select-none',
          disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-900 hover:bg-gray-100 cursor-pointer',
        )}
      >
        {selected && <span className={cn('w-2 h-2 rounded-full flex-shrink-0', PROVIDER_DOT[selected.provider] ?? 'bg-gray-400')} />}
        <span>{selected?.label ?? 'Select model'}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 max-h-80 overflow-y-auto">
            {Object.entries(byProvider).map(([provider, pms]) => (
              <div key={provider} className="mb-2 last:mb-0">
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className={cn('w-2 h-2 rounded-full', PROVIDER_DOT[provider] ?? 'bg-gray-400')} />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{provider}</span>
                </div>
                {pms.map((m) => (
                  <button key={m.id} disabled={!m.available}
                    onClick={() => { onSelect(m); setOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors',
                      !m.available && 'opacity-40 cursor-not-allowed',
                      m.available && selected?.id === m.id && 'bg-black/5',
                      m.available && selected?.id !== m.id && 'hover:bg-black/5',
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{m.label}</span>
                        {m.is_default && <span className="text-[9px] bg-blue-50 text-blue-600 rounded-full px-1.5 py-0.5 font-semibold">DEFAULT</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Zap className="w-2.5 h-2.5 text-gray-300" />
                        <span className="text-[10px] text-gray-400">{m.badge}</span>
                        {!m.available && m.env_var && <span className="text-[10px] text-orange-400 ml-1">needs {m.env_var}</span>}
                      </div>
                    </div>
                    {selected?.id === m.id && <Check className="w-4 h-4 text-gray-700 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={() => { setApiKeyModalOpen(true); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-apple-blue hover:bg-apple-blue/5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add or Update API Keys
            </button>
          </div>
        </div>
      )}

      <ApiKeyModal 
        isOpen={apiKeyModalOpen} 
        onClose={() => setApiKeyModalOpen(false)} 
        onSuccess={() => onRefresh?.()}
      />
    </div>
  );
}

export function ModelInfoTooltip({ model }: { model: ChatModel | null }) {
  const [visible, setVisible] = useState(false);
  if (!model) return null;
  return (
    <div className="relative flex-shrink-0">
      <button type="button"
        onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)} onBlur={() => setVisible(false)}
        aria-label="Model information"
        className="flex items-center justify-center w-5 h-5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {visible && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl z-50 p-4 pointer-events-none" role="tooltip">
          <div className="absolute left-1/2 -translate-x-1/2 top-[-5px] w-2.5 h-2.5 bg-white border-l border-t border-gray-200/50 rotate-45" />
          <div className="flex items-center gap-2 mb-3">
            <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', PROVIDER_DOT[model.provider] ?? 'bg-gray-400')} />
            <span className={cn('text-[10px] font-bold uppercase tracking-widest', PROVIDER_TEXT[model.provider] ?? 'text-gray-500')}>{model.provider}</span>
            {model.is_default && <span className="ml-auto text-[9px] bg-blue-50 text-blue-600 rounded-full px-1.5 py-0.5 font-semibold">DEFAULT</span>}
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-3">{model.label}</p>
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="w-3 h-3 text-amber-400" /><span className="text-xs text-gray-500">{model.badge}</span>
          </div>
          <div className="border-t border-gray-100 my-2" />
          <div className="flex items-start gap-2 text-xs mb-2">
            <span className="text-gray-400 font-medium w-16 flex-shrink-0">API Key:</span>
            {model.env_var
              ? <span className={cn('font-mono text-[10px] px-1.5 py-0.5 rounded', model.available ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-500 border border-red-200')}>{model.env_var}</span>
              : <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-200">None (local)</span>}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 font-medium w-16 flex-shrink-0">Status:</span>
            <span className={cn('flex items-center gap-1 font-medium', model.available ? 'text-green-600' : 'text-orange-500')}>
              <span className={cn('w-1.5 h-1.5 rounded-full', model.available ? 'bg-green-500' : 'bg-orange-400')} />
              {model.available ? 'Available' : 'Key not set'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
