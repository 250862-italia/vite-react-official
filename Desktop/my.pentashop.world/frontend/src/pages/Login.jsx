import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    city: '',
    sponsorCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const response = await axios.post(endpoint, formData);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        console.log('✅ Auth successful, user saved:', response.data.data.user);
        
        if (isRegistering) {
          setSuccess(response.data.message);
          setTimeout(() => {
            // Redirect based on user role
            if (response.data.data.user.role === 'admin') {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
          }, 2000);
        } else {
          // Redirect based on user role
          if (response.data.data.user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }
      }
    } catch (err) {
      console.error('Errore auth:', err);
      setError(err.response?.data?.error || `Errore durante ${isRegistering ? 'la registrazione' : 'il login'}. Riprova.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background with animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400 to-blue-600 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="card animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <span className="text-white text-3xl font-bold">🌊</span>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Wash The World
            </h1>
            <p className="text-neutral-600">
              {isRegistering ? 'Registrazione Ambassador' : 'Piattaforma Gamificata per Ambasciatori'}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-slide-in">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg animate-slide-in">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>{success}</span>
                </div>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-neutral-400">👤</span>
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Inserisci il tuo username"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-neutral-400">🔒</span>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Inserisci la tua password"
                  required
                />
              </div>
            </div>

            {/* Campi di registrazione */}
            {isRegistering && (
              <>
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-400">📧</span>
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Inserisci la tua email"
                      required
                    />
                  </div>
                </div>

                {/* Nome e Cognome */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Nome"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-2">
                      Cognome *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Cognome"
                      required
                    />
                  </div>
                </div>

                {/* Telefono */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                    Telefono
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-400">📱</span>
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="+39 123 456 7890"
                    />
                  </div>
                </div>

                {/* Città e Paese */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
                      Città
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Città"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-neutral-700 mb-2">
                      Paese
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Paese"
                    />
                  </div>
                </div>

                {/* Codice Sponsor */}
                <div>
                  <label htmlFor="sponsorCode" className="block text-sm font-medium text-neutral-700 mb-2">
                    Codice Sponsor (opzionale)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-400">👥</span>
                    </div>
                    <input
                      type="text"
                      id="sponsorCode"
                      name="sponsorCode"
                      value={formData.sponsorCode}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Codice sponsor (se hai)"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full btn btn-primary btn-lg ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{isRegistering ? 'Registrazione in corso...' : 'Accesso in corso...'}</span>
                </>
              ) : (
                <>
                  <span>{isRegistering ? '🌟' : '🚀'}</span>
                  <span>{isRegistering ? 'Registrati come Ambassador' : 'Accedi'}</span>
                </>
              )}
            </button>

            {/* Toggle Login/Register */}
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                  setSuccess('');
                  setFormData({
                    username: '',
                    password: '',
                    email: '',
                    firstName: '',
                    lastName: '',
                    phone: '',
                    country: '',
                    city: '',
                    sponsorCode: ''
                  });
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
              >
                {isRegistering ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati come Ambassador'}
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              📋 Credenziali Demo
            </h3>
            <div className="space-y-3 text-sm">
              <div className="border-b border-blue-200 pb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-blue-700">👤 Utente Normale:</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Username:</span>
                  <code className="text-blue-800 font-mono">testuser</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Password:</span>
                  <code className="text-blue-800 font-mono">password</code>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-blue-700">👑 Admin:</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Username:</span>
                  <code className="text-blue-800 font-mono">admin</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Password:</span>
                  <code className="text-blue-800 font-mono">admin123</code>
                </div>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-800 mb-3">
              ✨ Funzionalità Disponibili
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600">
              <div className="flex items-center space-x-1">
                <span>🎯</span>
                <span>Task Gamificati</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🏆</span>
                <span>Badge System</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>💰</span>
                <span>Commissioni</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>👥</span>
                <span>Referral MLM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-neutral-500">
            © 2025 Wash The World. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login; 