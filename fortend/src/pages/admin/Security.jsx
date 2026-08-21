import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Clock3,
  LockKeyhole,
  FileText,
  CheckCircle2,
  Search,
  RefreshCw,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertTriangle,
  Activity,
  ArrowRight,
} from "lucide-react";

import api from "../../services/api";

/*
|--------------------------------------------------------------------------
| SECURITY CENTER
|--------------------------------------------------------------------------
|
| Supports:
| - Users
| - User access/status
| - Roles
| - Permissions
| - Audit logs
| - Audit log details
| - Search
| - Pagination
| - Refresh
|
|--------------------------------------------------------------------------
*/

/* ==========================================================================
   API ENDPOINTS
   ========================================================================== */

const AUDIT_ENDPOINTS = ["/auditlogs", "/audit-logs", "/audit/logs"];

const AUDIT_DETAIL_ENDPOINTS = (id) => [
  `/auditlogs/${id}`,
  `/audit-logs/${id}`,
  `/audit/logs/${id}`,
];

/* ==========================================================================
   HELPERS
   ========================================================================== */

const getErrorMessage = (error, fallback = "Something went wrong.") => {
  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  return (
    responseData?.message ||
    responseData?.error ||
    responseData?.errors?.[0]?.message ||
    error?.message ||
    fallback
  );
};

const isNotFoundError = (error) => {
  return error?.response?.status === 404;
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

const formatPermission = (permission) => {
  return String(permission || "")
    .replace(/_/g, " ")
    .replace(/\./g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

/*
 * IMPORTANT:
 * "log.user" waa user-ka runtiga ah ee ficilka lagu sameeyay
 * (tusaale: user-ka la approve-gareeyay).
 *
 * "log.performedBy" waa admin-ka sameeyay ficilka.
 *
 * Sidaas darteed "log.user" waa inuu had iyo jeer mudnaanta koowaad
 * lahaadaa - haddii kale User ID-gu wuxuu tusi doonaa admin-ka
 * halkii uu tusi lahaa user-ka runtiga ah.
 */

const getAuditUserName = (log) => {
  return (
    log?.user?.fullname ||
    log?.user?.name ||
    log?.user?.username ||
    log?.performedBy?.fullname ||
    log?.performedBy?.name ||
    log?.performedBy?.username ||
    log?.fullname ||
    log?.name ||
    log?.username ||
    "System"
  );
};

const getAuditUserEmail = (log) => {
  return log?.user?.email || log?.performedBy?.email || log?.email || "-";
};

const getAuditUserId = (log) => {
  return (
    log?.user?.userId ??
    log?.userId ??
    log?.performedBy?.userId ??
    (log?.user?._id ||
      log?.user?.id ||
      log?.performedBy?._id ||
      log?.performedBy?.id ||
      "-")
  );
};

const getAuditAction = (log) => {
  return log?.action || log?.event || log?.activity || log?.type || "-";
};

const getAuditDescription = (log) => {
  return log?.description || log?.message || log?.details || "-";
};

const getAuditIp = (log) => {
  return log?.ipAddress || log?.ip || log?.clientIp || log?.requestIp || "-";
};

const getAuditCreatedAt = (log) => {
  return log?.createdAt || log?.created_at || log?.timestamp || log?.date;
};

/* ==========================================================================
   AUDIT RESPONSE NORMALIZER
   ========================================================================== */

const normalizeAuditResponse = (responseData, requestedPage = 1) => {
  let body = responseData || {};

  if (
    body?.data &&
    !Array.isArray(body.data) &&
    typeof body.data === "object"
  ) {
    body = body.data;
  }

  let logs = [];

  if (Array.isArray(body)) {
    logs = body;
  } else if (Array.isArray(body?.logs)) {
    logs = body.logs;
  } else if (Array.isArray(body?.auditLogs)) {
    logs = body.auditLogs;
  } else if (Array.isArray(body?.auditlogs)) {
    logs = body.auditlogs;
  } else if (Array.isArray(body?.records)) {
    logs = body.records;
  } else if (Array.isArray(body?.results)) {
    logs = body.results;
  } else if (Array.isArray(body?.items)) {
    logs = body.items;
  } else if (Array.isArray(body?.data)) {
    logs = body.data;
  }

  const pagination =
    body?.pagination || body?.meta?.pagination || body?.meta || {};

  const total = Number(
    pagination?.total ??
      body?.total ??
      body?.count ??
      body?.totalCount ??
      logs.length,
  );

  const limit = Number(
    pagination?.limit ??
      pagination?.pageSize ??
      body?.limit ??
      body?.pageSize ??
      10,
  );

  const page = Number(
    pagination?.page ??
      pagination?.currentPage ??
      body?.page ??
      body?.currentPage ??
      requestedPage,
  );

  const totalPages = Number(
    pagination?.totalPages ??
      pagination?.pages ??
      body?.totalPages ??
      body?.pages ??
      (limit > 0 ? Math.ceil(total / limit) : 0),
  );

  const hasNextPage =
    pagination?.hasNextPage !== undefined
      ? Boolean(pagination.hasNextPage)
      : body?.hasNextPage !== undefined
        ? Boolean(body.hasNextPage)
        : page < totalPages;

  const hasPreviousPage =
    pagination?.hasPreviousPage !== undefined
      ? Boolean(pagination.hasPreviousPage)
      : body?.hasPreviousPage !== undefined
        ? Boolean(body.hasPreviousPage)
        : page > 1;

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  };
};

/* ==========================================================================
   SECURITY COMPONENT
   ========================================================================== */

const Security = () => {
  /* ------------------------------------------------------------------------
     TAB
     ------------------------------------------------------------------------ */

  const [activeTab, setActiveTab] = useState("overview");

  /* ------------------------------------------------------------------------
     USERS
     ------------------------------------------------------------------------ */

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);

  const usersPerPage = 10;

  const [actionLoading, setActionLoading] = useState(null);

  /* ------------------------------------------------------------------------
     PERMISSIONS
     ------------------------------------------------------------------------ */

  const [permissions, setPermissions] = useState({
    admin: [],
    user: [],
  });

  const [currentAccount, setCurrentAccount] = useState({
    role: "unknown",
    permissions: [],
  });

  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState("");

  /* ------------------------------------------------------------------------
     AUDIT LOGS
     ------------------------------------------------------------------------ */

  const [auditLogs, setAuditLogs] = useState([]);

  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");

  const [auditSearch, setAuditSearch] = useState("");
  const [auditPage, setAuditPage] = useState(1);

  const [auditPagination, setAuditPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [auditDetailLoading, setAuditDetailLoading] = useState(false);

  /* ------------------------------------------------------------------------
     RECENT ACTIVITY (OVERVIEW WIDGET)
     ------------------------------------------------------------------------ */

  const [recentActivity, setRecentActivity] = useState([]);
  const [recentActivityLoading, setRecentActivityLoading] = useState(false);

  /* ==========================================================================
     FETCH USERS
     ========================================================================== */

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError("");

      const response = await api.get("/users");

      console.log("SECURITY USERS RESPONSE:", response.data);

      const body = response.data;

      let data = [];

      if (Array.isArray(body)) {
        data = body;
      } else if (Array.isArray(body?.data)) {
        data = body.data;
      } else if (Array.isArray(body?.users)) {
        data = body.users;
      } else if (Array.isArray(body?.results)) {
        data = body.results;
      } else if (Array.isArray(body?.items)) {
        data = body.items;
      }

      setUsers(data);
    } catch (error) {
      console.error("GET USERS ERROR:", error);

      setUsersError(getErrorMessage(error, "Failed to load users."));

      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  /* ==========================================================================
     FETCH PERMISSIONS
     ========================================================================== */

  const fetchPermissions = useCallback(async () => {
    try {
      setPermissionsLoading(true);
      setPermissionsError("");

      const response = await api.get("/auth/permissions");

      console.log("PERMISSIONS RESPONSE:", response.data);

      let data = response.data || {};

      if (
        data?.data &&
        typeof data.data === "object" &&
        !Array.isArray(data.data)
      ) {
        data = data.data;
      }

      const adminPermissions =
        data?.allPermissions?.admin ||
        data?.permissionsByRole?.admin ||
        data?.roles?.admin ||
        data?.permissions?.admin ||
        [];

      const userPermissions =
        data?.allPermissions?.user ||
        data?.permissionsByRole?.user ||
        data?.roles?.user ||
        data?.permissions?.user ||
        [];

      let currentPermissions = [];

      if (Array.isArray(data?.currentAccount?.permissions)) {
        currentPermissions = data.currentAccount.permissions;
      } else if (Array.isArray(data?.currentUser?.permissions)) {
        currentPermissions = data.currentUser.permissions;
      } else if (Array.isArray(data?.permissions)) {
        currentPermissions = data.permissions;
      } else if (Array.isArray(data?.userPermissions)) {
        currentPermissions = data.userPermissions;
      }

      const currentRole =
        data?.currentAccount?.role ||
        data?.currentUser?.role ||
        data?.role ||
        "unknown";

      setPermissions({
        admin: normalizeArray(adminPermissions),
        user: normalizeArray(userPermissions),
      });

      setCurrentAccount({
        role: String(currentRole).toLowerCase(),
        permissions: currentPermissions,
      });
    } catch (error) {
      console.error("GET PERMISSIONS ERROR:", error);

      setPermissionsError(
        getErrorMessage(error, "Failed to load permissions."),
      );
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  /* ==========================================================================
     FETCH AUDIT LOGS
     ========================================================================== */

  const fetchAuditLogs = useCallback(async (page = 1, search = "") => {
    try {
      setAuditLoading(true);
      setAuditError("");

      const params = {
        page,
        limit: 10,
      };

      const cleanSearch = String(search || "").trim();

      if (cleanSearch) {
        params.search = cleanSearch;
      }

      console.log("FETCH AUDIT LOGS:", params);

      let response = null;
      let lastError = null;

      for (const endpoint of AUDIT_ENDPOINTS) {
        try {
          response = await api.get(endpoint, {
            params,
          });

          console.log(`AUDIT LOG SUCCESS: ${endpoint}`, response.data);

          break;
        } catch (error) {
          lastError = error;

          console.warn(
            `AUDIT LOG ENDPOINT FAILED: ${endpoint}`,
            error?.response?.status,
            error?.response?.data,
          );

          if (!isNotFoundError(error)) {
            throw error;
          }
        }
      }

      if (!response) {
        throw lastError || new Error("Audit logs endpoint was not found.");
      }

      const normalized = normalizeAuditResponse(response.data, page);

      console.log("NORMALIZED AUDIT LOGS:", normalized);

      setAuditLogs(normalized.logs);

      setAuditPagination(normalized.pagination);
    } catch (error) {
      console.error("GET AUDIT LOGS ERROR:", error);

      setAuditLogs([]);

      setAuditPagination({
        page,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      setAuditError(getErrorMessage(error, "Failed to fetch audit logs."));
    } finally {
      setAuditLoading(false);
    }
  }, []);

  /* ==========================================================================
     FETCH RECENT ACTIVITY (OVERVIEW WIDGET - LIGHTWEIGHT, 5 LATEST)
     ========================================================================== */

  const fetchRecentActivity = useCallback(async () => {
    try {
      setRecentActivityLoading(true);

      let response = null;

      for (const endpoint of AUDIT_ENDPOINTS) {
        try {
          response = await api.get(endpoint, {
            params: { page: 1, limit: 5 },
          });

          break;
        } catch (error) {
          if (!isNotFoundError(error)) {
            throw error;
          }
        }
      }

      if (!response) {
        setRecentActivity([]);
        return;
      }

      const normalized = normalizeAuditResponse(response.data, 1);

      setRecentActivity(normalized.logs.slice(0, 5));
    } catch (error) {
      console.error("GET RECENT ACTIVITY ERROR:", error);

      setRecentActivity([]);
    } finally {
      setRecentActivityLoading(false);
    }
  }, []);

  /* ==========================================================================
     FETCH SINGLE AUDIT LOG
     ========================================================================== */

  const fetchAuditLogById = async (id) => {
    if (!id) {
      return;
    }

    try {
      setAuditDetailLoading(true);

      let response = null;
      let lastError = null;

      for (const endpoint of AUDIT_DETAIL_ENDPOINTS(id)) {
        try {
          response = await api.get(endpoint);

          console.log(`AUDIT DETAIL SUCCESS: ${endpoint}`, response.data);

          break;
        } catch (error) {
          lastError = error;

          if (!isNotFoundError(error)) {
            throw error;
          }
        }
      }

      if (!response) {
        throw (
          lastError || new Error("Audit log detail endpoint was not found.")
        );
      }

      let body = response.data || {};

      if (body?.data && typeof body.data === "object") {
        body = body.data;
      }

      const log = body?.log || body?.auditLog || body?.auditlog || body;

      setSelectedAuditLog(log);
    } catch (error) {
      console.error("GET AUDIT LOG BY ID ERROR:", error);

      setAuditError(
        getErrorMessage(error, "Failed to load audit log details."),
      );
    } finally {
      setAuditDetailLoading(false);
    }
  };

  /* ==========================================================================
     INITIAL DATA
     ========================================================================== */

  useEffect(() => {
    fetchUsers();
    fetchPermissions();
    fetchRecentActivity();
  }, [fetchUsers, fetchPermissions, fetchRecentActivity]);

  /* ==========================================================================
     AUDIT TAB
     ========================================================================== */

  useEffect(() => {
    if (activeTab !== "logs") {
      return;
    }

    fetchAuditLogs(auditPage, auditSearch);
  }, [activeTab, auditPage, fetchAuditLogs]);

  /* ==========================================================================
     FILTER USERS
     ========================================================================== */

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();

    if (!search) {
      return users;
    }

    return users.filter((user) => {
      return [
        user?._id,
        user?.id,
        user?.userId,
        user?.fullname,
        user?.name,
        user?.email,
        user?.username,
        user?.role,
        user?.status,
        user?.accountStatus,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(search),
      );
    });
  }, [users, userSearch]);

  /* ==========================================================================
     USER PAGINATION
     ========================================================================== */

  const userTotalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / usersPerPage),
  );

  const safeUserPage = Math.min(userPage, userTotalPages);

  const userStartIndex = (safeUserPage - 1) * usersPerPage;

  const paginatedUsers = filteredUsers.slice(
    userStartIndex,
    userStartIndex + usersPerPage,
  );

  /* ==========================================================================
     USER STATUS
     ========================================================================== */

  const handleStatusChange = async (user, newStatus) => {
    const userId = user?._id || user?.id || user?.userId;

    if (!userId) {
      alert("User ID is missing.");
      return;
    }

    try {
      setActionLoading(userId);

      await api.put(`/users/${userId}/status`, {
        status: newStatus,
      });

      setUsers((previous) =>
        previous.map((item) => {
          const itemId = item?._id || item?.id || item?.userId;

          if (String(itemId) !== String(userId)) {
            return item;
          }

          return {
            ...item,
            status: newStatus,
          };
        }),
      );
    } catch (error) {
      console.error("UPDATE USER STATUS ERROR:", error);

      alert(getErrorMessage(error, "Failed to update user status."));
    } finally {
      setActionLoading(null);
    }
  };

  /* ==========================================================================
     AUDIT SEARCH
     ========================================================================== */

  const submitAuditSearch = () => {
    if (auditPage !== 1) {
      setAuditPage(1);
      return;
    }

    fetchAuditLogs(1, auditSearch);
  };

  /* ==========================================================================
     AUDIT PAGE NUMBERS
     ========================================================================== */

  const getAuditPageNumbers = () => {
    const totalPages = auditPagination.totalPages;

    const current = auditPagination.page || auditPage;

    if (!totalPages) {
      return [];
    }

    if (totalPages <= 7) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1,
      );
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (current >= totalPages - 3) {
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

    return [1, "...", current - 1, current, current + 1, "...", totalPages];
  };

  /* ==========================================================================
     STATISTICS
     ========================================================================== */

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => String(user?.status || "").toLowerCase() === "active",
  ).length;

  const inactiveUsers = users.filter(
    (user) => String(user?.status || "").toLowerCase() === "inactive",
  ).length;

  const pendingUsers = users.filter(
    (user) => String(user?.accountStatus || "").toLowerCase() === "pending",
  ).length;

  /* ==========================================================================
     REFRESH
     ========================================================================== */

  const refreshAll = () => {
    fetchUsers();
    fetchPermissions();
    fetchRecentActivity();

    if (activeTab === "logs") {
      fetchAuditLogs(auditPage, auditSearch);
    }
  };

  /* ==========================================================================
     TABS
     ========================================================================== */

  const tabs = [
    {
      id: "overview",
      name: "Overview",
      icon: ShieldCheck,
    },
    {
      id: "access",
      name: "User Access",
      icon: Users,
    },
    {
      id: "roles",
      name: "Roles & Permissions",
      icon: LockKeyhole,
    },
    {
      id: "logs",
      name: "Audit Logs",
      icon: FileText,
    },
  ];

  /* ==========================================================================
     RENDER
     ========================================================================== */

  return (
    <div className="min-h-screen bg-[#F4F7FB] p-4 md:p-6">
      {/* ================================================================
          HEADER
      ================================================================= */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B2A5B] to-[#1557A8] shadow-lg">
            <ShieldCheck size={24} className="text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Security Center
            </h1>

            <p className="text-sm text-slate-500">
              Manage users, access, permissions and security activity
            </p>
          </div>
        </div>

        <button
          onClick={refreshAll}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* ================================================================
          TABS
      ================================================================= */}

      <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            const selected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  selected
                    ? "bg-[#1557A8] text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Icon size={17} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================
          OVERVIEW
      ================================================================= */}

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Users"
              value={totalUsers}
              icon={<Users size={22} />}
              iconClass="bg-blue-50 text-blue-500"
              onClick={() => {
                setActiveTab("access");
                setUserSearch("");
                setUserPage(1);
              }}
            />

            <StatCard
              title="Active Users"
              value={activeUsers}
              icon={<UserCheck size={22} />}
              iconClass="bg-emerald-50 text-emerald-500"
              onClick={() => {
                setActiveTab("access");
                setUserSearch("active");
                setUserPage(1);
              }}
            />

            <StatCard
              title="Pending Users"
              value={pendingUsers}
              icon={<Clock3 size={22} />}
              iconClass="bg-yellow-50 text-yellow-500"
              onClick={() => {
                setActiveTab("access");
                setUserSearch("pending");
                setUserPage(1);
              }}
            />

            <StatCard
              title="Inactive Users"
              value={inactiveUsers}
              icon={<UserX size={22} />}
              iconClass="bg-red-50 text-red-500"
              onClick={() => {
                setActiveTab("access");
                setUserSearch("inactive");
                setUserPage(1);
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <CheckCircle2 size={21} className="text-emerald-500" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">Security System</h2>

                  <p className="text-sm text-slate-500">System is available</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                Access management is active.
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                  <UserCog size={21} className="text-purple-500" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">Current Role</h2>

                  <p className="text-sm text-slate-500">Current account</p>
                </div>
              </div>

              <div className="mt-5 inline-flex rounded-full bg-purple-50 px-4 py-2 text-sm font-bold uppercase text-purple-600">
                {currentAccount.role}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <LockKeyhole size={21} className="text-blue-500" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">Permissions</h2>

                  <p className="text-sm text-slate-500">Current account</p>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-900">
                  {currentAccount.permissions.length}
                </span>

                <span className="ml-2 text-sm text-slate-500">permissions</span>
              </div>
            </div>
          </div>

          {/* ============================================================
              USER STATUS DISTRIBUTION + RECENT ACTIVITY
          ============================================================= */}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* STATUS DISTRIBUTION */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  <Activity size={21} className="text-indigo-500" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    User Status Distribution
                  </h2>

                  <p className="text-sm text-slate-500">
                    Breakdown of {totalUsers} users
                  </p>
                </div>
              </div>

              {totalUsers === 0 ? (
                <p className="mt-6 text-sm text-slate-400">
                  No users to display yet.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {/* Stacked bar */}
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="bg-emerald-500"
                      style={{
                        width: `${(activeUsers / totalUsers) * 100}%`,
                      }}
                      title={`Active: ${activeUsers}`}
                    />

                    <div
                      className="bg-yellow-400"
                      style={{
                        width: `${(pendingUsers / totalUsers) * 100}%`,
                      }}
                      title={`Pending: ${pendingUsers}`}
                    />

                    <div
                      className="bg-red-400"
                      style={{
                        width: `${(inactiveUsers / totalUsers) * 100}%`,
                      }}
                      title={`Inactive: ${inactiveUsers}`}
                    />
                  </div>

                  <StatusLegendRow
                    color="bg-emerald-500"
                    label="Active"
                    count={activeUsers}
                    percent={Math.round((activeUsers / totalUsers) * 100)}
                  />

                  <StatusLegendRow
                    color="bg-yellow-400"
                    label="Pending"
                    count={pendingUsers}
                    percent={Math.round((pendingUsers / totalUsers) * 100)}
                  />

                  <StatusLegendRow
                    color="bg-red-400"
                    label="Inactive"
                    count={inactiveUsers}
                    percent={Math.round((inactiveUsers / totalUsers) * 100)}
                  />
                </div>
              )}
            </div>

            {/* RECENT ACTIVITY */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <FileText size={21} className="text-blue-500" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Recent Activity
                    </h2>

                    <p className="text-sm text-slate-500">
                      Latest security events
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("logs")}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"
                >
                  View all
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="mt-5">
                {recentActivityLoading ? (
                  <p className="py-6 text-center text-sm text-slate-400">
                    Loading activity...
                  </p>
                ) : recentActivity.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">
                    No recent activity found.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentActivity.map((log, index) => (
                      <div
                        key={log?._id || log?.id || index}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                            <Activity size={15} className="text-slate-500" />
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {getAuditUserName(log)}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {getAuditDescription(log)}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
                            {getAuditAction(log)}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            {formatDate(getAuditCreatedAt(log))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          USER ACCESS
      ================================================================= */}

      {activeTab === "access" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  User Access
                </h2>

                <p className="text-sm text-slate-500">
                  Manage user account access
                </p>
              </div>

              <div className="flex gap-2">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    placeholder="Search user..."
                    className="w-64 rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={fetchUsers}
                  disabled={usersLoading}
                  className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    size={17}
                    className={
                      usersLoading
                        ? "animate-spin text-blue-500"
                        : "text-slate-500"
                    }
                  />
                </button>
              </div>
            </div>
          </div>

          {usersError && <ErrorBox message={usersError} />}

          {usersLoading ? (
            <Loading />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        ID
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        User
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        Role
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        Account
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-bold uppercase text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="py-16 text-center text-slate-400"
                        >
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => {
                        const status = String(
                          user?.status || "active",
                        ).toLowerCase();

                        const active = status === "active";

                        const userId = user?._id || user?.id || user?.userId;

                        const loading = actionLoading === userId;

                        return (
                          <tr
                            key={userId || Math.random()}
                            className="border-t border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-mono text-xs text-slate-500">
                              {user?.userId || user?._id || user?.id || "-"}
                            </td>

                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-800">
                                {user?.fullname ||
                                  user?.name ||
                                  user?.username ||
                                  "-"}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {user?.email || "-"}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-600">
                                {user?.role || "USER"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                                  String(
                                    user?.accountStatus || "pending",
                                  ).toLowerCase() === "active"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-yellow-50 text-yellow-600"
                                }`}
                              >
                                {user?.accountStatus || "pending"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  active
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {active ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  disabled={loading || active}
                                  onClick={() =>
                                    handleStatusChange(user, "active")
                                  }
                                  className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-100 disabled:opacity-40"
                                >
                                  {loading && !active ? "..." : "Active"}
                                </button>

                                <button
                                  disabled={loading || !active}
                                  onClick={() =>
                                    handleStatusChange(user, "inactive")
                                  }
                                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-40"
                                >
                                  {loading && active ? "..." : "Inactive"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-slate-500">
                  Showing {filteredUsers.length === 0 ? 0 : userStartIndex + 1}{" "}
                  to{" "}
                  {Math.min(
                    userStartIndex + usersPerPage,
                    filteredUsers.length,
                  )}{" "}
                  of {filteredUsers.length}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUserPage((page) => Math.max(page - 1, 1))}
                    disabled={safeUserPage === 1}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                    {filteredUsers.length === 0 ? 0 : safeUserPage}
                  </span>

                  <button
                    onClick={() =>
                      setUserPage((page) => Math.min(page + 1, userTotalPages))
                    }
                    disabled={safeUserPage >= userTotalPages}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================================================================
          ROLES & PERMISSIONS
      ================================================================= */}

      {activeTab === "roles" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <LockKeyhole size={21} className="text-blue-500" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Roles & Permissions
                </h2>

                <p className="text-sm text-slate-500">
                  Permissions loaded from database
                </p>
              </div>
            </div>

            <button
              onClick={fetchPermissions}
              disabled={permissionsLoading}
              className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  permissionsLoading
                    ? "animate-spin text-blue-500"
                    : "text-slate-500"
                }
              />
            </button>
          </div>

          {permissionsError && <ErrorBox message={permissionsError} />}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PermissionBox
              title="ADMIN"
              description="Administrator permissions"
              permissions={permissions.admin}
              loading={permissionsLoading}
              icon={<ShieldCheck size={20} />}
              iconClass="bg-purple-50 text-purple-600"
              formatPermission={formatPermission}
            />

            <PermissionBox
              title="USER"
              description="Normal user permissions"
              permissions={permissions.user}
              loading={permissionsLoading}
              icon={<Users size={20} />}
              iconClass="bg-blue-50 text-blue-600"
              formatPermission={formatPermission}
            />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900">
              Current Account Permissions
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Role:
              <span className="ml-1 font-bold uppercase text-blue-600">
                {currentAccount.role}
              </span>
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {currentAccount.permissions.length === 0 ? (
                <div className="rounded-xl bg-yellow-50 p-4 text-sm text-yellow-700 md:col-span-2">
                  No permissions assigned.
                </div>
              ) : (
                currentAccount.permissions.map((permission) => (
                  <div
                    key={String(permission)}
                    className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"
                  >
                    <CheckCircle2 size={17} className="text-emerald-500" />

                    {formatPermission(permission)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          AUDIT LOGS
      ================================================================= */}

      {activeTab === "logs" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 md:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <FileText size={21} className="text-blue-500" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">Audit Logs</h2>

                  <p className="text-sm text-slate-500">
                    Security activity and user actions
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        submitAuditSearch();
                      }
                    }}
                    placeholder="Search logs..."
                    className="w-64 rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={submitAuditSearch}
                  disabled={auditLoading}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Search
                </button>

                <button
                  onClick={() => fetchAuditLogs(auditPage, auditSearch)}
                  disabled={auditLoading}
                  className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 disabled:opacity-40"
                >
                  <RefreshCw
                    size={17}
                    className={
                      auditLoading
                        ? "animate-spin text-blue-500"
                        : "text-slate-500"
                    }
                  />
                </button>
              </div>
            </div>
          </div>

          {auditError && <ErrorBox message={auditError} />}

          {auditLoading ? (
            <Loading />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        #
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        User
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        Action
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        Description
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        IP
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase text-slate-500">
                        Date
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-bold uppercase text-slate-500">
                        View
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FileText
                              size={38}
                              className="mb-3 text-slate-300"
                            />

                            <p className="font-semibold text-slate-400">
                              No audit logs found.
                            </p>

                            {auditError && (
                              <p className="mt-2 max-w-md text-xs text-red-400">
                                Check the error message above.
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log, index) => {
                        const rowNumber =
                          (auditPagination.page - 1) * auditPagination.limit +
                          index +
                          1;

                        return (
                          <tr
                            key={
                              log?._id ||
                              log?.id ||
                              `${auditPagination.page}-${index}`
                            }
                            className="border-t border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-5 py-4 font-bold text-slate-500">
                              {rowNumber}
                            </td>

                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-800">
                                {getAuditUserName(log)}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {getAuditUserEmail(log)}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                                {getAuditAction(log)}
                              </span>
                            </td>

                            <td className="max-w-[350px] px-5 py-4 text-slate-600">
                              <p className="line-clamp-2">
                                {getAuditDescription(log)}
                              </p>
                            </td>

                            <td className="px-5 py-4 font-mono text-xs text-slate-500">
                              {getAuditIp(log)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                              {formatDate(getAuditCreatedAt(log))}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() =>
                                  fetchAuditLogById(log?._id || log?.id)
                                }
                                disabled={
                                  auditDetailLoading || !(log?._id || log?.id)
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                              >
                                {auditDetailLoading ? (
                                  <RefreshCw
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Eye size={15} />
                                )}
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  {auditLogs.length === 0
                    ? 0
                    : (auditPagination.page - 1) * auditPagination.limit +
                      1}{" "}
                  to{" "}
                  {Math.min(
                    auditPagination.page * auditPagination.limit,
                    auditPagination.total,
                  )}{" "}
                  of {auditPagination.total} logs
                </p>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setAuditPage((page) => Math.max(page - 1, 1))
                    }
                    disabled={!auditPagination.hasPreviousPage || auditLoading}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"
                  >
                    <ChevronLeft size={17} />
                  </button>

                  {getAuditPageNumbers().map((page, index) => {
                    if (page === "...") {
                      return (
                        <span
                          key={`dots-${index}`}
                          className="flex h-9 w-9 items-center justify-center text-slate-400"
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setAuditPage(page)}
                        disabled={auditLoading}
                        className={`h-9 min-w-9 rounded-lg px-3 text-sm font-bold ${
                          auditPage === page
                            ? "bg-blue-600 text-white"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setAuditPage((page) => page + 1)}
                    disabled={!auditPagination.hasNextPage || auditLoading}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================================================================
          AUDIT DETAIL MODAL
      ================================================================= */}

      {selectedAuditLog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedAuditLog(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Audit Log Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Complete database record
                </p>
              </div>

              <button
                onClick={() => setSelectedAuditLog(null)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailBox
                  label="Action"
                  value={getAuditAction(selectedAuditLog)}
                />

                <DetailBox
                  label="User"
                  value={getAuditUserName(selectedAuditLog)}
                />

                <DetailBox
                  label="Email"
                  value={getAuditUserEmail(selectedAuditLog)}
                />

                <DetailBox
                  label="IP Address"
                  value={getAuditIp(selectedAuditLog)}
                  mono
                />

                <DetailBox
                  label="Created At"
                  value={formatDate(getAuditCreatedAt(selectedAuditLog))}
                />

                <DetailBox
                  label="Updated At"
                  value={formatDate(selectedAuditLog?.updatedAt)}
                />

                <DetailBox
                  label="User ID"
                  value={getAuditUserId(selectedAuditLog)}
                  mono
                />
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {getAuditDescription(selectedAuditLog)}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 p-4">
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   STATUS LEGEND ROW
   ========================================================================== */

const StatusLegendRow = ({ color, label, count, percent }) => {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />

        <span className="font-semibold text-slate-700">{label}</span>
      </div>

      <div className="flex items-center gap-2 text-slate-500">
        <span className="font-bold text-slate-800">{count}</span>

        <span className="text-xs">({percent || 0}%)</span>
      </div>
    </div>
  );
};

/* ==========================================================================
   STAT CARD
   ========================================================================== */

const StatCard = ({ title, value, icon, iconClass, onClick }) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition ${
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
            {value}
          </h2>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   ERROR BOX
   ========================================================================== */

const ErrorBox = ({ message }) => {
  return (
    <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
      <div className="flex items-start gap-3">
        <AlertTriangle size={19} className="mt-0.5 shrink-0" />

        <div>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   LOADING
   ========================================================================== */

const Loading = () => {
  return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={30} className="animate-spin text-blue-500" />
    </div>
  );
};

/* ==========================================================================
   PERMISSION BOX
   ========================================================================== */

const PermissionBox = ({
  title,
  description,
  permissions,
  loading,
  icon,
  iconClass,
  formatPermission,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>

          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading permissions...</p>
      ) : permissions.length === 0 ? (
        <p className="text-sm text-slate-400">No permissions found.</p>
      ) : (
        <div className="space-y-3">
          {permissions.map((permission) => (
            <div
              key={String(permission)}
              className="flex items-center gap-3 text-sm text-slate-700"
            >
              <CheckCircle2 size={17} className="text-emerald-500" />

              {formatPermission(permission)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   DETAIL BOX
   ========================================================================== */

const DetailBox = ({ label, value, mono = false }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 break-all text-sm font-semibold text-slate-800 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "-"}
      </p>
    </div>
  );
};

/* ==========================================================================
   JSON SECTION
   ========================================================================== */

const JsonSection = ({ title, data }) => {
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-sm font-extrabold text-slate-900">{title}</h3>

      <pre className="max-h-[300px] overflow-auto rounded-xl bg-slate-900 p-4 text-xs leading-6 text-white">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default Security;
