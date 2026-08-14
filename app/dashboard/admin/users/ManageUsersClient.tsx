'use client';

/**
 * @file app/dashboard/admin/users/ManageUsersClient.tsx
 * @description Client Component for Manage Users in Admin Dashboard.
 * Features Part A (Create User with Generated Password & Resend Welcome Email)
 * and Part B (Role-Grouped Collapsible Accordions with Edit, Reset Password, Disable/Enable, and Delete modals).
 */

import { useState, useTransition, useMemo } from 'react';
import {
  inviteUserAction,
  updateUserProfileAction,
  deleteUserAction,
  toggleUserDisabledAction,
  resetUserPasswordAction,
} from '@/app/dashboard/admin/actions';
import { Profile, UserRole } from '@/lib/types/database';
import {
  UserPlus,
  Users,
  Shield,
  Phone,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  Search,
  ChevronDown,
  ChevronRight,
  Edit2,
  Briefcase,
  ShieldCheck,
  Trash2,
  Ban,
  Lock,
  Key,
  Copy,
  RotateCcw,
} from 'lucide-react';

export interface UserProfileWithEmail extends Profile {
  email?: string;
}

interface ManageUsersClientProps {
  profiles: UserProfileWithEmail[];
  actingUserRole: UserRole;
  currentUserId: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  parent: 'Parent',
  teacher: 'Teacher',
  admin: 'School Admin',
  super_admin: 'Super Admin',
};

const ROLE_SECTION_TITLES: Record<UserRole, string> = {
  teacher: 'Teachers',
  admin: 'School Admins',
  parent: 'Parents',
  super_admin: 'Super Admins',
};

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  parent: 'bg-blue-50 text-blue-700 border-blue-200',
  teacher: 'bg-purple-50 text-purple-700 border-purple-200',
  admin: 'bg-amber-50 text-amber-800 border-amber-200',
  super_admin: 'bg-red-50 text-red-800 border-red-200 font-bold',
};

export default function ManageUsersClient({
  profiles,
  actingUserRole,
  currentUserId,
}: ManageUsersClientProps) {
  const isSuperAdmin = actingUserRole === 'super_admin';

  // Part A: Form State
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteFullName, setInviteFullName] = useState<string>('');
  const [invitePhone, setInvitePhone] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<UserRole>('parent');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdPasswordNotice, setCreatedPasswordNotice] = useState<{
    password: string;
    message: string;
  } | null>(null);

  // Part B: Modals State
  const [editingUser, setEditingUser] = useState<UserProfileWithEmail | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('parent');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingUser, setDeletingUser] = useState<UserProfileWithEmail | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [togglingUser, setTogglingUser] = useState<UserProfileWithEmail | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const [resettingUser, setResettingUser] = useState<UserProfileWithEmail | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Search Filter
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Feedback Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const availableAssignRoles: UserRole[] = isSuperAdmin
    ? ['parent', 'teacher', 'admin', 'super_admin']
    : ['parent', 'teacher', 'admin'];

  const displayRoleSections: UserRole[] = isSuperAdmin
    ? ['teacher', 'admin', 'parent', 'super_admin']
    : ['teacher', 'admin', 'parent'];

  // Group profiles by role
  const { filteredProfiles, profilesByRole } = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const filtered = profiles.filter(
      (p) =>
        p.full_name.toLowerCase().includes(term) ||
        (p.email && p.email.toLowerCase().includes(term)) ||
        (p.phone && p.phone.toLowerCase().includes(term))
    );

    const map: Record<UserRole, UserProfileWithEmail[]> = {
      parent: [],
      teacher: [],
      admin: [],
      super_admin: [],
    };

    filtered.forEach((p) => {
      if (map[p.role]) {
        map[p.role].push(p);
      }
    });

    return { filteredProfiles: filtered, profilesByRole: map };
  }, [profiles, searchTerm]);

  // Accordion Expand/Collapse State
  const [expandedSections, setExpandedSections] = useState<Record<UserRole, boolean>>({
    teacher: true,
    admin: true,
    parent: true,
    super_admin: false,
  });

  const toggleSection = (role: UserRole) => {
    setExpandedSections((prev) => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  // --- Handlers: Create User ---
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setSuccessMessage(null);
    setCreatedPasswordNotice(null);

    const emailVal = inviteEmail.trim();
    const nameVal = inviteFullName.trim();
    const phoneVal = invitePhone.trim();

    if (!emailVal) {
      setInviteError('Please enter an email address.');
      return;
    }

    if (!isSuperAdmin && inviteRole === 'super_admin') {
      setInviteError('Only super_admin users can assign a super_admin role.');
      return;
    }

    startTransition(async () => {
      const res = await inviteUserAction(emailVal, nameVal, inviteRole, phoneVal);

      if (res.error) {
        setInviteError(res.error);
      } else {
        if (res.generatedPassword) {
          setCreatedPasswordNotice({
            password: res.generatedPassword,
            message: res.message || 'Account created successfully!',
          });
        }
        setSuccessMessage(`Created account for ${emailVal} (${ROLE_LABELS[inviteRole]}).`);
        setInviteEmail('');
        setInviteFullName('');
        setInvitePhone('');
        setInviteRole('parent');
      }
    });
  };

  // --- Handlers: Edit Profile ---
  const handleOpenEditModal = (user: UserProfileWithEmail) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditPhone(user.phone || '');
    setEditError(null);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditError(null);
    setSuccessMessage(null);

    if (!isSuperAdmin && (editingUser.role === 'super_admin' || editRole === 'super_admin')) {
      setEditError('Only super_admin users can assign or modify super_admin profiles.');
      return;
    }

    startTransition(async () => {
      const res = await updateUserProfileAction(editingUser.id, editRole, editPhone);

      if (res.error) {
        setEditError(res.error);
      } else {
        setSuccessMessage(
          `Updated profile details for ${editingUser.full_name} (${ROLE_LABELS[editRole]}).`
        );
        setEditingUser(null);
      }
    });
  };

  // --- Handlers: Reset Password ---
  const handleOpenResetPasswordModal = (user: UserProfileWithEmail) => {
    setResettingUser(user);
    setResetError(null);
  };

  const handleConfirmResetPassword = () => {
    if (!resettingUser) return;

    setResetError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await resetUserPasswordAction(resettingUser.id);

      if (res.error) {
        setResetError(res.error);
      } else {
        if (res.generatedPassword) {
          setCreatedPasswordNotice({
            password: res.generatedPassword,
            message: res.message || `Password reset successfully for ${resettingUser.full_name}.`,
          });
        }
        setSuccessMessage(`Reset password for ${resettingUser.full_name}.`);
        setResettingUser(null);
      }
    });
  };

  // --- Handlers: Disable / Enable User ---
  const handleOpenToggleDisabledModal = (user: UserProfileWithEmail) => {
    setTogglingUser(user);
    setToggleError(null);
  };

  const handleConfirmToggleDisabled = () => {
    if (!togglingUser) return;

    setToggleError(null);
    setSuccessMessage(null);

    const willDisable = !togglingUser.is_disabled;

    startTransition(async () => {
      const res = await toggleUserDisabledAction(togglingUser.id, willDisable);

      if (res.error) {
        setToggleError(res.error);
      } else {
        setSuccessMessage(
          `Successfully ${willDisable ? 'disabled' : 're-enabled'} account for ${
            togglingUser.full_name
          }.`
        );
        setTogglingUser(null);
      }
    });
  };

  // --- Handlers: Delete User ---
  const handleOpenDeleteModal = (user: UserProfileWithEmail) => {
    setDeletingUser(user);
    setDeleteConfirmText('');
    setDeleteError(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;

    setDeleteError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await deleteUserAction(deletingUser.id);

      if (res.error) {
        setDeleteError(res.error);
      } else {
        setSuccessMessage(
          `Successfully deleted account for ${deletingUser.full_name} (${deletingUser.email}).`
        );
        setDeletingUser(null);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-olive-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-3 h-8 bg-schoolYellow-500 rounded-full" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-olive-900 tracking-tight">
              Manage Users & Roles
            </h1>
          </div>
          <p className="text-olive-700 text-sm font-medium">
            Create user accounts, reset passwords, manage roles, and toggle account access.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-olive-50 border border-olive-200 px-3.5 py-2 rounded-xl text-xs font-bold text-olive-800 shrink-0">
          <Shield className="w-4 h-4 text-schoolYellow-600" />
          <span>Acting Role: {ROLE_LABELS[actingUserRole]}</span>
        </div>
      </div>

      {/* Global Success Feedback */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 text-sm">
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Created/Reset Password Notice Banner */}
      {createdPasswordNotice && (
        <div className="p-5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-amber-950 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-extrabold text-sm">
              <Key className="w-5 h-5 text-amber-700" />
              <span>Temporary Account Credentials</span>
            </div>
            <button
              onClick={() => setCreatedPasswordNotice(null)}
              className="text-amber-800 hover:text-amber-950 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs font-medium text-amber-900">
            {createdPasswordNotice.message}
          </p>
          <div className="p-3.5 bg-white border border-amber-200 rounded-xl flex items-center justify-between font-mono text-sm font-bold text-olive-950">
            <span>Temp Password: {createdPasswordNotice.password}</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(createdPasswordNotice.password)}
              className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-sans rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
        </div>
      )}

      {/* PART A: CREATE NEW USER FORM */}
      <div className="bg-white rounded-2xl border border-olive-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-olive-900 text-white flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-schoolYellow-500 flex items-center justify-center text-olive-950 font-bold">
            <UserPlus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-extrabold text-base tracking-tight">
              Part A — Create User Account
            </h2>
            <p className="text-2xs text-olive-300 font-medium">
              Generates a crypto password, dispatches a welcome email via Resend, and forces password change on first login.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-olive-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                Full Name (Optional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-olive-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-olive-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. +234 800 123 4567"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                Assign Role <span className="text-red-500">*</span>
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
              >
                {availableAssignRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {inviteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{inviteError}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPending || !inviteEmail.trim()}
              className="px-6 py-2.5 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Create Account & Send Email</span>
            </button>
          </div>
        </form>
      </div>

      {/* PART B: ROLE-GROUPED ACCORDIONS */}
      <div className="space-y-4">
        {/* Section Header & Filter */}
        <div className="bg-white rounded-2xl p-5 border border-olive-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <Users className="w-5 h-5 text-olive-800" />
            <h2 className="font-extrabold text-olive-900 text-base">
              Part B — Existing School Users ({filteredProfiles.length})
            </h2>
          </div>

          {/* Search Filter */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-olive-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-olive-200 rounded-xl text-xs font-medium text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
            />
          </div>
        </div>

        {/* Role Accordions List */}
        {displayRoleSections.map((roleKey) => {
          const roleUsers = profilesByRole[roleKey] || [];
          const isExpanded = expandedSections[roleKey] ?? false;

          return (
            <div
              key={roleKey}
              className="bg-white rounded-2xl border border-olive-200 shadow-sm overflow-hidden transition-all"
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleSection(roleKey)}
                className="w-full p-5 bg-olive-50/80 hover:bg-olive-100/70 border-b border-olive-200 flex items-center justify-between transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-olive-200/70 text-olive-900 rounded-lg">
                    {roleKey === 'teacher' && <Briefcase className="w-5 h-5" />}
                    {roleKey === 'admin' && <ShieldCheck className="w-5 h-5 text-amber-700" />}
                    {roleKey === 'parent' && <User className="w-5 h-5 text-blue-700" />}
                    {roleKey === 'super_admin' && <Shield className="w-5 h-5 text-red-700" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <h3 className="font-extrabold text-olive-900 text-base">
                        {ROLE_SECTION_TITLES[roleKey]}
                      </h3>
                      <span className="px-2.5 py-0.5 bg-schoolYellow-100 border border-schoolYellow-300 text-olive-950 text-xs font-bold rounded-full font-mono">
                        {roleUsers.length} {roleUsers.length === 1 ? 'User' : 'Users'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-olive-600 font-bold text-xs">
                  <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-olive-800" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-olive-800" />
                  )}
                </div>
              </button>

              {/* Accordion Content Section */}
              {isExpanded && (
                <div className="divide-y divide-olive-100 bg-white">
                  {roleUsers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-olive-500 font-medium italic">
                      No {ROLE_SECTION_TITLES[roleKey].toLowerCase()} currently registered.
                    </div>
                  ) : (
                    roleUsers.map((user) => {
                      const isSuperAdminRow = user.role === 'super_admin';
                      const isRowLocked = isSuperAdminRow && !isSuperAdmin;
                      const isSelf = user.id === currentUserId;
                      const isDisabled = user.is_disabled ?? false;

                      return (
                        <div
                          key={user.id}
                          className={`p-4 sm:p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isDisabled ? 'bg-red-50/30' : 'hover:bg-olive-50/40'
                          }`}
                        >
                          <div className="flex items-center space-x-3.5 min-w-0">
                            {/* User Initials Avatar */}
                            <div className="w-10 h-10 rounded-xl bg-olive-800 text-schoolYellow-400 font-bold text-sm flex items-center justify-center shrink-0 border border-olive-900">
                              {user.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase() || 'U'}
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-sm text-olive-950 truncate">
                                  {user.full_name}
                                </h4>
                                {isSelf && (
                                  <span className="px-2 py-0.5 bg-olive-100 text-olive-800 rounded text-2xs font-bold">
                                    You
                                  </span>
                                )}
                                {isDisabled && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded text-2xs font-extrabold flex items-center space-x-1">
                                    <Ban className="w-3 h-3" />
                                    <span>Disabled</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 text-xs text-olive-600 font-medium">
                                {user.email && (
                                  <span className="truncate flex items-center space-x-1">
                                    <Mail className="w-3.5 h-3.5 text-olive-400" />
                                    <span>{user.email}</span>
                                  </span>
                                )}
                                {user.phone ? (
                                  <span className="flex items-center space-x-1 text-olive-800 font-semibold">
                                    <Phone className="w-3.5 h-3.5 text-olive-500" />
                                    <span>{user.phone}</span>
                                  </span>
                                ) : (
                                  <span className="text-olive-400 italic">No Phone</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions Bar */}
                          <div className="flex items-center space-x-2 shrink-0">
                            {/* Role Badge */}
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs border ${
                                ROLE_BADGE_STYLES[user.role]
                              }`}
                            >
                              {ROLE_LABELS[user.role]}
                            </span>

                            {!isRowLocked ? (
                              <>
                                {/* Edit Profile Button */}
                                <button
                                  onClick={() => handleOpenEditModal(user)}
                                  className="px-2.5 py-1.5 text-xs font-bold text-olive-800 bg-olive-100 hover:bg-olive-200 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                                  title="Edit profile & role"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>

                                {/* Reset Password Button */}
                                <button
                                  onClick={() => handleOpenResetPasswordModal(user)}
                                  className="px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                                  title="Generate new temporary password"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Reset Password</span>
                                </button>

                                {/* Disable / Enable Toggle Button */}
                                {!isSelf && (
                                  <button
                                    onClick={() => handleOpenToggleDisabledModal(user)}
                                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer ${
                                      isDisabled
                                        ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    }`}
                                    title={isDisabled ? 'Re-enable account' : 'Disable account'}
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    <span>{isDisabled ? 'Enable' : 'Disable'}</span>
                                  </button>
                                )}

                                {/* Delete Button */}
                                {!isSelf && (
                                  <button
                                    onClick={() => handleOpenDeleteModal(user)}
                                    className="px-2.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                                    title="Delete account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-2xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                                Locked (Super Admin)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ================= MODAL 1: EDIT USER PROFILE ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-olive-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-olive-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-olive-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-schoolYellow-500 flex items-center justify-center text-olive-950 font-bold">
                  <Edit2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight">
                    Edit User Profile
                  </h3>
                  <p className="text-2xs text-olive-300 font-medium">
                    {editingUser.full_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                disabled={isPending}
                className="p-1 text-olive-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                  Account Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  disabled={isPending}
                  className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                >
                  {availableAssignRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-olive-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. +234 800 123 4567"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  />
                </div>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={isPending}
                  className="px-4 py-2 border border-olive-300 rounded-xl text-xs font-bold text-olive-800 hover:bg-olive-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: RESET PASSWORD ================= */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-olive-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-olive-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-amber-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-schoolYellow-500 flex items-center justify-center text-olive-950 font-bold">
                  <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-extrabold text-lg tracking-tight">
                  Reset Password
                </h3>
              </div>
              <button
                onClick={() => setResettingUser(null)}
                disabled={isPending}
                className="p-1 text-amber-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-olive-900">
                Are you sure you want to reset the password for <span className="font-bold text-olive-950">{resettingUser.full_name}</span> ({resettingUser.email})?
              </p>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs font-semibold leading-relaxed">
                This will immediately invalidate their current password, generate a new 12-character temporary password, and force them to set a new password on their next login.
              </div>

              {resetError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  disabled={isPending}
                  className="px-4 py-2 border border-olive-300 rounded-xl text-xs font-bold text-olive-800 hover:bg-olive-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetPassword}
                  disabled={isPending}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  <span>Generate New Password</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: DISABLE / ENABLE USER ================= */}
      {togglingUser && (
        <div className="fixed inset-0 z-50 bg-olive-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-olive-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className={`p-6 text-white flex items-center justify-between ${
              togglingUser.is_disabled ? 'bg-emerald-800' : 'bg-amber-900'
            }`}>
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
                  <Ban className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-lg tracking-tight">
                  {togglingUser.is_disabled ? 'Enable Account' : 'Disable Account'}
                </h3>
              </div>
              <button
                onClick={() => setTogglingUser(null)}
                disabled={isPending}
                className="p-1 text-white/70 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-olive-900">
                Are you sure you want to {togglingUser.is_disabled ? 're-enable' : 'disable'} the account for <span className="font-bold text-olive-950">{togglingUser.full_name}</span> ({togglingUser.email})?
              </p>

              {!togglingUser.is_disabled && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold leading-relaxed">
                  Notice: They will be signed out on their next server request and prevented from logging in until re-enabled.
                </div>
              )}

              {toggleError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{toggleError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setTogglingUser(null)}
                  disabled={isPending}
                  className="px-4 py-2 border border-olive-300 rounded-xl text-xs font-bold text-olive-800 hover:bg-olive-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmToggleDisabled}
                  disabled={isPending}
                  className={`px-5 py-2 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer ${
                    togglingUser.is_disabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                  <span>{togglingUser.is_disabled ? 'Confirm Enable' : 'Confirm Disable'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: DELETE USER ================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-olive-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-olive-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-red-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-lg tracking-tight">
                  Delete User Account
                </h3>
              </div>
              <button
                onClick={() => setDeletingUser(null)}
                disabled={isPending}
                className="p-1 text-red-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-olive-900">
                Are you sure you want to delete <span className="font-bold text-olive-950">{deletingUser.full_name}</span> ({deletingUser.email})?
              </p>

              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs font-semibold leading-relaxed">
                This will permanently delete this account. They will no longer be able to log in. Any scores or comments they previously entered will remain on record but will no longer show who entered them. This cannot be undone.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                  Type <span className="font-mono text-red-600 font-extrabold">{deletingUser.email || 'DELETE'}</span> to confirm:
                </label>
                <input
                  type="text"
                  placeholder={deletingUser.email || 'DELETE'}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>

              {deleteError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  disabled={isPending}
                  className="px-4 py-2 border border-olive-300 rounded-xl text-xs font-bold text-olive-800 hover:bg-olive-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={
                    isPending ||
                    (deleteConfirmText !== deletingUser.email &&
                      deleteConfirmText.toUpperCase() !== 'DELETE')
                  }
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-40 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Permanently Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
