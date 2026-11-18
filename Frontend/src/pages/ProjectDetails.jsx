
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  FolderKanban,
  ClipboardList,
} from "lucide-react";

import projectService from "../services/projectService";

const statusStyles = {
  PLANNING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
  ON_HOLD: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  COMPLETED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  TODO: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const priorityStyles = {
  LOW: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  HIGH: "bg-red-500/10 text-red-400 border-red-500/20",
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

export default function ProjectDetails() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [taskError, setTaskError] = useState("");

  const fetchProjectDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setTaskError("");

      const projectData = await projectService.getProjectById(projectId);

      setProject(projectData);

      try {
        const taskData = await projectService.getProjectTasks(
          projectId,
          0,
          10
        );

        if (!Array.isArray(taskData)) {
          throw new Error("Unexpected task API response.");
        }

        setTasks(taskData);
      } catch (taskErr) {
        console.error("Project tasks loading failed:", taskErr);
        setTasks([]);
        setTaskError(getErrorMessage(taskErr));
      }
    } catch (err) {
      console.error("Project details loading failed:", err);
      setProject(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const todoTasks = tasks.filter(
    (task) => task.status === "TODO"
  ).length;

  if (loading) {
    return (
      <div className="rounded-xl border border-dark-border bg-dark-card p-12 text-center text-dark-muted">
        Loading project details...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm text-brand-yellow transition hover:text-brand-hover"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </Link>

        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
          <AlertCircle size={24} className="mb-2" />

          <p className="font-semibold">Unable to load project</p>

          <p className="mt-1 text-sm">
            {error || "Project not found."}
          </p>

          <button
            onClick={fetchProjectDetails}
            className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">

      {/* Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-dark-muted transition hover:text-brand-yellow"
        >
          <ArrowLeft size={18} />
          Back to Projects
        </Link>

        <button
          onClick={fetchProjectDetails}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-dark-border bg-dark-card px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-brand-yellow hover:text-brand-yellow"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Project Information */}
      <div className="rounded-xl border border-dark-border bg-dark-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-dark-muted">
              <FolderKanban size={17} className="text-brand-yellow" />
              Project #{project.id}
            </div>

            <h1 className="text-2xl font-bold text-white">
              {project.name}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-dark-muted">
              {project.description || "No description provided."}
            </p>
          </div>

          <span
            className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${
              statusStyles[project.status] ||
              "border-dark-border bg-dark-elevated text-gray-300"
            }`}
          >
            {project.status?.replace("_", " ")}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-dark-border pt-5 sm:grid-cols-3">

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand-yellow/10 p-3 text-brand-yellow">
              <CalendarDays size={20} />
            </div>

            <div>
              <p className="text-xs text-dark-muted">Start Date</p>
              <p className="text-sm font-semibold text-gray-200">
                {formatDate(project.start_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-3 text-purple-400">
              <CalendarDays size={20} />
            </div>

            <div>
              <p className="text-xs text-dark-muted">Deadline</p>
              <p className="text-sm font-semibold text-gray-200">
                {formatDate(project.deadline)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-3 text-green-400">
              <Users size={20} />
            </div>

            <div>
              <p className="text-xs text-dark-muted">Team Members</p>
              <p className="text-sm font-semibold text-gray-200">
                {project.members?.length || 0} Members
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Overview */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-white">
          Task Overview
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            label="Total Tasks"
            value={totalTasks}
            icon={<ListTodo size={21} />}
            color="yellow"
          />

          <StatCard
            label="To Do"
            value={todoTasks}
            icon={<Clock size={21} />}
            color="gray"
          />

          <StatCard
            label="In Progress"
            value={inProgressTasks}
            icon={<RefreshCw size={21} />}
            color="blue"
          />

          <StatCard
            label="Completed"
            value={completedTasks}
            icon={<CheckCircle2 size={21} />}
            color="green"
          />
        </div>
      </div>

      {/* Assigned Team Members */}
      <div className="rounded-xl border border-dark-border bg-dark-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Assigned Team Members
            </h2>

            <p className="mt-1 text-sm text-dark-muted">
              People assigned to this project.
            </p>
          </div>

          <Users className="text-brand-yellow" size={22} />
        </div>

        {!project.members?.length ? (
          <p className="py-6 text-center text-sm text-dark-muted">
            No team members assigned.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-dark-border bg-dark-elevated p-4 transition hover:border-brand-yellow/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-yellow/10 font-semibold text-brand-yellow">
                  {member.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {member.name}
                  </p>

                  <p className="truncate text-xs text-dark-muted">
                    {member.email}
                  </p>
                </div>

                <span className="rounded-full border border-dark-border bg-dark-card px-2 py-1 text-xs text-gray-300">
                  {member.role?.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Tasks */}
      <div className="rounded-xl border border-dark-border bg-dark-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Project Tasks
            </h2>

            <p className="mt-1 text-sm text-dark-muted">
              Tasks associated with this project.
            </p>
          </div>

          <ClipboardList className="text-brand-yellow" size={22} />
        </div>

        {taskError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            Unable to load tasks: {taskError}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-10 text-center">
            <ClipboardList
              size={40}
              className="mx-auto mb-3 text-dark-muted"
            />

            <h3 className="font-semibold text-white">
              No tasks yet
            </h3>

            <p className="mt-1 text-sm text-dark-muted">
              No tasks have been created for this project.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-dark-border text-dark-muted">
                  <th className="px-3 py-3 font-medium">Task</th>
                  <th className="px-3 py-3 font-medium">Priority</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Due Date</th>
                </tr>
              </thead>

              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-dark-border transition last:border-0 hover:bg-dark-elevated/60"
                  >
                    <td className="px-3 py-4 font-medium text-gray-200">
                      {task.title}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                          priorityStyles[task.priority] ||
                          "border-dark-border bg-dark-elevated text-gray-300"
                        }`}
                      >
                        {task.priority || "N/A"}
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                          statusStyles[task.status] ||
                          "border-dark-border bg-dark-elevated text-gray-300"
                        }`}
                      >
                        {task.status?.replace("_", " ") || "N/A"}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-dark-muted">
                      {formatDate(task.due_date)}
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

function StatCard({ label, value, icon, color }) {
  const colors = {
    yellow: "bg-brand-yellow/10 text-brand-yellow",
    gray: "bg-gray-500/10 text-gray-400",
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-green-500/10 text-green-400",
  };

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-5 transition hover:border-brand-yellow/40">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-3 ${colors[color]}`}>
          {icon}
        </div>

        <div>
          <p className="text-sm text-dark-muted">{label}</p>
          <p className="text-2xl font-bold text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
