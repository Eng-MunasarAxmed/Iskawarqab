import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ArrowLeftRight,
  LogOut,
  Wallet,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

const menu = [
  {
    name: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    path: "/admin/users",
    icon: Users,
  },
  {
    name: "Categories",
    path: "/admin/categories",
    icon: FolderKanban,
  },
  {
    name: "Transactions",
    path: "/admin/transactions",
    icon: ArrowLeftRight,
  },
  {
    name: "Security",
    path: "/admin/security",
    icon: ShieldCheck,
  },
];

const Sidebar = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-45 flex h-screen w-64 flex-col justify-between border-r border-[#1E293B] bg-[#0A0A12] text-slate-200 shadow-2xl transition-all">
      {/* Top Section: Logo & Navigation */}
      <div>
        {/* Logo */}
        <div className="flex h-20 items-center border-b border-[#1E293B]/80 px-6 bg-[#11111B]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <Wallet size={21} className="text-white" />
            </div>

            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Iskawarqab
                <Sparkles size={13} className="text-blue-400" />
              </span>

              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                Finance Suite
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-3 p-4">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin/dashboard"}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-xs font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                      : "text-slate-400 hover:bg-[#11111B] hover:text-slate-100 border border-transparent hover:border-[#1E293B]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={`transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? "text-white" : "text-blue-400"
                      }`}
                    />

                    <span className="tracking-wide">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Profile & Logout */}
      <div className="p-4 bg-[#0A101D] border-t border-[#1E293B] space-y-3">
        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-blue-600/10 hover:text-blue-400 border border-transparent hover:border-blue-500/30 group"
        >
          <LogOut
            size={18}
            className="text-blue-400 transition-transform duration-200 group-hover:-translate-x-0.5"
          />

          <span>Logout Account</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
