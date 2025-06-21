import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Play, 
  CheckCircle, 
  Award, 
  TrendingUp,
  LogOut,
  Target,
  Zap
} from 'lucide-react';
import axios from 'axios';

const OnboardingDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await axios.get('/onboarding/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Errore caricamento dashboard:', error);
      // Fallback con dati mock
      setDashboardData({
        user: {
          level: 1,
          experience: 0,
          experienceToNextLevel: 100,
          onboardingLevel: 0,
          points: 100,
          tokens: 50
        },
        progress: {
          percentage: 20,
          completedTasks: 2,
          totalTasks: 10,
          currentTask: {
            id: 1,
            title: "Benvenuto in Wash The World",
            description: "Guarda il video di benvenuto",
            type: "video",
            rewards: { points: 25, tokens: 5, experience: 15 }
          }
        },
        availableTasks: [
          {
            id: 1,
            title: "Benvenuto in Wash The World",
            description: "Guarda il video di benvenuto",
            type: "video",
            rewards: { points: 25, tokens: 5, experience: 15 }
          },
          {
            id: 2,
            title: "Quiz: Conosci Wash The World?",
            description: "Testa la tua conoscenza",
            type: "quiz",
            rewards: { points: 50, tokens: 10, experience: 25 }
          }
        ],
        availableBadges: [
          {
            id: 1,
            name: "Primo Passo",
            description: "Completa il primo task",
            icon: "complete",
            category: "onboarding",
            level: 1
          },
          {
            id: 2,
            name: "Studente Diligente",
            description: "Guarda 3 video",
            icon: "locked",
            category: "onboarding",
            level: 1
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const startTask = (taskId) => {
    navigate(`/task/${taskId}`);
  };

  const getBadgeIcon = (iconType) => {
    switch (iconType) {
      case 'complete':
        return <img src="/images/badge-complete.svg" alt="Badge completato" className="w-8 h-8" />;
      case 'locked':
        return <img src="/images/badge-locked.svg" alt="Badge bloccato" className="w-8 h-8" />;
      default:
        return <img src="/images/badge-locked.svg" alt="Badge" className="w-8 h-8" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { user: userData, progress, availableTasks, availableBadges } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img src="/images/logo.svg" alt="Wash The World Logo" className="h-10" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Wash The World</h1>
                <p className="text-sm text-gray-500">Onboarding Gamificato</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">Livello {userData.level}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Livello</p>
                <p className="text-2xl font-bold text-gray-900">{userData.level}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Punti</p>
                <p className="text-2xl font-bold text-gray-900">{userData.points}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Token</p>
                <p className="text-2xl font-bold text-gray-900">{userData.tokens}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Progresso</p>
                <p className="text-2xl font-bold text-gray-900">{progress.percentage}%</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Progresso Onboarding</h2>
            <span className="text-sm text-gray-500">
              {progress.completedTasks} di {progress.totalTasks} task completati
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Inizio</span>
            <span>Completato</span>
          </div>
        </motion.div>

        {/* Current Task */}
        {progress.currentTask && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-blue-500 to-green-500 rounded-xl p-6 text-white mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Task Corrente</h3>
                <p className="text-blue-100 mb-2">{progress.currentTask.title}</p>
                <p className="text-blue-100 text-sm">{progress.currentTask.description}</p>
              </div>
              <button
                onClick={() => startTask(progress.currentTask.id)}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Inizia
              </button>
            </div>
          </motion.div>
        )}

        {/* Available Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <Play className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Task Disponibili</h2>
              </div>
              
              <div className="space-y-4">
                {availableTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => startTask(task.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-600">{task.description}</p>
                        <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                          <span>🎯 {task.rewards.points} punti</span>
                          <span>⚡ {task.rewards.tokens} token</span>
                          <span>⭐ {task.rewards.experience} exp</span>
                        </div>
                      </div>
                      <Play className="w-5 h-5 text-blue-500" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Available Badges */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Award className="w-6 h-6 text-purple-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Badge Disponibili</h2>
                </div>
                <button
                  onClick={() => navigate('/badges')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Vedi tutti
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {availableBadges.slice(0, 4).map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="text-center p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-center mb-2">
                      {getBadgeIcon(badge.icon)}
                    </div>
                    <h3 className="font-medium text-sm text-gray-900 mb-1">{badge.name}</h3>
                    <p className="text-xs text-gray-600">{badge.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Task Disponibili</h2>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            
            <div className="space-y-4">
              {availableTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => startTask(task.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          {task.rewards.points} punti
                        </span>
                        <span className="flex items-center">
                          <Zap className="w-3 h-3 mr-1" />
                          {task.rewards.tokens} token
                        </span>
                        <span className="flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {task.rewards.experience} exp
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Badges Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Badge Disponibili</h2>
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {availableBadges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1">{badge.name}</h3>
                  <p className="text-xs text-gray-600">{badge.description}</p>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/badges')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Vedi tutti i badge →
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingDashboard; 