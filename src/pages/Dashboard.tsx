import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { RefreshCw, Play, CheckCircle2, Clock, AlertCircle, Loader2, ChevronDown, X, ExternalLink, Check } from 'lucide-react';
import { fetchSessions, syncSession, approveSession, type Session } from '@/src/lib/api';

interface ModalConfig {
  type: 'pending' | 'processing' | 'completed';
  title: string;
  sessions: Session[];
}

export function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  const [syncingIds, setSyncingIds] = useState<Set<number>>(new Set());
  const [sessionsDropdownOpen, setSessionsDropdownOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
  const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set());

  const loadSessions = useCallback(async () => {
    try {
      const data = await fetchSessions();
      setSessions(data.results);
      setError('');
    } catch {
      setError('Failed to load sessions. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 30_000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await loadSessions();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncSession = async (sessionId: number) => {
    setSyncingIds((prev) => new Set(prev).add(sessionId));
    try {
      await syncSession(sessionId);
      setTimeout(loadSessions, 1500);
    } catch {
      // ignore
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const handleApproveSession = async (sessionId: number) => {
    setApprovingIds((prev) => new Set(prev).add(sessionId));
    try {
      await approveSession(sessionId);
      setTimeout(loadSessions, 1000);
    } catch (err) {
      console.error('Failed to approve session:', err);
    } finally {
      setApprovingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const pendingApproval = useMemo(() =>
    sessions.filter((s) => s.status === 'COMPLETED' && !s.is_approved),
    [sessions]
  );

  const processing = useMemo(() =>
    sessions.filter((s) => s.status === 'PROCESSING'),
    [sessions]
  );

  const completedToday = useMemo(() =>
    sessions.filter((s) => {
      return (
        (s.status === 'COMPLETED' || s.status === 'ARCHIVED') &&
        isToday(s.created_at)
      );
    }),
    [sessions]
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'PROCESSING': return <RefreshCw className="w-4 h-4 text-apple-blue animate-spin" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-apple-text-muted" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'PROCESSING': return <Badge variant="default" className="bg-apple-blue">Processing</Badge>;
      case 'PENDING': return <Badge variant="warning">Pending</Badge>;
      case 'FAILED': return <Badge variant="destructive">Failed</Badge>;
      case 'ARCHIVED': return <Badge variant="secondary">Archived</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLabelBadge = (label: string | null) => {
    if (!label) return null;
    switch (label.toUpperCase()) {
      case 'BUG': return <Badge variant="destructive">Bug</Badge>;
      case 'FEATURE': return <Badge variant="success">Feature</Badge>;
      case 'QUESTION': return <Badge variant="warning">Question</Badge>;
      case 'TRIAGE': return <Badge className="bg-violet-500/10 text-violet-700 border border-violet-200">Triage</Badge>;
      case 'DECISION': return <Badge className="bg-blue-500/10 text-blue-700 border border-blue-200">Decision</Badge>;
      case 'IMPROVEMENT': return <Badge className="bg-cyan-500/10 text-cyan-700 border border-cyan-200">Improvement</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">{label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}</Badge>;
    }
  };

  const openModal = (type: 'pending' | 'processing' | 'completed', title: string, filteredSessions: Session[]) => {
    setModalConfig({ type, title, sessions: filteredSessions });
  };

  const closeModal = () => setModalConfig(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') closeModal();
  }, []);

  useEffect(() => {
    if (modalConfig) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [modalConfig, handleKeyDown]);

  const SessionRow = ({ session, showActions = true }: { session: Session; showActions?: boolean }) => (
    <div className="p-4 flex items-center justify-between hover:bg-black/[0.02] transition-colors border-b border-apple-border/30 last:border-b-0">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0">
          {getStatusIcon(session.status)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium font-mono text-sm truncate">{session.plane_issue_id}</p>
            {getLabelBadge(session.triage_label)}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-apple-text-muted">
            <span>{new Date(session.created_at).toLocaleString()}</span>
            {session.project_name && (
              <span className="hidden sm:inline text-apple-text-muted/70">· {session.project_name}</span>
            )}
          </div>
        </div>
      </div>
      {showActions && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {getStatusBadge(session.status)}
          {(session.status === 'FAILED' || session.status === 'PENDING') && (
            <Button
              size="sm"
              variant="outline"
              disabled={syncingIds.has(session.id)}
              onClick={() => handleSyncSession(session.id)}
              className="h-8 px-2"
            >
              {syncingIds.has(session.id) ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </Button>
          )}
          {session.status === 'ARCHIVED' && session.is_approved && (
            <Badge variant="success" className="bg-green-500/10 text-green-600 border-0">
              Approved
            </Badge>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-apple-text">Dashboard</h1>
          <p className="text-apple-text-muted mt-1">Monitor agent sessions and approvals.</p>
        </div>
        <Button onClick={handleSync} disabled={isSyncing} variant="secondary">
          {isSyncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.button
          whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={() => openModal('pending', 'Pending Approval', pendingApproval)}
          className="text-left bg-apple-card/80 backdrop-blur-xl border border-apple-border/50 rounded-2xl p-0 overflow-hidden cursor-pointer"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-apple-text-muted">Pending Approval</p>
                <p className="text-3xl font-light mt-2">{loading ? '—' : pendingApproval.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </motion.button>

        <motion.button
          whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={() => openModal('processing', 'Processing Sessions', processing)}
          className="text-left bg-apple-card/80 backdrop-blur-xl border border-apple-border/50 rounded-2xl p-0 overflow-hidden cursor-pointer"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-apple-text-muted">Processing</p>
                <p className="text-3xl font-light mt-2">{loading ? '—' : processing.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-apple-blue/10 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-apple-blue" />
              </div>
            </div>
          </CardContent>
        </motion.button>

        <motion.button
          whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={() => openModal('completed', 'Completed Today', completedToday)}
          className="text-left bg-apple-card/80 backdrop-blur-xl border border-apple-border/50 rounded-2xl p-0 overflow-hidden cursor-pointer"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-apple-text-muted">Completed Today</p>
                <p className="text-3xl font-light mt-2">{loading ? '—' : completedToday.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </motion.button>
      </div>

      {/* Recent Sessions Dropdown */}
      <div className="bg-apple-card/80 backdrop-blur-xl border border-apple-border/50 rounded-2xl overflow-hidden shadow-sm">
        <motion.button
          initial={false}
          onClick={() => setSessionsDropdownOpen(!sessionsDropdownOpen)}
          className="w-full px-6 py-4 flex items-center justify-between bg-white/30 backdrop-blur-md border-b border-apple-border/50 hover:bg-white/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-apple-text">Recent Sessions</span>
            {!loading && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-medium">
                {sessions.length}
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: sessionsDropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5 text-apple-text-muted" />
          </motion.div>
        </motion.button>

        <AnimatePresence initial={false}>
          {sessionsDropdownOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="divide-y divide-apple-border/50 max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-apple-text-muted" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-8 text-center text-apple-text-muted text-sm">
                    No sessions yet. Celery Beat polls Plane every 5 minutes automatically.
                  </div>
                ) : (
                  sessions.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative bg-apple-card/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-apple-border/50 flex items-center justify-between bg-white/30 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-apple-text">{modalConfig.title}</h2>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-apple-blue/10 text-apple-blue font-medium">
                    {modalConfig.sessions.length}
                  </span>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-xl text-apple-text-muted hover:text-apple-text hover:bg-black/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto">
                {modalConfig.sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-apple-bg flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-apple-text-muted" />
                    </div>
                    <p className="text-apple-text font-medium">No sessions found</p>
                    <p className="text-sm text-apple-text-muted mt-1">
                      There are no {modalConfig.type === 'pending' ? 'sessions pending approval' : modalConfig.type === 'processing' ? 'sessions being processed' : 'sessions completed today'}.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-apple-border/30">
                    {modalConfig.sessions.map((session) => (
                      <div key={session.id} className="p-4 hover:bg-black/[0.02] transition-colors">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0">
                              {getStatusIcon(session.status)}
                            </div>
                            <div>
                              <p className="font-medium font-mono text-sm">{session.plane_issue_id}</p>
                              {getLabelBadge(session.triage_label)}
                            </div>
                          </div>
                          {getStatusBadge(session.status)}
                        </div>

                        <div className="pl-13 space-y-2">
                          <div className="flex items-center gap-4 text-xs text-apple-text-muted">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{new Date(session.created_at).toLocaleString()}</span>
                            </div>
                            {session.project_name && (
                              <div className="flex items-center gap-1.5">
                                <span>·</span>
                                <span>{session.project_name}</span>
                              </div>
                            )}
                          </div>

                          {session.status === 'COMPLETED' && !session.is_approved && (
                            <div className="flex items-center gap-2">
                              <Badge variant="warning" className="text-xs">Awaiting Approval</Badge>
                              <Button
                                size="sm"
                                onClick={() => handleApproveSession(session.id)}
                                disabled={approvingIds.has(session.id)}
                                className="h-7 bg-green-600 hover:bg-green-700 text-white"
                              >
                                {approvingIds.has(session.id) ? (
                                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3 mr-1.5" />
                                )}
                                Approve
                              </Button>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2">
                            {(session.status === 'FAILED' || session.status === 'PENDING') && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={syncingIds.has(session.id)}
                                onClick={() => handleSyncSession(session.id)}
                                className="h-8"
                              >
                                {syncingIds.has(session.id) ? (
                                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                ) : (
                                  <Play className="w-3 h-3 mr-1.5" />
                                )}
                                Retry
                              </Button>
                            )}
                            {session.plane_issue_url && (
                              <a
                                href={session.plane_issue_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-apple-blue hover:underline"
                              >
                                View in Plane
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-apple-border/50 bg-white/20 backdrop-blur-md">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="w-full border-apple-border/60"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
