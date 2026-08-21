import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Activity,
  RefreshCw,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  ShieldAlert,
  Target,
  CheckCircle2,
  Loader2,
} from "lucide-react";

// ============= Count-up Hook =============
const useCountUp = (end, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp = null;
    const numericEnd = parseFloat(end) || 0;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(ease * numericEnd);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return count;
};

const fmt = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

// ============= API CONFIG =============
// Haddii frontend-ka lagu deploy-gareeyo meel kale, dhig VITE_API_URL gudaha .env.
// Tusaale: VITE_API_URL=http://localhost:3000
const API_BASE_URL = (
  import.meta.env?.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const TRANSACTIONS_URLS = [
  `${API_BASE_URL}/api/transections`,
  // Fallback haddii backend-ka route-ku yahay "transactions" halkii "transections".
  `${API_BASE_URL}/api/transections`,
];

const USERS_URL = `${API_BASE_URL}/api/auth/users`;

// JSON-safe fetch:
// 404/HTML response kama keenayo "Unexpected token '<'" sababtoo ah response-ka
// marka hore text ayaa loo akhriyaa, kadib JSON ayaa la parse-gareeyaa haddii ay suurtagal tahay.
const fetchJson = async (urls, options = {}) => {
  const candidates = Array.isArray(urls) ? urls : [urls];
  let lastError = null;

  for (const url of candidates) {
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get("content-type") || "";
      const raw = await response.text();

      let data = null;
      if (raw) {
        try {
          data = contentType.includes("application/json")
            ? JSON.parse(raw)
            : JSON.parse(raw);
        } catch {
          data = null;
        }
      }

      if (response.ok) {
        return { response, data, url };
      }

      // Haddii route-kan uusan jirin, isku day route-ka fallback.
      if (response.status === 404) {
        lastError = new Error(`Endpoint not found: ${url}`);
        continue;
      }

      throw new Error(data?.message || `Request failed (${response.status})`);
    } catch (err) {
      lastError = err;
      // Network/CORS error ma laha response la hubin karo; isku day candidate-ka xiga.
    }
  }

  throw lastError || new Error("API request failed");
};

// ============= Helpers: bisha 8-dii u dambeeyay =============
const getLastMonths = (count = 8) => {
  const now = new Date();
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
    });
  }
  return months;
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animate, setAnimate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ============= Soo qaado xogta database-ka dhabta ah =============
  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("token");

    const authHeaders = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        // Transactions waa xogta dashboard-ka ugu muhiimsan.
        // Haddii /transections uusan jirin, fetchJson wuxuu isku dayayaa /transactions.
        const txResult = await fetchJson(TRANSACTIONS_URLS, {
          headers: authHeaders,
        });

        const txJson = txResult.data || {};
        const rawTransactions = Array.isArray(txJson)
          ? txJson
          : Array.isArray(txJson.data)
            ? txJson.data
            : [];

        // Backend-yada qaar status ma soo diraan; response.ok ayaa ah xaqiijinta koowaad.
        if (txJson && typeof txJson === "object" && txJson.status === false) {
          throw new Error(txJson.message || "Failed to load transactions");
        }

        const normalizedTx = rawTransactions.map((t) => ({
          id: t._id || t.id,
          amount: Number(t.amount) || 0,
          type: (t.type || "").toLowerCase(),
          category:
            t.categoryId?.name || t.category?.name || t.category || "Other",
          userName:
            t.userId?.fullname ||
            t.userId?.name ||
            t.fullname ||
            t.userName ||
            "Unknown",
          userId: t.userId?._id || t.userId?.id || t.userId || t.user?._id,
          date: t.createdAt || t.date || t.updatedAt,
        }));

        // Users endpoint waa optional. Haddii uu 404 yahay, dashboard-ku
        // wali wuxuu ku shaqaynayaa transaction data.
        let normalizedUsers = null;
        try {
          const usersResult = await fetchJson(USERS_URL, {
            headers: authHeaders,
          });

          const usersJson = usersResult.data || {};
          if (
            usersJson &&
            typeof usersJson === "object" &&
            usersJson.status === false
          ) {
            throw new Error(usersJson.message || "Failed to load users");
          }

          normalizedUsers = Array.isArray(usersJson)
            ? usersJson
            : Array.isArray(usersJson.data)
              ? usersJson.data
              : [];
        } catch (usersError) {
          console.warn(
            "Admin dashboard users endpoint unavailable; using transaction users:",
            usersError,
          );

          const uniqueUsers = [
            ...new Set(normalizedTx.map((t) => t.userId).filter(Boolean)),
          ];

          normalizedUsers = uniqueUsers.map((id) => ({ _id: id }));
        }

        if (isMounted) {
          setTransactions(normalizedTx);
          setUsers(normalizedUsers);
        }
      } catch (err) {
        console.error("Admin dashboard fetch error:", err);
        if (isMounted) {
          setError(
            err?.message?.includes("Endpoint not found")
              ? "Backend API route-ka lama helin. Hubi /api/transections ama /api/transactions."
              : "Ma soo qaadan karin xogta admin-ka.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setAnimate(false);
          setTimeout(() => {
            if (isMounted) setAnimate(true);
          }, 50);
        }
      }
    };

    fetchAll();

    // Auto refresh 60 ilbiriqsi kasta.
    const interval = setInterval(fetchAll, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshKey]);

  // ============= XISAABINTA (bisha 8-dii u dambeeyay) =============
  const months = getLastMonths(8);

  const monthlyData = months.map((m) => {
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === m.year && d.getMonth() === m.monthIndex;
    });
    const income = monthTx
      .filter((t) => t.type === "income")
      .reduce((a, t) => a + t.amount, 0);
    const expense = monthTx
      .filter((t) => t.type === "expense")
      .reduce((a, t) => a + t.amount, 0);

    const newUsers = users.filter((u) => {
      if (!u.createdAt) return false;
      const d = new Date(u.createdAt);
      return d.getFullYear() === m.year && d.getMonth() === m.monthIndex;
    }).length;

    // Risk tiers: xisaabi expense per user bishaas, kala saar high/medium/low
    const perUserExpense = {};
    monthTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        perUserExpense[t.userId] = (perUserExpense[t.userId] || 0) + t.amount;
      });
    const spendValues = Object.values(perUserExpense);
    const maxSpend = Math.max(1, ...spendValues);
    let high = 0,
      medium = 0,
      low = 0;
    spendValues.forEach((v) => {
      const pct = v / maxSpend;
      if (pct > 0.66) high++;
      else if (pct > 0.33) medium++;
      else low++;
    });

    return { ...m, income, expense, newUsers, high, medium, low };
  });

  const currentMonth = monthlyData[monthlyData.length - 1] || {};
  const prevMonth = monthlyData[monthlyData.length - 2] || {};

  const pctChange = (curr, prev) => {
    if (!prev) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const totalUsers = users.length;
  const totalIncome = currentMonth.income || 0;
  const totalExpense = currentMonth.expense || 0;
  const netBalance = totalIncome - totalExpense;
  const activeUsers = new Set(
    transactions
      .filter((t) => {
        const d = new Date(t.date);
        return (
          d.getFullYear() === currentMonth.year &&
          d.getMonth() === currentMonth.monthIndex
        );
      })
      .map((t) => t.userId),
  ).size;

  const aUsers = useCountUp(totalUsers, 1000);
  const aIncome = useCountUp(totalIncome, 1300);
  const aExpense = useCountUp(totalExpense, 1300);
  const aBalance = useCountUp(netBalance, 1400);
  const aActive = useCountUp(activeUsers, 1000);

  const maxVal = Math.max(
    1,
    ...monthlyData.map((m) => Math.max(m.income, m.expense)),
  );
  const maxUsers = Math.max(1, ...monthlyData.map((m) => m.newUsers));
  const maxRisk = Math.max(
    1,
    ...monthlyData.map((m) => m.high + m.medium + m.low),
  );

  const kpis = [
    {
      label: "Total Users",
      value: `${Math.round(aUsers)}`,
      trend: pctChange(totalUsers, totalUsers), // static context, no monthly user delta available reliably
      icon: Users,
      up: true,
      route: "/admin/security",
    },
    {
      label: "Total Income",
      value: `$${fmt(aIncome)}`,
      trend: pctChange(totalIncome, prevMonth.income),
      icon: ArrowUpRight,
      route: "/admin/transactions",
    },
    {
      label: "Total Expense",
      value: `$${fmt(aExpense)}`,
      trend: pctChange(totalExpense, prevMonth.expense),
      icon: ArrowDownRight,
      route: "/admin/transactions",
    },
    {
      label: "Net Balance",
      value: `$${fmt(aBalance)}`,
      trend: pctChange(
        netBalance,
        (prevMonth.income || 0) - (prevMonth.expense || 0),
      ),
      icon: Wallet,
      route: "/admin/transactions",
    },
    {
      label: "Active Users",
      value: `${Math.round(aActive)}`,
      trend: 0,
      icon: Activity,
      route: "/admin/security",
    },
  ].map((k) => ({ ...k, up: k.trend >= 0 }));

  // ============= Category Breakdown (expense-ka bisha hadda socota) =============
  const categoryMap = {};
  transactions
    .filter((t) => {
      const d = new Date(t.date);
      return (
        t.type === "expense" &&
        d.getFullYear() === currentMonth.year &&
        d.getMonth() === currentMonth.monthIndex
      );
    })
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
  const categoryTotal =
    Object.values(categoryMap).reduce((a, v) => a + v, 0) || 1;
  const blueShades = ["#1E3A8A", "#3B82F6", "#60A5FA", "#93C5FD", "#0A1A3A"];
  const categoryBreakdown = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, val], i) => ({
      label,
      value: Math.round((val / categoryTotal) * 100),
      shade: blueShades[i % blueShades.length],
    }));

  // ============= Transaction Type Split (bisha hadda socota) =============
  const currentMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return (
      d.getFullYear() === currentMonth.year &&
      d.getMonth() === currentMonth.monthIndex
    );
  });
  const transactionSplit = [
    {
      label: "Income",
      value: currentMonthTx.filter((t) => t.type === "income").length,
      shade: "#1E3A8A",
    },
    {
      label: "Expense",
      value: currentMonthTx.filter((t) => t.type === "expense").length,
      shade: "#3B82F6",
    },
    {
      label: "Savings",
      value: currentMonthTx.filter((t) => t.type === "savings").length,
      shade: "#93C5FD",
    },
  ];
  const maxSplit = Math.max(1, ...transactionSplit.map((t) => t.value));

  // ============= Top Spenders =============
  const spendByUser = {};
  currentMonthTx
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      spendByUser[t.userName] = (spendByUser[t.userName] || 0) + t.amount;
    });
  const maxUserSpend = Math.max(1, ...Object.values(spendByUser));
  const topSpenders = Object.entries(spendByUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, amount]) => ({
      name,
      pct: Math.round((amount / maxUserSpend) * 100),
      amount,
    }));

  const monthName = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#0A0A12] text-white font-sans">
      <style>{`
        @keyframes growBar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes growWidth { from { width: 0%; } to { width: var(--target-width); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes drawLine { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0% 0 0); } }
      `}</style>

      <main className="p-6 md:p-8 space-y-6">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              ADMIN ANALYTICS DASHBOARD
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Monitor Growth. Detect Risks. Optimize Platform.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0A0A12] border border-[#1E3A8A]/60 px-3.5 py-2 rounded-xl text-xs text-white">
              <Calendar size={14} className="text-blue-300" />
              {monthName}
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
              className="flex items-center gap-2 bg-[#1E3A8A]/30 border border-[#1E3A8A] px-3.5 py-2 rounded-xl text-xs text-white hover:bg-[#1E3A8A]/50 transition-all disabled:opacity-60"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-blue-300 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading platform data...
          </div>
        )}
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* ================= KPI CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div
                key={i}
                onClick={() => navigate(kpi.route)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(kpi.route);
                  }
                }}
                style={{
                  animation: animate
                    ? `fadeSlide 0.5s ease-out ${i * 0.08}s both`
                    : "none",
                }}
                className="cursor-pointer bg-[#0A0A12] rounded-[1.5rem] border border-[#1E3A8A]/50 p-5 shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_28px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                    {kpi.label}
                  </span>
                  <div className="p-2 rounded-full bg-[#1E3A8A]/30 border border-[#1E3A8A] shadow-[0_0_10px_rgba(59,130,246,0.4)]">
                    <Icon size={14} className="text-blue-300" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-white">{kpi.value}</h3>
                <p
                  className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
                    kpi.up ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {kpi.up ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {Math.abs(kpi.trend).toFixed(1)}% vs last month
                </p>
              </div>
            );
          })}
        </div>

        {/* ================= INSIGHT BOXES ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Activity,
              title: "What is the Trend?",
              text:
                netBalance >= (prevMonth.income || 0) - (prevMonth.expense || 0)
                  ? "Dakhliga guud ee platform-ka wuxuu ku socdaa koror joogto ah, iyadoo transactions-ku ay sii kordhayaan bishan."
                  : "Kharashka platform-ka wuxuu kordhayay bishan, marka la barbardhigo bisha hore.",
            },
            {
              icon: BarChart3,
              title: "Why Such Trend?",
              text: `Isbeddelkani wuxuu ka dhashay ${totalExpense > (prevMonth.expense || 0) ? "kordhinta kharashaadka" : "hoos u dhaca kharashaadka"} iyo dhaqdhaqaaqa users-ka platform-ka bishan.`,
            },
            {
              icon: ShieldAlert,
              title: "Management Insight",
              text: `Talo: ${activeUsers < totalUsers / 2 ? "Ku dhiirrigeli users-ka aan bishan wax gelin inay soo noqdaan platform-ka." : "Sii wad dhaqdhaqaaqa hadda socda, users-ku way firfircoon yihiin."}`,
            },
          ].map((box, i) => {
            const Icon = box.icon;
            return (
              <div
                key={i}
                style={{
                  animation: animate
                    ? `fadeSlide 0.5s ease-out ${0.3 + i * 0.08}s both`
                    : "none",
                }}
                className="bg-[#0A0A12] rounded-2xl border border-[#1E3A8A]/40 p-5 flex gap-3"
              >
                <div className="p-2.5 h-fit rounded-full bg-[#1E3A8A]/30 border border-[#1E3A8A] shadow-[0_0_10px_rgba(59,130,246,0.4)]">
                  <Icon size={16} className="text-blue-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    {box.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {box.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= MONTHLY INCOME/EXPENSE + SPENDING GROWTH ================= */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Monthly Income & Expense
                </h3>
                <p className="text-xs text-slate-400">
                  Deep Blue & Neon Blue dots flow
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#1E3A8A]"></span>{" "}
                  Income
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#93C5FD]"></span>{" "}
                  Expense
                </span>
              </div>
            </div>
            <div
              style={{
                animation: animate ? "drawLine 1.1s ease-out both" : "none",
              }}
              className="w-full"
            >
              <svg
                viewBox="0 0 480 180"
                className="w-full h-44 overflow-visible"
              >
                {[0, 1, 2, 3].map((i) => (
                  <line
                    key={i}
                    x1="0"
                    x2="480"
                    y1={20 + i * 40}
                    y2={20 + i * 40}
                    stroke="#1E3A8A"
                    strokeOpacity="0.15"
                  />
                ))}
                <polyline
                  fill="none"
                  stroke="#1E3A8A"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_8px_rgba(30,58,138,0.9)]"
                  points={monthlyData
                    .map(
                      (m, i) =>
                        `${(i * 480) / (monthlyData.length - 1)},${160 - (m.income / maxVal) * 140}`,
                    )
                    .join(" ")}
                />
                <polyline
                  fill="none"
                  stroke="#93C5FD"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_8px_rgba(147,197,253,0.9)]"
                  points={monthlyData
                    .map(
                      (m, i) =>
                        `${(i * 480) / (monthlyData.length - 1)},${160 - (m.expense / maxVal) * 140}`,
                    )
                    .join(" ")}
                />
                {monthlyData.map((m, i) => (
                  <g key={i}>
                    <circle
                      cx={(i * 480) / (monthlyData.length - 1)}
                      cy={160 - (m.income / maxVal) * 140}
                      r="3.5"
                      fill="#ffffff"
                      className="drop-shadow-[0_0_6px_#ffffff]"
                    />
                    <circle
                      cx={(i * 480) / (monthlyData.length - 1)}
                      cy={160 - (m.expense / maxVal) * 140}
                      r="3.5"
                      fill="#93C5FD"
                      className="drop-shadow-[0_0_6px_#93C5FD]"
                    />
                    <text
                      x={(i * 480) / (monthlyData.length - 1)}
                      y="175"
                      fontSize="9"
                      fill="#64748b"
                      textAnchor="middle"
                    >
                      {m.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Spending Growth Trend
                </h3>
                <p className="text-xs text-slate-400">
                  Medium Blue curve with clean dots
                </p>
              </div>
            </div>
            <div
              style={{
                animation: animate
                  ? "drawLine 1.1s ease-out 0.15s both"
                  : "none",
              }}
              className="w-full"
            >
              <svg
                viewBox="0 0 480 180"
                className="w-full h-44 overflow-visible"
              >
                {[0, 1, 2, 3].map((i) => (
                  <line
                    key={i}
                    x1="0"
                    x2="480"
                    y1={20 + i * 40}
                    y2={20 + i * 40}
                    stroke="#1E3A8A"
                    strokeOpacity="0.15"
                  />
                ))}
                <polyline
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_8px_rgba(59,130,246,0.9)]"
                  points={monthlyData
                    .map(
                      (m, i) =>
                        `${(i * 480) / (monthlyData.length - 1)},${160 - (m.expense / maxVal) * 140}`,
                    )
                    .join(" ")}
                />
                {monthlyData.map((m, i) => (
                  <g key={i}>
                    <circle
                      cx={(i * 480) / (monthlyData.length - 1)}
                      cy={160 - (m.expense / maxVal) * 140}
                      r="3.5"
                      fill="#ffffff"
                      className="drop-shadow-[0_0_6px_#ffffff]"
                    />
                    <text
                      x={(i * 480) / (monthlyData.length - 1)}
                      y="175"
                      fontSize="9"
                      fill="#64748b"
                      textAnchor="middle"
                    >
                      {m.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* ================= CATEGORY BREAKDOWN + TRANSACTION SPLIT + TOP SPENDERS ================= */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                Category Breakdown
              </h3>
              <PieIcon size={16} className="text-blue-300" />
            </div>
            <div className="flex items-center justify-center py-4">
              {categoryBreakdown.length === 0 ? (
                <p className="text-xs text-slate-500">No expense data yet.</p>
              ) : (
                <DonutChart
                  segments={categoryBreakdown}
                  size={140}
                  animate={animate}
                />
              )}
            </div>
            <div className="space-y-1.5 mt-2">
              {categoryBreakdown.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="flex items-center gap-2 text-slate-300">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: c.shade }}
                    ></span>
                    {c.label}
                  </span>
                  <span className="text-white font-bold">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                Transaction Type Split
              </h3>
              <BarChart3 size={16} className="text-blue-300" />
            </div>
            <div className="grid grid-cols-3 gap-4 h-36 items-end pt-4 pb-2 border-b border-[#1E3A8A]/40">
              {transactionSplit.map((t, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 h-full justify-end"
                >
                  <span className="text-xs font-bold text-white">
                    {t.value}
                  </span>
                  <div
                    className="w-full rounded-xl shadow-[0_0_12px_rgba(59,130,246,0.7)] origin-bottom"
                    style={{
                      height: `${(t.value / maxSplit) * 100}%`,
                      background: `linear-gradient(to top, #0A1A3A, ${t.shade})`,
                      animation: animate
                        ? `growBar 0.6s ease-out ${i * 0.1}s both`
                        : "none",
                    }}
                  ></div>
                  <span className="text-[10px] text-slate-400">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                Top Users by Spending
              </h3>
              <Users size={16} className="text-blue-300" />
            </div>
            <div className="space-y-3 mt-2">
              {topSpenders.length === 0 ? (
                <p className="text-xs text-slate-500">No spending data yet.</p>
              ) : (
                topSpenders.map((u, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{u.name}</span>
                      <span className="text-white font-bold">
                        ${fmt(u.amount)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#1E3A8A]/20 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full shadow-[0_0_8px_rgba(59,130,246,0.7)]"
                        style={{
                          width: animate ? `${u.pct}%` : "0%",
                          background:
                            "linear-gradient(to right, #1E3A8A, #93C5FD)",
                          transition: `width 0.8s ease-out ${i * 0.1}s`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ================= USER GROWTH TREND ================= */}
        <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                User Growth Trend (Monthly New Registrations)
              </h3>
              <p className="text-xs text-slate-400">
                Tracking user onboarding progression over 8 months
              </p>
            </div>
            <TrendingUp size={16} className="text-blue-300" />
          </div>
          <div
            style={{
              animation: animate ? "drawLine 1.2s ease-out 0.2s both" : "none",
            }}
            className="w-full"
          >
            <svg viewBox="0 0 900 160" className="w-full h-40 overflow-visible">
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1="0"
                  x2="900"
                  y1={10 + i * 35}
                  y2={10 + i * 35}
                  stroke="#1E3A8A"
                  strokeOpacity="0.15"
                />
              ))}
              <polyline
                fill="none"
                stroke="#1E3A8A"
                strokeWidth="3"
                className="drop-shadow-[0_0_10px_rgba(30,58,138,0.9)]"
                points={monthlyData
                  .map(
                    (m, i) =>
                      `${(i * 900) / (monthlyData.length - 1)},${140 - (m.newUsers / maxUsers) * 120}`,
                  )
                  .join(" ")}
              />
              {monthlyData.map((m, i) => (
                <g key={i}>
                  <circle
                    cx={(i * 900) / (monthlyData.length - 1)}
                    cy={140 - (m.newUsers / maxUsers) * 120}
                    r="4"
                    fill="#93C5FD"
                    className="drop-shadow-[0_0_8px_#93C5FD]"
                  />
                  <text
                    x={(i * 900) / (monthlyData.length - 1)}
                    y="155"
                    fontSize="10"
                    fill="#64748b"
                    textAnchor="middle"
                  >
                    {m.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* ================= MONTHLY RISK LEVELS ================= */}
        <div className="bg-[#0A0A12] rounded-[2rem] border border-[#1E3A8A]/50 p-6 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Monthly Risk Levels (Spender Distribution)
              </h3>
              <p className="text-xs text-slate-400">
                Dark Navy, Medium Blue, Neon Blue tiers
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0A1A3A] border border-[#1E3A8A]"></span>{" "}
                High
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>{" "}
                Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#93C5FD]"></span> Low
              </span>
            </div>
          </div>
          <div className="grid grid-cols-8 gap-3 h-36 items-end pt-4 pb-2 border-b border-[#1E3A8A]/40">
            {monthlyData.map((m, i) => {
              const total = m.high + m.medium + m.low || 1;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 h-full justify-end w-full"
                >
                  <div
                    className="flex flex-col-reverse w-full gap-0.5 origin-bottom"
                    style={{
                      height: `${(total / maxRisk) * 100}%`,
                      animation: animate
                        ? `growBar 0.6s ease-out ${i * 0.06}s both`
                        : "none",
                    }}
                  >
                    <div
                      className="w-full bg-[#0A1A3A] border-t border-[#1E3A8A] rounded-t"
                      style={{ height: `${(m.high / total) * 100}%` }}
                    ></div>
                    <div
                      className="w-full bg-[#3B82F6]"
                      style={{ height: `${(m.medium / total) * 100}%` }}
                    ></div>
                    <div
                      className="w-full bg-[#93C5FD] shadow-[0_0_8px_rgba(147,197,253,0.6)]"
                      style={{ height: `${(m.low / total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= BOTTOM SUMMARY ROW ================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0A0A12] rounded-2xl border border-[#1E3A8A]/40 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-[#1E3A8A]/30 border border-[#1E3A8A]">
                <Target size={14} className="text-blue-300" />
              </div>
              <h4 className="text-sm font-bold text-white">Key Takeaway</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nidaamku wuxuu ku shaqeynayaa si hufan, iyadoo {activeUsers} users
              firfircoon ay bishan wax geliyeen. Sii kordhi dhaqdhaqaaqa si loo
              helo natiijooyin fiican.
            </p>
          </div>

          <div className="bg-[#0A0A12] rounded-2xl border border-[#1E3A8A]/40 p-5">
            <h4 className="text-sm font-bold text-white mb-3">
              Top Recurring Categories
            </h4>
            <div className="space-y-3">
              {categoryBreakdown.slice(0, 2).map((c, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-300">{c.label}</span>
                    <span className="text-white font-bold">{c.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1E3A8A]/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: animate ? `${c.value}%` : "0%",
                        background:
                          "linear-gradient(to right, #1E3A8A, #93C5FD)",
                        transition: `width 0.8s ease-out ${i * 0.1}s`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0A0A12] rounded-2xl border border-[#1E3A8A]/40 p-5">
            <h4 className="text-sm font-bold text-white mb-3">Action Status</h4>
            <div className="flex items-center justify-center py-2">
              <DonutChart
                segments={[
                  {
                    label: "Active",
                    value: totalUsers
                      ? Math.round((activeUsers / totalUsers) * 100)
                      : 0,
                    shade: "#1E3A8A",
                  },
                  {
                    label: "Inactive",
                    value: totalUsers
                      ? 100 - Math.round((activeUsers / totalUsers) * 100)
                      : 0,
                    shade: "#93C5FD",
                  },
                ]}
                size={90}
                centerLabel={`${totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0}%`}
                animate={animate}
              />
            </div>
          </div>

          <div className="bg-[#0A0A12] rounded-2xl border border-[#1E3A8A]/40 p-5">
            <h4 className="text-sm font-bold text-white mb-3">Summary</h4>
            <div className="space-y-2 text-xs">
              {[
                { label: "Users", value: totalUsers },
                { label: "Income", value: `$${fmt(totalIncome)}` },
                { label: "Expense", value: `$${fmt(totalExpense)}` },
                { label: "Net Balance", value: `$${fmt(netBalance)}` },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 size={12} className="text-blue-300" />
                    {row.label}
                  </span>
                  <span className="text-white font-bold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= FOOTER STEPS ================= */}
        <div className="bg-[#0A0A12] rounded-2xl border border-[#1E3A8A]/40 p-5 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-300">
          {["Monitor Activity", "Detect Anomalies", "Optimize Platform"].map(
            (step, i, arr) => (
              <React.Fragment key={i}>
                <span className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#1E3A8A]/30 border border-[#1E3A8A] flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.4)]">
                    <Activity size={13} className="text-blue-300" />
                  </span>
                  <span className="font-semibold text-white">{step}</span>
                </span>
                {i < arr.length - 1 && <span className="text-blue-400">→</span>}
              </React.Fragment>
            ),
          )}
        </div>
      </main>
    </div>
  );
};

// ============= Reusable Donut Chart (SVG, animated draw-in, Deep Blue shades) =============
const DonutChart = ({ segments, size = 120, centerLabel, animate }) => {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1E3A8A"
        strokeOpacity="0.15"
        strokeWidth="14"
      />
      {segments.map((seg, i) => {
        const dash = (seg.value / 100) * circumference;
        const thisOffset = cumulativeOffset;
        cumulativeOffset += dash;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.shade}
            strokeWidth="14"
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]"
            style={{
              strokeDasharray: `${circumference} ${circumference}`,
              strokeDashoffset: animate
                ? circumference - dash + thisOffset
                : circumference,
              transition: `stroke-dashoffset 1s ease-out ${i * 0.15}s`,
            }}
          />
        );
      })}
      {centerLabel && (
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size / 5.5}
          fontWeight="900"
          fill="#ffffff"
        >
          {centerLabel}
        </text>
      )}
    </svg>
  );
};

export default AdminDashboard;
