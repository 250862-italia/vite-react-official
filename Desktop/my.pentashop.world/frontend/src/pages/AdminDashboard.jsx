import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { useWebSocket } from '../hooks/useWebSocket';
import Header from '../components/Layout/Header';
import UserManager from '../components/Admin/UserManager';
import WebSocketStatus from '../components/Layout/WebSocketStatus';
import Footer from '../components/Layout/Footer';
import TaskManager from '../components/Admin/TaskManager';
import SalesManager from '../components/Admin/SalesManager';
import CommissionManager from '../components/Admin/CommissionManager';
import CommissionPlansManager from '../components/Admin/CommissionPlansManager';
import CommunicationManager from '../components/Admin/CommunicationManager';
import PackageAuthorizationManager from '../components/Admin/PackageAuthorizationManager';
import CommissionPaymentAuthorizationManager from '../components/Admin/CommissionPaymentAuthorizationManager';
import UserPaymentAuthorizationManager from '../components/Admin/UserPaymentAuthorizationManager';
import NetworkTreeViewer from '../components/Admin/NetworkTreeViewer';

// Funzione per formattare numeri con una sola cifra decimale
const formatNumber = (number) => {
  if (typeof number !== 'number') return '0.0';
  return Number(number).toFixed(1);
};

// Funzione per formattare valute
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return '€0.0';
  return `€${Number(amount).toFixed(1)}`;
};

// Funzione per formattare percentuali
const formatPercentage = (value) => {
  if (typeof value !== 'number') return '0.0%';
  return `${Number(value).toFixed(1)}%`;
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    activeAmbassadors: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    totalSales: 0,
    monthlySales: 0,
    coordinationRate: 0,
    salesWithCommissions: 0,
    totalCommissionsCount: 0,
    recentActivity: []
  });
  const [notifications, setNotifications] = useState([]);
  const [activeSalesTab, setActiveSalesTab] = useState('sales');
  
  // 🔄 WebSocket per notifiche in tempo reale
  const token = localStorage.getItem('token');
  const { isConnected: wsConnected, notifications: wsNotifications } = useWebSocket(token);

  const tabs = [
    { id: 'overview', label: '📊 Panoramica', icon: '📊' },
    { id: 'users', label: '👥 Gestione Utenti', icon: '👥' },
    { id: 'tasks', label: '📋 Gestione Task', icon: '📋' },
    { id: 'sales', label: '🛍️ Vendite & Commissioni', icon: '🛍️' },
    { id: 'commission-plans', label: '💰 Piani Commissioni', icon: '💰' },
    { id: 'communications', label: '💬 Comunicazioni', icon: '💬' },
    { id: 'package-authorization', label: '📦 Autorizzazione Pacchetti', icon: '📦' },
    { id: 'commission-payment-authorization', label: '💰 Autorizzazione Pagamenti', icon: '💰' },
    { id: 'user-payment-authorization', label: '👥 Autorizzazione per Utente', icon: '👥' },
    { id: 'analytics', label: '📈 Analytics', icon: '📈' },
    { id: 'network-tree', label: '🌳 Albero Rete', icon: '🌳' }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await axios.get(getApiUrl('/auth/me'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          // L'API restituisce 'user' invece di 'data'
          const userData = response.data.user || response.data.data;
          if (userData && userData.role !== 'admin') {
            navigate('/dashboard');
            return;
          }
          setUser(userData);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Errore nel caricamento dati utente:', error);
        // Se c'è un errore, prova a verificare se il token è valido
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
        } else {
          // Token presente ma errore, potrebbe essere scaduto
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    loadAdminStats();
    loadNotifications();
  }, [navigate]);

  const loadAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/admin/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setAdminStats(response.data.data);
      }
    } catch (error) {
      console.error('Errore nel caricamento statistiche admin:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/notifications'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Errore nel caricamento notifiche:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'users':
        setActiveTab('users');
        break;
      case 'tasks':
        setActiveTab('tasks');
        // Scroll to task section
        setTimeout(() => {
          const taskSection = document.querySelector('[data-tab="tasks"]');
          if (taskSection) {
            taskSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        break;
      case 'sales':
        setActiveTab('sales');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header user={user} onLogout={handleLogout} />
      
      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">🛠️ Admin Panel</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
          
          <nav className="p-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 mb-2 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <span className="mr-3 text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-white shadow-sm">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              ☰
            </button>
            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="w-8"></div>
          </div>

          <div className="p-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {tabs.find(tab => tab.id === activeTab)?.label}
                  </h1>
                  <p className="text-gray-600">
                    Gestione completa della piattaforma MY.PENTASHOP.WORLD
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-3">
                  {/* Logout Button */}
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm"
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                  
                  {/* Refresh Stats */}
                  <button 
                    onClick={loadAdminStats}
                    className="p-3 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow"
                    title="Aggiorna statistiche"
                  >
                    🔄
                  </button>
                  
                  {/* Notifications */}
                  <div className="relative">
                    <button className="p-3 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow">
                      🔔
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {notifications.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards - Only show in overview */}
            {activeTab === 'overview' && (
              <div>
                {/* Statistiche Principali */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100">
                          <span className="text-2xl">👥</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Utenti Totali</p>
                          <p className="text-2xl font-bold text-gray-900">{adminStats.totalUsers}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Ambassador Attivi</p>
                        <p className="text-lg font-semibold text-blue-600">{adminStats.activeAmbassadors}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100">
                          <span className="text-2xl">📋</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Task Totali</p>
                          <p className="text-2xl font-bold text-gray-900">{adminStats.totalTasks}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Completati</p>
                        <p className="text-lg font-semibold text-green-600">{formatNumber(adminStats.totalTasks * 0.7)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100">
                          <span className="text-2xl">🔐</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">KYC in Attesa</p>
                          <p className="text-2xl font-bold text-gray-900">{adminStats.pendingKYC}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Da Verificare</p>
                        <p className="text-lg font-semibold text-yellow-600">{adminStats.pendingKYC}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100">
                          <span className="text-2xl">💰</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Commissioni Totali</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(adminStats.totalCommissions)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">In Attesa</p>
                        <p className="text-lg font-semibold text-purple-600">{formatCurrency(adminStats.pendingCommissions)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistiche Finanziarie */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-emerald-100">
                          <span className="text-2xl">🛍️</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Vendite Totali</p>
                          <p className="text-2xl font-bold text-gray-900">{adminStats.totalSales}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Vendite Mensili:</span>
                        <span className="font-semibold">{formatCurrency(adminStats.monthlySales)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Con Commissioni:</span>
                        <span className="font-semibold text-emerald-600">{adminStats.salesWithCommissions}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-indigo-100">
                          <span className="text-2xl">📊</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Coordinazione</p>
                          <p className="text-2xl font-bold text-gray-900">{formatPercentage(adminStats.coordinationRate)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Commissioni Totali:</span>
                        <span className="font-semibold">{adminStats.totalCommissionsCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Efficienza:</span>
                        <span className="font-semibold text-indigo-600">{formatPercentage(adminStats.coordinationRate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-3 rounded-full bg-orange-100">
                          <span className="text-2xl">⚡</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Performance</p>
                          <p className="text-2xl font-bold text-gray-900">{formatNumber(adminStats.activeAmbassadors)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ambassador Attivi:</span>
                        <span className="font-semibold">{adminStats.activeAmbassadors}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tasso Attivazione:</span>
                        <span className="font-semibold text-orange-600">{formatPercentage((adminStats.activeAmbassadors / adminStats.totalUsers) * 100)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attività Recente e Azioni Rapide */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">📈 Attività Recente</h3>
                      <span className="text-sm text-gray-500">{adminStats.recentActivity?.length || 0} attività</span>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {adminStats.recentActivity && adminStats.recentActivity.length > 0 ? (
                        adminStats.recentActivity.map((activity, index) => (
                          <div key={`${activity.id}-${index}`} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex-shrink-0">
                              <span className="text-lg">{activity.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                              <p className="text-xs text-gray-600">{activity.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">📊</div>
                          <p className="text-gray-500">Nessuna attività recente</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">⚡ Azioni Rapide</h3>
                      <span className="text-sm text-gray-500">Gestione</span>
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => handleQuickAction('commissions')}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-3">💰</span>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Gestione Commissioni</p>
                            <p className="text-sm text-gray-600">{formatCurrency(adminStats.pendingCommissions)} da approvare</p>
                          </div>
                        </div>
                        <span className="text-purple-600">→</span>
                      </button>

                      <button
                        onClick={() => handleQuickAction('users')}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-3">👥</span>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Gestione Utenti</p>
                            <p className="text-sm text-gray-600">{adminStats.totalUsers} utenti totali</p>
                          </div>
                        </div>
                        <span className="text-blue-600">→</span>
                      </button>

                      <button
                        onClick={() => handleQuickAction('tasks')}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-3">📋</span>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Task e Formazione</p>
                            <p className="text-sm text-gray-600">{adminStats.totalTasks} task disponibili</p>
                          </div>
                        </div>
                        <span className="text-green-600">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'users' && (
                <div className="bg-white rounded-2xl shadow-sm border">
                  <UserManager />
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="bg-white rounded-2xl shadow-sm border" data-tab="tasks">
                  <TaskManager />
                </div>
              )}

              {activeTab === 'sales' && (
                <div className="bg-white rounded-2xl shadow-sm border">
                  <div className="p-6">
                    <div className="border-b border-gray-200 mb-6">
                      <nav className="flex space-x-8">
                        <button 
                          onClick={() => setActiveSalesTab('sales')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeSalesTab === 'sales' 
                              ? 'border-blue-500 text-blue-600' 
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          🛍️ Gestione Vendite
                        </button>
                        <button 
                          onClick={() => setActiveSalesTab('commissions')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeSalesTab === 'commissions' 
                              ? 'border-blue-500 text-blue-600' 
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          💰 Commissioni Generate
                        </button>
                      </nav>
                    </div>
                    
                    {/* Contenuto delle tab */}
                    {activeSalesTab === 'sales' && (
                      <div>
                        <SalesManager />
                      </div>
                    )}
                    
                    {activeSalesTab === 'commissions' && (
                      <div>
                        <CommissionManager />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'communications' && (
                <div className="bg-white rounded-2xl shadow-sm border">
                  <CommunicationManager />
                </div>
              )}

              {activeTab === 'package-authorization' && (
                <div className="bg-white rounded-2xl shadow-sm border">
                  <PackageAuthorizationManager />
                </div>
              )}

              {activeTab === 'commission-payment-authorization' && (
                <div className="bg-white rounded-2xl shadow-sm border">
                  <CommissionPaymentAuthorizationManager />
                </div>
              )}

              {activeTab === 'user-payment-authorization' && (
                <div className="bg-white rounded-2xl shadow-sm border">
                  <UserPaymentAuthorizationManager />
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Analytics Avanzate</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
                      <h4 className="font-semibold text-blue-800 mb-2">Crescita Utenti</h4>
                      <p className="text-2xl font-bold text-blue-600">+12%</p>
                      <p className="text-sm text-blue-600">Questo mese</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
                      <h4 className="font-semibold text-green-800 mb-2">Task Completati</h4>
                      <p className="text-2xl font-bold text-green-600">89%</p>
                      <p className="text-sm text-green-600">Tasso di successo</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'network-tree' && <NetworkTreeViewer />}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* 🔄 WebSocket Status */}
      <WebSocketStatus isConnected={wsConnected} notifications={wsNotifications} />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default AdminDashboard; 