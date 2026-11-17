
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  BrainCircuit,
  X,
} from "lucide-react";

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
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2">
              <BrainCircuit size={22} />
            </div>

            <div>
              <h1 className="text-lg font-bold">ProjectAI</h1>
              <p className="text-xs text-slate-400">
                Project Management
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={21} />
          </button>
        </div>

        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                    `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <Icon size={19} />
                  {link.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-slate-800 p-5">
          <p className="text-xs text-slate-500">
            AI-Powered Project Management
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Workspace Dashboard
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
