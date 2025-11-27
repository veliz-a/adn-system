import React, { useState, useContext } from "react";
import { AuthContext } from "../Auth/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);

    try {
      await login(email, password);
      nav("/dashboard");
    } catch (err) {
      setMsg(err?.response?.data?.detail || "Credenciales incorrectas");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-200 px-4">
      <div className="bg-gray-800 w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-700">

        <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center">
          Iniciar Sesión
        </h2>

        {msg && (
          <div className="mb-4 p-3 bg-red-900 text-red-300 border border-red-700 rounded">
            {msg}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">

          <div>
            <label className="text-gray-300">Correo:</label>
            <input
              type="email"
              className="w-full mt-1 p-3 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:ring focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-gray-300">Contraseña:</label>
            <input
              type="password"
              className="w-full mt-1 p-3 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:ring focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="w-full py-3 bg-blue-600 rounded text-white hover:bg-blue-700 transition">
            Entrar
          </button>
        </form>

        <p className="mt-5 text-gray-400 text-center">
          ¿No tienes cuenta?{" "}
          <Link className="text-blue-400 hover:underline" to="/register">
            Regístrate
          </Link>
        </p>

      </div>
    </div>
  );
}

