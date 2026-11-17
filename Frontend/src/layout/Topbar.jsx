
import { Menu, Bell, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Topbar({ onMenuClick }) {
  const { user, role, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const displayName =
    user?.full_name ||
    user?.name ||
    user?.username ||
    user?.email ||
    "User";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={23} />
        </button>

        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Workspace
          </h2>
          <p className="hidden text-xs text-slate-500 sm:block">
            Manage your projects and team activities
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <button
          className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          <UserCircle size={30} className="text-blue-600" />

          <div>
            <p className="max-w-36 truncate text-sm font-semibold text-slate-800">
              {displayName}
            </p>
            <p className="text-xs text-slate-500">{role || "Member"}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
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
