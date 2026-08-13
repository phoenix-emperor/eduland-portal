'use client';

/**
 * @file app/dashboard/admin/terms/ManageTermsClient.tsx
 * @description Client Component for Managing Academic Terms in the Admin Dashboard.
 * Groups terms by academic session in collapsible accordion sections (most recent expanded by default).
 * Sorts terms in logical academic order (First Term -> Second Term -> Third Term).
 * Supports creating, editing, and deleting terms with delete protection.
 */

import { useState, useTransition, useMemo } from 'react';
import {
  createTermAction,
  updateTermAction,
  deleteTermAction,
} from '@/app/dashboard/admin/actions';
import { TermItem } from '@/lib/types/database';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface ManageTermsClientProps {
  terms: TermItem[];
}

const STANDARD_TERM_NAMES = ['First Term', 'Second Term', 'Third Term'];

// Logical academic term sorting order
const TERM_SORT_MAP: Record<string, number> = {
  'first term': 1,
  '1st term': 1,
  'second term': 2,
  '2nd term': 2,
  'third term': 3,
  '3rd term': 3,
};

const getTermSortOrder = (name: string): number => {
  const lower = name.toLowerCase().trim();
  return TERM_SORT_MAP[lower] ?? 99;
};

export default function ManageTermsClient({ terms }: ManageTermsClientProps) {
  // Modal Visibility States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingTerm, setEditingTerm] = useState<TermItem | null>(null);
  const [deletingTerm, setDeletingTerm] = useState<TermItem | null>(null);

  // Group terms by session and sort sessions descending (most recent first)
  const { sortedSessions, termsBySession } = useMemo(() => {
    const sessionMap: Record<string, TermItem[]> = {};

    terms.forEach((term) => {
      const sess = term.session || 'Unassigned Session';
      if (!sessionMap[sess]) {
        sessionMap[sess] = [];
      }
      sessionMap[sess].push(term);
    });

    // Sort terms inside each session logically (First Term -> Second Term -> Third Term)
    Object.keys(sessionMap).forEach((sess) => {
      sessionMap[sess].sort((a, b) => getTermSortOrder(a.name) - getTermSortOrder(b.name));
    });

    // Sort unique sessions descending (e.g. 2026/2027 -> 2025/2026)
    const sortedSessKeys = Object.keys(sessionMap).sort((a, b) => b.localeCompare(a));

    return {
      sortedSessions: sortedSessKeys,
      termsBySession: sessionMap,
    };
  }, [terms]);

  // Accordion Expand/Collapse State (Most recent session expanded by default)
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sortedSessions.forEach((session, index) => {
      initial[session] = index === 0; // Most recent session expanded by default
    });
    return initial;
  });

  const toggleSession = (session: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [session]: !prev[session],
    }));
  };

  // Add Form State
  const [addSessionOption, setAddSessionOption] = useState<string>('');
  const [addCustomSession, setAddCustomSession] = useState<string>('');
  const [addNameSelect, setAddNameSelect] = useState<string>('First Term');
  const [addCustomName, setAddCustomName] = useState<string>('');
  const [addNextTermBegins, setAddNextTermBegins] = useState<string>('');
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Form State
  const [editSessionOption, setEditSessionOption] = useState<string>('');
  const [editCustomSession, setEditCustomSession] = useState<string>('');
  const [editNameSelect, setEditNameSelect] = useState<string>('First Term');
  const [editCustomName, setEditCustomName] = useState<string>('');
  const [editNextTermBegins, setEditNextTermBegins] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Error State
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Global Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not Set';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // --- Handlers: Add Term ---
  const handleOpenAddModal = () => {
    const currentYear = new Date().getFullYear();
    const defaultNewSess = `${currentYear}/${currentYear + 1}`;

    if (sortedSessions.length > 0) {
      setAddSessionOption(sortedSessions[0]);
      setAddCustomSession('');
    } else {
      setAddSessionOption('NEW_SESSION');
      setAddCustomSession(defaultNewSess);
    }

    setAddNameSelect('First Term');
    setAddCustomName('');
    setAddNextTermBegins('');
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setSuccessMessage(null);

    const sessionVal =
      addSessionOption === 'NEW_SESSION'
        ? addCustomSession.trim()
        : addSessionOption.trim();

    const termName =
      addNameSelect === 'Custom' ? addCustomName.trim() : addNameSelect;

    if (!sessionVal) {
      setAddError('Please specify an academic session (e.g. "2025/2026").');
      return;
    }

    if (!termName) {
      setAddError('Please specify a term name.');
      return;
    }

    startTransition(async () => {
      const res = await createTermAction(
        sessionVal,
        termName,
        addNextTermBegins.trim() || null
      );

      if (res.error) {
        setAddError(res.error);
      } else {
        setSuccessMessage(`Successfully created ${termName} for session ${sessionVal}.`);
        // Expand the newly created session accordion
        setExpandedSessions((prev) => ({ ...prev, [sessionVal]: true }));
        setIsAddModalOpen(false);
      }
    });
  };

  // --- Handlers: Edit Term ---
  const handleOpenEditModal = (term: TermItem) => {
    setEditingTerm(term);

    if (sortedSessions.includes(term.session)) {
      setEditSessionOption(term.session);
      setEditCustomSession('');
    } else {
      setEditSessionOption('NEW_SESSION');
      setEditCustomSession(term.session);
    }

    if (STANDARD_TERM_NAMES.includes(term.name)) {
      setEditNameSelect(term.name);
      setEditCustomName('');
    } else {
      setEditNameSelect('Custom');
      setEditCustomName(term.name);
    }

    setEditNextTermBegins(term.next_term_begins || '');
    setEditError(null);
  };

  const handleUpdateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerm) return;

    setEditError(null);
    setSuccessMessage(null);

    const sessionVal =
      editSessionOption === 'NEW_SESSION'
        ? editCustomSession.trim()
        : editSessionOption.trim();

    const termName =
      editNameSelect === 'Custom' ? editCustomName.trim() : editNameSelect;

    if (!sessionVal) {
      setEditError('Please specify an academic session.');
      return;
    }

    if (!termName) {
      setEditError('Please specify a term name.');
      return;
    }

    startTransition(async () => {
      const res = await updateTermAction(
        editingTerm.id,
        sessionVal,
        termName,
        editNextTermBegins.trim() || null
      );

      if (res.error) {
        setEditError(res.error);
      } else {
        setSuccessMessage(`Updated details for ${termName} (${sessionVal}).`);
        setEditingTerm(null);
      }
    });
  };

  // --- Handlers: Delete Term ---
  const handleConfirmDelete = (term: TermItem) => {
    setDeletingTerm(term);
    setDeleteError(null);
  };

  const handleDeleteTerm = () => {
    if (!deletingTerm) return;

    setDeleteError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await deleteTermAction(deletingTerm.id);

      if (res.error) {
        setDeleteError(res.error);
      } else {
        setSuccessMessage(
          `Successfully deleted ${deletingTerm.name} (${deletingTerm.session}).`
        );
        setDeletingTerm(null);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-olive-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-3 h-8 bg-schoolYellow-500 rounded-full" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-olive-900 tracking-tight">
              Manage Academic Terms
            </h1>
          </div>
          <p className="text-olive-700 text-sm font-medium">
            Configure academic sessions, terms, and next term resumption dates grouped by session.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-sm rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Academic Term</span>
        </button>
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

      {/* Terms List View — Grouped by Session (Accordion Pattern) */}
      <div className="space-y-4">
        {sortedSessions.length === 0 ? (
          <div className="p-8 text-center bg-white border-2 border-dashed border-olive-200 rounded-2xl">
            <BookOpen className="w-10 h-10 text-olive-400 mx-auto mb-2" />
            <p className="text-olive-700 font-semibold text-sm">
              No academic terms configured yet. Click "Add Academic Term" to create one.
            </p>
          </div>
        ) : (
          sortedSessions.map((session) => {
            const sessionTerms = termsBySession[session] || [];
            const isExpanded = expandedSessions[session] ?? false;

            return (
              <div
                key={session}
                className="bg-white rounded-2xl border border-olive-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Accordion Session Header */}
                <button
                  type="button"
                  onClick={() => toggleSession(session)}
                  className="w-full p-5 bg-olive-50/80 hover:bg-olive-100/70 border-b border-olive-200 flex items-center justify-between transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-olive-200/70 text-olive-900 rounded-lg">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h2 className="font-extrabold text-olive-900 text-base">
                          Session {session}
                        </h2>
                        <span className="px-2.5 py-0.5 bg-schoolYellow-100 border border-schoolYellow-300 text-olive-950 text-xs font-bold rounded-full font-mono">
                          {sessionTerms.length} {sessionTerms.length === 1 ? 'Term' : 'Terms'}
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
                    {sessionTerms.map((term) => (
                      <div
                        key={term.id}
                        className="p-5 hover:bg-olive-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-olive-900 text-base">
                            {term.name}
                          </h3>
                          <p className="text-xs text-olive-600 font-medium flex items-center space-x-1.5">
                            <span>Next Term Resumes:</span>
                            <span className="font-bold text-olive-900">
                              {formatDate(term.next_term_begins)}
                            </span>
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(term)}
                            className="px-3 py-1.5 text-xs font-bold text-olive-800 bg-olive-100 hover:bg-olive-200 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleConfirmDelete(term)}
                            className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL 1: ADD TERM ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-olive-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-olive-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-olive-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-schoolYellow-500 flex items-center justify-center text-olive-950 font-bold">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <h2 className="font-extrabold text-lg tracking-tight">
                  Add Academic Term
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                disabled={isPending}
                className="p-1 text-olive-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTerm} className="p-6 space-y-4">
              {/* Academic Session */}
              <div>
                <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                  Academic Session <span className="text-red-500">*</span>
                </label>
                <select
                  value={addSessionOption}
                  onChange={(e) => setAddSessionOption(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 font-mono"
                >
                  {sortedSessions.map((sess) => (
                    <option key={sess} value={sess}>
                      Session {sess}
                    </option>
                  ))}
                  <option value="NEW_SESSION">+ Create New Session...</option>
                </select>
              </div>

              {addSessionOption === 'NEW_SESSION' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    New Session Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2026/2027"
                    value={addCustomSession}
                    onChange={(e) => setAddCustomSession(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 font-mono"
                  />
                </div>
              )}

              {/* Term Name */}
              <div>
                <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                  Term Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={addNameSelect}
                  onChange={(e) => setAddNameSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                  <option value="Custom">Custom Name...</option>
                </select>
              </div>

              {addNameSelect === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Custom Term Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Term"
                    value={addCustomName}
                    onChange={(e) => setAddCustomName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  />
                </div>
              )}

              {/* Next Term Begins */}
              <div>
                <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                  Next Term Resumes (Optional)
                </label>
                <input
                  type="date"
                  value={addNextTermBegins}
                  onChange={(e) => setAddNextTermBegins(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                />
              </div>

              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 border border-olive-300 rounded-xl text-xs font-bold text-olive-800 hover:bg-olive-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    (addSessionOption === 'NEW_SESSION' && !addCustomSession.trim())
                  }
                  className="px-5 py-2 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Create Term</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT TERM ================= */}
      {editingTerm && (
        <div className="fixed inset-0 z-50 bg-olive-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-olive-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-olive-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-schoolYellow-500 flex items-center justify-center text-olive-950 font-bold">
                  <Edit2 className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h2 className="font-extrabold text-lg tracking-tight">
                  Edit Academic Term
                </h2>
              </div>
              <button
                onClick={() => setEditingTerm(null)}
                disabled={isPending}
                className="p-1 text-olive-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTerm} className="p-6 space-y-4">
              {/* Academic Session */}
              <div>
                <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                  Academic Session <span className="text-red-500">*</span>
                </label>
                <select
                  value={editSessionOption}
                  onChange={(e) => setEditSessionOption(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 font-mono"
                >
                  {sortedSessions.map((sess) => (
                    <option key={sess} value={sess}>
                      Session {sess}
                    </option>
                  ))}
                  <option value="NEW_SESSION">+ Create New Session...</option>
                </select>
              </div>

              {editSessionOption === 'NEW_SESSION' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    New Session Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2026/2027"
                    value={editCustomSession}
                    onChange={(e) => setEditCustomSession(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500 font-mono"
                  />
                </div>
              )}

              {/* Term Name */}
              <div>
                <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                  Term Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={editNameSelect}
                  onChange={(e) => setEditNameSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                  <option value="Custom">Custom Name...</option>
                </select>
              </div>

              {editNameSelect === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                    Custom Term Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editCustomName}
                    onChange={(e) => setEditCustomName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                  />
                </div>
              )}

              {/* Next Term Begins */}
              <div>
                <label className="block text-xs font-bold uppercase text-olive-900 mb-1">
                  Next Term Resumes (Optional)
                </label>
                <input
                  type="date"
                  value={editNextTermBegins}
                  onChange={(e) => setEditNextTermBegins(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-olive-300 rounded-xl text-sm font-semibold text-olive-900 focus:outline-none focus:ring-2 focus:ring-schoolYellow-500"
                />
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
                  onClick={() => setEditingTerm(null)}
                  disabled={isPending}
                  className="px-4 py-2 border border-olive-300 rounded-xl text-xs font-bold text-olive-800 hover:bg-olive-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    (editSessionOption === 'NEW_SESSION' && !editCustomSession.trim())
                  }
                  className="px-5 py-2 bg-schoolYellow-500 hover:bg-schoolYellow-400 text-olive-950 font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: DELETE CONFIRMATION ================= */}
      {deletingTerm && (
        <div className="fixed inset-0 z-50 bg-olive-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-olive-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-red-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h2 className="font-extrabold text-lg tracking-tight">
                  Delete Academic Term
                </h2>
              </div>
              <button
                onClick={() => setDeletingTerm(null)}
                disabled={isPending}
                className="p-1 text-red-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-olive-800">
                Are you sure you want to delete <span className="font-bold text-olive-950">{deletingTerm.name}</span> ({deletingTerm.session})?
              </p>

              {deleteError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs font-semibold flex items-start space-x-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setDeletingTerm(null)}
                  disabled={isPending}
                  className="px-4 py-2 border border-olive-300 rounded-xl text-xs font-bold text-olive-800 hover:bg-olive-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTerm}
                  disabled={isPending}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
