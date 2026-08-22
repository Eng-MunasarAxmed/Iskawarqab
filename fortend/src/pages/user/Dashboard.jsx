import React, { useState, useEffect } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Users,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Clock,
  CreditCard,
  PiggyBank,
  Loader2,
} from "lucide-react";
import api from "../services/api"; // ⚠️ hubi path-ka saxda ah (fiiri UsersPage.jsx/Categories.jsx si aad u hubiso "../services/api" ama "../../services/api")

// ============= Count-up Hook for numbers animation =============
const useCountUp = (end, duration = 1200) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const numericEnd = parseFloat(end) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;

      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = easeProgress * numericEnd;

      setCount(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [end, duration]);

  return count;
};

// ============= Date Formatter (ISO string -> readable date) =============
const formatDate = (isoString) => {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }); // tusaale: "Aug 14, 2026"
};

const Dashboard = () => {
  // ============= XOGTA KA IMAANAYSA DATABASE/API-GA DHABTA AH =============
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        // "api" instance-ku (services/api.js) horeba wuu leeyahay:
        // - baseURL saxda ah (VITE_API_URL + "/api")
        // - Authorization Bearer token si otomaatig ah (interceptor)
        // sidaas darteed uma baahnid inaad si gaar ah u geliso token/headers halkan.
        const response = await api.get("/transections");

        const result = response.data;

        // Backend-ku wuxuu ku celiyaa: { status: true, message: "...", data: [...] }
        // ee ma aha array toos ah — waa in laga soo saaraa "data".
        if (!result.status) {
          throw new Error(result.message || "Failed to load transactions");
        }

        const rawTransactions = Array.isArray(result.data) ? result.data : [];

        // Normalize-garee xogta si ay ula jaanqaaddo qaabka schema-ga (categoryId populated, createdAt)
        const normalized = rawTransactions.map((t) => ({
          id: t._id,
          title:
            t.categoryId?.name || (t.type === "income" ? "Income" : "Expense"),
          type: (t.type || "").toLowerCase(), // "Income"/"Expense" -> "income"/"expense"
          amount: Number(t.amount) || 0,
          date: t.createdAt || t.date, // mongoose timestamps
          category: t.categoryId?.name || "-",
        }));

        if (isMounted) {
          setTransactions(normalized);
        }
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        if (isMounted) {
          setError("Ma soo qaadan karin xogta transactions-ka.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTransactions();

    // Optional: cusboonaysii xogta si toos ah every 30 seconds (real-time feel)
    const interval = setInterval(fetchTransactions, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ============= BISHA HADDA SOCOTA (Current Month/Year) =============
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();

  // ============= FILTER: kaliya transactions-ka bishan =============
  const currentMonthTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    return (
      txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
    );
  });

  // ============= XISAABINTA (kaliya bisha hadda socota) =============
  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSavings = currentMonthTransactions
    .filter((t) => t.type === "savings")
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Net Balance = Income − Expense − Savings
  const netBalance = totalIncome - totalExpense - totalSavings;

  const hasTransactionsThisMonth = currentMonthTransactions.length > 0;

  // ============= Animated Numbers =============
  const animatedBalance = useCountUp(netBalance, 1300);
  const animatedIncome = useCountUp(totalIncome, 1200);
  const animatedExpense = useCountUp(totalExpense, 1200);
  const animatedSavings = useCountUp(totalSavings, 1200);

  const monthName = now.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0A0A12] text-white font-sans overflow-hidden">
      <main className="p-6 md:p-8 space-y-6">
        {/* ============= LOADING / ERROR STATE ============= */}
        {loading && (
          <div className="flex items-center gap-2 text-blue-300 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading transactions from database...
          </div>
        )}
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* ================= SAFKA 1: 4 CARDS (LOGIC CUSUB — BISHA HADDA SOCOTA KALIYA) ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Card 1: Total Income */}
          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 shadow-[0_0_20px_rgba(59,130,246,0.25)] flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                Total Income
              </span>
              <h3 className="text-xl font-black text-white">
                $
                {animatedIncome.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </h3>
              <p className="text-xs text-slate-400">{monthName}</p>
            </div>
            <div className="w-16 h-16 rounded-full border-[9px] border-[#1E3A8A]/40 border-t-white border-r-blue-400 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)]">
              <ArrowUpRight size={20} className="text-emerald-400" />
            </div>
          </div>

          {/* Card 2: Net Balance = Income - Expense - Savings */}
          <div className="bg-[#1E3A8A] rounded-[2rem] border border-blue-400/80 p-6 shadow-[0_0_25px_rgba(59,130,246,0.6)] relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  Net Balance ({monthName})
                </span>
                <h3 className="text-2xl font-black text-white mt-1 tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                  $
                  {animatedBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </h3>
              </div>
              <div className="p-2.5 bg-[#0A0A12] border border-white/60 rounded-xl text-white shadow-[0_0_12px_rgba(255,255,255,0.6)]">
                <Wallet size={18} />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/30 space-y-1 text-xs font-semibold">
              <div className="flex justify-between text-white items-center">
                <span className="flex items-center gap-1 text-emerald-300">
                  <ArrowUpRight size={14} className="text-emerald-400" />
                  Income:
                </span>
                <span>
                  $
                  {animatedIncome.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-white items-center">
                <span className="flex items-center gap-1 text-rose-300">
                  <ArrowDownRight size={14} className="text-rose-400" />
                  Expense:
                </span>
                <span>
                  -$
                  {animatedExpense.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-white items-center">
                <span className="flex items-center gap-1 text-cyan-300">
                  <PiggyBank size={14} className="text-cyan-300" />
                  Savings:
                </span>
                <span>
                  -$
                  {animatedSavings.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {!hasTransactionsThisMonth && !loading && (
              <p className="mt-3 text-[10px] text-blue-200/70 italic">
                No transactions recorded for {monthName} yet.
              </p>
            )}
          </div>

          {/* Card 3: Total Expense */}
          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 shadow-[0_0_20px_rgba(59,130,246,0.25)] flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                Total Expense
              </span>
              <h3 className="text-xl font-black text-white">
                $
                {animatedExpense.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </h3>
              <p className="text-xs text-slate-400">{monthName}</p>
            </div>
            <div className="w-16 h-16 rounded-full border-[9px] border-[#1E3A8A]/40 border-t-white border-r-blue-400 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)]">
              <ArrowDownRight size={20} className="text-rose-400" />
            </div>
          </div>

          {/* Card 4: Total Savings */}
          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 shadow-[0_0_20px_rgba(59,130,246,0.25)] flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                Total Savings
              </span>
              <h3 className="text-xl font-black text-white">
                $
                {animatedSavings.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </h3>
              <p className="text-xs text-slate-400">{monthName}</p>
            </div>
            <div className="w-16 h-16 rounded-full border-[9px] border-[#1E3A8A]/40 border-t-white border-l-blue-400 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)]">
              <PiggyBank size={18} className="text-white" />
            </div>
          </div>
        </div>

        {/* ================= SAFKA 2: 3 CHARTS (design ma taaban) ================= */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 1. Burndown Chart */}
          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 md:p-8 shadow-[0_0_20px_rgba(59,130,246,0.2)] flex flex-col justify-between">
            <style>{`
              @keyframes growBar {
                from { transform: scaleY(0); }
                to { transform: scaleY(1); }
              }
            `}</style>
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Burndown Chart
                  </h3>
                  <p className="text-xs text-slate-400">
                    Task completion trajectory
                  </p>
                </div>
                <div className="p-2 bg-[#1E3A8A]/30 border border-[#1E3A8A] rounded-xl text-white">
                  <Activity size={16} />
                </div>
              </div>
              <div className="grid grid-cols-6 gap-3 h-40 items-end pt-4 pb-2 border-b border-[#1E3A8A]/40">
                {["90%", "80%", "65%", "45%", "25%", "10%"].map((h, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-[#1E3A8A] to-blue-400 border-t border-white rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.8)] origin-bottom"
                      style={{
                        height: h,
                        animation: `growBar 0.6s ease-out ${i * 0.08}s both`,
                      }}
                    ></div>
                    <span className="text-[10px] text-slate-400">W{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400 flex justify-between">
              <span>Target: On Track</span>
              <span className="text-white font-bold">Deep Blue Series</span>
            </div>
          </div>

          {/* 2. Probability of Risk */}
          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 md:p-8 shadow-[0_0_20px_rgba(59,130,246,0.2)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Probability of Risk
                  </h3>
                  <p className="text-xs text-slate-400">
                    Connected risk dots trajectory
                  </p>
                </div>
                <div className="p-2 bg-[#1E3A8A]/30 border border-[#1E3A8A] rounded-xl text-white">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <div className="h-40 relative flex items-center justify-center pt-2 pb-2 border-b border-[#1E3A8A]/40">
                <svg
                  className="w-full h-28 overflow-visible"
                  viewBox="0 0 300 100"
                >
                  <path
                    d="M 20 70 Q 90 20, 160 50 T 280 30"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    className="drop-shadow-[0_0_10px_rgba(59,130,246,0.9)]"
                  />
                  <circle
                    cx="20"
                    cy="70"
                    r="5"
                    fill="#ffffff"
                    className="drop-shadow-[0_0_8px_#ffffff]"
                  />
                  <circle
                    cx="90"
                    cy="35"
                    r="5"
                    fill="#ffffff"
                    className="drop-shadow-[0_0_8px_#ffffff]"
                  />
                  <circle
                    cx="160"
                    cy="50"
                    r="5"
                    fill="#ffffff"
                    className="drop-shadow-[0_0_8px_#ffffff]"
                  />
                  <circle
                    cx="220"
                    cy="40"
                    r="5"
                    fill="#ffffff"
                    className="drop-shadow-[0_0_8px_#ffffff]"
                  />
                  <circle
                    cx="280"
                    cy="30"
                    r="5"
                    fill="#ffffff"
                    className="drop-shadow-[0_0_8px_#ffffff]"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400 flex justify-between">
              <span>Status: Low Risk</span>
              <span className="text-white font-bold">Secured MA</span>
            </div>
          </div>

          {/* 3. Cost Structure */}
          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 md:p-8 shadow-[0_0_20px_rgba(59,130,246,0.2)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Cost Structure
                  </h3>
                  <p className="text-xs text-slate-400">
                    5-Sided Radar / Spider polygon
                  </p>
                </div>
                <div className="p-2 bg-[#1E3A8A]/30 border border-[#1E3A8A] rounded-xl text-white">
                  <BarChart3 size={16} />
                </div>
              </div>
              <div className="h-40 flex items-center justify-center relative">
                <svg
                  className="w-32 h-32 overflow-visible animate-pulse"
                  viewBox="0 0 100 100"
                >
                  <polygon
                    points="50,10 90,38 75,85 25,85 10,38"
                    fill="none"
                    stroke="#1E3A8A"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points="50,25 75,44 65,70 35,70 25,44"
                    fill="none"
                    stroke="#1E3A8A"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <polygon
                    points="50,18 82,41 68,78 32,75 16,40"
                    fill="rgba(30,58,138,0.6)"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    className="drop-shadow-[0_0_10px_rgba(59,130,246,0.9)]"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1E3A8A]/40 flex justify-between text-xs text-slate-400">
              <span>5-Vertex Mesh</span>
              <span className="text-white font-bold">100% Balanced</span>
            </div>
          </div>
        </div>

        {/* ================= SAFKA 3 (design ma taaban) ================= */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 1. Sprint Cycle */}
          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 md:p-8 shadow-[0_0_20px_rgba(59,130,246,0.2)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Sprint Cycle
                  </h3>
                  <p className="text-xs text-slate-400">
                    Iteration status ring
                  </p>
                </div>
                <div className="p-2 bg-[#1E3A8A]/30 border border-[#1E3A8A] rounded-xl text-white">
                  <Clock size={16} />
                </div>
              </div>
              <div className="flex items-center justify-center py-6">
                <div className="w-28 h-28 rounded-full border-[10px] border-[#1E3A8A]/40 border-t-white border-l-blue-400 flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.7)] animate-spin">
                  <span className="text-sm font-bold text-white animate-none">
                    82%
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-[#1E3A8A]/40 flex justify-between text-xs text-slate-400">
              <span>Active Cycle</span>
              <span className="text-white font-bold">Iteration #4</span>
            </div>
          </div>

          {/* 2. Recent Transactions */}
          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 md:p-8 shadow-[0_0_20px_rgba(59,130,246,0.2)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Recent Transactions
                  </h3>
                  <p className="text-xs text-slate-400">
                    Latest activity this month
                  </p>
                </div>
                <div className="p-2 bg-[#1E3A8A]/30 border border-[#1E3A8A] rounded-xl text-white">
                  <CreditCard size={16} />
                </div>
              </div>
              <div className="space-y-3">
                {currentMonthTransactions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No transactions yet this month.
                  </p>
                ) : (
                  currentMonthTransactions
                    .slice(-3)
                    .reverse()
                    .map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between bg-[#1E3A8A]/20 p-3 rounded-xl border border-[#1E3A8A]/40 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-white text-[10px] ${
                              tx.type === "income"
                                ? "bg-emerald-500/20 border-emerald-400"
                                : tx.type === "expense"
                                  ? "bg-rose-500/20 border-rose-400"
                                  : "bg-cyan-500/20 border-cyan-400"
                            }`}
                          >
                            {tx.type === "income" ? (
                              <ArrowUpRight
                                size={14}
                                className="text-emerald-400"
                              />
                            ) : tx.type === "expense" ? (
                              <ArrowDownRight
                                size={14}
                                className="text-rose-400"
                              />
                            ) : (
                              <PiggyBank size={14} className="text-cyan-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white">{tx.title}</p>
                            <p className="text-[10px] text-slate-400">
                              {formatDate(tx.date)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-bold ${
                            tx.type === "income"
                              ? "text-emerald-400"
                              : tx.type === "expense"
                                ? "text-rose-400"
                                : "text-cyan-400"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"}$
                          {tx.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
            <div className="pt-3 border-t border-[#1E3A8A]/40 flex justify-between text-xs text-slate-400">
              <span>This Month</span>
              <span className="text-white font-bold flex items-center gap-1">
                <CheckCircle2 size={13} className="text-blue-400" />
                {currentMonthTransactions.length} Records
              </span>
            </div>
          </div>

          {/* 3. Monthly Expenses */}
          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 md:p-8 shadow-[0_0_20px_rgba(59,130,246,0.2)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Monthly Expenses
                  </h3>
                  <p className="text-xs text-slate-400">{monthName} outflow</p>
                </div>
                <div className="p-2 bg-[#1E3A8A]/30 border border-[#1E3A8A] rounded-xl text-white">
                  <BarChart3 size={16} />
                </div>
              </div>
              <div className="h-32 flex items-end justify-center pt-2 pb-2 border-b border-[#1E3A8A]/40">
                <div
                  className="w-16 bg-gradient-to-t from-[#1E3A8A] to-blue-400 border-t border-white rounded-xl shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                  style={{ height: hasTransactionsThisMonth ? "80%" : "8%" }}
                ></div>
              </div>
            </div>
            <div className="pt-3 border-t border-[#1E3A8A]/40 flex justify-between text-xs text-slate-400">
              <span>Total Outflow</span>
              <span className="text-white font-bold">
                $
                {animatedExpense.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* ================= SAFKA 4: DATABASE TRANSACTIONS (bisha hadda socota) ================= */}
        <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 md:p-8 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">
                {monthName} Transactions (Database Records)
              </h3>
              <p className="text-xs text-slate-400">
                Live transactions recorded for {monthName}
              </p>
            </div>
            <div className="p-2 bg-[#1E3A8A]/30 border border-[#1E3A8A] rounded-xl text-white">
              <CreditCard size={16} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E3A8A]/40 text-slate-400">
                  <th className="pb-3 font-semibold">Transaction ID / Title</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1E3A8A]/20">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : currentMonthTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No transactions found for {monthName}.
                    </td>
                  </tr>
                ) : (
                  currentMonthTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#1E3A8A]/10 transition-colors"
                    >
                      <td className="py-3.5 font-bold text-white flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            tx.type === "income"
                              ? "bg-emerald-400"
                              : tx.type === "expense"
                                ? "bg-rose-400"
                                : "bg-cyan-400"
                          }`}
                        ></span>
                        {tx.title}
                      </td>
                      <td className="py-3.5 text-slate-300">{tx.category}</td>
                      <td className="py-3.5 text-slate-400">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            tx.type === "income"
                              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                              : tx.type === "expense"
                                ? "bg-rose-950/60 text-rose-300 border border-rose-500/40"
                                : "bg-cyan-950/60 text-cyan-300 border border-cyan-500/40"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td
                        className={`py-3.5 text-right font-black ${
                          tx.type === "income"
                            ? "text-emerald-400"
                            : tx.type === "expense"
                              ? "text-rose-400"
                              : "text-cyan-400"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}$
                        {tx.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1E3A8A]/40 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
            <span>Showing {monthName} database transaction entries only</span>
            <div className="flex gap-4 font-bold text-white">
              <span className="text-emerald-400">
                Income: $
                {totalIncome.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-rose-400">
                Expense: -$
                {totalExpense.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-cyan-400">
                Savings: -$
                {totalSavings.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-blue-300">
                Net: $
                {netBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
