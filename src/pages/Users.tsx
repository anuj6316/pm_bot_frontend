import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, UserPlus, Search, Shield, Globe, Key, Trash2, Check, X, Copy } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { api } from '@/src/lib/api';
import { useAuth } from '@/src/contexts/AuthContext';
import { toast } from 'sonner';

interface UserData {
  id: number;
  email: string;
  username: string;
  role: string;
  projects: string[];
}

interface Project {
  id: string;
  name: string;
  identifier: string;
}

export function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'developer',
    selected_projects: [] as string[],
  });

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [usersData, projectsData] = await Promise.all([
        api.get<UserData[]>('/user/list_users/'),
        api.get<Project[]>('/user/projects/')
      ]);
      setUsers(usersData);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (err: any) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const projectMap = (Array.isArray(projects) ? projects : []).reduce((acc, p) => ({ ...acc, [p.id.toLowerCase()]: p.name }), {} as Record<string, string>);

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'consultant' || currentUser?.is_superuser;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        projects: formData.selected_projects,
      };

      await api.post('/user/create-user/', payload);
      toast.success('User created successfully!');
      setIsModalOpen(false);
      setFormData({
        email: '',
        username: '',
        password: '',
        role: 'developer',
        selected_projects: [],
      });
      fetchInitialData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.msg || 'Failed to create user';
      toast.error(errorMsg);
    }
  };

  const copyCredentials = () => {
    const text = `Email: ${formData.email}\nPassword: ${formData.password}`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard');
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-apple-text">Team</h1>
          <p className="text-apple-text-muted mt-1">
            {canManage ? 'Manage team roles and project access.' : 'View your project colleagues and team members.'}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-apple-blue hover:bg-apple-blue-hover text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-sm active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </button>
        )}
      </div>

      {/* Stats/Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: UsersIcon, label: 'Total Users', value: users.length, color: 'text-blue-500' },
          { icon: Shield, label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'text-purple-500' },
          { icon: Globe, label: 'Projects Covered', value: new Set(users.flatMap(u => u.projects)).size, color: 'text-green-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-apple-card border border-apple-border/50 p-6 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl bg-white/50", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-apple-text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-apple-text">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & List */}
      <div className="bg-apple-card border border-apple-border/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-apple-border/50 bg-white/30 backdrop-blur-md flex items-center gap-3">
          <Search className="w-4 h-4 text-apple-text-muted" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-apple-text-muted"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5">
                <th className="px-6 py-4 text-xs font-semibold text-apple-text-muted uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-apple-text-muted uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-apple-text-muted uppercase tracking-wider">Project Access</th>
                {canManage && <th className="px-6 py-4 text-xs font-semibold text-apple-text-muted uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-apple-border/30">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-apple-text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-apple-text-muted">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-black/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-apple-blue/10 flex items-center justify-center font-bold text-apple-blue">
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-apple-text">{u.username}</p>
                          <p className="text-xs text-apple-text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
                        u.role === 'admin' ? "bg-purple-100/50 text-purple-600 border-purple-200" :
                          u.role === 'consultant' ? "bg-blue-100/50 text-blue-600 border-blue-200" :
                            "bg-green-100/50 text-green-600 border-green-200"
                      )}>
                        <Shield className="w-3 h-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[350px]">
                        {u.projects.length > 0 ? (
                          u.projects.map(pid => (
                            <span key={pid} className="px-2.5 py-1 rounded-lg bg-apple-blue/5 text-[10px] font-medium text-apple-blue border border-apple-blue/10">
                              {projectMap[pid.toLowerCase()] || pid.slice(0, 8)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-apple-text-muted italic">Global Access</span>
                        )}
                      </div>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-apple-text-muted hover:text-apple-blue rounded-lg hover:bg-black/5">
                            <Key className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-apple-text-muted hover:text-red-500 rounded-lg hover:bg-black/5">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl border border-apple-border/50 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-apple-border/50 bg-apple-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-apple-text">Add New Team Member</h2>
                  <p className="text-sm text-apple-text-muted mt-1">Configure their account and role.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-black/5 rounded-full text-apple-text-muted">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-apple-text ml-1">Username</label>
                  <input
                    required
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-apple-blue transition-all"
                    placeholder="e.g. jdoe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-apple-text ml-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-apple-blue transition-all"
                  >
                    <option value="developer">Developer</option>
                    <option value="consultant">Consultant</option>
                    {currentUser?.role === 'admin' && <option value="admin">Admin</option>}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-apple-text ml-1">Email Address</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-apple-blue transition-all"
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-apple-text ml-1 flex justify-between items-center">
                  Temporary Password
                  <button type="button" onClick={copyCredentials} className="text-[10px] text-apple-blue hover:underline">Copy Credentials</button>
                </label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-black/5 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-apple-blue transition-all font-mono"
                    placeholder="Minimum 8 characters"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <div className={cn("w-2 h-2 rounded-full", formData.password.length >= 8 ? "bg-green-500" : "bg-gray-300")} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-apple-text ml-1">Project Assignment</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-4 bg-black/5 rounded-2xl border border-apple-border/50">
                  {projects.map((proj) => (
                    <label 
                      key={proj.id} 
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer",
                        formData.selected_projects.includes(proj.id) 
                          ? "bg-apple-blue/10 border-apple-blue/30 text-apple-blue" 
                          : "bg-white border-transparent hover:border-apple-border"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.selected_projects.includes(proj.id)}
                        onChange={(e) => {
                          const next = e.target.checked 
                            ? [...formData.selected_projects, proj.id]
                            : formData.selected_projects.filter(id => id !== proj.id);
                          setFormData({ ...formData, selected_projects: next });
                        }}
                      />
                      <div className={cn(
                        "w-4 h-4 rounded-md border flex items-center justify-center transition-colors",
                        formData.selected_projects.includes(proj.id) ? "bg-apple-blue border-apple-blue" : "border-gray-300 bg-white"
                      )}>
                        {formData.selected_projects.includes(proj.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-xs font-medium truncate">{proj.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-apple-text-muted px-1 italic">
                  Note: Consultants and Admins automatically have Global access to all projects.
                </p>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-apple-border rounded-2xl font-semibold text-apple-text hover:bg-black/5 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-3 px-8 py-3 bg-apple-blue hover:bg-apple-blue-hover text-white rounded-2xl font-bold shadow-lg shadow-apple-blue/20 transition-all active:scale-95"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
