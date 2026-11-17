import { useEffect, useState } from "react";
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
  return new Date(value).toLocaleDateString();
}

function getErrorMessage(error) {
  return (
    error.response?.data?.detail ||
    error.message ||
    "Something went wrong."
  );
}

function statusColor(status) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

function priorityColor(priority) {
  switch (priority) {
    case "HIGH":
      return "bg-red-100 text-red-700";
    case "LOW":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-orange-100 text-orange-700";
  }
}

export default function Tasks() {
  const { user, isAdmin } = useAuth();

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

  // Find the assigned user's name using the users list
  // or the members list of the task's project.
  function getAssignedUserName(task) {
    const assignedUserId = task.assigned_to_id;

    if (
      assignedUserId === null ||
      assignedUserId === undefined
    ) {
      return "Unassigned";
    }

    const matchingUser = users.find(
      (item) =>
        Number(item.id) === Number(assignedUserId)
    );

    const taskProject = projects.find(
      (project) =>
        Number(project.id) ===
        Number(task.project_id ?? selectedProject)
    );

    const projectMember = taskProject?.members?.find(
      (member) =>
        Number(member.id) === Number(assignedUserId)
    );

    return (
      matchingUser?.name ||
      projectMember?.name ||
      `User #${assignedUserId}`
    );
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
      <div className="p-6 text-gray-600">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Task Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create, assign, track and manage project tasks.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {showCreateForm ? "Close Form" : "+ Create Task"}
          </button>
        )}
      </div>

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

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Select Project
        </label>

        <select
          value={selectedProject}
          onChange={(event) =>
            setSelectedProject(event.target.value)
          }
          className="w-full rounded-lg border px-3 py-2 md:max-w-md"
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

      {showCreateForm && isAdmin && (
        <form
          onSubmit={handleCreateTask}
          className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-800">
            Create New Task
          </h2>

          <div>
            <label className="mb-1 block text-sm font-medium">
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
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
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
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
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
                className="w-full rounded-lg border px-3 py-2"
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
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
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
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
                className="w-full rounded-lg border px-3 py-2"
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

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Task"}
          </button>
        </form>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Project Tasks ({tasks.length})
            </h2>

            {selectedProject && (
              <button
                onClick={() => loadTasks(selectedProject)}
                className="text-sm text-blue-600 hover:underline"
              >
                Refresh
              </button>
            )}
          </div>

          {taskLoading ? (
            <p className="text-gray-500">
              Loading project tasks...
            </p>
          ) : tasks.length === 0 ? (
            <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
              No tasks found for this project.
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-xl border bg-white p-4 shadow-sm ${
                    selectedTask?.id === task.id
                      ? "border-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row">
                    <button
                      onClick={() => openTask(task.id)}
                      className="text-left"
                    >
                      <h3 className="font-semibold text-gray-800 hover:text-blue-600">
                        {task.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {task.description || "No description"}
                      </p>

                      <p className="mt-2 text-xs text-gray-400">
                        Due: {formatDate(task.due_date)}
                      </p>
                    </button>

                    <div className="flex flex-wrap items-start gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${priorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor(
                          task.status
                        )}`}
                      >
                        {task.status?.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-gray-500">
                      Task #{task.id} · Assigned to:{" "}
                      {getAssignedUserName(task)}
                    </span>

                    <select
                      value={task.status}
                      onChange={(event) =>
                        handleStatusChange(
                          task.id,
                          event.target.value
                        )
                      }
                      className="rounded-lg border px-3 py-2 text-sm"
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

        <aside className="space-y-5">
          {!selectedTask ? (
            <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">
              Select a task to view its details, comments and activity history.
            </div>
          ) : (
            <>
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800">
                  Task Details
                </h2>

                <p className="mt-3 font-medium">
                  {selectedTask.title}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  {selectedTask.description || "No description"}
                </p>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>Task ID: {selectedTask.id}</p>
                  <p>Project ID: {selectedTask.project_id}</p>
                  <p>
                    Assigned to: {getAssignedUserName(selectedTask)}
                  </p>
                  <p>Priority: {selectedTask.priority}</p>
                  <p>Status: {selectedTask.status}</p>
                  <p>Due date: {formatDate(selectedTask.due_date)}</p>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                  Comments ({comments.length})
                </h2>

                <form onSubmit={handleAddComment}>
                  <textarea
                    required
                    value={newComment}
                    onChange={(event) =>
                      setNewComment(event.target.value)
                    }
                    rows={3}
                    placeholder="Write a comment..."
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />

                  <button
                    type="submit"
                    disabled={saving || !newComment.trim()}
                    className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Posting..." : "Add Comment"}
                  </button>
                </form>

                <div className="mt-4 space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No comments yet.
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-lg bg-gray-50 p-3"
                      >
                        <p className="text-sm text-gray-700">
                          {comment.comment}
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                          User #{comment.user_id} ·{" "}
                          {formatDate(comment.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-800">
                  Activity History
                </h2>

                {activities.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No activity available.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="border-l-2 border-blue-200 pl-3"
                      >
                        <p className="text-sm font-medium text-gray-700">
                          {activity.action.replaceAll("_", " ")}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {activity.details}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
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