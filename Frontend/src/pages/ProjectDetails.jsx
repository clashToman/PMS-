
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
  PLANNING: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-purple-100 text-purple-700",
  CANCELLED: "bg-red-100 text-red-700",
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
};

const priorityStyles = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
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
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
        Loading project details...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to Projects
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <AlertCircle size={24} className="mb-2" />
          <p className="font-semibold">Unable to load project</p>
          <p className="mt-1 text-sm">
            {error || "Project not found."}
          </p>

          <button
            onClick={fetchProjectDetails}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft size={18} />
          Back to Projects
        </Link>

        <button
          onClick={fetchProjectDetails}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
              <FolderKanban size={17} />
              Project #{project.id}
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              {project.name}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              {project.description || "No description provided."}
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusStyles[project.status] ||
              "bg-gray-100 text-gray-700"
            }`}
          >
            {project.status?.replace("_", " ")}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatDate(project.start_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Deadline</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatDate(project.deadline)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Team Members</p>
              <p className="text-sm font-semibold text-gray-800">
                {project.members?.length || 0} Members
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Task Overview
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            icon={<ListTodo size={21} />}
            color="blue"
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
            color="yellow"
          />

          <StatCard
            label="Completed"
            value={completedTasks}
            icon={<CheckCircle2 size={21} />}
            color="green"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Assigned Team Members
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              People assigned to this project.
            </p>
          </div>
          <Users className="text-gray-400" size={22} />
        </div>

        {!project.members?.length ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No team members assigned.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                  {member.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {member.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {member.email}
                  </p>
                </div>

                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  {member.role?.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Project Tasks
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Tasks associated with this project.
            </p>
          </div>
          <ClipboardList className="text-gray-400" size={22} />
        </div>

        {taskError ? (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            Unable to load tasks: {taskError}
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-10 text-center">
            <ClipboardList
              size={40}
              className="mx-auto mb-3 text-gray-300"
            />
            <h3 className="font-semibold text-gray-800">
              No tasks yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No tasks have been created for this project.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
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
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-3 py-4 font-medium text-gray-800">
                      {task.title}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          priorityStyles[task.priority] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {task.priority || "N/A"}
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          statusStyles[task.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {task.status?.replace("_", " ") || "N/A"}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-gray-600">
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
    blue: "bg-blue-100 text-blue-600",
    gray: "bg-gray-100 text-gray-600",
    yellow: "bg-yellow-100 text-yellow-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-3 ${colors[color]}`}>
          {icon}
        </div>

        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
