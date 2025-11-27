import React, { useState } from "react";
import Papa from "papaparse";
import api from "../../api/axios";

export default function SearchForm() {
  const [file, setFile] = useState(null);
  const [pattern, setPattern] = useState("");
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    if (!f.name.endsWith(".csv")) {
      setMsg("Solo se permiten archivos .csv");
      return;
    }

    setFile(f);

    Papa.parse(f, {
      preview: 3,
      complete: (r) => setPreview(r.data),
    });
  };

  const validatePattern = (p) => /^[ACGTacgt]+$/.test(p) && p.length >= 3;

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!file) return setMsg("Debes cargar un archivo CSV");
    if (!validatePattern(pattern))
      return setMsg("Patrón inválido (solo A,C,G,T — mínimo 3)");

    try {
      setLoading(true);

      const form = new FormData();
      form.append("file", file);
      form.append("pattern", pattern);
      form.append("algorithm", "kmp");

      const up = await api.post("/upload-csv", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const file_id = up.data.file_id;

      const res = await api.post("/search", {
        file_id,
        pattern,
        algorithm: "kmp",
      });

      localStorage.setItem("last_search_result", JSON.stringify(res.data));
      window.dispatchEvent(new Event("search:complete"));

      setMsg("Búsqueda completada");
    } catch (err) {
      setMsg(err?.response?.data?.detail || "Error en la búsqueda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="bg-gray-800 p-6 shadow-lg rounded-xl border border-gray-700" onSubmit={submit}>
      <h3 className="text-2xl font-semibold mb-4 text-blue-400">
        Nueva búsqueda
      </h3>

      {msg && (
        <div className="p-3 bg-red-900 text-red-300 rounded mb-4 border border-red-700">
          {msg}
        </div>
      )}

      <label className="block mb-4">
        <span className="text-gray-300">Patrón de ADN:</span>
        <input
          className="w-full p-3 border rounded mt-1 bg-gray-700 text-gray-100 border-gray-600"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
        />
      </label>

      <label className="block mb-4">
        <span className="text-gray-300">Archivo CSV:</span>
        <input type="file" accept=".csv" className="mt-1 text-gray-300" onChange={onFile} />
      </label>

      {preview.length > 0 && (
        <div className="bg-gray-700 border border-gray-600 rounded p-3 text-sm text-gray-300 mb-4">
          <strong>Preview:</strong>
          <pre className="text-xs mt-1">
            {JSON.stringify(preview, null, 2)}
          </pre>
        </div>
      )}

      <button className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
        {loading ? "Buscando..." : "Iniciar búsqueda"}
      </button>
    </form>
  );
}
