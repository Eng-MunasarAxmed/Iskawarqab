import React from "react";
import {
  Activity,
  PieChart as PieIcon,
  Wallet,
  Users,
  LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: Activity },
  { name: "Categories", path: "/categories", icon: PieIcon },
  { name: "Transactions", path: "/transactions", icon: Wallet },
  { name: "My Profile", path: "/profile", icon: Users },
];

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#080B14] border-r border-blue-900/40 text-white z-30 flex flex-col justify-between p-6 shadow-[4px_0_30px_rgba(0,0,0,0.5)]">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B2A5B] to-[#1557A8] border border-blue-400/60 flex items-center justify-center font-black text-white shadow-[0_0_18px_rgba(37,99,235,0.55)]">
            I
          </div>
          <span className="font-extrabold text-lg tracking-wider text-white">
            Iskawarqab
          </span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 mb-8 p-3 rounded-2xl bg-[#0D1322] border border-blue-900/50 shadow-[inset_0_0_20px_rgba(30,64,175,0.12)]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B2A5B] to-[#1557A8] border border-blue-400/70 flex items-center justify-center font-black text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]">
            MA
          </div>
          <div>
            <h2 className="font-bold text-white text-xs">Munasar Ahmed</h2>
            <span className="text-[9px] text-blue-400 font-semibold uppercase tracking-wider">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-[#0B2A5B] to-[#123F7A] text-white border border-blue-400/50 shadow-[0_0_20px_rgba(37,99,235,0.45)]"
                      : "text-slate-400 hover:text-white hover:bg-[#0D1729] hover:border hover:border-blue-900/50"
                  }`
                }
              >
                <Icon size={18} className="text-blue-400" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-blue-900/30">
        <button
          onClick={handleLogout}
          className="
        w-full
        flex
        items-center
        justify-center
        gap-2
        px-4
        py-3
        rounded-xl
        bg-[#0D1322]
        border
        border-blue-900/50
        text-blue-300
        hover:bg-[#123F7A]
        hover:border-blue-400/70
        hover:text-white
        hover:shadow-[0_0_18px_rgba(37,99,235,0.4)]
        transition-all
        duration-300
        text-sm
        font-semibold
      "
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
