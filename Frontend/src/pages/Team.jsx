
import { useEffect, useMemo, useState } from "react";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "TEAM_MEMBER",
};

function getErrorMessage(error) {
  const detail = error.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return detail || error.message || "Something went wrong.";
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString();
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
      <div className="rounded-xl border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Admin access required
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          You do not have permission to manage team members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Team Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage team members, roles and account access.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Add Team Member
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Members</p>
          <p className="mt-2 text-2xl font-bold text-gray-800">
            {users.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active Members</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {activeCount}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inactive Members</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {editingUser ? "Edit Team Member" : "Add Team Member"}
            </h2>

            <button
              type="button"
              onClick={closeForm}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Close
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Enter full name"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
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
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          {!editingUser && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
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
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          )}

          {editingUser && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value })
                }
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="TEAM_MEMBER">Team Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
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
              className="rounded-lg border px-5 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search and filters */}
      <div className="grid gap-3 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email..."
          className="rounded-lg border px-3 py-2"
        />

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="rounded-lg border px-3 py-2"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="TEAM_MEMBER">Team Member</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border px-3 py-2"
        >
          <option value="ALL">All Accounts</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Team table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold text-gray-800">
            Team Members ({filteredUsers.length})
          </h2>

          <button
            onClick={loadUsers}
            className="text-sm text-blue-600 hover:underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading team members...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No team members found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.email}
                      </p>
                      
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {user.role?.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          user.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {formatDate(user.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditForm(user)}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleStatusChange(user)}
                          disabled={changingStatusId === user.id}
                          className={`font-medium hover:underline disabled:opacity-50 ${
                            user.is_active
                              ? "text-red-600"
                              : "text-green-600"
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
