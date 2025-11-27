import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../Auth/AuthContext";

export default function PrivateLayout({ children }) {
  const { logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen flex bg-gray-900 text-gray-200">

      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 shadow-xl p-6 hidden md:flex flex-col">
        <h2 className="text-3xl font-bold mb-10 text-blue-400">DNA Finder</h2>

        <nav className="flex-1 space-y-3">
          <Link
            className="block p-3 rounded hover:bg-gray-700 hover:text-white transition"
            to="/dashboard"
          >
            Dashboard
          </Link>
        </nav>

        <button
          onClick={logout}
          className="mt-4 w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 bg-gray-900">
        {children}
      </main>
    </div>
  );
}


