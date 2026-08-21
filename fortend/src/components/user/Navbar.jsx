import { LogOut, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <header className="h-16 bg-[#080B14] border-b border-blue-900/40 flex items-center justify-between px-6 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
      {/* Left */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-wide">
          User Panel
        </h2>

        <div className="h-0.5 w-8 mt-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* User */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B2A5B] to-[#1557A8] border border-blue-400/60 flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.45)]">
            <UserCircle size={21} className="text-blue-200" />
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              {user.fullname || "User"}
            </p>

            <p className="text-xs text-slate-400">{user.email || ""}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
