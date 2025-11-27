import React from "react";
import PrivateLayout from "../components/Layout/PrivateLayout";
import SearchForm from "../components/Search/SearchForm";
import ResultsView from "../components/Search/ResultsView";
import HistoryList from "../components/Search/HistoryList";

export default function Dashboard() {
  return (
    <PrivateLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Gestiona tus análisis de ADN y visualiza resultados.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <SearchForm />
        </div>

        <div>
          <HistoryList />
        </div>
      </div>

      <div className="mt-8">
        <ResultsView />
      </div>
    </PrivateLayout>
  );
}