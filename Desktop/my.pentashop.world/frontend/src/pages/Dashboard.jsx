import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Layout/Header';
import StatsCards from '../components/Dashboard/StatsCards';
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
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (!token || !savedUser) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(savedUser);
    setUser(userData);
    loadDashboardData(userData.id);
  }, [navigate]);

  const loadDashboardData = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/onboarding/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setDashboardData(response.data.data);
        // Aggiorna anche l'utente con i dati più recenti
        setUser(response.data.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
    } catch (error) {
      console.error('Errore caricamento dashboard:', error);
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
      await axios.post(`/api/onboarding/complete-task`, {
        taskId: completionData.task.id,
        completed: true,
        rewards: completionData.rewards
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Ricarica i dati dashboard
      await loadDashboardData(user.id);

      // Mostra messaggio di successo
      setCompletionMessage({
        type: 'success',
        title: '🎉 Task Completato!',
        message: completionData.message,
        rewards: completionData.rewards
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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50">
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

        {/* KYC Message */}
        {user?.kycStatus !== 'approved' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-yellow-600 text-xl mr-2">⚠️</span>
              <div>
                <h3 className="text-yellow-800 font-medium">Verifica KYC Richiesta</h3>
                <p className="text-yellow-700 text-sm">
                  Completa la verifica della tua identità per accedere a tutte le funzionalità.
                </p>
                <button
                  onClick={() => setShowKYC(true)}
                  className="btn btn-warning btn-sm mt-2"
                >
                  Completa KYC
                </button>
              </div>
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

        {/* Stats Cards */}
        {dashboardData && (
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <StatsCards 
              user={dashboardData.user} 
              progress={dashboardData.progress} 
            />
          </div>
        )}

        {/* Progress Section with Enhanced Design */}
        {dashboardData && (
          <div className="card mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text">
                📊 Progresso Onboarding
              </h2>
              <div className="text-sm text-neutral-500">
                {dashboardData.progress.completedTasks} di {dashboardData.progress.totalTasks} completati
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-neutral-600">Progresso</span>
                <span className="text-sm font-bold text-neutral-700">{dashboardData.progress.percentage}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${dashboardData.progress.percentage}%`,
                    animation: 'progressFill 1s ease-out'
                  }}
                ></div>
              </div>
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-lg font-bold text-blue-600">{dashboardData.progress.completedTasks}</div>
                <div className="text-sm text-neutral-600">Completati</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl mb-2">⏳</div>
                <div className="text-lg font-bold text-green-600">{dashboardData.progress.totalTasks - dashboardData.progress.completedTasks}</div>
                <div className="text-sm text-neutral-600">Rimanenti</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-2xl mb-2">🏆</div>
                <div className="text-lg font-bold text-purple-600">{Math.round((dashboardData.progress.completedTasks / dashboardData.progress.totalTasks) * 100)}%</div>
                <div className="text-sm text-neutral-600">Completamento</div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Section with Enhanced Cards */}
        {dashboardData && (
          <div className="card animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold gradient-text">
                📋 Task Disponibili
              </h2>
              <div className="text-sm text-neutral-500">
                {dashboardData.availableTasks.length} task disponibili
              </div>
            </div>

            {dashboardData.availableTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-neutral-800 mb-2">
                  Tutti i task completati!
                </h3>
                <p className="text-neutral-600">
                  Hai completato tutti i task disponibili. Controlla più tardi per nuovi contenuti.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData.availableTasks.map((task, index) => {
                  const isCompleted = dashboardData.completedTasks.some(completedTask => completedTask.id === task.id);
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isCompleted={isCompleted}
                      onStartTask={handleStartTask}
                      style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                    />
                  );
                })}
              </div>
            )}
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
      </main>
    </div>
  );
}

export default Dashboard; 