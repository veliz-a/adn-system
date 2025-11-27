import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL; 
const api = axios.create({
    baseURL: API_URL,
    timeout: 60000, 
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwt_token'); 
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("Token expirado o inválido. Redirigiendo a Login.");
            localStorage.removeItem('jwt_token'); 
            window.location.href = '/login'; 
        }
        return Promise.reject(error); 
    }
);

export default api;