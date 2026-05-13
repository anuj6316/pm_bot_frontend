import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, MessageSquarePlus, Trash2, Mic, Plus, PanelLeftClose, PanelLeftOpen, Database, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { 
  fetchConversations, 
  fetchChatModels, 
  deleteConversation, 
  postChatQuery,
  type Conversation, 
  type ChatModel 
} from '@/src/lib/api';
import { useChatWebSocket, type ChatMessage } from '@/src/hooks/useChatWebSocket';
import { ModelSelector, ModelInfoTooltip } from '@/src/components/chat/ModelSelector';
import { MessageBubble } from '@/src/components/chat/MessageBubble';
import { useProject } from '@/src/contexts/ProjectContext';

export function Chat() {
  const { selectedProject } = useProject();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [models, setModels] = useState<ChatModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<ChatModel | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // New: Toggle between Conversation mode and DB Query mode
  const [mode, setMode] = useState<'chat' | 'query'>('chat');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations();
      setConversations(data.results);
    } catch {
      // Ignored for UI
    } finally {
      setConvLoading(false);
    }
  }, []);

  const loadModels = useCallback(async () => {
    try {
      const list = await fetchChatModels();
      setModels(list);
      setSelectedModel((prev) => {
        if (prev && list.find((m) => m.id === prev.id)) return prev;
        return list.find((m) => m.is_default && m.available) ?? list.find((m) => m.available) ?? null;
      });
    } catch { /* ignore */ }
  }, []);

  const {
    connectToConversation,
    sendMessage,
    messages: chatMessages,
    activeConvId,
    wsError,
    isSending: isChatSending
  } = useChatWebSocket(loadConversations, selectedModel?.id, selectedProject?.id);

  // Combine messages based on mode
  const currentMessages = mode === 'query' ? localMessages : chatMessages;
  const isSending = mode === 'query' ? isQuerying : isChatSending;

  useEffect(() => {
    loadConversations();
    loadModels();
  }, [loadConversations, loadModels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  }, [inputValue]);

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) connectToConversation('new');
    } catch { /* ignore */ }
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isSending) return;
    setInputValue('');

    if (mode === 'query') {
      setIsQuerying(true);
      const userMsg: ChatMessage = { 
        id: `q-user-${Date.now()}`, 
        type: 'user', 
        text, 
        timestamp: new Date() 
      };
      setLocalMessages(prev => [...prev, userMsg]);

      try {
        const res = await postChatQuery(text, selectedModel?.id);
        const assistantMsg: ChatMessage = {
          id: `q-ai-${Date.now()}`,
          type: 'assistant',
          text: res.answer,
          timestamp: new Date()
        };
        setLocalMessages(prev => [...prev, assistantMsg]);
      } catch (err: any) {
        setLocalMessages(prev => [...prev, {
          id: `q-err-${Date.now()}`,
          type: 'error',
          text: err.message,
          timestamp: new Date()
        }]);
      } finally {
        setIsQuerying(false);
      }
    } else {
      sendMessage(text);
    }
  };

  const toggleMode = (newMode: 'chat' | 'query') => {
    setMode(newMode);
    if (newMode === 'query') {
      setLocalMessages([]);
    }
  };

  return (
    <div className="flex w-full h-full bg-apple-bg overflow-hidden relative">

      {/* ════ LEFT: Conversation sidebar ════════════════════════════════════════ */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            className="flex flex-col flex-shrink-0 border-r border-apple-border/50 bg-apple-card/50 backdrop-blur-xl overflow-hidden"
          >
            {/* Sidebar header (Glass) */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 h-[57px] bg-apple-card/50 backdrop-blur-xl border-b border-apple-border/50 sticky top-0 z-10">
              <span className="text-sm font-semibold text-apple-text">Conversations</span>
            </div>

            {/* Mode Switcher */}
            <div className="flex-shrink-0 p-3 flex gap-1 bg-black/5">
              <button
                onClick={() => toggleMode('chat')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  mode === 'chat' ? "bg-white shadow-sm text-apple-blue" : "text-apple-text-muted hover:bg-white/50"
                )}
              >
                <MessageSquare className="w-3 h-3" />
                Chat
              </button>
              <button
                onClick={() => toggleMode('query')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  mode === 'query' ? "bg-white shadow-sm text-apple-blue" : "text-apple-text-muted hover:bg-white/50"
                )}
              >
                <Database className="w-3 h-3" />
                Query
              </button>
            </div>

            {/* New chat button */}
            <div className="flex-shrink-0 p-3 border-b border-apple-border/50">
              <button
                onClick={() => { toggleMode('chat'); connectToConversation('new'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-apple-text hover:bg-black/5 active:bg-black/10 transition-colors group cursor-pointer"
              >
                <span className="w-7 h-7 rounded-lg bg-apple-blue flex items-center justify-center flex-shrink-0 group-hover:bg-apple-blue-hover transition-colors">
                  <MessageSquarePlus className="w-3.5 h-3.5 text-white" />
                </span>
                New chat
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
              {convLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-apple-border" /></div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center px-3">
                  <div className="w-10 h-10 rounded-xl bg-apple-card flex items-center justify-center shadow-inner">
                    <MessageSquarePlus className="w-4 h-4 text-apple-text-muted" />
                  </div>
                  <p className="text-xs text-apple-text-muted leading-relaxed mt-2">
                    No chats yet.<br />Click <strong className="text-apple-text">New chat</strong> to start.
                  </p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => { toggleMode('chat'); if (conv.id !== activeConvId) connectToConversation(conv.id); }}
                    className={cn(
                      'group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm mb-0.5',
                      activeConvId === conv.id && mode === 'chat'
                        ? 'bg-apple-card shadow-[0_2px_8px_rgb(0,0,0,0.04)] text-apple-text font-medium'
                        : 'hover:bg-black/5 text-apple-text-muted',
                    )}
                  >
                    <p className="truncate flex-1 mr-2">{conv.title}</p>
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded-lg text-apple-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ RIGHT: Main chat area ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-apple-bg relative">

        {/* ── Top header bar (True Glassmorphism) ───────── */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 h-[57px] bg-apple-card/70 backdrop-blur-2xl border-b border-apple-border/50 sticky top-0 z-20">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-apple-text-muted hover:text-apple-text hover:bg-black/5 transition-colors mr-0.5 focus:outline-none focus:ring-2 focus:ring-apple-border cursor-pointer"
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2 ml-1 mr-2 px-2 py-1 bg-black/5 rounded-full">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                mode === 'query' ? "bg-purple-500 animate-pulse" : "bg-green-500"
              )} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-apple-text-muted">
                {mode === 'query' ? 'System Query' : 'Chat Mode'}
              </span>
            </div>
            <ModelSelector models={models} selected={selectedModel} onSelect={setSelectedModel} disabled={isSending} onRefresh={loadModels} />
            <ModelInfoTooltip model={selectedModel} />
          </div>

          <div className="flex items-center gap-2">
            {mode === 'query' ? (
              <button
                onClick={() => setLocalMessages([])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-apple-border hover:bg-black/5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            ) : (
              <button
                onClick={() => connectToConversation('new')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-apple-blue text-white hover:bg-apple-blue-hover active:bg-apple-blue-hover/90 transition-colors shadow-sm cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                New chat
              </button>
            )}
          </div>
        </div>

        {wsError && mode === 'chat' && (
          <div className="flex-shrink-0 text-sm text-red-600 bg-red-50/90 backdrop-blur-md border-b border-red-100 px-6 py-2 text-center absolute top-[57px] w-full z-10">{wsError}</div>
        )}

        {/* ── Messages area ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto w-full">
          {mode === 'chat' && !activeConvId && currentMessages.length === 0 ? (
            /* Empty state Chat */
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full gap-5 text-center px-6">
              <div className="w-14 h-14 rounded-[20px] bg-apple-blue flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl tracking-tight">PM</span>
              </div>
              <div>
                <p className="text-2xl font-semibold text-apple-text">What can I help with?</p>
                {selectedModel && (
                  <p className="text-sm text-apple-text-muted mt-1.5">
                    Using <span className="font-medium text-apple-text">{selectedModel.label}</span>
                    <span className="mx-1.5 text-apple-border">·</span>
                    Conversational agent with tool access
                  </p>
                )}
              </div>
            </motion.div>
          ) : mode === 'query' && currentMessages.length === 0 ? (
            /* Empty state Query */
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full gap-5 text-center px-6">
              <div className="w-14 h-14 rounded-[20px] bg-purple-600 flex items-center justify-center shadow-lg text-white">
                <Database className="w-7 h-7" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-apple-text">System Query Mode</p>
                <p className="text-sm text-apple-text-muted mt-1.5 max-w-sm">
                  Ask about your assigned projects, team members, or the status of AI processing tasks directly from our database.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-2">
              {currentMessages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} isSending={isSending} />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* ── Input bar ────────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 pb-6 pt-2 bg-gradient-to-t from-apple-bg via-apple-bg/95 to-transparent">
          <div className="max-w-3xl mx-auto">
            <div className={cn(
              'flex items-end gap-2 bg-apple-card/80 backdrop-blur-md rounded-[28px] p-2 ring-1 ring-apple-border/60 transition-shadow focus-within:ring-apple-border hover:ring-apple-border/80 shadow-[0_2px_15px_rgb(0,0,0,0.03)]',
              mode === 'query' && 'ring-purple-200 focus-within:ring-purple-400'
            )}>
              <button disabled={isSending}
                className="flex-shrink-0 w-[40px] h-[40px] rounded-full bg-apple-card border border-apple-border/60 flex items-center justify-center text-apple-text-muted hover:bg-black/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm ml-1 mb-0.5"
              >
                <Plus className="w-4 h-4" />
              </button>

              <textarea
                ref={textareaRef} rows={1} value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={mode === 'query' ? "Query system status, projects or users..." : "Ask anything"}
                disabled={isSending}
                className="flex-1 bg-transparent border-none outline-none resize-none text-[15px] text-apple-text placeholder:text-apple-text-muted py-3 px-1 mb-0.5 disabled:cursor-not-allowed max-h-[200px] overflow-y-auto leading-relaxed"
                style={{ minHeight: '40px' }}
              />

              <button disabled={isSending}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-apple-text-muted hover:text-apple-text hover:bg-black/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button onClick={handleSend}
                disabled={isSending || !inputValue.trim()}
                className={cn(
                  'flex-shrink-0 w-[40px] h-[40px] rounded-full flex items-center justify-center transition-all duration-200 mb-0.5 mr-1',
                  inputValue.trim() && !isSending
                    ? (mode === 'query' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-apple-blue hover:bg-apple-blue-hover') + ' text-white shadow-md active:scale-95 cursor-pointer'
                    : 'bg-apple-border text-white cursor-not-allowed',
                )}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 translate-x-[1px]" />}
              </button>
            </div>
            <p className="text-center text-[11px] text-apple-text-muted/80 mt-3 font-medium tracking-wide">
              {mode === 'query' ? 'System Query mode uses the local database as source of truth.' : 'PM.ai can make mistakes. Verify important information.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
