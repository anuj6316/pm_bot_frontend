import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Mail, Calendar, Shield, Key, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';

const roleConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  admin: { label: 'Admin', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  consultant: { label: 'Consultant', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  developer: { label: 'Developer', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
};

export function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const [profileSuccess, setProfileSuccess] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
    }
  }, [user]);

  useEffect(() => {
    if (profileSuccess) {
      const timer = setTimeout(() => setProfileSuccess(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccess]);

  useEffect(() => {
    if (passwordSuccess) {
      const timer = setTimeout(() => {
        setPasswordSuccess('');
        navigate('/login', { replace: true });
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [passwordSuccess, navigate]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    const config = roleConfig[role] || roleConfig.developer;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}>
        <Shield className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const handleProfileSave = async () => {
    const errors: { firstName?: string; lastName?: string } = {};

    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setProfileErrors({});
    setProfileLoading(true);

    try {
      await updateProfile({ first_name: firstName.trim(), last_name: lastName.trim() });
      setProfileSuccess('Profile updated successfully');
    } catch (err) {
      setProfileErrors({
        firstName: err instanceof Error ? err.message : 'Failed to update profile',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    const errors: { oldPassword?: string; newPassword?: string; confirmPassword?: string } = {};

    if (!oldPassword) {
      errors.oldPassword = 'Current password is required';
    }
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    setPasswordLoading(true);

    try {
      await changePassword(oldPassword, newPassword, confirmPassword);
      setPasswordSuccess('Password changed successfully. Redirecting to login...');
    } catch (err) {
      setPasswordErrors({
        oldPassword: err instanceof Error ? err.message : 'Failed to change password',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-apple-text-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-apple-text">Profile</h1>
        <p className="text-apple-text-muted mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-apple-card/80 backdrop-blur-xl border border-apple-border/50 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-apple-border/50 bg-white/30 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-apple-text flex items-center gap-2">
              <User className="w-5 h-5 text-apple-blue" />
              Personal Information
            </h2>
          </div>

          <div className="p-6">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-apple-blue flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-white font-bold text-2xl">{getUserInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-apple-text">{getUserDisplayName()}</h3>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-apple-text-muted">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-apple-text-muted">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>Joined {formatDate(user.date_joined)}</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                {getRoleBadge(user.role)}
              </div>
            </div>

            <div className="border-t border-apple-border/30 pt-6">
              <h4 className="text-sm font-medium text-apple-text mb-4">Edit Profile</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-apple-text-muted uppercase tracking-wide">First Name</label>
                  <Input
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setProfileErrors((prev) => ({ ...prev, firstName: undefined }));
                    }}
                    placeholder="Enter first name"
                    className="border-apple-border/60 focus:ring-apple-blue/30 focus:border-apple-blue"
                  />
                  {profileErrors.firstName && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {profileErrors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-apple-text-muted uppercase tracking-wide">Last Name</label>
                  <Input
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setProfileErrors((prev) => ({ ...prev, lastName: undefined }));
                    }}
                    placeholder="Enter last name"
                    className="border-apple-border/60 focus:ring-apple-blue/30 focus:border-apple-blue"
                  />
                  {profileErrors.lastName && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {profileErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-medium text-apple-text-muted uppercase tracking-wide">Username</label>
                <Input
                  value={user.username || ''}
                  disabled
                  className="bg-apple-bg/50 border-apple-border/40 text-apple-text-muted"
                />
                <p className="text-[11px] text-apple-text-muted/70">Username cannot be changed</p>
              </div>

              {profileSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-4">
                  <Check className="w-4 h-4" />
                  {profileSuccess}
                </div>
              )}

              <Button
                onClick={handleProfileSave}
                disabled={profileLoading}
                className="bg-apple-blue hover:bg-apple-blue-hover text-white"
              >
                {profileLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-apple-card/80 backdrop-blur-xl border border-apple-border/50 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-apple-border/50 bg-white/30 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-apple-text flex items-center gap-2">
              <Key className="w-5 h-5 text-apple-blue" />
              Change Password
            </h2>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-apple-text-muted uppercase tracking-wide">Current Password</label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      setPasswordErrors((prev) => ({ ...prev, oldPassword: undefined }));
                    }}
                    placeholder="Enter current password"
                    className="pr-10 border-apple-border/60 focus:ring-apple-blue/30 focus:border-apple-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-text-muted hover:text-apple-text transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.oldPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {passwordErrors.oldPassword}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-apple-text-muted uppercase tracking-wide">New Password</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }));
                    }}
                    placeholder="Enter new password (min. 8 characters)"
                    className="pr-10 border-apple-border/60 focus:ring-apple-blue/30 focus:border-apple-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-text-muted hover:text-apple-text transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-apple-text-muted uppercase tracking-wide">Confirm New Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="Confirm new password"
                    className="pr-10 border-apple-border/60 focus:ring-apple-blue/30 focus:border-apple-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-text-muted hover:text-apple-text transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {passwordSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mt-4">
                <Check className="w-4 h-4" />
                {passwordSuccess}
              </div>
            )}

            <Button
              onClick={handlePasswordChange}
              disabled={passwordLoading || !oldPassword || !newPassword || !confirmPassword}
              className="mt-4 bg-apple-blue hover:bg-apple-blue-hover text-white"
            >
              {passwordLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
