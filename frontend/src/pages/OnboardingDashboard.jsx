import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Droplets, 
  Trophy, 
  Target, 
  Star, 
  ArrowRight, 
  LogOut,
  Award,
  CheckCircle,
  Circle,
  Play,
  ShoppingCart,
  Zap,
  TrendingUp,
  Euro,
  Wallet,
  Percent,
  Plus,
  Users,
  Gift
} from 'lucide-react';
import axios from 'axios';
import UserStats from '../components/UserStats';

const OnboardingDashboard = () => {
  const { user, logout, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({
    completedTasks: 0,
    totalTasks: 0,
    level: 1,
    experience: 0,
    nextLevelExp: 100
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Caricamento dati dashboard...');
      // Carica i dati della dashboard dal backend
      const response = await axios.get('http://localhost:5000/api/onboarding/dashboard');
      console.log('✅ Dati ricevuti dal backend:', response.data);
      const { data } = response.data;
      
      // Adatta i dati del backend alla struttura del frontend
      const backendTasks = data.availableTasks.map(task => ({
        _id: task.id,
        title: task.title,
        description: task.description,
        experiencePoints: task.rewards.experience,
        completed: false, // Verificheremo se è completato
        type: task.type,
        level: task.level,
        order: task.order
      }));
      
      console.log('📋 Task adattati:', backendTasks);
      setTasks(backendTasks);
      setUserProgress({
        completedTasks: data.progress.completedTasks || 0,
        totalTasks: data.progress.totalTasks || backendTasks.length,
        level: data.user.onboardingLevel || 1,
        experience: data.user.points || 0,
        nextLevelExp: data.user.experienceToNextLevel || 100
      });
      console.log('👤 Progresso utente aggiornato');
    } catch (error) {
      console.error('❌ Errore nel caricamento della dashboard:', error);
      // Fallback con dati di esempio se l'API non è disponibile
      setTasks([
        {
          _id: '1',
          title: 'Benvenuto su Wash The World',
          description: 'Completa il tuo primo task di onboarding per iniziare il tuo viaggio',
          experiencePoints: 50,
          completed: false,
          type: 'welcome'
        },
        {
          _id: '2',
          title: 'Configura il tuo Wallet',
          description: 'Imposta il tuo wallet per ricevere i token WTW',
          experiencePoints: 100,
          completed: false,
          type: 'wallet'
        },
        {
          _id: '3',
          title: 'Completa il Quiz',
          description: 'Testa le tue conoscenze sulla piattaforma',
          experiencePoints: 75,
          completed: false,
          type: 'quiz'
        }
      ]);
      setUserProgress({
        completedTasks: 0,
        totalTasks: 3,
        level: user?.onboardingLevel || 1,
        experience: user?.points || 0,
        nextLevelExp: 100
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleUpgrade = async () => {
    try {
      console.log('🔄 Avvio upgrade MLM...');
      const response = await axios.post('http://localhost:5000/api/ambassador/upgrade');
      
      if (response.data.success) {
        console.log('✅ Upgrade MLM completato:', response.data);
        // Ricarica i dati della dashboard
        fetchDashboardData();
        // Mostra messaggio di successo
        alert('🎉 Upgrade a MLM Ambassador completato con successo! Ora puoi guadagnare commissioni più alte.');
      } else {
        console.error('❌ Errore durante upgrade:', response.data.error);
        alert('Errore durante l\'upgrade: ' + response.data.error);
      }
    } catch (error) {
      console.error('❌ Errore durante upgrade MLM:', error);
      alert('Errore durante l\'upgrade. Riprova più tardi.');
    }
  };

  const getProgressPercentage = () => {
    return userProgress.totalTasks > 0 
      ? (userProgress.completedTasks / userProgress.totalTasks) * 100 
      : 0;
  };

  const getExperiencePercentage = () => {
    return Math.min((userProgress.experience / userProgress.nextLevelExp) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">
            Benvenuto, {user?.firstName || 'Wavemaker'}! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Inizia il tuo viaggio per salvare il pianeta e guadagnare commissioni
          </p>
        </motion.div>

        {/* User Stats Component */}
        <UserStats user={user} stats={userProgress} />

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/tasks/1')}
            className="card-hover group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700">Continua Onboarding</h3>
                <p className="text-gray-600 text-sm">Completa i task</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all">
                <Play className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/shop')}
            className="card-hover group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-success-700">Shop</h3>
                <p className="text-gray-600 text-sm">Vendi prodotti</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-success-500 to-success-600 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/badges')}
            className="card-hover group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-secondary-700">Badge</h3>
                <p className="text-gray-600 text-sm">Vedi traguardi</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.button>

          {/* Mostra il pulsante Upgrade MLM solo se l'utente non è già MLM Ambassador */}
          {user?.role !== 'mlm_ambassador' ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpgrade}
              className="card-hover group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-warning-700">Upgrade MLM</h3>
                  <p className="text-gray-600 text-sm">Guadagna di più</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-warning-500 to-warning-600 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card bg-gradient-to-r from-success-50 to-success-100 border-success-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-success-900">🎉 MLM Ambassador</h3>
                  <p className="text-success-700 text-sm">Hai già l'upgrade!</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-success-500 to-success-600 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Tasks Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Target className="w-6 h-6 mr-2 text-primary-600" />
              Task Disponibili
            </h2>
            <div className="badge badge-primary">
              {tasks.length} task disponibili
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task, index) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleTaskClick(task._id)}
                className="card-hover group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {task.description}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-100 to-primary-200 rounded-lg flex items-center justify-center group-hover:from-primary-200 group-hover:to-primary-300 transition-all">
                    {task.type === 'video' && <Play className="w-5 h-5 text-primary-600" />}
                    {task.type === 'quiz' && <Target className="w-5 h-5 text-primary-600" />}
                    {task.type === 'welcome' && <Star className="w-5 h-5 text-primary-600" />}
                    {task.type === 'wallet' && <Wallet className="w-5 h-5 text-primary-600" />}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      +{task.experiencePoints} XP
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Livello {task.level}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-success-600" />
            Attività Recenti
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-success-50 rounded-lg">
              <div className="w-10 h-10 bg-success-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Registrazione completata</p>
                <p className="text-sm text-gray-600">Benvenuto nella piattaforma Wash The World</p>
              </div>
              <span className="text-sm text-gray-500">Oggi</span>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-primary-50 rounded-lg">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Bonus di benvenuto ricevuto</p>
                <p className="text-sm text-gray-600">+100 punti e +50 token WTW</p>
              </div>
              <span className="text-sm text-gray-500">Oggi</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingDashboard; 