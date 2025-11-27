// src/components/Search/ResultsView.jsx
import React, { useEffect, useState } from 'react';
import { saveAs } from 'file-saver';

export default function ResultsView() {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const load = () => {
      const r = localStorage.getItem('last_search_result');
      if (r) setResult(JSON.parse(r));
    };
    load();
    window.addEventListener('search:complete', load);
    return () => window.removeEventListener('search:complete', load);
  }, []);

  if (!result) {
    return <div className="p-4 bg-white rounded">No hay resultados aún.</div>;
  }

  const exportCSV = () => {
    const rows = [['name','positions_count','positions']];
    (result.matches || []).forEach(m => {
      rows.push([m.name || m, (m.positions?.length || 0), (m.positions || []).join('|')]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'results.csv');
  };

  return (
    <div className="p-4 bg-white rounded mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg">Resultados — {result.algorithm}</h3>
        <div>
          <button onClick={exportCSV} className="px-3 py-1 bg-gray-200 rounded mr-2">Exportar CSV</button>
        </div>
      </div>

      <div className="mb-2 text-sm">Tiempo: {result.execution_time_ms} ms — Coincidencias: {result.match_count}</div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left">
            <th className="border p-2">Nombre</th>
            <th className="border p-2">Posiciones</th>
            <th className="border p-2">Count</th>
          </tr>
        </thead>
        <tbody>
          {(result.matches || []).map((m, idx) => (
            <tr key={idx}>
              <td className="border p-2">{m.name || m}</td>
              <td className="border p-2">{(m.positions || []).join(', ')}</td>
              <td className="border p-2">{(m.positions || []).length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
