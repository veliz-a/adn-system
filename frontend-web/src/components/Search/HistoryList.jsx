import { useState, useEffect } from "react";
import api from "../../api/axios";

export default function HistoryList() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        api.get("/history?limit=10").then((res) => setHistory(res.data.searches));
    }, []);

    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Historial</h3>
            {history.length === 0 ? (
                <p className="text-gray-400">Sin búsquedas previas</p>
            ) : (
                <ul className="space-y-2">
                    {history.map((h) => (
                        <li key={h.id} className="bg-gray-700 p-3 rounded">
                            <div className="text-white">{h.pattern} - {h.algorithm}</div>
                            <div className="text-gray-400 text-sm">
                                {h.match_count} coincidencias | {h.execution_time_ms}ms
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}