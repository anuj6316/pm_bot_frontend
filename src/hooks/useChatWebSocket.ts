import { useState, useRef, useCallback, useEffect } from 'react';
import { openChatSocket, fetchConversationMessages, type HistoryMessage } from '@/src/lib/api';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'tool_call' | 'tool_result' | 'error';
  text: string;
  toolName?: string;
  isStreaming?: boolean;
  timestamp: Date;
}

export function useChatWebSocket(loadConversations: () => void, selectedModelId?: string, projectId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [wsError, setWsError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const streamingIdRef = useRef<string | null>(null);
  const pendingMessageRef = useRef<string | null>(null);

  const connectToConversation = useCallback(async (convId: 'new' | string) => {
    wsRef.current?.close();
    wsRef.current = null;
    setMessages([]);
    setWsError('');
    setIsSending(false);
    streamingIdRef.current = null;

    if (convId !== 'new') {
      try {
        const history: HistoryMessage[] = await fetchConversationMessages(convId);
        setMessages(
          history
            .filter((m) => m.role === 'human' || m.role === 'assistant')
            .map((m): ChatMessage => ({
              id: m.id, type: m.role === 'human' ? 'user' : 'assistant',
              text: m.content, isStreaming: false, timestamp: new Date(m.created_at),
            })),
        );
      } catch { /* non-fatal */ }
    }

    const ws = openChatSocket(convId, {
      onConnected: (newId, model) => {
        setActiveConvId(newId);
        if (convId === 'new') loadConversations();

        if (pendingMessageRef.current) {
          const text = pendingMessageRef.current;
          pendingMessageRef.current = null;
          setMessages((prev) => [...prev, { id: `user-${Date.now()}`, type: 'user', text, timestamp: new Date() }]);
          const sid = `stream-${Date.now()}`;
          streamingIdRef.current = sid;
          setMessages((prev) => [...prev, { id: sid, type: 'assistant', text: '', isStreaming: true, timestamp: new Date() }]);
          wsRef.current?.send(JSON.stringify({ type: 'message', content: text }));
        }
      },
      onToken: (token) => {
        setMessages((prev) => {
          const sid = streamingIdRef.current;
          if (!sid) return prev;
          return prev.map((m) => m.id === sid ? { ...m, text: m.text + token } : m);
        });
      },
      onToolCall: (name) => {
        setMessages((prev) => {
          const sid = streamingIdRef.current;
          const idx = prev.findIndex((m) => m.id === sid);
          if (idx === -1) return [...prev, { id: `tool-${Date.now()}`, type: 'tool_call', text: '', toolName: name, timestamp: new Date() }];
          const copy = [...prev];
          copy.splice(idx, 0, { id: `tool-${Date.now()}`, type: 'tool_call', text: '', toolName: name, timestamp: new Date() });
          return copy;
        });
      },
      onToolResult: (result) => {
        setMessages((prev) => {
          const sid = streamingIdRef.current;
          const idx = prev.findIndex((m) => m.id === sid);
          if (idx === -1) return [...prev, { id: `result-${Date.now()}`, type: 'tool_result', text: result, timestamp: new Date() }];
          const copy = [...prev];
          copy.splice(idx, 0, { id: `result-${Date.now()}`, type: 'tool_result', text: result, timestamp: new Date() });
          return copy;
        });
      },
      onDone: () => {
        streamingIdRef.current = null;
        setMessages((prev) => prev.map((m) => m.isStreaming ? { ...m, isStreaming: false } : m));
        setIsSending(false);
        loadConversations();
      },
      onError: (msg) => {
        streamingIdRef.current = null;
        setMessages((prev) => prev.map((m) => m.isStreaming ? { ...m, isStreaming: false } : m));
        setMessages((prev) => [...prev, { id: `err-${Date.now()}`, type: 'error', text: msg, timestamp: new Date() }]);
        setIsSending(false);
      },
      onClose: () => setIsSending(false),
    }, selectedModelId, projectId);
    wsRef.current = ws;
  }, [loadConversations, selectedModelId, projectId]);

  useEffect(() => { return () => { wsRef.current?.close(); }; }, []);

  const clearMessages = () => {
    setMessages([]);
    setActiveConvId(null);
    wsRef.current?.close();
  };

  const sendMessage = (text: string) => {
    setIsSending(true);

    if (!activeConvId || !wsRef.current) {
      pendingMessageRef.current = text;
      connectToConversation('new');
      return;
    }

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, type: 'user', text, timestamp: new Date() }]);
    const sid = `stream-${Date.now()}`;
    streamingIdRef.current = sid;
    setMessages((prev) => [...prev, { id: sid, type: 'assistant', text: '', isStreaming: true, timestamp: new Date() }]);
    wsRef.current.send(JSON.stringify({ type: 'message', content: text }));
  }

  return { connectToConversation, clearMessages, sendMessage, messages, activeConvId, wsError, isSending };
}
