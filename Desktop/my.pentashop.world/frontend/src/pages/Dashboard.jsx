import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { useWebSocket } from '../hooks/useWebSocket';
import Header from '../components/Layout/Header';
import StatsCards from '../components/Dashboard/StatsCards';
import WebSocketStatus from '../components/Layout/WebSocketStatus';
import Footer from '../components/Layout/Footer';
import TaskCard from '../components/Tasks/TaskCard';
import TaskExecutor from '../components/Tasks/TaskExecutor';
import KYCForm from '../components/KYC/KYCForm';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskExecutor, setShowTaskExecutor] = useState(false);
  const [completionMessage, setCompletionMessage] = useState(null);
  const [showKYC, setShowKYC] = useState(false);
  const [kycMessage, setKycMessage] = useState(null);
  const [specialBadge, setSpecialBadge] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const navigate = useNavigate();
  
  // 🔄 WebSocket per notifiche in tempo reale
  const token = localStorage.getItem('token');
  const { isConnected, notifications } = useWebSocket(token);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (!token || !savedUser) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(savedUser);
    
    // Reindirizza admin alla dashboard admin
    if (userData.role === 'admin') {
      navigate('/admin');
      return;
    }
    
    // 🔒 PROTEZIONE: Se è un guest, verifica se è stato approvato dall'admin
    if (userData.role === 'guest') {
      checkGuestApproval();
      return;
    }
    
    setUser(userData);
    loadDashboardData(userData.id);
  }, [navigate]);

  const checkGuestApproval = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/kyc/status'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const kycData = response.data.data;
        
        // Se il guest non è stato approvato dall'admin, redirect al guest dashboard
        if (!kycData.adminApproved || kycData.state !== 'approved') {
          console.log('🔒 Guest non approvato dall\'admin, redirect al guest dashboard');
          navigate('/guest-dashboard');
          return;
        }
        
        // Se è stato approvato, aggiorna il ruolo e continua
        console.log('🔓 Guest approvato, aggiornamento ruolo...');
        const updatedUser = { ...JSON.parse(localStorage.getItem('user')), role: 'ambassador' };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        loadDashboardData(updatedUser.id);
      }
    } catch (error) {
      console.error('Errore verifica approvazione guest:', error);
      navigate('/guest-dashboard');
    }
  };

  const loadDashboardData = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Caricamento dashboard per utente:', userId);
      console.log('🔑 Token presente:', !!token);
      
      const response = await axios.get(getApiUrl('/dashboard'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        console.log('✅ Dashboard data loaded:', response.data.data);
        console.log('📋 Available tasks:', response.data.data.availableTasks?.length || 0);
        console.log('✅ Completed tasks:', response.data.data.completedTasks?.length || 0);
        console.log('📊 Progress:', response.data.data.progress);
        
        setDashboardData(response.data.data);
        // Aggiorna anche l'utente con i dati più recenti
        setUser(response.data.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      } else {
        console.error('❌ Dashboard response non success:', response.data);
      }
    } catch (error) {
      console.error('❌ Errore caricamento dashboard:', error);
      console.error('❌ Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleStartTask = (task) => {
    setSelectedTask(task);
    setShowTaskExecutor(true);
  };

  const handleTaskComplete = async (completionData) => {
    try {
      // Aggiorna il progresso nel backend
      const token = localStorage.getItem('token');
      const response = await axios.post(getApiUrl(`/tasks/${completionData.task.id}/complete`), {
        completed: true,
        rewards: completionData.rewards
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Controlla se c'è un badge speciale
      if (response.data.success && response.data.data.specialBadge) {
        setSpecialBadge(response.data.data.specialBadge);
        setShowBadgeModal(true);
      }

      // Ricarica i dati dashboard
      await loadDashboardData(user.id);

      // Mostra messaggio di successo
      setCompletionMessage({
        type: 'success',
        title: response.data.data.isAllTasksCompleted ? '🏆 Congratulazioni!' : '🎉 Task Completato!',
        message: response.data.data.message,
        rewards: response.data.data.rewards
      });

      // Nascondi il task executor
      setShowTaskExecutor(false);
      setSelectedTask(null);

      // Nascondi il messaggio dopo 5 secondi
      setTimeout(() => {
        setCompletionMessage(null);
      }, 5000);

    } catch (error) {
      console.error('Errore aggiornamento dashboard:', error);
    }
  };

  const handleCloseTaskExecutor = () => {
    setShowTaskExecutor(false);
    setSelectedTask(null);
  };

  const handleKYCComplete = (kycData) => {
    // Aggiorna lo stato utente con i dati KYC
    const updatedUser = {
      ...user,
      kycStatus: 'completed',
      kycData: kycData
    };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Mostra messaggio di successo
    setKycMessage({
      type: 'success',
      title: '✅ KYC Completato!',
      message: 'La tua verifica identità è stata completata con successo.',
      details: 'Ora puoi accedere a tutte le funzionalità MLM avanzate.'
    });
    
    // Nascondi il form KYC
    setShowKYC(false);
    
    // Nascondi il messaggio dopo 5 secondi
    setTimeout(() => {
      setKycMessage(null);
    }, 5000);
  };

  // Funzione per ottenere il ruolo specifico basato sui pacchetti acquistati
  const getSpecificRole = (user) => {
    if (user.role === 'admin') return '👑 Admin';
    
    if (!user.purchasedPackages || user.purchasedPackages.length === 0) {
      return '🌟 Ambasciatore Base';
    }

    // Mappa dei pacchetti ai ruoli specifici
    const packageRoles = {
      1: '🌍 WTW Ambassador',
      2: '🏢 MLM Ambassador', 
      3: '🎮 Pentagame Ambassador'
    };

    // Trova il pacchetto più alto (ID più alto = pacchetto più avanzato)
    const highestPackage = user.purchasedPackages.reduce((highest, current) => {
      return current.packageId > highest.packageId ? current : highest;
    });

    return packageRoles[highestPackage.packageId] || '🌟 Ambasciatore';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl animate-pulse">Caricamento Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50 flex flex-col">
      <Header user={user} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Message */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-neutral-800 mb-2">
            Benvenuto, {user?.firstName || 'Utente'}! 👋
          </h1>
          <p className="text-neutral-600 text-lg">
            Completa i task per sbloccare nuove funzionalità e guadagnare ricompense.
          </p>
        </div>

        {/* Profile Banner - SUPER ACCATTIVANTE PREMIUM */}
        {dashboardData && (
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="bg-gradient-to-r from-purple-700 via-blue-600 to-cyan-400 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border-4 border-white/20 backdrop-blur-xl relative overflow-hidden">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-500/20 to-cyan-400/20 animate-pulse"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16 animate-bounce"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12 animate-pulse"></div>
              <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-yellow-400 bg-opacity-20 rounded-full -translate-x-8 -translate-y-8 animate-spin"></div>
              
              {/* Avatar & Badge */}
              <div className="flex flex-col items-center md:flex-row md:items-center gap-6 relative z-10">
                <div className="relative group">
                  <div className="w-24 h-24 bg-white bg-opacity-40 rounded-full flex items-center justify-center border-4 border-white/40 shadow-lg transform group-hover:scale-110 transition-all duration-300 animate-pulse">
                    <span className="text-5xl">👤</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse">
                    <span className="text-lg">✓</span>
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-extrabold text-white drop-shadow-lg animate-pulse">{dashboardData.user.firstName} {dashboardData.user.lastName}</h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                    <span className="bg-white/30 px-4 py-1 rounded-full text-base font-semibold text-white flex items-center gap-1 shadow transform hover:scale-105 transition-all duration-200">
                      {getSpecificRole(dashboardData.user)}
                    </span>
                    <span className="bg-yellow-400/30 px-4 py-1 rounded-full text-base font-semibold text-yellow-100 flex items-center gap-1 shadow transform hover:scale-105 transition-all duration-200">
                      🏅 Livello {dashboardData.user.level || 1}
                    </span>
                  </div>
                </div>
              </div>
              {/* Stats Cards */}
              <div className="flex flex-col md:flex-row gap-4 items-center relative z-10">
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm border border-white/30 shadow-md min-w-[120px] transform hover:scale-105 transition-all duration-200 group">
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-white group-hover:text-yellow-300 transition-colors duration-200">€{Math.round(dashboardData.user.totalCommissions || 0)}</div>
                    <div className="text-xs text-blue-100">Commissioni</div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm border border-white/30 shadow-md min-w-[120px] transform hover:scale-105 transition-all duration-200 group">
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-white group-hover:text-blue-300 transition-colors duration-200">{dashboardData.user.points}</div>
                    <div className="text-xs text-blue-100">Punti</div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
                <div className="bg-white/20 rounded-xl p-6 backdrop-blur-sm border border-white/30 shadow-md min-w-[120px] transform hover:scale-105 transition-all duration-200 group">
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-white group-hover:text-green-300 transition-colors duration-200">{(dashboardData.user.commissionRate * 100).toFixed(0)}%</div>
                    <div className="text-xs text-blue-100">Commission Rate</div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-teal-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full mt-6 relative z-10">
                <div className="flex justify-between text-sm text-white mb-1">
                  <span className="font-semibold">Esperienza</span>
                  <span className="font-semibold">{dashboardData.user.experience} / {dashboardData.user.experienceToNextLevel}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 relative overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500 animate-pulse relative"
                    style={{ width: `${Math.min((dashboardData.user.experience / dashboardData.user.experienceToNextLevel) * 100, 100)}%` }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>
              {/* Badge animato se presente */}
              {specialBadge && (
                <div className="absolute top-4 right-4 animate-bounce text-4xl drop-shadow-xl z-20">{specialBadge.icon}</div>
              )}
            </div>
          </div>
        )}



        {/* Completion Message */}
        {completionMessage && (
          <div className={`mb-6 p-4 rounded-lg border ${
            completionMessage.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">
                  {completionMessage.type === 'success' ? '🎉' : '⚠️'}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{completionMessage.title}</h3>
                  <p className="text-sm">{completionMessage.message}</p>
                  {completionMessage.rewards && (
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="text-sm font-medium">Ricompense:</span>
                      <span className="badge badge-primary">🎯 +{completionMessage.rewards.points} punti</span>
                      <span className="badge badge-success">💎 +{completionMessage.rewards.tokens} token</span>
                      <span className="badge badge-warning">⭐ +{completionMessage.rewards.experience} exp</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setCompletionMessage(null)}
                className="text-neutral-500 hover:text-neutral-700 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>
        )}



        {/* MLM Dashboard Section */}
        {dashboardData && (
          <div className="card mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🚀</div>
                <h2 className="text-3xl font-bold mb-2">MY.PENTASHOP.WORLD</h2>
                <p className="text-blue-100 text-lg">La tua piattaforma MLM e-commerce</p>
              </div>
              
              {/* MLM Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {/* Commissioni */}
                <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">💰</span>
                    <h4 className="text-lg font-semibold">Commissioni</h4>
                  </div>
                  <p className="text-blue-100 mb-4 text-sm">
                    Traccia i tuoi guadagni e commissioni
                  </p>
                  <div className="text-2xl font-bold mb-2">€{Math.round(dashboardData.user.totalCommissions || 0)}</div>
                  <button
                    onClick={() => navigate('/commissions')}
                    className="w-full bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    📊 Vai alle Commissioni
                  </button>
                </div>

                {/* Rete MLM & Referral Unificati */}
                <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">👥</span>
                    <h4 className="text-lg font-semibold">Gestione Referral</h4>
                  </div>
                  <p className="text-blue-100 mb-4 text-sm">
                    Gestisci i tuoi referral e inviti
                  </p>
                  <div className="text-2xl font-bold mb-2">👥</div>
                  <button
                    onClick={() => navigate('/network-referral')}
                    className="w-full bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    👥 Vai ai Referral
                  </button>
                </div>

                {/* KYC */}
                <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">🆔</span>
                    <h4 className="text-lg font-semibold">KYC</h4>
                  </div>
                  <p className="text-blue-100 mb-4 text-sm">
                    Verifica la tua identità
                  </p>
                  <div className="text-2xl font-bold mb-2">🔐</div>
                  <button
                    onClick={() => navigate('/kyc')}
                    className="w-full bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    🆔 Vai al KYC
                  </button>
                </div>

                {/* Comunicazioni */}
                <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">📞</span>
                    <h4 className="text-lg font-semibold">Comunicazioni</h4>
                  </div>
                  <p className="text-blue-100 mb-4 text-sm">
                    Messaggi e notifiche
                  </p>
                  <div className="text-2xl font-bold mb-2">💬</div>
                  <button
                    onClick={() => navigate('/communications')}
                    className="w-full bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    📞 Vai alle Comunicazioni
                  </button>
                </div>

                {/* Pacchetti Disponibili */}
                <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">📦</span>
                    <h4 className="text-lg font-semibold">Pacchetti Disponibili</h4>
                  </div>
                  <p className="text-blue-100 mb-4 text-sm">
                    Visualizza e acquista pacchetti
                  </p>
                  <div className="text-2xl font-bold mb-2">💰</div>
                  <button
                    onClick={() => navigate('/plans')}
                    className="w-full bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    📦 Vai ai Pacchetti
                  </button>
                </div>

                {/* Profilo Utente */}
                <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">👤</span>
                    <h4 className="text-lg font-semibold">Profilo Utente</h4>
                  </div>
                  <p className="text-blue-100 mb-4 text-sm">
                    Gestisci il tuo profilo e impostazioni
                  </p>
                  <div className="text-2xl font-bold mb-2">⚙️</div>
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    👤 Vai al Profilo
                  </button>
                </div>



                {/* Presentazione MY.PENTASHOP.WORLD */}
                <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">🎬</span>
                    <h4 className="text-lg font-semibold">Presentazione</h4>
                  </div>
                  <p className="text-blue-100 mb-4 text-sm">
                    Guarda la presentazione ufficiale di MY.PENTASHOP.WORLD
                  </p>
                  <div className="text-2xl font-bold mb-2">🌍</div>
                  <button
                    onClick={() => window.open('https://washtheworld.org/zoom', '_blank')}
                    className="w-full bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    🎬 Vai alla Presentazione
                  </button>
                </div>
                {/* Task e Formazione - Nuovo Blocco Semplice */}
                <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200 flex flex-col items-center justify-center">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">📚</span>
                    <h4 className="text-lg font-semibold">Task e Formazione</h4>
                  </div>
                  <p className="text-blue-100 mb-4 text-sm text-center">
                    Completa i task per diventare ambasciatore e sbloccare ricompense!
                  </p>
                  <div className="text-2xl font-bold mb-2">✅ {dashboardData.progress.completedTasks}/{dashboardData.progress.totalTasks}</div>
                  <button
                    onClick={() => navigate('/tasks')}
                    className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    📚 Vai ai Task
                  </button>
                </div>
              </div>


            </div>
          </div>
        )}



        {/* Task Executor Modal */}
        {showTaskExecutor && selectedTask && (
          <TaskExecutor
            task={selectedTask}
            onComplete={handleTaskComplete}
            onClose={handleCloseTaskExecutor}
          />
        )}

        {/* KYC Modal */}
        {showKYC && (
          <KYCForm
            onComplete={handleKYCComplete}
            onClose={() => setShowKYC(false)}
          />
        )}

        {/* Special Badge Modal */}
        {showBadgeModal && specialBadge && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-bounce-in">
              <div className="text-6xl mb-4">{specialBadge.icon}</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{specialBadge.title}</h3>
              <p className="text-gray-600 mb-6">{specialBadge.description}</p>
              
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 mb-6">
                <div className="text-white font-bold text-lg">🎉 Congratulazioni!</div>
                <div className="text-white text-sm">Sei ora un Ambasciatore ufficiale di MY.PENTASHOP.WORLD</div>
              </div>
              
              <button
                onClick={() => {
                  setShowBadgeModal(false);
                  setSpecialBadge(null);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200"
              >
                🎊 Grazie!
              </button>
            </div>
          </div>
        )}
        
        {/* 🔄 WebSocket Status */}
        <WebSocketStatus isConnected={isConnected} notifications={notifications} />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Dashboard; 