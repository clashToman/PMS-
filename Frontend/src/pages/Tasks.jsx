
import { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  CalendarDays,
  Users,
  ListTodo,
  MessageSquare,
  Activity,
  AlertCircle,
  CheckCircle,
  X,
  ClipboardList,
} from "lucide-react";

import taskService from "../services/taskService";
import projectService from "../services/projectService";
import { useAuth } from "../context/AuthContext";

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "COMPLETED"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH"];

const emptyTask = {
  title: "",
  description: "",
  priority: "MEDIUM",
  due_date: "",
  assigned_to_id: "",
};

function formatDate(value) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString("en-IN", {
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

function statusColor(status) {
  switch (status) {
    case "COMPLETED":
      return "border-green-500/20 bg-green-500/10 text-green-400";
    case "IN_PROGRESS":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";
    default:
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
  }
}

function priorityColor(priority) {
  switch (priority) {
    case "HIGH":
      return "border-red-500/20 bg-red-500/10 text-red-400";
    case "LOW":
      return "border-gray-500/20 bg-gray-500/10 text-gray-400";
    default:
      return "border-orange-500/20 bg-orange-500/10 text-orange-400";
  }
}

const inputClass =
  "w-full rounded-lg border border-dark-border bg-dark-elevated px-3 py-2.5 text-white placeholder-gray-500 outline-none transition focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/10";

const labelClass =
  "mb-1 block text-sm font-medium text-gray-300";

export default function Tasks() {
  const { isAdmin } = useAuth();

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedProject, setSelectedProject] = useState("");
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);

  const [taskForm, setTaskForm] = useState(emptyTask);
  const [newComment, setNewComment] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadTasks(selectedProject);
    } else {
      setTasks([]);
      setSelectedTask(null);
    }
  }, [selectedProject]);

  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      const projectData = await projectService.getProjects();

      const projectList = Array.isArray(projectData)
        ? projectData
        : [];

      setProjects(projectList);

      if (projectList.length > 0) {
        setSelectedProject(String(projectList[0].id));
      }

      if (isAdmin) {
        const userData = await projectService.getUsers();

        setUsers(
          Array.isArray(userData)
            ? userData.filter((item) => item.is_active)
            : []
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadTasks(projectId) {
    setTaskLoading(true);
    setError("");
    setSelectedTask(null);

    try {
      const data = await taskService.getProjectTasks(projectId);

      const taskList = Array.isArray(data) ? data : [];
      setTasks(taskList);
    } catch (err) {
      setError(getErrorMessage(err));
      setTasks([]);
    } finally {
      setTaskLoading(false);
    }
  }

  async function openTask(taskId) {
    setError("");
    setSuccess("");

    try {
      const [task, commentData, activityData] = await Promise.all([
        taskService.getTaskById(taskId),
        taskService.getComments(taskId),
        taskService.getActivities(taskId),
      ]);

      setSelectedTask(task);
      setComments(
        Array.isArray(commentData) ? commentData : []
      );
      setActivities(
        Array.isArray(activityData) ? activityData : []
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleCreateTask(event) {
    event.preventDefault();

    if (!selectedProject) {
      setError("Please select a project.");
      return;
    }

    if (!taskForm.assigned_to_id) {
      setError("Please select a team member.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await taskService.createTask(selectedProject, {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
        due_date: taskForm.due_date,
        assigned_to_id: Number(taskForm.assigned_to_id),
      });

      setTaskForm(emptyTask);
      setShowCreateForm(false);
      setSuccess("Task created successfully.");

      await loadTasks(selectedProject);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(taskId, status) {
    setError("");
    setSuccess("");

    try {
      const updatedTask = await taskService.updateTaskStatus(
        taskId,
        status
      );

      setTasks((previous) =>
        previous.map((task) =>
          task.id === taskId
            ? { ...task, ...updatedTask }
            : task
        )
      );

      if (selectedTask?.id === taskId) {
        setSelectedTask((previous) => ({
          ...previous,
          ...updatedTask,
        }));

        const updatedActivities =
          await taskService.getActivities(taskId);

        setActivities(
          Array.isArray(updatedActivities)
            ? updatedActivities
            : []
        );
      }

      setSuccess("Task status updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleAddComment(event) {
    event.preventDefault();

    if (!selectedTask || !newComment.trim()) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await taskService.addComment(
        selectedTask.id,
        newComment.trim()
      );

      setNewComment("");

      const [commentData, activityData] = await Promise.all([
        taskService.getComments(selectedTask.id),
        taskService.getActivities(selectedTask.id),
      ]);

      setComments(
        Array.isArray(commentData) ? commentData : []
      );

      setActivities(
        Array.isArray(activityData) ? activityData : []
      );

      setSuccess("Comment added successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-dark-border bg-dark-card p-12 text-center text-dark-muted">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 text-white md:p-6">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Task Management
          </h1>

          <p className="mt-1 text-sm text-dark-muted">
            Create, assign, track and manage project tasks.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setError("");
              setSuccess("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-yellow px-4 py-2 font-semibold text-black transition hover:bg-brand-hover"
          >
            {showCreateForm ? (
              <>
                <X size={18} />
                Close Form
              </>
            ) : (
              <>
                <Plus size={18} />
                Create Task
              </>
            )}
          </button>
        )}
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

      {/* Project Selection */}
      <div className="rounded-xl border border-dark-border bg-dark-card p-4">
        <label className={labelClass}>
          Select Project
        </label>

        <select
          value={selectedProject}
          onChange={(event) =>
            setSelectedProject(event.target.value)
          }
          className={`${inputClass} md:max-w-md`}
        >
          {projects.length === 0 && (
            <option value="">No projects available</option>
          )}

          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Create Task Form */}
      {showCreateForm && isAdmin && (
        <form
          onSubmit={handleCreateTask}
          className="space-y-4 rounded-xl border border-dark-border bg-dark-card p-5"
        >
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-brand-yellow/10 p-2 text-brand-yellow">
              <Plus size={20} />
            </div>

            <h2 className="text-lg font-semibold text-white">
              Create New Task
            </h2>
          </div>

          <div>
            <label className={labelClass}>
              Task Title
            </label>

            <input
              required
              value={taskForm.title}
              onChange={(event) =>
                setTaskForm({
                  ...taskForm,
                  title: event.target.value,
                })
              }
              placeholder="Enter task title"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Description
            </label>

            <textarea
              value={taskForm.description}
              onChange={(event) =>
                setTaskForm({
                  ...taskForm,
                  description: event.target.value,
                })
              }
              rows={3}
              placeholder="Describe the task"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>
                Priority
              </label>

              <select
                value={taskForm.priority}
                onChange={(event) =>
                  setTaskForm({
                    ...taskForm,
                    priority: event.target.value,
                  })
                }
                className={inputClass}
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Due Date
              </label>

              <input
                required
                type="date"
                value={taskForm.due_date}
                onChange={(event) =>
                  setTaskForm({
                    ...taskForm,
                    due_date: event.target.value,
                  })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Assign To
              </label>

              <select
                required
                value={taskForm.assigned_to_id}
                onChange={(event) =>
                  setTaskForm({
                    ...taskForm,
                    assigned_to_id: event.target.value,
                  })
                }
                className={inputClass}
              >
                <option value="">Select member</option>

                {users.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-dark-border pt-4 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-yellow px-5 py-2.5 font-semibold text-black transition hover:bg-brand-hover disabled:opacity-50"
            >
              <Plus size={17} />
              {saving ? "Creating..." : "Create Task"}
            </button>

            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              disabled={saving}
              className="rounded-lg border border-dark-border bg-dark-elevated px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:border-brand-yellow hover:text-brand-yellow"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Main Task Layout */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* Task List */}
        <section className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Project Tasks ({tasks.length})
              </h2>
              <p className="mt-1 text-xs text-dark-muted">
                Select a task to view its details.
              </p>
            </div>

            {selectedProject && (
              <button
                onClick={() => loadTasks(selectedProject)}
                disabled={taskLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-dark-border bg-dark-card px-3 py-2 text-sm text-gray-300 transition hover:border-brand-yellow hover:text-brand-yellow disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={taskLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            )}
          </div>

          {taskLoading ? (
            <div className="rounded-xl border border-dark-border bg-dark-card p-8 text-center text-dark-muted">
              Loading project tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-xl border border-dark-border bg-dark-card p-8 text-center">
              <ClipboardList
                size={40}
                className="mx-auto mb-3 text-dark-muted"
              />
              <h3 className="font-semibold text-white">
                No tasks found
              </h3>
              <p className="mt-1 text-sm text-dark-muted">
                No tasks found for this project.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-xl border bg-dark-card p-4 shadow-sm transition ${
                    selectedTask?.id === task.id
                      ? "border-brand-yellow"
                      : "border-dark-border hover:border-brand-yellow/40"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row">
                    <button
                      onClick={() => openTask(task.id)}
                      className="min-w-0 text-left"
                    >
                      <h3 className="font-semibold text-white transition hover:text-brand-yellow">
                        {task.title}
                      </h3>

                      <p className="mt-1 text-sm text-dark-muted">
                        {task.description || "No description"}
                      </p>

                      <p className="mt-2 flex items-center gap-1 text-xs text-dark-muted">
                        <CalendarDays size={13} />
                        Due: {formatDate(task.due_date)}
                      </p>
                    </button>

                    <div className="flex flex-wrap items-start gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusColor(
                          task.status
                        )}`}
                      >
                        {task.status?.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t border-dark-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-dark-muted">
                      Task #{task.id} · Assigned to:{" "}
                      <span className="font-medium text-gray-300">
                        {task.assigned_to_name || "Unassigned"}
                      </span>
                    </span>

                    <select
                      value={task.status}
                      onChange={(event) =>
                        handleStatusChange(
                          task.id,
                          event.target.value
                        )
                      }
                      className="rounded-lg border border-dark-border bg-dark-elevated px-3 py-2 text-sm text-white outline-none focus:border-brand-yellow"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Task Details Sidebar */}
        <aside className="space-y-5">
          {!selectedTask ? (
            <div className="rounded-xl border border-dark-border bg-dark-card p-6 text-center">
              <ListTodo
                size={36}
                className="mx-auto mb-3 text-brand-yellow"
              />
              <h3 className="font-semibold text-white">
                Task Details
              </h3>
              <p className="mt-2 text-sm text-dark-muted">
                Select a task to view its details, comments and activity history.
              </p>
            </div>
          ) : (
            <>
              {/* Details */}
              <div className="rounded-xl border border-dark-border bg-dark-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ClipboardList
                    size={20}
                    className="text-brand-yellow"
                  />
                  <h2 className="text-lg font-semibold text-white">
                    Task Details
                  </h2>
                </div>

                <p className="font-semibold text-white">
                  {selectedTask.title}
                </p>

                <p className="mt-2 text-sm leading-6 text-dark-muted">
                  {selectedTask.description || "No description"}
                </p>

                <div className="mt-4 space-y-3 border-t border-dark-border pt-4 text-sm">
                  <p className="text-dark-muted">
                    Task ID: <span className="text-gray-200">{selectedTask.id}</span>
                  </p>

                  <p className="text-dark-muted">
                    Project ID: <span className="text-gray-200">{selectedTask.project_id}</span>
                  </p>

                  <p className="text-dark-muted">
                    Assigned to: <span className="text-gray-200">{selectedTask.assigned_to_name || "Unassigned"}</span>
                  </p>

                  <p className="text-dark-muted">
                    Priority: <span className="text-gray-200">{selectedTask.priority}</span>
                  </p>

                  <p className="text-dark-muted">
                    Status: <span className="text-gray-200">{selectedTask.status}</span>
                  </p>

                  <p className="text-dark-muted">
                    Due date: <span className="text-gray-200">{formatDate(selectedTask.due_date)}</span>
                  </p>
                </div>
              </div>

              {/* Comments */}
              <div className="rounded-xl border border-dark-border bg-dark-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare
                    size={20}
                    className="text-brand-yellow"
                  />
                  <h2 className="text-lg font-semibold text-white">
                    Comments ({comments.length})
                  </h2>
                </div>

                <form onSubmit={handleAddComment}>
                  <textarea
                    required
                    value={newComment}
                    onChange={(event) =>
                      setNewComment(event.target.value)
                    }
                    rows={3}
                    placeholder="Write a comment..."
                    className={inputClass}
                  />

                  <button
                    type="submit"
                    disabled={saving || !newComment.trim()}
                    className="mt-2 w-full rounded-lg bg-brand-yellow px-4 py-2 text-sm font-semibold text-black transition hover:bg-brand-hover disabled:opacity-50"
                  >
                    {saving ? "Posting..." : "Add Comment"}
                  </button>
                </form>

                <div className="mt-4 space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-dark-muted">
                      No comments yet.
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-lg border border-dark-border bg-dark-elevated p-3"
                      >
                        <p className="text-sm text-gray-200">
                          {comment.comment}
                        </p>

                        <p className="mt-2 text-xs text-dark-muted">
                          User #{comment.user_id} ·{" "}
                          {formatDate(comment.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Activity History */}
              <div className="rounded-xl border border-dark-border bg-dark-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Activity
                    size={20}
                    className="text-brand-yellow"
                  />
                  <h2 className="text-lg font-semibold text-white">
                    Activity History
                  </h2>
                </div>

                {activities.length === 0 ? (
                  <p className="text-sm text-dark-muted">
                    No activity available.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="border-l-2 border-brand-yellow/50 pl-3"
                      >
                        <p className="text-sm font-medium text-gray-200">
                          {activity.action.replaceAll("_", " ")}
                        </p>

                        <p className="mt-1 text-xs text-dark-muted">
                          {activity.details}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
