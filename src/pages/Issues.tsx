import React, { useEffect, useState, useCallback } from 'react';
import {
  Loader2, RefreshCw, ChevronDown, ChevronRight,
  Folder, AlertCircle, ArrowUp, ArrowDown, Minus, Circle,
  Plus, GitBranch, X, Check, FolderOpen,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import {
  fetchIssuesByProject,
  createIssue,
  createSubtask,
  type ProjectGroup,
  type PlaneIssue,
} from '@/src/lib/api';
import { useProject } from '@/src/contexts/ProjectContext';

// ─── Priority helpers ─────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  urgent: { label: 'Urgent', icon: <AlertCircle className="w-3 h-3" />, cls: 'text-red-600 bg-red-50 border-red-200' },
  high:   { label: 'High',   icon: <ArrowUp className="w-3 h-3" />,    cls: 'text-orange-600 bg-orange-50 border-orange-200' },
  medium: { label: 'Medium', icon: <Minus className="w-3 h-3" />,      cls: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  low:    { label: 'Low',    icon: <ArrowDown className="w-3 h-3" />,  cls: 'text-blue-600 bg-blue-50 border-blue-200' },
  none:   { label: 'None',   icon: <Circle className="w-3 h-3" />,     cls: 'text-gray-500 bg-gray-50 border-gray-200' },
};

const PRIORITY_OPTIONS = ['none', 'low', 'medium', 'high', 'urgent'] as const;

const STATE_GROUP_COLOR: Record<string, string> = {
  backlog:     'bg-gray-400',
  unstarted:   'bg-gray-400',
  started:     'bg-yellow-400',
  in_progress: 'bg-blue-400',
  completed:   'bg-green-500',
  cancelled:   'bg-red-400',
};

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.none;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] font-medium border rounded px-1.5 py-0.5 flex-shrink-0',
      cfg.cls,
    )}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function StateDot({ group }: { group: string }) {
  return (
    <span className={cn(
      'w-2 h-2 rounded-full flex-shrink-0',
      STATE_GROUP_COLOR[group?.toLowerCase()] ?? 'bg-gray-300',
    )} />
  );
}

// ─── Inline subtask creation form ────────────────────────────────────────────

function SubtaskForm({
  projectId,
  parentIssueId,
  onCreated,
  onCancel,
}: {
  projectId: string;
  parentIssueId: string;
  onCreated: (issue: PlaneIssue) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<string>('none');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const newIssue = await createSubtask({ project_id: projectId, parent_issue_id: parentIssueId, name: name.trim(), priority });
      onCreated(newIssue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subtask');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 py-3 bg-blue-50/60 border-t border-blue-200/50">
      <div className="flex items-center gap-2">
        <GitBranch className="w-3.5 h-3.5 text-apple-blue flex-shrink-0" />
        <span className="text-xs font-semibold text-apple-blue">New Sub-task</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sub-task title…"
          className="flex-1 text-sm px-3 py-1.5 border border-apple-border/60 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="text-xs px-2 py-1.5 border border-apple-border/60 rounded-lg bg-white focus:outline-none cursor-pointer"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="p-1.5 rounded-lg bg-apple-blue text-white hover:bg-apple-blue/80 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg text-apple-text-muted hover:bg-black/10 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}

// ─── Issue row (with inline subtask toggle) ────────────────────────────────────

function IssueRow({
  issue,
  projectId,
  onSubtaskCreated,
}: {
  issue: PlaneIssue & { subtasks?: PlaneIssue[] };
  projectId: string;
  onSubtaskCreated: (subtask: PlaneIssue, parentId: string) => void;
  key?: React.Key;
}) {
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/[0.02] transition-colors border-b border-apple-border/30 last:border-0 group">
        <StateDot group={issue.state_group} />
        <span className="text-[10px] font-mono text-apple-text-muted w-16 flex-shrink-0">
          {issue.project_identifier}-{issue.sequence_id ?? '?'}
        </span>
        <p className="flex-1 text-sm font-medium text-apple-text truncate">{issue.name}</p>
        <span className="text-[11px] text-apple-text-muted hidden md:block w-24 flex-shrink-0 text-right truncate">{issue.state}</span>
        <PriorityBadge priority={issue.priority} />
        {/* Add subtask button */}
        <button
          onClick={() => setShowSubtaskForm(!showSubtaskForm)}
          title="Add sub-task"
          className={cn(
            'p-1 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0',
            showSubtaskForm ? 'opacity-100 bg-apple-blue/10 text-apple-blue' : 'text-apple-text-muted hover:bg-black/8',
          )}
        >
          <GitBranch className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Inline subtask form */}
      {showSubtaskForm && (
        <SubtaskForm
          projectId={projectId}
          parentIssueId={issue.id}
          onCreated={(sub) => {
            onSubtaskCreated(sub, issue.id);
            setShowSubtaskForm(false);
          }}
          onCancel={() => setShowSubtaskForm(false)}
        />
      )}

      {/* Existing subtasks */}
      {(issue.subtasks ?? []).map((sub) => (
        <div key={sub.id} className="flex items-center gap-3 pl-10 pr-4 py-2 bg-black/[0.012] border-b border-apple-border/20 last:border-0">
          <GitBranch className="w-3 h-3 text-apple-text-muted flex-shrink-0" />
          <StateDot group={sub.state_group} />
          <span className="text-[9px] font-mono text-apple-text-muted w-16 flex-shrink-0">
            {sub.project_identifier}-{sub.sequence_id ?? '?'}
          </span>
          <p className="flex-1 text-xs text-apple-text truncate">{sub.name}</p>
          <PriorityBadge priority={sub.priority} />
        </div>
      ))}
    </>
  );
}

// ─── New issue form (per project) ─────────────────────────────────────────────

function NewIssueForm({
  projectId,
  onCreated,
  onCancel,
}: {
  projectId: string;
  onCreated: (issue: PlaneIssue) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<string>('none');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const newIssue = await createIssue({ project_id: projectId, name: name.trim(), priority });
      onCreated(newIssue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 py-3 bg-green-50/50 border-t border-green-200/50">
      <div className="flex items-center gap-2">
        <Plus className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
        <span className="text-xs font-semibold text-green-700">New Issue</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Issue title…"
          className="flex-1 text-sm px-3 py-1.5 border border-apple-border/60 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-500"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="text-xs px-2 py-1.5 border border-apple-border/60 rounded-lg bg-white focus:outline-none cursor-pointer"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="p-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg text-apple-text-muted hover:bg-black/10 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}

// ─── Project section ──────────────────────────────────────────────────────────

type EnrichedIssue = PlaneIssue & { subtasks?: PlaneIssue[] };
type EnrichedGroup = { project: ProjectGroup['project']; issues: EnrichedIssue[] };

function ProjectSection({ group, onRefresh }: { group: EnrichedGroup; onRefresh: () => void; key?: React.Key }) {
  const [expanded, setExpanded] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [localIssues, setLocalIssues] = useState<EnrichedIssue[]>(group.issues);

  // keep in sync if parent data refreshes
  useEffect(() => setLocalIssues(group.issues), [group.issues]);

  const handleNewIssue = (newIssue: PlaneIssue) => {
    const enriched: EnrichedIssue = {
      ...newIssue,
      project_id: group.project.id,
      project_name: group.project.name,
      project_identifier: group.project.identifier,
      subtasks: [],
    };
    setLocalIssues((prev) => [...prev, enriched]);
    setShowNewForm(false);
  };

  const handleSubtaskCreated = (subtask: PlaneIssue, parentId: string) => {
    setLocalIssues((prev) =>
      prev.map((i) => i.id === parentId
        ? { ...i, subtasks: [...(i.subtasks ?? []), { ...subtask, project_id: group.project.id, project_name: group.project.name, project_identifier: group.project.identifier }] }
        : i,
      ),
    );
  };

  return (
    <div className="border border-apple-border/50 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center bg-white hover:bg-black/[0.015] transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 px-4 py-3 flex-1 text-left"
        >
          {expanded ? <ChevronDown className="w-4 h-4 text-apple-text-muted" /> : <ChevronRight className="w-4 h-4 text-apple-text-muted" />}
          <Folder className="w-4 h-4 text-apple-blue flex-shrink-0" />
          <span className="font-semibold text-sm text-apple-text">{group.project.name}</span>
          <span className="text-xs font-mono text-apple-text-muted bg-black/5 rounded-full px-2 py-0.5 ml-auto">
            {localIssues.length} issue{localIssues.length !== 1 ? 's' : ''}
          </span>
        </button>
        {/* Add issue button always visible */}
        <button
          onClick={() => { setExpanded(true); setShowNewForm(true); }}
          title="Add issue to this project"
          className="flex items-center gap-1.5 px-3 py-3 text-apple-text-muted hover:text-green-600 hover:bg-green-50 transition-colors text-xs font-medium border-l border-apple-border/30"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {expanded && (
        <div className="border-t border-apple-border/40 bg-white/50">
          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 py-1.5 bg-black/[0.015] border-b border-apple-border/30">
            <span className="w-2 h-2 flex-shrink-0" />
            <span className="text-[10px] font-semibold text-apple-text-muted uppercase tracking-wide w-16 flex-shrink-0">ID</span>
            <span className="flex-1 text-[10px] font-semibold text-apple-text-muted uppercase tracking-wide">Title</span>
            <span className="hidden md:block w-24 text-right text-[10px] font-semibold text-apple-text-muted uppercase tracking-wide flex-shrink-0">State</span>
            <span className="text-[10px] font-semibold text-apple-text-muted uppercase tracking-wide flex-shrink-0">Priority</span>
            <span className="w-6 flex-shrink-0" />{/* space for sub-task btn */}
          </div>

          {localIssues.length === 0 ? (
            <div className="px-4 py-6 text-center text-apple-text-muted text-sm">
              No issues in this project
            </div>
          ) : (
            localIssues.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                projectId={group.project.id}
                onSubtaskCreated={handleSubtaskCreated}
              />
            ))
          )}

          {showNewForm && (
            <NewIssueForm
              projectId={group.project.id}
              onCreated={handleNewIssue}
              onCancel={() => setShowNewForm(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Issues page ─────────────────────────────────────────────────────────

export function Issues() {
  const { selectedProject, availableProjects } = useProject();
  const [groups, setGroups] = useState<EnrichedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchIssuesByProject();
      setGroups(data.map((g) => ({ ...g, issues: g.issues.map((i) => ({ ...i, subtasks: [] })) })));
    } catch {
      setError('Failed to fetch issues. Check that PLANE_API_TOKEN is configured in the backend .env file.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  // Filter groups by selected project
  const filteredGroups = React.useMemo(() => {
    let result = search.trim()
      ? groups
          .map((g) => ({
            ...g,
            issues: g.issues.filter(
              (i) =>
                i.name.toLowerCase().includes(search.toLowerCase()) ||
                g.project.name.toLowerCase().includes(search.toLowerCase()),
            ),
          }))
          .filter((g) => g.issues.length > 0)
      : groups;

    // Filter by selected project
    if (selectedProject) {
      result = result.filter((g) => g.project.id === selectedProject.id);
    }

    return result;
  }, [groups, search, selectedProject]);

  const totalIssues = filteredGroups.reduce((sum, g) => sum + g.issues.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Issues</h1>
          <p className="text-apple-text-muted mt-1">
            {loading ? 'Loading…' : (
              selectedProject
                ? `${totalIssues} issue${totalIssues !== 1 ? 's' : ''} in ${selectedProject.name}`
                : `${totalIssues} issues across ${filteredGroups.length} project${filteredGroups.length !== 1 ? 's' : ''}`
            )}
          </p>
        </div>
        <button
          onClick={loadIssues}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-apple-border/60 rounded-xl hover:bg-black/5 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder={selectedProject ? `Search issues in ${selectedProject.name}…` : 'Search issues or projects…'}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 text-sm border border-apple-border/60 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue transition"
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-7 h-7 animate-spin text-apple-text-muted" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="border border-apple-border/40 rounded-xl p-12 text-center">
          {availableProjects.length === 0 ? (
            <div className="space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto text-apple-text-muted" />
              <p className="text-apple-text-muted text-sm">No projects available</p>
              <p className="text-apple-text-muted/60 text-xs">Contact your administrator to get project access</p>
            </div>
          ) : search ? (
            <p className="text-apple-text-muted text-sm">No issues match your search.</p>
          ) : (
            <div className="space-y-2">
              <Folder className="w-10 h-10 mx-auto text-apple-text-muted" />
              <p className="text-apple-text-muted text-sm">No issues found</p>
              {selectedProject && (
                <p className="text-apple-text-muted/60 text-xs">in {selectedProject.name}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => (
            <ProjectSection key={group.project.id} group={group} onRefresh={loadIssues} />
          ))}
        </div>
      )}
    </div>
  );
}
