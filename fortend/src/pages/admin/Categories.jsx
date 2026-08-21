import { useEffect, useState } from "react";
import { FolderOpen, RefreshCw, Plus, X, Pencil, Sparkles } from "lucide-react";

import api from "../../services/api";

const Categories = () => {
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
  });

  // ==========================================
  // PAGINATION
  // ==========================================

  const categoriesPerPage = 10;

  const [currentPage, setCurrentPage] = useState(1);

  // Markii "All" la riixo, showAll wuxuu noqonayaa true
  // marka table-ku wuxuu tusayaa dhammaan data-da hal mar
  const [showAll, setShowAll] = useState(false);

  // ==========================================
  // GET CURRENT USER
  // ==========================================

  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.error("User data error:", error);
      return null;
    }
  };

  const currentUser = getCurrentUser();

  const isAdmin = currentUser?.role === "admin";

  // ==========================================
  // GET CATEGORIES
  // ==========================================

  const getCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/categories");

      setCategories(response.data.data || []);

      // Marka data cusub la keeno, ku celi bogga 1aad
      setCurrentPage(1);
    } catch (err) {
      console.error("Categories error:", err);

      setError(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  // ==========================================
  // PAGINATION LOGIC
  // ==========================================

  const totalPages = Math.ceil(categories.length / categoriesPerPage);

  const startIndex = (currentPage - 1) * categoriesPerPage;

  const paginatedCategories = showAll
    ? categories
    : categories.slice(startIndex, startIndex + categoriesPerPage);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const toggleShowAll = () => {
    setShowAll((prev) => !prev);
    setCurrentPage(1);
  };

  // Dhis liiska lambarada bogagga (1, 2, 3, ...)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  // ==========================================
  // CHANGE INPUT
  // ==========================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
    setSuccess("");
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFormData({
      name: "",
    });

    setEditingCategory(null);
    setError("");
    setSuccess("");
  };

  // ==========================================
  // OPEN ADD MODAL
  // ==========================================

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const openEditModal = (category) => {
    setEditingCategory(category);

    setFormData({
      name: category.name || "",
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  // ==========================================
  // CHECK DUPLICATE CATEGORY
  // ==========================================

  const categoryExists = (name) => {
    const normalizedName = name.trim().toLowerCase();

    return categories.some((category) => {
      const sameName = category.name?.trim().toLowerCase() === normalizedName;

      // Haddii edit la samaynayo,
      // category-ga uu isagu yahay lama xisaabinayo
      const isSameCategory =
        editingCategory && category._id === editingCategory._id;

      return sameName && !isSameCategory;
    });
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const categoryName = formData.name.trim();

    // EMPTY
    if (!categoryName) {
      setError("Category name is required");
      return;
    }

    // MIN LENGTH
    if (categoryName.length < 3) {
      setError("Category name must be at least 3 characters");
      return;
    }

    // DUPLICATE
    if (categoryExists(categoryName)) {
      setError("This category already exists");
      return;
    }

    try {
      setSaving(true);

      // ========================================
      // UPDATE
      // ========================================

      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, {
          name: categoryName,
        });

        setSuccess("Category updated successfully");
      }

      // ========================================
      // CREATE
      // ========================================
      else {
        await api.post("/categories", {
          name: categoryName,
        });

        setSuccess("Category created successfully");
      }

      // Refresh categories
      await getCategories();

      // Close modal
      setTimeout(() => {
        setShowModal(false);
        resetForm();
      }, 700);
    } catch (err) {
      console.error("Category save error:", err);

      setError(err.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // GET USER DISPLAY
  // ==========================================

  const getUserDisplay = (category) => {
    if (category.userId?.userId) {
      return category.userId.userId;
    }

    if (category.userId?.fullname) {
      return category.userId.fullname;
    }

    return "-";
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6 text-slate-200">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* Cinwaanka oo leh laba midab (Two-tone): 'Categories' waa buluug, ikhtiyaari icon leh */}
          <h1 className="text-xl font-black flex items-center gap-2">
            <span className="text-blue-400">Categories</span>
            <Sparkles size={16} className="text-blue-400" />
          </h1>

          <p className="mt-0.5 text-xs text-slate-400 font-medium">
            Manage your categories
          </p>
        </div>

        <div className="flex gap-3">
          {/* REFRESH */}
          <button
            onClick={getCategories}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#1E293B] bg-[#11111B] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30 disabled:opacity-50 transition-all"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          {/* ADD */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
          >
            <Plus size={16} />
            Add Category
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && !showModal && (
        <div className="rounded-xl bg-rose-950/40 border border-rose-500/30 px-4 py-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-[#1E293B] bg-[#0A0A12] shadow-xl">
        {/* ALL BUTTON - TOP */}
        {!loading && categories.length > 0 && (
          <div className="flex items-center justify-end border-b border-[#1E293B] px-6 py-3">
            <button
              onClick={toggleShowAll}
              className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-all ${
                showAll
                  ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                  : "border-[#1E293B] bg-[#11111B] text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30"
              }`}
            >
              All
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">
            No categories found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E293B] bg-[#11111B]/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3.5">{isAdmin ? "No" : "ID"}</th>

                  <th className="px-6 py-3.5">Name</th>

                  <th className="px-6 py-3.5">User</th>

                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1E293B]">
                {paginatedCategories.map((category, index) => (
                  <tr
                    key={category._id}
                    className="hover:bg-[#11111B]/60 transition-colors text-xs"
                  >
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {isAdmin
                        ? startIndex + index + 1
                        : category.userId?.userId || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-950/50 border border-blue-500/30">
                          <FolderOpen size={15} className="text-blue-400" />
                        </div>

                        <span className="font-bold text-white">
                          {category.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-300">
                      {getUserDisplay(category)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(category)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#1E293B] bg-[#11111B] px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-sm"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ================================================= */}
            {/* PAGINATION FOOTER */}
            {/* ================================================= */}

            <div className="flex flex-col gap-4 border-t border-[#1E293B] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400 font-medium">
                {showAll
                  ? `Showing all ${categories.length} categories`
                  : `Showing ${startIndex + 1} to ${Math.min(
                      startIndex + categoriesPerPage,
                      categories.length,
                    )} of ${categories.length} categories`}
              </p>

              {/* PAGE NUMBERS - only shown when NOT showing all */}
              {!showAll && (
                <div className="flex flex-wrap items-center gap-2">
                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`min-w-[32px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        currentPage === page
                          ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                          : "border-[#1E293B] bg-[#11111B] text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1E293B] bg-[#0A0A12] p-6 shadow-2xl text-slate-200">
            {/* HEADER */}
            <div className="mb-5 flex items-center justify-between border-b border-[#1E293B] pb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {editingCategory ? "Edit Category" : "Add Category"}
                <Sparkles size={13} className="text-blue-400" />
              </h2>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-[#11111B] hover:text-white transition-all border border-transparent hover:border-[#1E293B] disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-rose-950/40 border border-rose-500/30 px-4 py-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 px-4 py-3 text-xs text-emerald-300">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Category Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Food, Salary, Transport"
                  required
                  disabled={saving}
                  className="w-full rounded-xl border border-[#1E293B] bg-[#11111B] px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-blue-500 transition-all disabled:opacity-50"
                />
              </div>

              <div className="rounded-xl border border-[#1E293B] bg-[#11111B]/50 p-3">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Category only requires a name. Amount and type will be entered
                  when creating a transaction.
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-[#1E293B] bg-[#11111B] py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-60 transition-all"
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
