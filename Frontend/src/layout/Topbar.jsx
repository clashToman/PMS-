
import { Menu, Bell, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Topbar({ onMenuClick }) {
  const { user, role, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const displayName =
    user?.full_name ||
    user?.name ||
    user?.username ||
    user?.email ||
    "User";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-dark-border bg-dark-sidebar/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg border border-dark-border p-2 text-gray-300 transition hover:border-brand-yellow hover:bg-dark-elevated hover:text-brand-yellow lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={23} />
        </button>

        <div>
          <h2 className="text-lg font-bold text-white">
            Workspace
          </h2>

          <p className="hidden text-xs text-dark-muted sm:block">
            Manage your projects and team activities
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 sm:gap-5">
        <button
          className="relative rounded-full border border-transparent p-2 text-gray-400 transition hover:border-dark-border hover:bg-dark-elevated hover:text-brand-yellow"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={20} />
        </button>

        {/* USER PROFILE */}
        <div className="hidden items-center gap-3 border-l border-dark-border pl-4 sm:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-yellow/30 bg-brand-yellow/10">
            <UserCircle
              size={25}
              className="text-brand-yellow"
            />
          </div>

          <div>
            <p className="max-w-36 truncate text-sm font-semibold text-white">
              {displayName}
            </p>

            <p className="text-xs font-medium text-brand-yellow">
              {role || "Member"}
            </p>
          </div>
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-dark-border px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
          title="Logout"
        >
          <LogOut size={17} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;
