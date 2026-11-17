
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
  PLANNING: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-purple-100 text-purple-700",
  CANCELLED: "bg-red-100 text-red-700",
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Projects
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track your projects.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Create Project
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <FolderKanban size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <FolderKanban size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter((p) => p.status === "ACTIVE").length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
              <Users size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Your Role</p>
              <p className="text-lg font-bold text-gray-900">
                {isAdmin ? "Administrator" : "Team Member"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="PLANNING">Planning</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <FolderKanban
            size={40}
            className="mx-auto mb-3 text-gray-300"
          />
          <h3 className="font-semibold text-gray-800">
            No projects found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try changing your search or status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {project.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {project.description || "No description provided."}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    statusStyles[project.status] ||
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {project.status?.replace("_", " ")}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays size={16} />
                  <div>
                    <p className="text-xs text-gray-400">Start Date</p>
                    <p className="font-medium text-gray-700">
                      {formatDate(project.start_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CalendarDays size={16} />
                  <div>
                    <p className="text-xs text-gray-400">Deadline</p>
                    <p className="font-medium text-gray-700">
                      {formatDate(project.deadline)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={16} />
                  {project.members?.length || 0} members
                </div>

                <Link
                  to={`/projects/${project.id}`}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Create Project
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter project details and assign team members.
                </p>
              </div>

              <button
                onClick={closeCreateModal}
                disabled={submitting}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-5 p-5">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Project Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  maxLength={255}
                  placeholder="Enter project name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Describe the project..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    min={form.start_date || undefined}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Project Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Assign Team Members
                </label>

                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                  {usersLoading ? (
                    <p className="text-sm text-gray-500">
                      Loading team members...
                    </p>
                  ) : users.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No active team members found.
                    </p>
                  ) : (
                    users.map((user) => (
                      <label
                        key={user.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={form.member_ids.includes(user.id)}
                          onChange={() => handleMemberToggle(user.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />

                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user.email}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Selected members: {form.member_ids.length}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || usersLoading}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
