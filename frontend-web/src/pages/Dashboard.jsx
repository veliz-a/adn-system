import { useState } from "react";
import SearchForm from "../components/Search/SearchForm";
import ResultsView from "../components/Search/ResultsView";
import HistoryList from "../components/Search/HistoryList";

export default function Dashboard() {
    const [results, setResults] = useState(null);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-8">Sistema Forense ADN</h1>
            <button
                onClick={() => {
                    localStorage.removeItem("token");
                    window.location.reload();
                }}
                className="mb-4 bg-red-600 px-4 py-2 rounded"
            >
                Cerrar Sesión
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SearchForm onResults={setResults} />
                <HistoryList />
            </div>

            {results && (
                <div className="mt-6">
                    <ResultsView data={results} />
                </div>
            )}
        </div>
    );
}