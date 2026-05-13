/**
 * api.ts — Central API client for PM Bot frontend.
 *
 * All backend calls go through here. Handles:
 * - JWT token storage / refresh
 * - Authenticated fetch wrapper
 * - Typed response helpers for each endpoint
 */

const API_BASE = '/api/v1';

// ─── Token storage ──────────────────────────────────────────────────────────

export const auth = {
  getAccessToken: () => localStorage.getItem('pm_bot_access'),
  getRefreshToken: () => localStorage.getItem('pm_bot_refresh'),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('pm_bot_access', access);
    localStorage.setItem('pm_bot_refresh', refresh);
  },
  clear: () => {
    localStorage.removeItem('pm_bot_access');
    localStorage.removeItem('pm_bot_refresh');
  },
  isAuthenticated: () => !!localStorage.getItem('pm_bot_access'),
};

// ─── Fetch wrapper ───────────────────────────────────────────────────────────

/**
 * Authenticated fetch. Automatically adds Authorization header.
 * On 401, attempts a token refresh once and retries.
 */
async function apiFetch(
  path: string,
  options: RequestInit = {},
  _isRetry = false,
): Promise<Response> {
  const token = auth.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Auto-refresh on 401 (unless we already retried)
  if (res.status === 401 && !_isRetry) {
    const refreshed = await refreshTokens();
    if (refreshed) return apiFetch(path, options, true);
    auth.clear();
    window.location.href = '/login';
  }

  return res;
}

async function refreshTokens(): Promise<boolean> {
  const refresh = auth.getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    auth.setTokens(data.access, data.refresh ?? refresh);
    return true;
  } catch {
    return false;
  }
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface UserResponse {
  msg: string;
  data: User;
}

// ─── API wrapper with typed responses ───────────────────────────────────────

export const api = {
  get: async <T>(path: string): Promise<T> => {
    const res = await apiFetch(path);
    if (!res.ok) throw new Error(`GET ${path} failed`);
    const data = await res.json();
    return data.data ?? data;
  },

  post: async <T>(path: string, data: unknown): Promise<T> => {
    const res = await apiFetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { msg?: string }).msg || `POST ${path} failed`);
    }
    const result = await res.json();
    return result.data ?? result;
  },

  patch: async <T>(path: string, data: unknown): Promise<T> => {
    const res = await apiFetch(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { msg?: string }).msg || `PATCH ${path} failed`);
    }
    const result = await res.json();
    return result.data ?? result;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_BASE}/auth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid credentials');
    }
    return res.json();
  },
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Invalid credentials');
  }
  return res.json();
}

export async function logout(): Promise<void> {
  const refresh = auth.getRefreshToken();
  if (refresh) {
    await fetch(`${API_BASE}/auth/token/blacklist/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    }).catch(() => { });
  }
  auth.clear();
}

// ─── User Profile ───────────────────────────────────────────────────────────

export async function fetchUserProfile(): Promise<User> {
  const res = await apiFetch('/user/');
  if (!res.ok) throw new Error('Failed to fetch user profile');
  const data = await res.json();
  return data.data;
}

export async function updateUserProfile(updates: Partial<User>): Promise<User> {
  const res = await apiFetch('/user/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { msg?: string }).msg || 'Failed to update profile');
  }
  const data = await res.json();
  return data.data;
}

export async function changeUserPassword(
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  const res = await apiFetch('/user/change-password/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { msg?: string }).msg || 'Failed to change password');
  }
}

// ─── Sessions (Dashboard) ─────────────────────────────────────────────────────

export interface Session {
  id: number;
  plane_issue_id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ARCHIVED';
  triage_label: string | null;
  is_approved: boolean;
  thread_id: string | null;
  error_log: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function fetchSessions(page = 1): Promise<PaginatedResponse<Session>> {
  const res = await apiFetch(`/sessions/?page=${page}`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function syncSession(sessionId: number): Promise<void> {
  const res = await apiFetch(`/sessions/${sessionId}/sync/`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to sync session');
}

export async function approveSession(sessionId: number): Promise<void> {
  const res = await apiFetch(`/sessions/${sessionId}/approve/`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to approve session');
  }
}

// ─── Issues ───────────────────────────────────────────────────────────────────

export interface PlaneIssue {
  id: string;
  sequence_id: number;
  name: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'none';
  state: string;
  state_group: string;
  project_id: string;
  project_name: string;
  project_identifier: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectGroup {
  project: {
    id: string;
    name: string;
    identifier: string;
    issue_count: number;
  };
  issues: PlaneIssue[];
}

export async function fetchIssues(): Promise<PlaneIssue[]> {
  const res = await apiFetch('/issues/');
  if (!res.ok) throw new Error('Failed to fetch issues');
  const data = await res.json();
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function fetchIssuesByProject(): Promise<ProjectGroup[]> {
  const res = await apiFetch('/issues/by_project/');
  if (!res.ok) throw new Error('Failed to fetch issues by project');
  return res.json();
}

export async function createIssue(payload: {
  project_id: string;
  name: string;
  description?: string;
  priority?: string;
}): Promise<PlaneIssue> {
  const res = await apiFetch('/issues/create/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? 'Failed to create issue');
  }
  return res.json();
}

export async function createSubtask(payload: {
  project_id: string;
  parent_issue_id: string;
  name: string;
  description?: string;
  priority?: string;
}): Promise<PlaneIssue> {
  const res = await apiFetch('/issues/create_subtask/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? 'Failed to create subtask');
  }
  return res.json();
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  title: string;
  message_count: number;
  last_message: { role: string; content: string; created_at: string } | null;
  created_at: string;
  updated_at: string;
}

export interface ChatModel {
  id: string;
  label: string;
  provider: string;
  badge: string;
  env_var: string | null;
  available: boolean;
  is_default: boolean;
}

export async function fetchChatModels(): Promise<ChatModel[]> {
  const res = await apiFetch('/chat/models/');
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
}

export async function fetchConversations(): Promise<PaginatedResponse<Conversation>> {
  const res = await apiFetch('/chat/conversations/');
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function createConversation(): Promise<Conversation> {
  const res = await apiFetch('/chat/conversations/', { method: 'POST', body: '{}' });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await apiFetch(`/chat/conversations/${id}/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete conversation');
}

export interface ChatQueryResponse {
  query: string;
  answer: string;
  source: string;
}

export async function postChatQuery(query: string, model?: string): Promise<ChatQueryResponse> {
  const res = await apiFetch('/chat/chatquery/query/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Query failed');
  }
  return res.json();
}

// ─── API Keys ───────────────────────────────────────────────────────────────

export interface ApiKeyProvider {
  id: string;
  label: string;
}

export async function fetchApiKeyProviders(): Promise<ApiKeyProvider[]> {
  const res = await apiFetch('/user/api-keys/providers/');
  if (!res.ok) throw new Error('Failed to fetch providers');
  return res.json();
}

export async function saveApiKey(provider: string, apiKey: string): Promise<void> {
  const res = await apiFetch('/user/api-keys/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, api_key: apiKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { msg?: string }).msg || 'Failed to save API key');
  }
}

export interface HistoryMessage {
  id: number;
  role: 'human' | 'assistant' | 'tool';
  content: string;
  tool_calls: unknown[] | null;
  created_at: string;
}

export async function fetchConversationMessages(
  conversationId: string,
): Promise<HistoryMessage[]> {
  const res = await apiFetch(`/chat/conversations/${conversationId}/messages/`);
  if (!res.ok) throw new Error('Failed to fetch message history');
  const data = await res.json();
  // API may return paginated or plain array
  return Array.isArray(data) ? data : (data.results ?? []);
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

export type WsEventType = 'connected' | 'token' | 'tool_call' | 'tool_result' | 'done' | 'error';

export interface WsEvent {
  type: WsEventType;
  data: string | Record<string, unknown>;
}

/**
 * Opens an authenticated WebSocket connection to a conversation.
 * Pass "new" to start a fresh conversation, or a UUID to resume one.
 * Pass `model` to override the LLM used for this connection.
 * Pass `projectId` to scope the conversation to a specific project.
 */
export function openChatSocket(
  conversationId: 'new' | string,
  handlers: {
    onConnected?: (conversationId: string, model: string) => void;
    onToken?: (token: string) => void;
    onToolCall?: (name: string, args: Record<string, unknown>) => void;
    onToolResult?: (result: string) => void;
    onDone?: () => void;
    onError?: (message: string) => void;
    onClose?: () => void;
  },
  model?: string,
  projectId?: string,
): WebSocket {
  const token = auth.getAccessToken();
  const path = conversationId === 'new' ? 'new' : conversationId;
  let wsUrl = `/ws/chat/${path}/?token=${token ?? ''}`;
  if (model) wsUrl += `&model=${encodeURIComponent(model)}`;
  if (projectId) wsUrl += `&project_id=${encodeURIComponent(projectId)}`;
  // In dev, Vite proxies /ws → ws://localhost:8002/ws
  const fullUrl = wsUrl.startsWith('/')
    ? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${wsUrl}`
    : wsUrl;

  const ws = new WebSocket(fullUrl);

  ws.onmessage = (event) => {
    try {
      const msg: WsEvent = JSON.parse(event.data);
      switch (msg.type) {
        case 'connected':
          handlers.onConnected?.(
            (msg.data as Record<string, unknown>).conversation_id as string,
            (msg.data as Record<string, unknown>).model as string,
          );
          break;
        case 'token':
          handlers.onToken?.(msg.data as string);
          break;
        case 'tool_call': {
          const d = msg.data as Record<string, unknown>;
          handlers.onToolCall?.(d.name as string, (d.args ?? {}) as Record<string, unknown>);
          break;
        }
        case 'tool_result':
          handlers.onToolResult?.(msg.data as string);
          break;
        case 'done':
          handlers.onDone?.();
          break;
        case 'error':
          handlers.onError?.(msg.data as string);
          break;
      }
    } catch {
      // ignore malformed frames
    }
  };

  ws.onclose = () => handlers.onClose?.();

  return ws;
}
