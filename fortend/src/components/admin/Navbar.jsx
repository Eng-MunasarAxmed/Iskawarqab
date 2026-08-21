import { Bell, Sparkles } from "lucide-react";

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#1E293B] bg-[#0A0A12] px-8 text-slate-200 shadow-xl transition-all">
      {/* LEFT: Title & Subtitle */}
      <div>
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          Admin Dashboard <Sparkles size={14} className="text-blue-400" />
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          Manage your system metrics and data
        </p>
      </div>

      {/* RIGHT: Notifications & User Profile */}
      <div className="flex items-center gap-5">
        {/* NOTIFICATION BUTTON */}
        <button className="relative rounded-xl p-2.5 text-slate-400 bg-[#11111B] border border-[#1E293B] hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30 transition-all">
          <Bell size={19} />
          {/* Notification dot using blue/neon accent instead of red */}
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500" />
        </button>

        {/* USER PROFILE INFO */}
        <div className="flex items-center gap-3.5 border-l border-[#1E293B] pl-5">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-600/30 shrink-0">
            {user.fullname
              ? user.fullname
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : "MA"}
          </div>

          <div className="hidden sm:block overflow-hidden">
            <p className="text-xs font-bold text-white truncate">
              {user.fullname || "Munasar Ahmed"}
            </p>
            <p className="text-[10px] text-slate-400 truncate font-medium">
              {user.email || "admin@iskawarqab.com"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
