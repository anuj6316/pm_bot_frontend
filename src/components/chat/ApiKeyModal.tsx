import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Key, Loader2, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { fetchApiKeyProviders, saveApiKey, type ApiKeyProvider } from '@/src/lib/api';
import { toast } from 'sonner';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onSuccess }: ApiKeyModalProps) {
  const [providers, setProviders] = useState<ApiKeyProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchApiKeyProviders()
        .then(setProviders)
        .catch(() => toast.error('Failed to load providers'))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !apiKey) return;

    setIsSaving(true);
    try {
      await saveApiKey(selectedProvider, apiKey);
      toast.success('API Key saved successfully');
      setApiKey('');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-apple-border/50 overflow-hidden"
          >
            <div className="p-8 border-b border-apple-border/50 bg-apple-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-apple-text">Add API Key</h2>
                  <p className="text-sm text-apple-text-muted mt-1">Use your own models with custom keys.</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full text-apple-text-muted transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-apple-text ml-1 text-apple-text-muted uppercase tracking-widest text-[10px]">
                  Provider
                </label>
                {isLoading ? (
                  <div className="h-12 w-full bg-black/5 rounded-2xl animate-pulse" />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProvider(p.id)}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-2xl border transition-all text-sm font-medium",
                          selectedProvider === p.id 
                            ? "bg-apple-blue/10 border-apple-blue/30 text-apple-blue" 
                            : "bg-black/5 border-transparent hover:border-apple-border text-apple-text-muted"
                        )}
                      >
                        {p.label}
                        {selectedProvider === p.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-apple-text ml-1 text-apple-text-muted uppercase tracking-widest text-[10px]">
                  API Key
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-text-muted">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    required
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-black/5 border-none rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-apple-blue transition-all font-mono"
                    placeholder="sk-..."
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-apple-border rounded-2xl font-semibold text-apple-text hover:bg-black/5 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !selectedProvider || !apiKey}
                  className="flex-3 px-8 py-3 bg-apple-blue hover:bg-apple-blue-hover text-white rounded-2xl font-bold shadow-lg shadow-apple-blue/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </div>
                  ) : 'Save Key'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
