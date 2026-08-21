import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  X,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
} from "lucide-react";

import api from "../../services/api";

const Transections = () => {
  const [transections, setTransections] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    type: "expense",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // PAGINATION
  // ==========================================

  const transectionsPerPage = 10;

  const [currentPage, setCurrentPage] = useState(1);

  // Markii "All" la riixo, showAll wuxuu noqonayaa true
  // marka table-ku wuxuu tusayaa dhammaan data-da hal mar
  const [showAll, setShowAll] = useState(false);

  // ==========================================
  // GET TRANSACTIONS
  // ==========================================

  const fetchTransections = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/transections");

      setTransections(response.data.data || []);

      // Marka data cusub la keeno, ku celi bogga 1aad
      setCurrentPage(1);
    } catch (err) {
      console.error("Transaction error:", err);

      setError(err.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PAGINATION LOGIC
  // ==========================================

  const totalPages = Math.ceil(transections.length / transectionsPerPage);

  const startIndex = (currentPage - 1) * transectionsPerPage;

  const paginatedTransections = showAll
    ? transections
    : transections.slice(startIndex, startIndex + transectionsPerPage);

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
  // GET CATEGORIES
  // ==========================================

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");

      setCategories(response.data.data || []);
    } catch (err) {
      console.error("Category loading error:", err);
    }
  };

  // ==========================================
  // LOAD DATA
  // ==========================================

  useEffect(() => {
    fetchTransections();
    fetchCategories();
  }, []);

  // ==========================================
  // CHANGE
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
  // OPEN ADD MODAL
  // ==========================================

  const openAddModal = () => {
    setEditingId(null);

    setFormData({
      categoryId: "",
      amount: "",
      type: "expense",
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const openEditModal = (transaction) => {
    setEditingId(transaction._id);

    setFormData({
      categoryId: transaction.categoryId?._id || transaction.categoryId || "",

      amount: transaction.amount ?? "",

      type: transaction.type || "expense",
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
    setEditingId(null);

    setFormData({
      categoryId: "",
      amount: "",
      type: "expense",
    });

    setError("");
    setSuccess("");
  };

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // CATEGORY
    if (!formData.categoryId) {
      setError("Please select a category");
      return;
    }

    // AMOUNT
    if (formData.amount === "" || Number(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    // TYPE
    if (!formData.type) {
      setError("Please select transaction type");
      return;
    }

    try {
      setSaving(true);

      const data = {
        categoryId: formData.categoryId,
        amount: Number(formData.amount),
        type: formData.type,
      };

      // ========================================
      // UPDATE
      // ========================================

      if (editingId) {
        await api.put(`/transections/${editingId}`, data);

        setSuccess("Transaction updated successfully");
      }

      // ========================================
      // CREATE
      // ========================================
      else {
        await api.post("/transections", data);

        setSuccess("Transaction created successfully");
      }

      await fetchTransections();

      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      console.error("Transaction save error:", err);

      setError(err.response?.data?.message || "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // TYPE STYLE
  // ==========================================

  const getTypeStyle = (type) => {
    if (type === "income") {
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }

    if (type === "expense") {
      return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    }

    if (type === "savings") {
      return "bg-blue-600/10 text-blue-400 border border-blue-600/20";
    }

    return "bg-slate-800 text-slate-400 border border-slate-700";
  };

  // ==========================================
  // TYPE ICON
  // ==========================================

  const getTypeIcon = (type) => {
    if (type === "income") {
      return <ArrowUpCircle size={15} className="text-emerald-400" />;
    }

    if (type === "expense") {
      return <ArrowDownCircle size={15} className="text-rose-400" />;
    }

    if (type === "savings") {
      return <PiggyBank size={15} className="text-blue-400" />;
    }

    return null;
  };

  // ==========================================
  // MONEY
  // ==========================================

  const formatMoney = (amount) => {
    return `$${Number(amount || 0).toLocaleString()}`;
  };

  return (
    <div className="space-y-6 text-slate-100 min-h-screen bg-[#0b0f17] p-2 sm:p-6">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Transactions
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Manage all income, expenses and savings
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-[0.98]"
          >
            <Plus size={17} />
            Add Transaction
          </button>

          <button
            onClick={fetchTransections}
            className="flex items-center gap-2 rounded-xl border border-[#1f2d43] bg-[#090b14] px-4 py-2.5 text-sm font-semibold text-slate-300 hover:border-blue-500 hover:text-white transition"
          >
            <RefreshCw size={17} className="text-blue-400" />
            Refresh
          </button>
        </div>
      </div>

      {/* ======================================
          ERROR
      ====================================== */}

      {error && !showModal && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400">
          {error}
        </div>
      )}

      {/* ======================================
          TABLE
      ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-[#1f2d43] bg-[#090b14] shadow-2xl">
        {/* ALL BUTTON - TOP */}
        {!loading && transections.length > 0 && (
          <div className="flex items-center justify-end border-b border-[#1f2d43] px-6 py-3">
            <button
              onClick={toggleShowAll}
              className={`rounded-lg border px-4 py-1.5 text-xs font-bold transition-all ${
                showAll
                  ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                  : "border-[#1f2d43] bg-[#10111b] text-slate-300 hover:border-blue-500 hover:text-blue-400"
              }`}
            >
              All
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            Loading transactions...
          </div>
        ) : transections.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            No transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1f2d43] bg-[#0b0f17]/60 text-xs uppercase tracking-wider text-slate-400 font-bold">
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1f2d43]/50">
                {paginatedTransections.map((transaction, index) => (
                  <tr
                    key={transaction._id}
                    className="hover:bg-[#101322] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-400">
                      {startIndex + index + 1}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">
                        {transaction.userId?.fullname || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-300">
                      {transaction.categoryId?.name || "-"}
                    </td>

                    <td className="px-6 py-4 font-bold text-white">
                      {formatMoney(transaction.amount)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${getTypeStyle(
                          transaction.type,
                        )}`}
                      >
                        {getTypeIcon(transaction.type)}
                        {transaction.type || "-"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-400">
                      {transaction.createdAt
                        ? new Date(transaction.createdAt).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => openEditModal(transaction)}
                        className="flex items-center gap-1.5 rounded-lg border border-transparent bg-blue-600/10 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition"
                      >
                        <Pencil size={14} />
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

            <div className="flex flex-col gap-4 border-t border-[#1f2d43] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400 font-medium">
                {showAll
                  ? `Showing all ${transections.length} transactions`
                  : `Showing ${startIndex + 1} to ${Math.min(
                      startIndex + transectionsPerPage,
                      transections.length,
                    )} of ${transections.length} transactions`}
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
                          : "border-[#1f2d43] bg-[#10111b] text-slate-300 hover:border-blue-500 hover:text-blue-400"
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

      {/* ======================================
          MODAL
      ====================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1f2d43] bg-[#090b14] p-6 shadow-2xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-[#1f2d43] pb-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingId ? "Edit Transaction" : "Add Transaction"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingId
                    ? "Update transaction details"
                    : "Create a new transaction record"}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-[#101322] hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-400">
                  {success}
                </div>
              )}

              {/* CATEGORY */}
              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-400">
                  CATEGORY
                </label>

                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="h-[44px] w-full rounded-xl border border-[#1f2d43] bg-[#10111b] px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                >
                  <option value="" className="bg-[#090b14] text-slate-500">
                    Select Category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category._id}
                      value={category._id}
                      className="bg-[#090b14] text-white"
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* AMOUNT */}
              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-400">
                  AMOUNT
                </label>

                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="e.g. 100"
                  min="0"
                  step="0.01"
                  required
                  className="h-[44px] w-full rounded-xl border border-[#1f2d43] bg-[#10111b] px-4 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>

              {/* TYPE */}
              <div>
                <label className="mb-2 block text-xs font-semibold tracking-wide text-slate-400">
                  TYPE
                </label>

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="h-[44px] w-full rounded-xl border border-[#1f2d43] bg-[#10111b] px-4 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                >
                  <option value="income" className="bg-[#090b14] text-white">
                    Income
                  </option>
                  <option value="expense" className="bg-[#090b14] text-white">
                    Expense
                  </option>
                  <option value="savings" className="bg-[#090b14] text-white">
                    Savings
                  </option>
                </select>
              </div>

              {/* INFO */}
              <div className="rounded-xl bg-[#0b0f17] border border-[#1f2d43] p-3">
                <p className="text-xs text-slate-400">
                  User ID and transaction date are automatically assigned by the
                  backend.
                </p>
              </div>

              {/* BUTTONS */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-[43px] rounded-xl border border-[#1f2d43] bg-[#10111b] text-sm font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-[43px] rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Transaction"
                      : "Create Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transections;
