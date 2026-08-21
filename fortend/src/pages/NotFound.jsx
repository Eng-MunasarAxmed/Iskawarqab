import { ShieldX } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center">
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center w-[500px]">
        <ShieldX size={90} className="mx-auto text-red-500" />

        <h1 className="text-4xl font-bold mt-5">404</h1>

        <h2 className="text-2xl font-semibold mt-3">Page Not Found</h2>

        <p className="text-gray-500 mt-4">
          This page doesn't exist or you don't have permission.
        </p>

        <Link
          to="/"
          className="inline-block mt-8 bg-[#1B2A41] text-white px-8 py-3 rounded-lg"
        >
          Back To Login
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
