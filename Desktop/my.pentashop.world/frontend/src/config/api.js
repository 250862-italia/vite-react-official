// Configurazione API per sviluppo e produzione
const API_CONFIG = {
  // URL base per le API
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-backend-url.com/api'  // TODO: Sostituire con URL backend deployato
    : 'http://localhost:3001/api',                  // URL di sviluppo
  
  // Timeout per le richieste
  timeout: 10000,
  
  // Headers di default
  headers: {
    'Content-Type': 'application/json',
  }
};

// Funzione per ottenere l'URL completo dell'API
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.baseURL}${endpoint}`;
};

// Funzione per ottenere gli headers con token
export const getAuthHeaders = (token) => {
  return {
    ...API_CONFIG.headers,
    'Authorization': `Bearer ${token}`
  };
};

// Configurazione axios di default
export const axiosConfig = {
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers
};

export default API_CONFIG; 