import { useState, useEffect } from "react";
import Login from "./components/AuthForm/Login";
import Register from "./components/AuthForm/Register";
import Dashboard from "./pages/Dashboard";

export default function App() {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [showRegister, setShowRegister] = useState(false);

    if (token) return <Dashboard />;

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
                {showRegister ? (
                    <>
                        <Register onSuccess={() => setShowRegister(false)} />
                        <p className="text-gray-400 mt-4 text-center">
                            ¿Ya tienes cuenta?{" "}
                            <button
                                onClick={() => setShowRegister(false)}
                                className="text-blue-400"
                            >
                                Iniciar sesión
                            </button>
                        </p>
                    </>
                ) : (
                    <>
                        <Login onSuccess={() => setToken(localStorage.getItem("token"))} />
                        <p className="text-gray-400 mt-4 text-center">
                            ¿No tienes cuenta?{" "}
                            <button
                                onClick={() => setShowRegister(true)}
                                className="text-blue-400"
                            >
                                Registrarse
                            </button>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
