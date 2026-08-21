import { Outlet } from "react-router-dom";

import Sidebar from "../components/user/Sidebar";
import Navbar from "../components/user/Navbar";

const UserLayout = () => {
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

export default UserLayout;
