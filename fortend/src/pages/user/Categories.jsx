import { useEffect, useState } from "react";
import { Plus, Pencil, X, RefreshCw, Layers } from "lucide-react";
import api from "../../services/api";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/categories");
      setCategories(response.data.data || []);
    } catch (err) {
      console.error("Category error:", err);
      setError(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "" });
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingId(category._id);
    setFormData({
      name: category.name || "",
    });
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: "" });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!formData.name.trim()) {
        setError("Please enter a category name");
        setSaving(false);
        return;
      }

      const data = { name: formData.name.trim() };

      if (editingId) {
        await api.put(`/categories/${editingId}`, data);
        setSuccess("Category updated successfully");
      } else {
        await api.post("/categories", data);
        setSuccess("Category created successfully");
      }

      await fetchCategories();
      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      console.error("Category save error:", err);
      setError(err.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] p-6 space-y-6 text-white">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[#1C2541] p-6 rounded-2xl border border-[#3A506B] shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-sm text-blue-200 mt-1">Manage your categories</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all shadow-md"
          >
            <Plus size={18} />
            Add Category
          </button>

          <button
            onClick={fetchCategories}
            className="flex items-center gap-2 rounded-xl border border-[#3A506B] bg-[#0B132B] px-4 py-2.5 text-sm font-semibold text-blue-200 hover:bg-[#1C2541] transition-all"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {error && !showModal && (
        <div className="rounded-xl bg-[#1C2541] border border-red-500/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* CATEGORIES GRID */}
      {loading ? (
        <div className="p-12 text-center text-blue-200">
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center text-blue-200 rounded-2xl border border-[#1C2541] bg-[#1C2541]/40 shadow-xl">
          No categories found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((category) => (
            <div
              key={category._id}
              className="flex items-center justify-between bg-[#1C2541] border border-[#3A506B] px-5 py-4 rounded-xl shadow-md hover:border-blue-500 transition-all w-full"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#0B132B] text-blue-400 border border-[#3A506B]">
                  <Layers size={20} />
                </div>
                <span className="font-semibold text-white tracking-wide text-base">
                  {category.name}
                </span>
              </div>

              <button
                onClick={() => openEditModal(category)}
                className="p-2 rounded-lg text-blue-300 hover:bg-[#0B132B] transition-colors"
                title="Edit Category"
              >
                <Pencil size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0B132B] border border-[#1C2541] shadow-2xl text-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1C2541] bg-[#1C2541] p-5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingId ? "Edit Category" : "Add Category"}
                </h2>
                <p className="mt-1 text-sm text-blue-200">
                  {editingId
                    ? "Update category details"
                    : "Create a new category"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-blue-200 hover:bg-[#0B132B]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {error && (
                <div className="rounded-xl bg-[#1C2541] border border-red-500/40 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-[#1C2541] border border-green-500/40 px-4 py-3 text-sm text-green-300">
                  {success}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-blue-200">
                  Category Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Food, Salary..."
                  required
                  className="w-full rounded-xl border border-[#3A506B] bg-[#1C2541] px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-[#3A506B] bg-[#0B132B] px-5 py-2.5 text-sm font-semibold text-blue-200 hover:bg-[#1C2541] transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 shadow-md"
                >
                  {saving
                    ? "Saving..."
                    : editingId
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
