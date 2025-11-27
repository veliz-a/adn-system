import React, { useEffect, useState } from "react";
import api from "../../api/axios";

export default function HistoryList() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/history?limit=10&offset=0");
        setHistory(res.data.searches || res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
      <h3 className="text-xl text-blue-400 font-semibold mb-4">Historial</h3>

      {!history.length && (
        <p className="text-gray-400">No hay búsquedas recientes.</p>
      )}

      <ul className="space-y-3">
        {history.map((item) => (
          <li
            key={item.id}
            className="p-3 bg-gray-700 rounded border border-gray-600 text-gray-300"
          >
            <div className="font-medium">
              {item.pattern} — {item.algorithm}
            </div>
            <div className="text-sm text-gray-400">
              Coincidencias: {item.match_count}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


