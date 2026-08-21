import { useEffect, useState } from "react";
import { Mail, Lock, Save, Fingerprint, User, ShieldCheck } from "lucide-react";
import api from "../../services/api";

const UserProfile = () => {
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.put("/users/profile");
        const userData = response.data.data;

        setUser({
          ...userData,
          userId: userData.userId || "198898",
        });
        setFormData({
          email: userData.email || "",
          password: "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser({
            ...parsed,
            userId: parsed.userId || "198898",
          });
          setFormData({ email: parsed.email || "", password: "" });
        } else {
          setUser({
            userId: "198898",
            fullname: "isma cali",
            role: "user",
            email: "isma@gmail.com",
          });
          setFormData({ email: "isma@gmail.com", password: "" });
        }
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const data = {
        email: formData.email,
      };

      if (formData.password.trim() !== "") {
        data.password = formData.password;
      }

      const response = await api.put("/users/profile", data);

      const updatedUser = response.data.data;

      const newUser = {
        userId: updatedUser.userId || "198898",
        fullname: updatedUser.fullname,
        email: updatedUser.email,
        role: updatedUser.role,
      };

      localStorage.setItem("user", JSON.stringify(newUser));

      setUser(newUser);

      setFormData({
        email: newUser.email,
        password: "",
      });

      setMessage("Profile updated successfully");
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B132B] p-6 text-blue-200">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B132B] p-6 text-white">
      <div className="max-w-4xl space-y-6">
        {/* PAGE TITLE */}
        <div>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-sm text-blue-200 mt-1">
            View your account information and update your login details
          </p>
        </div>

        {/* ACCOUNT INFORMATION - Halkan waxaa lagu daray max-w-xl si kaarku u gaabiyo */}
        <div className="bg-[#1C2541] rounded-2xl shadow-xl border border-[#3A506B] overflow-hidden max-w-xl">
          <div className="px-6 py-4 border-b border-[#3A506B]">
            <h2 className="text-lg font-bold text-white">
              Account Information
            </h2>
          </div>

          <div className="p-6 flex flex-col gap-3">
            {/* ID ROW */}
            <div className="px-5 py-3 rounded-xl border border-[#3A506B]/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint size={18} className="text-blue-400" />
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                  ID
                </span>
              </div>
              <span className="text-sm font-semibold text-white">
                {user.userId || "198898"}
              </span>
            </div>

            {/* FULL NAME ROW */}
            <div className="px-5 py-3 rounded-xl border border-[#3A506B]/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User size={18} className="text-blue-400" />
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                  FULL NAME
                </span>
              </div>
              <span className="text-sm font-semibold text-white">
                {user.fullname}
              </span>
            </div>

            {/* ROLE ROW */}
            <div className="px-5 py-3 rounded-xl border border-[#3A506B]/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-blue-400" />
                <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                  ROLE
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border bg-blue-950/40 text-blue-300 border-blue-500/30">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* EMAIL + PASSWORD CARD */}
        <div className="bg-[#1C2541] rounded-2xl shadow-xl border border-[#3A506B]">
          <div className="px-6 py-4 border-b border-[#3A506B]">
            <h2 className="text-lg font-bold text-white">Login Information</h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Change your email or password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* SUCCESS MESSAGE */}
            {message && (
              <div className="p-3 rounded-xl bg-[#0B132B] border border-green-500/40 text-sm text-green-300">
                {message}
              </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
              <div className="p-3 rounded-xl bg-[#0B132B] border border-red-500/40 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* EMAIL */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Email
                </label>

                <div className="relative flex items-center">
                  <Mail size={18} className="absolute left-4 text-blue-400" />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#0B132B] border border-[#3A506B] rounded-xl text-white outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  New Password
                </label>

                <div className="relative flex items-center">
                  <Lock size={18} className="absolute left-4 text-blue-400" />

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    className="w-full pl-11 pr-4 py-3 bg-[#0B132B] border border-[#3A506B] rounded-xl text-white outline-none focus:border-blue-500 transition-colors text-sm"
                  />
                </div>

                <p className="text-xs text-blue-300 mt-1.5">
                  Leave empty if you don't want to change it.
                </p>
              </div>
            </div>

            {/* UPDATE BUTTON */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 shadow-md"
              >
                <Save size={18} />
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
