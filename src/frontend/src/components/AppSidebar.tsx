import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Wrench,
} from "lucide-react";

type Page = "dashboard" | "workorders" | "parts" | "reports";

interface AppSidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const navItems: {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "workorders", label: "Work Orders", icon: ClipboardList },
  { id: "parts", label: "Parts Tracker", icon: Package },
  { id: "reports", label: "Monthly Reports", icon: BarChart3 },
];

export default function AppSidebar({
  currentPage,
  onNavigate,
  onLogout,
}: AppSidebarProps) {
  return (
    <aside className="w-60 min-h-screen bg-slate-900 flex flex-col border-r border-slate-700 flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold leading-tight">
              A1 Collision
            </div>
            <div className="text-blue-400 font-semibold text-sm leading-tight">
              Repair
            </div>
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-2">Fort Walton Beach, FL</p>
      </div>
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-ocid={`sidebar.${item.id}.link`}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
      {/* Logout */}
      <div className="p-3 border-t border-slate-700">
        <button
          type="button"
          data-ocid="sidebar.logout.button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
