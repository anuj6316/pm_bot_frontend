import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListTodo, 
  MessageSquare, 
  Settings, 
  LogOut, 
  User as UserIcon, 
  Users, 
  UserCircle,
  Shield,
  HelpCircle,
  Settings as SettingsIcon,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { Dropdown, DropdownItem, DropdownSeparator, DropdownLabel } from './ui/Dropdown';
import { ProjectSelector } from './ProjectSelector';
import { Logo } from './Logo';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoading } = useAuth();
  const isChat = location.pathname === '/chat';

  React.useEffect(() => {
    if (!isLoading && !user) navigate('/login', { replace: true });
  }, [navigate, user, isLoading]);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ListTodo,        label: 'Issues',    path: '/issues' },
    { icon: MessageSquare,   label: 'Chat',      path: '/chat' },
    { icon: UserCircle,      label: 'Profile',   path: '/profile' },
    { icon: Users,           label: 'Users',     path: '/users' },
    { icon: Settings,        label: 'Settings',  path: '/settings' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getUserInitials = () => {
    if (!user) return '?';
    const first = user.first_name?.charAt(0)?.toUpperCase() || '';
    const last = user.last_name?.charAt(0)?.toUpperCase() || '';
    return first + last || user.username?.charAt(0)?.toUpperCase() || '?';
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user.username || user.email;
  };

  return (
    <div className="flex h-screen w-full bg-apple-bg overflow-hidden text-apple-text">
      {/* Global nav sidebar — always visible */}
      <aside className="w-64 flex-shrink-0 border-r border-apple-border/50 bg-apple-card/50 backdrop-blur-xl flex flex-col z-30">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <Logo className="w-9 h-9 shadow-lg shadow-apple-blue/20" />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-br from-apple-text to-apple-text/70 bg-clip-text text-transparent">PM.ai</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-apple-blue/10 text-apple-blue'
                    : 'text-apple-text-muted hover:bg-black/5 hover:text-apple-text',
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-apple-border/50">
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {user ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-apple-blue/10 border border-apple-blue/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-semibold text-apple-blue">{getUserInitials()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-apple-text truncate">{getUserDisplayName()}</p>
                    <p className="text-xs text-apple-text-muted truncate">{user.email}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-apple-text truncate">Loading...</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex-shrink-0 flex items-center justify-center w-7 h-7 text-apple-text-muted hover:text-apple-text rounded-lg hover:bg-black/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col relative">
        {/* Top Header */}
        <header className="h-16 border-b border-apple-border/50 bg-apple-card/50 backdrop-blur-xl flex items-center justify-between px-8 flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <ProjectSelector />
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 text-apple-text-muted hover:text-apple-text hover:bg-black/5 rounded-full transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-black/5 transition-colors border border-transparent hover:border-apple-border/50">
                  <div className="w-8 h-8 rounded-full bg-apple-blue/10 border border-apple-blue/20 flex items-center justify-center overflow-hidden">
                    {user ? (
                      <span className="text-[11px] font-semibold text-apple-blue">{getUserInitials()}</span>
                    ) : (
                      <UserIcon className="w-4 h-4 text-apple-text-muted" />
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-apple-text-muted" />
                </button>
              }
            >
              <DropdownLabel>Account</DropdownLabel>
              <div className="px-3 py-2 mb-1">
                <p className="text-sm font-semibold">{getUserDisplayName()}</p>
                <p className="text-xs text-apple-text-muted truncate">{user?.email}</p>
              </div>
              <DropdownSeparator />
              <DropdownItem onClick={() => navigate('/profile')}>
                <UserCircle className="w-4 h-4" />
                Profile
              </DropdownItem>
              <DropdownItem onClick={() => navigate('/settings')}>
                <SettingsIcon className="w-4 h-4" />
                Settings
              </DropdownItem>
              <DropdownItem onClick={() => navigate('/users')}>
                <Shield className="w-4 h-4" />
                Admin
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem onClick={handleLogout} variant="danger">
                <LogOut className="w-4 h-4" />
                Sign out
              </DropdownItem>
            </Dropdown>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {isChat
            ? <div className="flex-1 flex min-h-0"><Outlet /></div>
            : (
              <div className="flex-1 overflow-y-auto p-8 w-full">
                <Outlet />
              </div>
            )}
        </div>
      </main>
    </div>
  );
}