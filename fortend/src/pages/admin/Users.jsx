import { useEffect, useState } from "react";
import {
  Users,
  RefreshCw,
  Search,
  Plus,
  X,
  Pencil,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    userId: "",
    fullname: "",
    email: "",
    password: "",
  });

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ============= CUSUB: Confirmation modal (Cancel/Delete) =============
  const [confirmUser, setConfirmUser] = useState(null); // user la doonayo in la Cancel/Delete gareeyo
  const [confirming, setConfirming] = useState(false);

  // ============= CUSUB: Success toast/message =============
  const [successMessage, setSuccessMessage] = useState("");

  // ============= CUSUB: PAGINATION (10 users bog kasta + All button) =============
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const usersPerPage = 10;

  // Toast-ku si otomaatig ah ha u lumo 3 seconds gudahood
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // =========================
  // GET USERS
  // =========================
  const getUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");

      const data = response?.data?.data;

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Users error:", err);

      setError(err?.response?.data?.message || "Failed to load users");

      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  // =========================
  // SEARCH
  // =========================
  const filteredUsers = users.filter((user) => {
    const fullname = user?.fullname || "";
    const email = user?.email || "";

    return `${fullname} ${email}`.toLowerCase().includes(search.toLowerCase());
  });

  // ============= CUSUB: PAGINATION LOGIC =============

  // Marka search-ka isbedelo, dib ugu noqo bogga 1aad
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / usersPerPage),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginationStartIndex = (safeCurrentPage - 1) * usersPerPage;

  const paginatedUsers = showAll
    ? filteredUsers
    : filteredUsers.slice(
        paginationStartIndex,
        paginationStartIndex + usersPerPage,
      );

  const goToPage = (page) => {
    setShowAll(false);
    setCurrentPage(page);
  };

  const toggleShowAll = () => {
    setShowAll((prev) => !prev);
    setCurrentPage(1);
  };

  // Liiska lambarada bogagga (1, 2, 3...)
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "...",
      totalPages,
    ];
  };

  // =========================
  // FORM CHANGE
  // =========================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setFormError("");
  };

  // =========================
  // RESET FORM
  // =========================
  const resetForm = () => {
    setFormData({
      userId: "",
      fullname: "",
      email: "",
      password: "",
    });

    setFormError("");
  };

  // =========================
  // ADD USER
  // =========================
  const openAddModal = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  // =========================
  // EDIT USER
  // =========================
  const openEditModal = (user) => {
    setEditingUser(user);

    setFormData({
      userId: user?.userId || "",
      fullname: user?.fullname || "",
      email: user?.email || "",
      password: "",
    });

    setFormError("");
    setShowModal(true);
  };

  // =========================
  // CLOSE MODAL
  // =========================
  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    resetForm();
  };

  // =========================
  // APPROVE USER
  // =========================
  const handleApprove = async (id) => {
    try {
      setError("");

      await api.put(`/users/${id}/approve`);

      await getUsers();

      setSuccessMessage("User approved successfully.");
    } catch (err) {
      console.error("Approve error:", err);

      setError(err?.response?.data?.message || "Failed to approve user");
    }
  };

  // =========================
  // CUSUB: OPEN CONFIRM MODAL (Cancel/Reject)
  // =========================
  const openConfirmCancel = (user) => {
    setConfirmUser(user);
  };

  const closeConfirmModal = () => {
    setConfirmUser(null);
    setConfirming(false);
  };

  // =========================
  // CANCEL USER (marka la xaqiijiyo)
  // =========================
  const handleConfirmCancel = async () => {
    if (!confirmUser?._id) return;

    try {
      setConfirming(true);
      setError("");

      await api.put(`/users/${confirmUser._id}/cancel`);

      await getUsers();

      // ✅ Fariinta guuleysashada
      setSuccessMessage("User deleted successfully.");
      closeConfirmModal();
    } catch (err) {
      console.error("Cancel error:", err);

      setError(err?.response?.data?.message || "Failed to cancel user");
      setConfirming(false);
    }
  };

  // =========================
  // CREATE / UPDATE USER
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");
    setSubmitting(true);

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, formData);
        setSuccessMessage("User updated successfully.");
      } else {
        await api.post("/users", formData);
        setSuccessMessage("User created successfully.");
      }

      closeModal();

      await getUsers();
    } catch (err) {
      console.error("Submit user error:", err);

      setFormError(
        err?.response?.data?.message ||
          "Waxaa dhacay khalad, fadlan isku day mar kale.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      {/* =========================
          CUSUB: SUCCESS TOAST (dhinaca sare, mid guriga la mid ah)
      ========================= */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-[60] flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-[#062018] px-5 py-4 shadow-2xl shadow-emerald-900/40 animate-[fadeSlideIn_0.3s_ease-out]">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold text-emerald-300">
            {successMessage}
          </p>
          <button
            onClick={() => setSuccessMessage("")}
            className="ml-2 text-emerald-400/60 hover:text-emerald-300"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <span className="text-blue-400">Users</span>

            <span className="text-white">Management</span>

            <Sparkles size={16} className="text-blue-400" />
          </h1>

          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Manage registered system users and accounts
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
          >
            <Plus size={16} />
            Add User
          </button>

          <button
            onClick={getUsers}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#1E293B] bg-[#11111B] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30 transition-all"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      {/* =========================
          ERROR
      ========================= */}
      {error && (
        <div className="rounded-xl bg-rose-950/40 border border-rose-500/30 px-4 py-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* =========================
          SEARCH
      ========================= */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[#1E293B] bg-[#11111B] py-3 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        />
      </div>

      {/* =========================
          TABLE
      ========================= */}
      <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0A0A12] shadow-xl">
        <div className="border-b border-[#1E293B] bg-[#11111B] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users size={18} className="text-blue-400" />

            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              All Users ({filteredUsers.length})
            </h2>
          </div>

          {/* ============= CUSUB: ALL BUTTON ============= */}
          <button
            onClick={toggleShowAll}
            className={`rounded-xl px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${
              showAll
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "border border-[#1E293B] bg-[#0A0A12] text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30"
            }`}
          >
            All
          </button>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">
            Loading users data...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* =========================
                  TABLE HEADER
              ========================= */}
              <thead>
                <tr className="border-b border-[#1E293B] bg-[#11111B]/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3.5">ID</th>

                  <th className="px-6 py-3.5">Fullname</th>

                  <th className="px-6 py-3.5">Email</th>

                  <th className="px-6 py-3.5">Role</th>

                  {/* NEW */}
                  <th className="px-6 py-3.5">Account</th>

                  <th className="px-6 py-3.5">Status</th>

                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              {/* =========================
                  TABLE BODY
              ========================= */}
              <tbody className="divide-y divide-[#1E293B]">
                {paginatedUsers.map((user, index) => {
                  const accountStatus =
                    user?.accountStatus === "approved" ? "approved" : "pending";

                  return (
                    <tr
                      key={user?._id || user?.userId || index}
                      className="hover:bg-[#11111B]/60 transition-colors text-xs"
                    >
                      {/* ID */}
                      <td className="px-6 py-4 text-slate-400 font-mono">
                        {user?.userId || 10001 + index}
                      </td>

                      {/* FULLNAME */}
                      <td className="px-6 py-4 font-bold text-white">
                        {user?.fullname || "-"}
                      </td>

                      {/* EMAIL */}
                      <td className="px-6 py-4 text-slate-300">
                        {user?.email || "-"}
                      </td>

                      {/* ROLE */}
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase ${
                            user?.role === "admin"
                              ? "bg-purple-950/50 text-purple-400 border border-purple-500/30"
                              : "bg-blue-950/50 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {user?.role || "user"}
                        </span>
                      </td>

                      {/* ACCOUNT STATUS */}
                      <td className="px-6 py-4">
                        {accountStatus === "approved" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase bg-amber-950/50 text-amber-400 border border-amber-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* OLD STATUS */}
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5 w-max ${
                            user?.status === "active"
                              ? "bg-emerald-950/50 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-950/50 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user?.status === "active"
                                ? "bg-emerald-400"
                                : "bg-rose-400"
                            }`}
                          />

                          {user?.status || "active"}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* APPROVE */}
                          {accountStatus === "pending" && (
                            <button
                              onClick={() => handleApprove(user?._id)}
                              disabled={!user?._id}
                              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              Approve
                            </button>
                          )}

                          {/* CANCEL — hadda wuxuu furayaa confirmation modal, ma tirtirayo toos ahaan */}
                          {accountStatus === "pending" && (
                            <button
                              onClick={() => openConfirmCancel(user)}
                              disabled={!user?._id}
                              className="rounded-xl bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              Cancel
                            </button>
                          )}

                          {/* EDIT */}
                          <button
                            onClick={() => openEditModal(user)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#1E293B] bg-[#11111B] px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30 transition-all"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* =========================
            CUSUB: PAGINATION CONTROLS
        ========================= */}
        {!loading && filteredUsers.length > 0 && !showAll && totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-[#1E293B] bg-[#11111B]/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-slate-400 font-medium">
              Showing {paginationStartIndex + 1} to{" "}
              {Math.min(
                paginationStartIndex + usersPerPage,
                filteredUsers.length,
              )}{" "}
              of {filteredUsers.length} users
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(Math.max(safeCurrentPage - 1, 1))}
                disabled={safeCurrentPage === 1}
                className="rounded-lg border border-[#1E293B] bg-[#0A0A12] px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
              >
                Prev
              </button>

              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`dots-${idx}`}
                    className="px-2 text-[11px] text-slate-500"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`h-8 min-w-8 rounded-lg px-2.5 text-[11px] font-bold transition-all ${
                      safeCurrentPage === page
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "border border-[#1E293B] bg-[#0A0A12] text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                onClick={() =>
                  goToPage(Math.min(safeCurrentPage + 1, totalPages))
                }
                disabled={safeCurrentPage === totalPages}
                className="rounded-lg border border-[#1E293B] bg-[#0A0A12] px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Fariin yar marka "All" la taabtay */}
        {!loading && filteredUsers.length > 0 && showAll && (
          <div className="border-t border-[#1E293B] bg-[#11111B]/50 px-6 py-4">
            <p className="text-[11px] text-slate-400 font-medium">
              Showing all {filteredUsers.length} users.{" "}
              <button
                onClick={toggleShowAll}
                className="font-bold text-blue-400 hover:text-blue-300"
              >
                Switch back to pages
              </button>
            </p>
          </div>
        )}
      </div>

      {/* =========================
          CUSUB: CONFIRMATION MODAL (Cancel/Delete)
      ========================= */}
      {confirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-[#0A0A12] p-6 shadow-2xl text-slate-200">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-950/50 border border-rose-500/40">
                <AlertTriangle size={22} className="text-rose-400" />
              </div>

              <h3 className="text-sm font-bold text-white">
                Delete this user?
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                Waxaad ku dhowdahay inaad tirtirto{" "}
                <span className="font-bold text-white">
                  {confirmUser.fullname}
                </span>{" "}
                ({confirmUser.email}). Tallaabadan lama soo celin karo.
              </p>
            </div>

            <div className="flex gap-3 pt-5">
              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={confirming}
                className="flex-1 rounded-xl border border-[#1E293B] bg-[#11111B] py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={confirming}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-60 transition-all"
              >
                {confirming ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          ADD / EDIT MODAL
      ========================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1E293B] bg-[#0A0A12] p-6 shadow-2xl text-slate-200">
            {/* MODAL HEADER */}
            <div className="mb-5 flex items-center justify-between border-b border-[#1E293B] pb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {editingUser ? "Edit User Account" : "Create New User"}

                <Sparkles size={13} className="text-blue-400" />
              </h2>

              <button
                onClick={closeModal}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-[#11111B] hover:text-white transition-all border border-transparent hover:border-[#1E293B]"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM ERROR */}
            {formError && (
              <div className="mb-4 rounded-xl bg-rose-950/40 border border-rose-500/30 px-4 py-3 text-xs text-rose-300">
                {formError}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* USER ID */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  User ID
                </label>

                <input
                  type="number"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  placeholder="e.g. 10001"
                  className="w-full rounded-xl border border-[#1E293B] bg-[#11111B] px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>

              {/* FULL NAME */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Fullname
                </label>

                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-[#1E293B] bg-[#11111B] px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter email address"
                  className="w-full rounded-xl border border-[#1E293B] bg-[#11111B] px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Password
                  {editingUser && (
                    <span className="text-[10px] lowercase font-normal text-slate-500">
                      {" "}
                      (leave blank to keep current)
                    </span>
                  )}
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={
                    editingUser ? "Enter new password" : "Enter password"
                  }
                  required={!editingUser}
                  className="w-full rounded-xl border border-[#1E293B] bg-[#11111B] px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500 transition-all"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-[#1E293B] bg-[#11111B] py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-60 transition-all"
                >
                  {submitting
                    ? editingUser
                      ? "Saving..."
                      : "Creating..."
                    : editingUser
                      ? "Save Changes"
                      : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
