import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Droplets, Shield, Sparkles, Eye, EyeOff, Lock, User } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/onboarding');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white/50 to-secondary-50/50"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10"
      >
        <div className="glass-effect rounded-2xl shadow-glow p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6 shadow-glow"
            >
              <Droplets className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              Wash The World
            </h1>
            <p className="text-gray-600">
              Inizia il tuo viaggio per salvare il pianeta
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm flex items-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>{error}</span>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                  placeholder="Inserisci il tuo username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                  placeholder="Inserisci la tua password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 px-4 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Accesso in corso...
                </div>
              ) : (
                'Accedi'
              )}
            </motion.button>
          </form>

          {/* Demo Credentials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200"
          >
            <h3 className="text-sm font-medium text-primary-900 mb-2 flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Credenziali di test:
            </h3>
            <div className="text-sm text-primary-700 space-y-1">
              <p>
                <span className="font-medium">Username:</span> 
                <span className="font-mono ml-2 bg-white/50 px-2 py-1 rounded">testuser</span>
              </p>
              <p>
                <span className="font-medium">Password:</span> 
                <span className="font-mono ml-2 bg-white/50 px-2 py-1 rounded">password</span>
              </p>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 grid grid-cols-3 gap-4 text-center"
          >
            <motion.div 
              className="flex flex-col items-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-2">
                <Shield className="w-6 h-6 text-success-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Sicuro</span>
            </motion.div>
            <motion.div 
              className="flex flex-col items-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-2">
                <Sparkles className="w-6 h-6 text-secondary-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Gamificato</span>
            </motion.div>
            <motion.div 
              className="flex flex-col items-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-2">
                <Droplets className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Sostenibile</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login; 