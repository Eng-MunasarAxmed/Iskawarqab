import { Routes, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import Login from "../pages/Login";
import NotFound from "../pages/NotFound";

// User
import UserDashboard from "../pages/user/Dashboard";
import UserCategories from "../pages/user/Categories";
import UserTransactions from "../pages/user/Transections";
import UserProfile from "../pages/user/UserProfile";

// Admin
import AdminDashboard from "../pages/admin/Dashboard";
import AdminUsers from "../pages/admin/Users";
import AdminCategories from "../pages/admin/Categories";
import AdminTransactions from "../pages/admin/Transections";
import Security from "../pages/admin/Security";

// Layouts
import UserLayout from "../layouts/UserLayout";
import AdminLayout from "../layouts/AdminLayout";

// Auth
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AdminRoute from "../components/auth/AdminRoute";
import Register from "../pages/Register";

const AppRoutes = () => {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ================= USER ================= */}
      <Route
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/categories" element={<UserCategories />} />
        <Route path="/transactions" element={<UserTransactions />} />
        <Route path="/profile" element={<UserProfile />} />
      </Route>

      {/* ================= ADMIN ================= */}
      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/security" element={<Security />} />{" "}
      </Route>

      {/* NOT FOUND */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
