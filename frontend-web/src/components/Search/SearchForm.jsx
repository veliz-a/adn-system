import { useState } from "react";
import api from "../../api/axios";

export default function SearchForm({ onResults }) {
    const [file, setFile] = useState(null);
    const [pattern, setPattern] = useState("");
    const [algorithm, setAlgorithm] = useState("kmp");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setError("");

        if (!file) return setError("Debes cargar un CSV");
        if (!/^[ACGTacgt]+$/.test(pattern) || pattern.length < 3) {
            return setError("Patrón inválido (solo A,C,G,T — mínimo 3)");
        }

        try {
            setLoading(true);
            const form = new FormData();
            form.append("csv_file", file);
            form.append("pattern", pattern.toUpperCase());
            form.append("algorithm", algorithm);

            const { data } = await api.post("/search", form);
            onResults(data);
        } catch (err) {
            setError(err.response?.data?.detail || "Error en la búsqueda");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="bg-gray-800 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-bold text-blue-400">Nueva Búsqueda</h3>
            {error && <div className="bg-red-600 text-white p-2 rounded">{error}</div>}

            <div>
                <label className="text-gray-300">Patrón ADN:</label>
                <input
                    className="w-full p-2 bg-gray-700 text-white rounded mt-1"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="ATCG"
                />
            </div>

            <div>
                <label className="text-gray-300">Algoritmo:</label>
                <select
                    className="w-full p-2 bg-gray-700 text-white rounded mt-1"
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                >
                    <option value="kmp">KMP</option>
                    <option value="rabin_karp">Rabin-Karp</option>
                </select>
            </div>

            <div>
                <label className="text-gray-300">Archivo CSV:</label>
                <input
                    type="file"
                    accept=".csv"
                    className="w-full mt-1 text-gray-300"
                    onChange={(e) => setFile(e.target.files[0])}
                />
            </div>

            <button
                className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
            >
                {loading ? "Buscando..." : "Buscar"}
            </button>
        </form>
    );
}