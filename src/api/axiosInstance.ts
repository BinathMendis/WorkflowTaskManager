import axios from 'axios'

// Get API URL from config.js file (can be edited after build)
const getApiUrl = (): string => {
  // Use runtime config from config.js if available
  if (window.API_URL) {
    return window.API_URL;
  }
  
  // Fallback to .env variable (development)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Final fallback
  return 'http://localhost:5085/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error(`[API Error] ${error.config?.url}`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    })
    
    // Don't automatically redirect - let the component handle 401
    return Promise.reject(error)
  }
)

export default api
