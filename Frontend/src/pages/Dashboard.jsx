
import { useEffect, useState } from "react";
import {
  FolderKanban,
  ListTodo,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Activity,
  BrainCircuit,
  RefreshCw,
  Users,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import dashboardService from "../services/dashboardService";

function formatDate(value) {
  if (!value) return "No due date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Dashboard() {
  const { user, isAdmin } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const name =
    user?.full_name ||
    user?.name ||
    user?.username ||
    user?.email ||
    "there";

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await dashboardService.getSummary();

      setData(result);
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const projects = data?.projects || {};
  const tasks = data?.tasks || {};

  const stats = [
    {
      title: "Total Projects",
      value: projects.total ?? 0,
      description: `${projects.active ?? 0} currently active`,
      icon: FolderKanban,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Tasks",
      value: tasks.total ?? 0,
      description: `${tasks.todo ?? 0} waiting to start`,
      icon: ListTodo,
      color: "bg-violet-50 text-violet-600",
    },
    {
      title: "In Progress",
      value: tasks.in_progress ?? 0,
      description: "Currently being worked on",
      icon: Clock3,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Completed",
      value: tasks.completed ?? 0,
      description: "Successfully completed",
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-8">

      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Overview
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Welcome back, {name}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Here's what's happening in your workspace.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </section>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={20} className="shrink-0" />
          <div>
            <p className="font-semibold">
              Dashboard loading failed
            </p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${stat.color}`}>
                  <Icon size={22} />
                </div>
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                {stat.title}
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                {loading ? "..." : stat.value}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {stat.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Additional statistics */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <AlertTriangle size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Overdue Tasks
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {loading ? "..." : tasks.overdue ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Completed Projects
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {loading ? "..." : projects.completed ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming tasks and recent activities */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Upcoming tasks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-blue-600" size={22} />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Upcoming Tasks
              </h2>
              <p className="text-xs text-slate-500">
                Tasks approaching their due dates
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-slate-400">
                Loading upcoming tasks...
              </p>
            ) : data?.upcoming_tasks?.length > 0 ? (
              data.upcoming_tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {task.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Due: {formatDate(task.due_date)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {task.status}
                    </span>

                    <span className="text-xs text-slate-400">
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
                No upcoming tasks found.
              </p>
            )}
          </div>
        </div>

        {/* Recent activities */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <Activity className="text-violet-600" size={22} />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Activities
              </h2>
              <p className="text-xs text-slate-500">
                Latest updates in your workspace
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-slate-400">
                Loading recent activities...
              </p>
            ) : data?.recent_activities?.length > 0 ? (
              data.recent_activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 border-b border-slate-100 pb-4 last:border-0"
                >
                  <div className="rounded-full bg-violet-50 p-2 text-violet-600">
                    <Activity size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {activity.action}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {activity.details || "Activity updated"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
                No recent activities found.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Admin team workload */}
      {isAdmin && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <Users className="text-blue-600" size={22} />

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Team Workload
              </h2>

              <p className="text-xs text-slate-500">
                Task distribution across team members
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[550px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="pb-3">Team Member</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">To Do</th>
                  <th className="pb-3">In Progress</th>
                  <th className="pb-3">Completed</th>
                </tr>
              </thead>

              <tbody>
                {!loading && data?.team_workload?.length > 0 ? (
                  data.team_workload.map((member) => (
                    <tr
                      key={member.user_id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-4 font-medium text-slate-800">
                        {member.name}
                      </td>

                      <td className="py-4">{member.total_tasks}</td>
                      <td className="py-4">{member.todo}</td>
                      <td className="py-4">{member.in_progress}</td>
                      <td className="py-4">{member.completed}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-6 text-center text-slate-400"
                    >
                      {loading
                        ? "Loading team workload..."
                        : "No team workload data available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* AI assistant banner */}
      <section className="flex flex-col justify-between gap-5 rounded-2xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-blue-600 p-3">
            <BrainCircuit size={25} />
          </div>

          <div>
            <h2 className="text-lg font-bold">
              AI Project Assistant
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Analyze project progress, identify possible delays,
              and receive recommendations for your next actions.
            </p>
          </div>
        </div>

        <a
          href="/ai-analysis"
          className="w-fit rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Explore AI Assistant
        </a>
      </section>
    </div>
  );
}

export default Dashboard;
