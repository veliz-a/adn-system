import { useState } from "react";
import api from "../../api/axios";

export default function Login({ onSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post("/login", { email, password });
            localStorage.setItem("token", data.access_token);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.detail || "Error de login");
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <h2 className="text-2xl font-bold">Iniciar Sesión</h2>
            {error && <div className="bg-red-600 text-white p-2 rounded">{error}</div>}
            <input
                type="email"
                placeholder="Email"
                className="w-full p-3 border rounded bg-gray-700 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Contraseña"
                className="w-full p-3 border rounded bg-gray-700 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700">
                Entrar
            </button>
        </form>
    );
}