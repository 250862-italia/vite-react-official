import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const OnboardingDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    completedTasks: 0,
    totalPoints: 0,
    unlockedBadges: 0,
    streak: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/onboarding/tasks');
        const data = await res.json();
        setTasks(data.tasks || []);
        const completed = (data.tasks || []).filter(t => t.completed).length;
        const total = (data.tasks || []).length;
        setProgress(total > 0 ? (completed / total) * 100 : 0);
        
        // Calcola statistiche dinamiche
        const totalPoints = (data.tasks || []).reduce((sum, task) => 
          task.completed ? sum + (task.points || 100) : sum, 0
        );
        
        setStats({
          completedTasks: completed,
          totalPoints: totalPoints + 250, // Bonus iniziali
          unlockedBadges: Math.floor(completed / 2) + 1,
          streak: Math.min(completed, 7)
        });
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    
    // Simula notifiche in tempo reale
    const notificationInterval = setInterval(() => {
      const newNotification = {
        id: Date.now(),
        type: 'achievement',
        message: 'Ottimo lavoro! Hai completato un\'altra attività!',
        timestamp: new Date()
      };
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }, 30000); // Ogni 30 secondi

    return () => clearInterval(notificationInterval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin" style={{ animationDelay: '-0.5s' }}></div>
          </div>
          <p className="text-gray-600 text-lg font-medium">Caricamento dashboard...</p>
          <p className="text-gray-400 text-sm mt-2">Preparando la tua esperienza personalizzata</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <span className="font-medium">Ottimo lavoro! Hai completato un'altra attività!</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="text-sm">👋 Benvenuto di nuovo</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-4 animate-fade-in-up">
              Ciao, {user?.username}! 
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Continua il tuo viaggio per rendere il mondo un posto migliore. 
              Ogni attività ti avvicina al tuo obiettivo! 🌍
            </p>
            
            {/* Enhanced Progress Bar */}
            <div className="max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium">Progresso Onboarding</span>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="relative w-full bg-white/20 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-2000 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-blue-200 mt-2">
                <span>Iniziato</span>
                <span>In corso</span>
                <span>Completato</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Task Completate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedTasks}/{tasks.length}
                </p>
                <p className="text-xs text-green-600">+{stats.completedTasks * 10}% questa settimana</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Badge Sbloccati</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unlockedBadges}</p>
                <p className="text-xs text-green-600">+2 questo mese</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Punti Totali</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}</p>
                <p className="text-xs text-green-600">+{stats.completedTasks * 100} oggi</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">🔥</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Streak Attuale</p>
                <p className="text-2xl font-bold text-gray-900">{stats.streak} giorni</p>
                <p className="text-xs text-orange-600">Mantieni la serie!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Le tue attività</h2>
              <p className="text-gray-600 mt-1">Completa le attività per sbloccare nuovi contenuti e badge</p>
            </div>
            <div className="flex gap-3">
              <Link 
                to="/badges" 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-300 flex items-center gap-2"
              >
                🏆 Vedi Badge
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task, index) => (
              <Link
                key={task.id || index}
                to={`/task/${task.id || index}`}
                className="group block"
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group-hover:-translate-y-2 relative overflow-hidden">
                  {task.completed && (
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-500 transform rotate-45 translate-x-8 -translate-y-8">
                      <div className="absolute top-2 right-2 text-white text-xs font-bold">✓</div>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      task.completed 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {task.completed ? '✅ Completata' : '⏳ In corso'}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {task.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {task.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>⏱️ {task.estimatedTime || '5 min'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Punti:</span>
                      <span className="font-semibold text-blue-600">{task.points || 100}</span>
                    </div>
                  </div>
                  
                  {!task.completed && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* MLM Upgrade Section */}
        {user?.role !== 'mlm_ambassador' && (
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative text-center">
              <div className="text-5xl mb-4 animate-bounce">🚀</div>
              <h3 className="text-3xl font-bold mb-4">Pronto per il prossimo livello?</h3>
              <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
                Diventa un MLM Ambassador e inizia a guadagnare commissioni mentre aiuti a diffondere la missione di Wash The World.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/onboarding"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  💰 Upgrade a MLM Ambassador
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <button className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-all duration-300">
                  📊 Scopri di più
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Recent Activity */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Attività Recenti</h3>
            <button className="text-blue-600 hover:text-blue-700 font-medium">Vedi tutto</button>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600">✅</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Task completata: "Presentazione della piattaforma"</p>
                  <p className="text-sm text-gray-500">2 ore fa • +100 punti</p>
                </div>
                <div className="text-green-600 font-semibold">+100</div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600">🏆</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Badge sbloccato: "Primo Passo"</p>
                  <p className="text-sm text-gray-500">Ieri • +50 punti bonus</p>
                </div>
                <div className="text-blue-600 font-semibold">+50</div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600">👋</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Benvenuto nella community Wash The World!</p>
                  <p className="text-sm text-gray-500">3 giorni fa • Account creato</p>
                </div>
                <div className="text-purple-600 font-semibold">+250</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-in-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OnboardingDashboard; 