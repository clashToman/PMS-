
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  BrainCircuit,
  X,
} from "lucide-react";

import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

function Sidebar({ open, onClose }) {
  const { isAdmin } = useAuth();

  const links = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Projects",
      path: "/projects",
      icon: FolderKanban,
    },
    {
      name: "Tasks",
      path: "/tasks",
      icon: ListTodo,
    },
    ...(isAdmin
      ? [
          {
            name: "Team Management",
            path: "/team",
            icon: Users,
          },
        ]
      : []),
    {
      name: "AI Assistant",
      path: "/ai-analysis",
      icon: BrainCircuit,
    },
  ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-dark-border bg-dark-sidebar text-white transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* BRAND LOGO */}
        <div className="flex h-20 items-center justify-between border-b border-dark-border px-4">
          <div className="flex min-w-0 flex-1 items-center">
            <img
              src={logo}
              alt="PMS Project Logo"
              className="h-14 w-full max-w-[190px] object-contain object-left"
            />
          </div>

          <button
            onClick={onClose}
            className="ml-2 rounded-lg p-2 text-gray-400 transition hover:bg-dark-elevated hover:text-brand-yellow lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={21} />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="px-4 py-6">
          <p className="mb-4 px-3 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
            Workspace
          </p>

          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;

              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "border-brand-yellow/20 bg-brand-yellow text-black shadow-yellow"
                        : "border-transparent text-gray-400 hover:border-dark-border hover:bg-dark-elevated hover:text-brand-yellow"
                    }`
                  }
                >
                  <Icon size={19} />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM INFO */}
        <div className="mt-auto border-t border-dark-border p-5">
          <div className="rounded-xl border border-dark-border bg-dark-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <BrainCircuit
                size={17}
                className="text-brand-yellow"
              />
              <span className="text-xs font-semibold text-white">
                AI Workspace
              </span>
            </div>

            <p className="text-xs leading-5 text-dark-muted">
              Manage projects, track tasks and discover insights.
            </p>
          </div>

          <p className="mt-4 text-center text-[10px] text-gray-600">
            PMS Project Workspace
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
