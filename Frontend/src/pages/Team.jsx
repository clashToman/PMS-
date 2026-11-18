
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Edit,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  AlertCircle,
  CheckCircle,
  UsersRound,
} from "lucide-react";

import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "TEAM_MEMBER",
};

const inputClass =
  "w-full rounded-lg border border-dark-border bg-dark-elevated px-3 py-2.5 text-white placeholder-gray-500 outline-none transition focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/10";

const labelClass =
  "mb-1 block text-sm font-medium text-gray-300";

function getErrorMessage(error) {
  const detail = error.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return detail || error.message || "Something went wrong.";
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Team() {
  const { isAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const data = await userService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingUser(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEditForm(user) {
    setEditingUser(user);

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "TEAM_MEMBER",
    });

    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingUser(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingUser) {
        const updateData = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
        };

        const updatedUser = await userService.updateUser(
          editingUser.id,
          updateData
        );

        setUsers((previous) =>
          previous.map((user) =>
            user.id === editingUser.id
              ? {
                  ...user,
                  ...updatedUser,
                  ...updateData,
                }
              : user
          )
        );

        setSuccess("Team member updated successfully.");
      } else {
        const createData = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        };

        await userService.createUser(createData);

        setSuccess("Team member created successfully.");
      }

      closeForm();
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(user) {
    const nextStatus = !user.is_active;
    const action = nextStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}'s account?`
    );

    if (!confirmed) return;

    setChangingStatusId(user.id);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await userService.updateUserStatus(
        user.id,
        nextStatus
      );

      setUsers((previous) =>
        previous.map((item) =>
          item.id === user.id
            ? {
                ...item,
                ...updatedUser,
                is_active: nextStatus,
              }
            : item
        )
      );

      setSuccess(
        `${user.name}'s account ${nextStatus ? "activated" : "deactivated"} successfully.`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setChangingStatusId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        (user.name || "").toLowerCase().includes(searchText) ||
        (user.email || "").toLowerCase().includes(searchText);

      const matchesRole =
        roleFilter === "ALL" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.is_active) ||
        (statusFilter === "INACTIVE" && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const activeCount = users.filter((user) => user.is_active).length;
  const inactiveCount = users.length - activeCount;

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-dark-border bg-dark-card p-8 text-center">
        <ShieldCheck
          size={42}
          className="mx-auto mb-3 text-brand-yellow"
        />

        <h2 className="text-lg font-semibold text-white">
          Admin access required
        </h2>

        <p className="mt-2 text-sm text-dark-muted">
          You do not have permission to manage team members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 text-white md:p-6">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Team Management
          </h1>

          <p className="mt-1 text-sm text-dark-muted">
            Manage team members, roles and account access.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-yellow px-4 py-2.5 font-semibold text-black transition hover:bg-brand-hover"
        >
          <UserPlus size={18} />
          Add Team Member
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto"
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button
            onClick={() => setSuccess("")}
            className="ml-auto"
            aria-label="Dismiss success"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-dark-border bg-dark-card p-5 transition hover:border-brand-yellow/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-dark-muted">
              Total Members
            </p>

            <div className="rounded-lg bg-brand-yellow/10 p-2 text-brand-yellow">
              <Users size={20} />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold text-white">
            {users.length}
          </p>

          <p className="mt-1 text-xs text-dark-muted">
            Registered team accounts
          </p>
        </div>

        <div className="rounded-xl border border-dark-border bg-dark-card p-5 transition hover:border-green-500/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-dark-muted">
              Active Members
            </p>

            <div className="rounded-lg bg-green-500/10 p-2 text-green-400">
              <UserCheck size={20} />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold text-green-400">
            {activeCount}
          </p>

          <p className="mt-1 text-xs text-dark-muted">
            Currently active accounts
          </p>
        </div>

        <div className="rounded-xl border border-dark-border bg-dark-card p-5 transition hover:border-red-500/40">
          <div className="flex items-center justify-between">
            <p className="text-sm text-dark-muted">
              Inactive Members
            </p>

            <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
              <UserX size={20} />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold text-red-400">
            {inactiveCount}
          </p>

          <p className="mt-1 text-xs text-dark-muted">
            Deactivated accounts
          </p>
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-dark-border bg-dark-card p-5"
        >
          <div className="flex items-center justify-between border-b border-dark-border pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-yellow/10 p-2 text-brand-yellow">
                <UserPlus size={20} />
              </div>

              <h2 className="text-lg font-semibold text-white">
                {editingUser ? "Edit Team Member" : "Add Team Member"}
              </h2>
            </div>

            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg p-2 text-dark-muted transition hover:bg-dark-elevated hover:text-white"
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>

          <div>
            <label className={labelClass}>
              Full Name
            </label>

            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Enter full name"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Email
            </label>

            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              placeholder="Enter email address"
              className={inputClass}
            />
          </div>

          {!editingUser && (
            <div>
              <label className={labelClass}>
                Password
              </label>

              <input
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                placeholder="Enter initial password"
                className={inputClass}
              />
            </div>
          )}

          {editingUser && (
            <div>
              <label className={labelClass}>
                Role
              </label>

              <select
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value })
                }
                className={inputClass}
              >
                <option value="TEAM_MEMBER">Team Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-dark-border pt-4 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-yellow px-5 py-2.5 font-semibold text-black transition hover:bg-brand-hover disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingUser
                  ? "Save Changes"
                  : "Create Member"}
            </button>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg border border-dark-border bg-dark-elevated px-5 py-2.5 text-gray-300 transition hover:border-brand-yellow hover:text-brand-yellow"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search and Filters */}
      <div className="grid gap-3 rounded-xl border border-dark-border bg-dark-card p-4 md:grid-cols-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email..."
            className={`${inputClass} pl-10`}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className={inputClass}
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="TEAM_MEMBER">Team Member</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={inputClass}
        >
          <option value="ALL">All Accounts</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Team Members Table */}
      <div className="overflow-hidden rounded-xl border border-dark-border bg-dark-card">
        <div className="flex flex-col justify-between gap-3 border-b border-dark-border p-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <UsersRound
                size={20}
                className="text-brand-yellow"
              />

              <h2 className="font-semibold text-white">
                Team Members ({filteredUsers.length})
              </h2>
            </div>

            <p className="mt-1 text-xs text-dark-muted">
              View and manage registered team accounts.
            </p>
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-dark-border bg-dark-elevated px-3 py-2 text-sm text-gray-300 transition hover:border-brand-yellow hover:text-brand-yellow disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-dark-muted">
            Loading team members...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center">
            <Users
              size={36}
              className="mx-auto mb-3 text-dark-muted"
            />

            <p className="font-medium text-white">
              No team members found
            </p>

            <p className="mt-1 text-sm text-dark-muted">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-dark-elevated text-dark-muted">
                <tr>
                  <th className="px-5 py-4 font-medium">
                    Member
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Role
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Joined
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-dark-border">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-dark-elevated/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-yellow/10 font-semibold text-brand-yellow">
                          {(user.name || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-medium text-white">
                            {user.name}
                          </p>

                          <p className="mt-1 text-xs text-dark-muted">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
  className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
    user.role === "ADMIN"
      ? "border-brand-yellow/20 bg-brand-yellow/10 text-brand-yellow"
      : "border-blue-500/20 bg-blue-500/10 text-blue-400"
  }`}
>
  {user.role?.replace("_", " ")}
</span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                          user.is_active
                            ? "border-green-500/20 bg-green-500/10 text-green-400"
                            : "border-red-500/20 bg-red-500/10 text-red-400"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-dark-muted">
                      {formatDate(user.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditForm(user)}
                          className="inline-flex items-center gap-1 font-medium text-brand-yellow transition hover:text-brand-hover"
                        >
                          <Edit size={14} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleStatusChange(user)}
                          disabled={changingStatusId === user.id}
                          className={`font-medium transition hover:underline disabled:opacity-50 ${
                            user.is_active
                              ? "text-red-400 hover:text-red-300"
                              : "text-green-400 hover:text-green-300"
                          }`}
                        >
                          {changingStatusId === user.id
                            ? "Updating..."
                            : user.is_active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
