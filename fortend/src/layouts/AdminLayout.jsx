import { Outlet } from "react-router-dom";
import Navbar from "../components/admin/Navbar";
import Sidebar from "../components/admin/Sidebar";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />

      <div className="ml-64">
        <Navbar />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
