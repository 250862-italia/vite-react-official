// Service Layer per gestione centralizzata delle API
import axios from 'axios';
import { getApiUrl } from '../config/api';

// Configurazione axios con interceptors
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor per aggiungere token automaticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Errore interceptor request:', error);
    return Promise.reject(error);
  }
);

// Interceptor per gestione errori di risposta
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ Errore API:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });

    // Gestione errori specifici
    if (error.response?.status === 401) {
      console.error('🔐 Token scaduto o non valido');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (error.response?.status === 403) {
      console.error('🚫 Accesso negato');
    }

    if (error.response?.status === 500) {
      console.error('💥 Errore server interno');
    }

    return Promise.reject(error);
  }
);

// Funzione per gestione robusta degli errori
const handleApiError = (error, context = '') => {
  const errorInfo = {
    message: 'Errore di connessione',
    code: 'NETWORK_ERROR',
    context
  };

  if (error.response) {
    // Server ha risposto con status code di errore
    errorInfo.status = error.response.status;
    errorInfo.message = error.response.data?.error || error.response.statusText;
    errorInfo.code = `HTTP_${error.response.status}`;
  } else if (error.request) {
    // Richiesta fatta ma nessuna risposta
    errorInfo.message = 'Server non raggiungibile';
    errorInfo.code = 'NO_RESPONSE';
  } else {
    // Errore nella configurazione della richiesta
    errorInfo.message = error.message || 'Errore di configurazione';
    errorInfo.code = 'CONFIG_ERROR';
  }

  console.error(`❌ API Error [${context}]:`, errorInfo);
  return errorInfo;
};

// API Service Functions
export const apiService = {
  // Auth
  login: async (credentials) => {
    try {
      const response = await apiClient.post(getApiUrl('/auth/login'), credentials);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'LOGIN') };
    }
  },

  register: async (userData) => {
    try {
      const response = await apiClient.post(getApiUrl('/auth/register'), userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'REGISTER') };
    }
  },

  // Profile
  getProfile: async () => {
    try {
      const response = await apiClient.get(getApiUrl('/profile'));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'GET_PROFILE') };
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put(getApiUrl('/profile'), profileData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'UPDATE_PROFILE') };
    }
  },

  // Admin APIs
  getAdminStats: async () => {
    try {
      const response = await apiClient.get(getApiUrl('/admin/stats'));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'ADMIN_STATS') };
    }
  },

  getAdminUsers: async () => {
    try {
      const response = await apiClient.get(getApiUrl('/admin/users'));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'ADMIN_USERS') };
    }
  },

  createUser: async (userData) => {
    try {
      const response = await apiClient.post(getApiUrl('/admin/users'), userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'CREATE_USER') };
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(getApiUrl(`/admin/users/${userId}`), userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'UPDATE_USER') };
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(getApiUrl(`/admin/users/${userId}`));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'DELETE_USER') };
    }
  },

  // Tasks
  getTasks: async () => {
    try {
      const response = await apiClient.get(getApiUrl('/admin/tasks'));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'GET_TASKS') };
    }
  },

  createTask: async (taskData) => {
    try {
      const response = await apiClient.post(getApiUrl('/admin/tasks'), taskData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'CREATE_TASK') };
    }
  },

  updateTask: async (taskId, taskData) => {
    try {
      const response = await apiClient.put(getApiUrl(`/admin/tasks/${taskId}`), taskData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'UPDATE_TASK') };
    }
  },

  deleteTask: async (taskId) => {
    try {
      const response = await apiClient.delete(getApiUrl(`/admin/tasks/${taskId}`));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'DELETE_TASK') };
    }
  },

  // Commission Plans
  getCommissionPlans: async () => {
    try {
      const response = await apiClient.get(getApiUrl('/admin/commission-plans'));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'GET_COMMISSION_PLANS') };
    }
  },

  createCommissionPlan: async (planData) => {
    try {
      const response = await apiClient.post(getApiUrl('/admin/commission-plans'), planData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'CREATE_COMMISSION_PLAN') };
    }
  },

  updateCommissionPlan: async (planId, planData) => {
    try {
      const response = await apiClient.put(getApiUrl(`/admin/commission-plans/${planId}`), planData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'UPDATE_COMMISSION_PLAN') };
    }
  },

  deleteCommissionPlan: async (planId) => {
    try {
      const response = await apiClient.delete(getApiUrl(`/admin/commission-plans/${planId}`));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'DELETE_COMMISSION_PLAN') };
    }
  },

  // KYC
  getKYCRequests: async () => {
    try {
      const response = await apiClient.get(getApiUrl('/admin/kyc'));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'GET_KYC_REQUESTS') };
    }
  },

  updateKYCStatus: async (kycId, statusData) => {
    try {
      const response = await apiClient.put(getApiUrl(`/admin/kyc/${kycId}/status`), statusData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'UPDATE_KYC_STATUS') };
    }
  },

  // Sales
  getSales: async () => {
    try {
      const response = await apiClient.get(getApiUrl('/admin/sales'));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'GET_SALES') };
    }
  },

  createSale: async (saleData) => {
    try {
      const response = await apiClient.post(getApiUrl('/admin/sales'), saleData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'CREATE_SALE') };
    }
  },

  // MLM
  getMLMCommissions: async () => {
    try {
      const response = await apiClient.get(getApiUrl('/mlm/commissions'));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'GET_MLM_COMMISSIONS') };
    }
  },

  getMLMSales: async () => {
    try {
      const response = await apiClient.get(getApiUrl('/mlm/sales'));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'GET_MLM_SALES') };
    }
  },

  // Health Check
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error, 'HEALTH_CHECK') };
    }
  }
};

export default apiService; 