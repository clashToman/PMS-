
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
  ArrowUpRight,
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
    },
    {
      title: "Total Tasks",
      value: tasks.total ?? 0,
      description: `${tasks.todo ?? 0} waiting to start`,
      icon: ListTodo,
    },
    {
      title: "In Progress",
      value: tasks.in_progress ?? 0,
      description: "Currently being worked on",
      icon: Clock3,
    },
    {
      title: "Completed",
      value: tasks.completed ?? 0,
      description: "Successfully completed",
      icon: CheckCircle2,
    },
  ];

  const getStatusStyle = (status) => {
    const normalized = status?.toUpperCase();

    if (normalized === "COMPLETED" || normalized === "DONE") {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    }

    if (normalized === "IN_PROGRESS") {
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";
    }

    if (normalized === "TODO") {
      return "border-gray-500/20 bg-gray-500/10 text-gray-400";
    }

    return "border-brand-yellow/20 bg-brand-yellow/10 text-brand-yellow";
  };

  return (
    <div className="space-y-8">

      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-yellow">
            <span className="h-2 w-2 rounded-full bg-brand-yellow" />
            Overview
          </p>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Welcome back, <span className="text-brand-yellow">{name}</span>
          </h1>

          <p className="mt-2 text-sm text-dark-muted">
            Here's what's happening in your workspace.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-dark-border bg-dark-card px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-brand-yellow hover:text-brand-yellow disabled:opacity-50"
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
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertTriangle size={20} className="shrink-0" />
          <div>
            <p className="font-semibold">Dashboard loading failed</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Main statistics */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="group rounded-2xl border border-dark-border bg-dark-card p-5 transition duration-200 hover:-translate-y-1 hover:border-brand-yellow/50"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl border border-brand-yellow/20 bg-brand-yellow/10 p-3 text-brand-yellow transition group-hover:bg-brand-yellow group-hover:text-black">
                  <Icon size={22} />
                </div>

                <ArrowUpRight
                  size={18}
                  className="text-gray-600 transition group-hover:text-brand-yellow"
                />
              </div>

              <p className="mt-5 text-sm font-medium text-dark-muted">
                {stat.title}
              </p>

              <p className="mt-1 text-3xl font-extrabold text-white">
                {loading ? "..." : stat.value}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                {stat.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Additional statistics */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-dark-border bg-dark-card p-5">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-400">
            <AlertTriangle size={22} />
          </div>

          <div>
            <p className="text-sm text-dark-muted">Overdue Tasks</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {loading ? "..." : tasks.overdue ?? 0}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-dark-border bg-dark-card p-5">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <p className="text-sm text-dark-muted">Completed Projects</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {loading ? "..." : projects.completed ?? 0}
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming tasks and recent activities */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Upcoming tasks */}
        <div className="rounded-2xl border border-dark-border bg-dark-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-yellow/10 p-2.5 text-brand-yellow">
              <CalendarDays size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Upcoming Tasks
              </h2>
              <p className="text-xs text-dark-muted">
                Tasks approaching their due dates
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-dark-muted">
                Loading upcoming tasks...
              </p>
            ) : data?.upcoming_tasks?.length > 0 ? (
              data.upcoming_tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-3 border-b border-dark-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {task.title}
                    </p>

                    <p className="mt-1 text-xs text-dark-muted">
                      Due: {formatDate(task.due_date)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(task.status)}`}>
                      {task.status}
                    </span>

                    <span className="text-xs text-gray-500">
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dark-border bg-dark-elevated p-5 text-center text-sm text-dark-muted">
                No upcoming tasks found.
              </p>
            )}
          </div>
        </div>

        {/* Recent activities */}
        <div className="rounded-2xl border border-dark-border bg-dark-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-yellow/10 p-2.5 text-brand-yellow">
              <Activity size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Recent Activities
              </h2>
              <p className="text-xs text-dark-muted">
                Latest updates in your workspace
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-dark-muted">
                Loading recent activities...
              </p>
            ) : data?.recent_activities?.length > 0 ? (
              data.recent_activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 border-b border-dark-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="shrink-0 rounded-full p-2 text-brand-yellow">
                    <Activity size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {activity.action}
                    </p>

                    <p className="mt-1 text-sm text-dark-muted">
                      {activity.details || "Activity updated"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dark-border bg-dark-elevated p-5 text-center text-sm text-dark-muted">
                No recent activities found.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Admin team workload */}
      {isAdmin && (
        <section className="rounded-2xl border border-dark-border bg-dark-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-yellow/10 p-2.5 text-brand-yellow">
              <Users size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Team Workload
              </h2>

              <p className="text-xs text-dark-muted">
                Task distribution across team members
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[550px] text-left text-sm">
              <thead>
                <tr className="border-b border-dark-border text-xs uppercase tracking-wider text-gray-500">
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
                      className="border-b border-dark-border last:border-0 hover:bg-dark-elevated/50"
                    >
                      <td className="py-4 font-semibold text-white">
                        {member.name}
                      </td>

                      <td className="py-4 text-gray-300">{member.total_tasks}</td>
                      <td className="py-4 text-gray-300">{member.todo}</td>
                      <td className="py-4 text-blue-400">{member.in_progress}</td>
                      <td className="py-4 text-emerald-400">{member.completed}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-6 text-center text-dark-muted"
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
      <section className="relative overflow-hidden rounded-2xl border border-brand-yellow/20 bg-dark-sidebar p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-yellow/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-brand-yellow p-3 text-black shadow-yellow">
              <BrainCircuit size={26} />
            </div>

            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-yellow">
                Intelligent insights
              </p>

              <h2 className="text-lg font-extrabold text-white">
                AI Project Assistant
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-dark-muted">
                Analyze project progress, identify possible delays,
                and receive recommendations for your next actions.
              </p>
            </div>
          </div>

          <a
            href="/ai-analysis"
            className="relative z-10 inline-flex w-fit items-center gap-2 rounded-xl bg-brand-yellow px-5 py-3 text-sm font-bold text-black transition hover:bg-brand-hover"
          >
            Explore AI Assistant
            <ArrowUpRight size={17} />
          </a>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
