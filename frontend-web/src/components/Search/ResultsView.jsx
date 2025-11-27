export default function ResultsView({ data }) {
    if (!data) return null;

    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-green-400 mb-4">Resultados</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Algoritmo</div>
                    <div className="text-white font-bold">{data.algorithm}</div>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Coincidencias</div>
                    <div className="text-white font-bold">{data.match_count}</div>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                    <div className="text-gray-400 text-sm">Tiempo (ms)</div>
                    <div className="text-white font-bold">{data.execution_time_ms}</div>
                </div>
            </div>

            {data.matches.length > 0 ? (
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-2">Nombre</th>
                            <th className="p-2">Posiciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.matches.map((m, i) => (
                            <tr key={i} className="border-t border-gray-700">
                                <td className="p-2">{m.name}</td>
                                <td className="p-2">{m.positions.join(", ")}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-gray-400">No se encontraron coincidencias</p>
            )}
        </div>
    );
}