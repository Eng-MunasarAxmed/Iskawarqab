import { useEffect, useState } from "react";
import { Plus, Pencil, X, RefreshCw } from "lucide-react";
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
    type: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTransections = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/transections");
      setTransections(response.data.data || []);
    } catch (err) {
      console.error("Transaction error:", err);
      setError(err.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data.data || []);
    } catch (err) {
      console.error("Category loading error:", err);
    }
  };

  useEffect(() => {
    fetchTransections();
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
    setFormData({ categoryId: "", amount: "", type: "" });
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (transaction) => {
    setEditingId(transaction._id);
    setFormData({
      categoryId: transaction.categoryId?._id || "",
      amount: transaction.amount ?? "",
      type: transaction.type || "",
    });
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ categoryId: "", amount: "", type: "" });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!formData.categoryId) {
        setError("Please select a category");
        setSaving(false);
        return;
      }

      if (formData.amount === "" || Number(formData.amount) <= 0) {
        setError("Please enter a valid amount");
        setSaving(false);
        return;
      }

      if (!formData.type) {
        setError("Please select transaction type");
        setSaving(false);
        return;
      }

      const data = {
        categoryId: formData.categoryId,
        amount: Number(formData.amount),
        type: formData.type,
      };

      if (editingId) {
        await api.put(`/transections/${editingId}`, data);
        setSuccess("Transaction updated successfully");
      } else {
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

  return (
    <div className="min-h-screen bg-[#0B132B] p-6 space-y-6 text-white">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-[#1C2541] p-6 rounded-2xl border border-[#3A506B] shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-sm text-blue-200 mt-1">
            Manage your income, expenses and savings
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all shadow-md"
          >
            <Plus size={18} />
            Add Transaction
          </button>

          <button
            onClick={fetchTransections}
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

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-[#1C2541] bg-[#0B132B] shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-blue-200">
            Loading transactions...
          </div>
        ) : transections.length === 0 ? (
          <div className="p-12 text-center text-blue-200">
            No transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1C2541] border-b border-[#3A506B]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">
                    NO
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {transections.map((transaction, index) => {
                  const rowBg =
                    index % 2 === 0 ? "bg-[#0B132B]" : "bg-[#1C2541]/40";
                  return (
                    <tr
                      key={transaction._id}
                      className={`border-t border-[#1C2541] hover:bg-[#1C2541] transition-colors ${rowBg}`}
                    >
                      <td className="px-6 py-4 text-base font-bold text-white">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-white">
                          {transaction.userId?.fullname || "-"}
                        </div>
                        <div className="text-xs text-blue-300">
                          {transaction.userId?.email || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-white">
                          {transaction.categoryId?.name || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-blue-300">
                        ${Number(transaction.amount || 0).toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full px-3 py-1 text-xs font-semibold capitalize bg-[#1C2541] border border-blue-500/30 text-blue-200">
                          {transaction.type || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-blue-200">
                        {transaction.createdAt
                          ? new Date(transaction.createdAt).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => openEditModal(transaction)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-300 hover:bg-[#1C2541]"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#0B132B] border border-[#1C2541] shadow-2xl text-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1C2541] bg-[#1C2541] p-5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingId ? "Edit Transaction" : "Add Transaction"}
                </h2>
                <p className="mt-1 text-sm text-blue-200">
                  {editingId
                    ? "Update transaction details"
                    : "Create a new transaction"}
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
                  Category
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-[#3A506B] bg-[#1C2541] px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="" className="bg-[#0B132B]">
                    Select Category
                  </option>
                  {categories.map((category) => (
                    <option
                      key={category._id}
                      value={category._id}
                      className="bg-[#0B132B]"
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-blue-200">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="e.g. 100"
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full rounded-xl border border-[#3A506B] bg-[#1C2541] px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-blue-200">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-[#3A506B] bg-[#1C2541] px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="" className="bg-[#0B132B]">
                    Select Type
                  </option>
                  <option value="income" className="bg-[#0B132B]">
                    Income
                  </option>
                  <option value="expense" className="bg-[#0B132B]">
                    Expense
                  </option>
                  <option value="savings" className="bg-[#0B132B]">
                    Savings
                  </option>
                </select>
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
