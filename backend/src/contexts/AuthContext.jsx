import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configura axios per usare il proxy Vite
  axios.defaults.baseURL = '/api';

  useEffect(() => {
    if (token) {
      // Verifica token e carica dati utente
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUserData = async () => {
    try {
      // Per ora usiamo dati mock, in futuro chiameremo l'API
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        level: 1,
        experience: 0,
        points: 100,
        tokens: 50,
        onboardingLevel: 0,
        badges: []
      };
      setUser(mockUser);
    } catch (error) {
      console.error('Errore caricamento utente:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('/auth/login', {
        username,
        password
      });

      const { data } = response.data;
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      
      return { success: true };
    } catch (error) {
      console.error('Errore login:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Errore durante il login'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      
      const { data } = response.data;
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      
      return { success: true };
    } catch (error) {
      console.error('Errore registrazione:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Errore durante la registrazione'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 