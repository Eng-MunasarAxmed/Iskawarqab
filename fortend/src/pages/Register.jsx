import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  CreditCard,
  Wallet,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const Register = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    userId: "",
    fullname: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Success message auto-hide
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [message]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    // Frontend validation
    if (
      !formData.userId ||
      !formData.fullname.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
  userId: Number(formData.userId),
  fullname: formData.fullname.trim(),
  email: formData.email.trim().toLowerCase(),
  password: formData.password,
});

      setMessage(
        response.data?.message ||
          "Registration successful. Your account is waiting for admin approval.",
      );

      // Clear form
      setFormData({
        userId: "",
        fullname: "",
        email: "",
        password: "",
      });
    } catch (err) {
      console.error(
        "REGISTER ERROR:",
        err.response?.data || err.message || err,
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create account.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-[#0A0F1D]">
      {/* ================= LEFT SIDE ================= */}
      <div className="relative flex flex-col justify-between p-8 sm:p-16 bg-[#002244] text-white">
        {/* Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 text-white shadow-lg">
              <Wallet size={24} />
            </div>

            <span className="text-xl font-bold tracking-wide text-white">
              Iskawarqab
            </span>
          </div>

          <div className="flex items-center px-4 py-1.5 rounded-full border border-white/20 text-blue-100 text-xs font-semibold bg-white/10">
            <span>est. 2026</span>
          </div>
        </div>

        {/* Center */}
        <div className="space-y-6 my-auto py-12">
          <div className="inline-flex items-center gap-1.5 text-blue-300 text-xs font-bold tracking-widest uppercase">
            <Sparkles size={14} />
            Create Your Account
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Join <br />
            <span className="text-blue-300">Iskawarqab today.</span>
          </h1>

          <p className="text-blue-100 text-sm leading-relaxed max-w-md">
            Register with your details to manage your wealth, track expenses,
            and stay on top of your monthly savings.
          </p>

          {/* Financial Bars */}
          <div className="pt-6 flex items-end gap-3.5 h-32">
            <div className="w-5 bg-[#0047AB] rounded-t-lg h-12" />
            <div className="w-5 bg-[#002244] rounded-t-lg h-24" />
            <div className="w-5 bg-[#0047AB] rounded-t-lg h-16" />
            <div className="w-5 bg-[#002244] rounded-t-lg h-28" />
            <div className="w-5 bg-[#0047AB] rounded-t-lg h-10" />
            <div className="w-5 bg-[#002244] rounded-t-lg h-20" />
            <div className="w-5 bg-[#0047AB] rounded-t-lg h-28" />
          </div>
        </div>

        {/* Owner */}
        <div className="flex items-center justify-between pt-6 border-t border-white/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 text-white font-black text-sm shadow-md">
              MA
            </div>

            <div>
              <h4 className="text-xs font-bold text-white">Munasar Ahmed</h4>

              <p className="text-[11px] text-blue-200">
                System Owner & Developer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-blue-200">
            <ShieldCheck size={14} className="text-blue-300" />
            <span>Encrypted</span>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="relative flex items-center justify-center p-8 sm:p-20 bg-[#0A0F1D] overflow-hidden">
        <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl bg-[#0A0F1D] border-4 border-slate-800 shadow-2xl shadow-blue-950/50 text-slate-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#002244] text-blue-400 border border-slate-800 mb-4 shadow-inner">
              <Wallet size={24} />
            </div>

            <div className="text-[10px] font-bold tracking-widest uppercase text-blue-400 mb-1">
              New Account
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Create Account
            </h2>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-950/50 border border-red-800/50 px-4 py-3 text-xs sm:text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Success */}
          {message && (
            <div className="mb-4 rounded-xl bg-emerald-950/50 border border-emerald-800/50 px-4 py-3 text-xs sm:text-sm text-emerald-400">
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                USER ID
              </label>

              <div className="relative">
                <CreditCard
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="number"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="e.g. 134500"
                  className="w-full rounded-xl bg-[#0A0F1D] border border-slate-800 py-3 pl-11 pr-4 text-xs sm:text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                FULL NAME
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="Enter full name"
                  className="w-full rounded-xl bg-[#0A0F1D] border border-slate-800 py-3 pl-11 pr-4 text-xs sm:text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                EMAIL ADDRESS
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="w-full rounded-xl bg-[#0A0F1D] border border-slate-800 py-3 pl-11 pr-4 text-xs sm:text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                PASSWORD
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl bg-[#0A0F1D] border border-slate-800 py-3 pl-11 pr-12 text-xs sm:text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl bg-[#002244] border border-blue-500/30 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-lg transition hover:bg-[#0047AB] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-blue-400 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
