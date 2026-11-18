
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  Search,
  RefreshCw,
  CalendarDays,
  Users,
  AlertCircle,
  Plus,
  X,
  CheckCircle,
} from "lucide-react";

import projectService from "../services/projectService";
import { useAuth } from "../context/AuthContext";

const statusStyles = {
  PLANNING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
  ON_HOLD: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  COMPLETED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const initialForm = {
  name: "",
  description: "",
  start_date: "",
  deadline: "",
  status: "PLANNING",
  member_ids: [],
};

function formatDate(date) {
  if (!date) return "Not set";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error) {
  const detail = error.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return error.message || "Something went wrong.";
}

export default function Projects() {
  const { isAdmin } = useAuth();

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [form, setForm] = useState(initialForm);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await projectService.getProjects();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected projects API response.");
      }

      setProjects(data);
    } catch (err) {
      console.error("Projects loading failed:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setFormError("");

      const data = await projectService.getUsers();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected users API response.");
      }

      setUsers(data.filter((user) => user.is_active));
    } catch (err) {
      console.error("Users loading failed:", err);
      setFormError(
        `Unable to load team members: ${getErrorMessage(err)}`
      );
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        project.name?.toLowerCase().includes(searchText) ||
        project.description?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" || project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const openCreateModal = async () => {
    setForm(initialForm);
    setFormError("");
    setSuccess("");
    setShowCreateModal(true);

    await fetchUsers();
  };

  const closeCreateModal = () => {
    if (submitting) return;

    setShowCreateModal(false);
    setForm(initialForm);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleMemberToggle = (userId) => {
    setForm((previous) => {
      const alreadySelected = previous.member_ids.includes(userId);

      return {
        ...previous,
        member_ids: alreadySelected
          ? previous.member_ids.filter((id) => id !== userId)
          : [...previous.member_ids, userId],
      };
    });
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccess("");

    if (!form.name.trim()) {
      setFormError("Project name is required.");
      return;
    }

    if (!form.start_date || !form.deadline) {
      setFormError("Please select both project dates.");
      return;
    }

    if (form.deadline < form.start_date) {
      setFormError("Deadline cannot be earlier than the start date.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      start_date: form.start_date,
      deadline: form.deadline,
      status: form.status,
      member_ids: form.member_ids,
    };

    try {
      setSubmitting(true);

      const createdProject =
        await projectService.createProject(payload);

      setShowCreateModal(false);
      setForm(initialForm);
      setSuccess(
        `Project "${createdProject.name}" created successfully.`
      );

      await fetchProjects();
    } catch (err) {
      console.error("Project creation failed:", err);
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const activeProjects = projects.filter(
    (project) => project.status === "ACTIVE"
  ).length;

  return (
    <div className="space-y-6 text-white">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Projects
          </h1>
          <p className="mt-1 text-sm text-dark-muted">
            Manage and track your projects.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-dark-border bg-dark-card px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-brand-yellow hover:text-brand-yellow disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-yellow px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-hover"
            >
              <Plus size={18} />
              Create Project
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
          <CheckCircle size={18} />
          {success}
          <button
            onClick={() => setSuccess("")}
            className="ml-auto"
            aria-label="Dismiss success message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-dark-border bg-dark-card p-5 transition hover:border-brand-yellow/40">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand-yellow/10 p-3 text-brand-yellow">
              <FolderKanban size={22} />
            </div>
            <div>
              <p className="text-sm text-dark-muted">Total Projects</p>
              <p className="text-2xl font-bold text-white">
                {projects.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dark-border bg-dark-card p-5 transition hover:border-brand-yellow/40">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-3 text-green-400">
              <FolderKanban size={22} />
            </div>
            <div>
              <p className="text-sm text-dark-muted">Active Projects</p>
              <p className="text-2xl font-bold text-white">
                {activeProjects}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dark-border bg-dark-card p-5 transition hover:border-brand-yellow/40">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-3 text-purple-400">
              <Users size={22} />
            </div>
            <div>
              <p className="text-sm text-dark-muted">Your Role</p>
              <p className="text-lg font-bold text-white">
                {isAdmin ? "Administrator" : "Team Member"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted"
          />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-dark-border bg-dark-card py-2.5 pl-10 pr-4 text-white placeholder-gray-500 outline-none transition focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-white outline-none focus:border-brand-yellow"
        >
          <option value="ALL">All Statuses</option>
          <option value="PLANNING">Planning</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={fetchProjects}
            className="ml-auto font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Project List */}
      {loading ? (
        <div className="rounded-xl border border-dark-border bg-dark-card p-12 text-center text-dark-muted">
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-dark-border bg-dark-card p-12 text-center">
          <FolderKanban
            size={40}
            className="mx-auto mb-3 text-dark-muted"
          />
          <h3 className="font-semibold text-white">
            No projects found
          </h3>
          <p className="mt-1 text-sm text-dark-muted">
            Try changing your search or status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-dark-border bg-dark-card p-5 shadow-sm transition duration-200 hover:border-brand-yellow/50 hover:shadow-yellow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white">
                    {project.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-dark-muted">
                    {project.description || "No description provided."}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                    statusStyles[project.status] ||
                    "border-dark-border bg-dark-elevated text-gray-300"
                  }`}
                >
                  {project.status?.replace("_", " ")}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-dark-border pt-4">
                <div className="flex items-center gap-2 text-sm text-dark-muted">
                  <CalendarDays size={16} className="text-brand-yellow" />
                  <div>
                    <p className="text-xs text-dark-muted">Start Date</p>
                    <p className="font-medium text-gray-200">
                      {formatDate(project.start_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-dark-muted">
                  <CalendarDays size={16} className="text-brand-yellow" />
                  <div>
                    <p className="text-xs text-dark-muted">Deadline</p>
                    <p className="font-medium text-gray-200">
                      {formatDate(project.deadline)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-dark-border pt-4">
                <div className="flex items-center gap-2 text-sm text-dark-muted">
                  <Users size={16} className="text-brand-yellow" />
                  {project.members?.length || 0} members
                </div>

                <Link
                  to={`/projects/${project.id}`}
                  className="rounded-lg bg-brand-yellow px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-hover"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-dark-border bg-dark-card shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-dark-border bg-dark-card p-5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Create Project
                </h2>
                <p className="mt-1 text-sm text-dark-muted">
                  Enter project details and assign team members.
                </p>
              </div>

              <button
                onClick={closeCreateModal}
                disabled={submitting}
                className="rounded-lg p-2 text-dark-muted transition hover:bg-dark-elevated hover:text-white disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-5 p-5">
              {formError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Project Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  maxLength={255}
                  placeholder="Enter project name"
                  className="w-full rounded-lg border border-dark-border bg-dark-elevated px-3 py-2.5 text-white placeholder-gray-500 outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/10"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Describe the project..."
                  className="w-full rounded-lg border border-dark-border bg-dark-elevated px-3 py-2.5 text-white placeholder-gray-500 outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/10"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-dark-border bg-dark-elevated px-3 py-2.5 text-white outline-none focus:border-brand-yellow"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    min={form.start_date || undefined}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-dark-border bg-dark-elevated px-3 py-2.5 text-white outline-none focus:border-brand-yellow"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">
                  Project Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-dark-border bg-dark-elevated px-3 py-2.5 text-white outline-none focus:border-brand-yellow"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Assign Team Members
                </label>

                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-dark-border bg-dark-elevated p-3">
                  {usersLoading ? (
                    <p className="text-sm text-dark-muted">
                      Loading team members...
                    </p>
                  ) : users.length === 0 ? (
                    <p className="text-sm text-dark-muted">
                      No active team members found.
                    </p>
                  ) : (
                    users.map((user) => (
                      <label
                        key={user.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-dark-card"
                      >
                        <input
                          type="checkbox"
                          checked={form.member_ids.includes(user.id)}
                          onChange={() => handleMemberToggle(user.id)}
                          className="h-4 w-4 rounded border-dark-border bg-dark-card accent-yellow-400"
                        />

                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.name}
                          </p>
                          <p className="text-xs text-dark-muted">
                            {user.email}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <p className="mt-2 text-xs text-dark-muted">
                  Selected members: {form.member_ids.length}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-dark-border pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={submitting}
                  className="rounded-lg border border-dark-border bg-dark-elevated px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:border-brand-yellow hover:text-brand-yellow"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || usersLoading}
                  className="rounded-lg bg-brand-yellow px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
