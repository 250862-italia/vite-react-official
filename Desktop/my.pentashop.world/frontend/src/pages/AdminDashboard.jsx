import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Layout/Header';
import TaskManager from '../components/Admin/TaskManager';
import UserManager from '../components/Admin/UserManager';
import CommissionPlansManager from '../components/Admin/CommissionPlansManager';
import CommissionManager from '../components/Admin/CommissionManager';
import KYCManager from '../components/Admin/KYCManager';
import SalesManager from '../components/Admin/SalesManager';

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    activeAmbassadors: 0,
    totalCommissions: 0,
    pendingKYC: 0,
    recentActivity: []
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (!token || !savedUser) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(savedUser);
    
    if (userData.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    setUser(userData);
    setLoading(false);
    loadAdminStats();
    loadNotifications();
  }, [navigate]);

  const loadAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.log('❌ Errore caricamento stats:', error.message);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/admin/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.log('❌ Errore caricamento notifiche:', error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Caricamento Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '📊 Panoramica', icon: '📊' },
    { id: 'users', label: '👥 Utenti', icon: '👥' },
    { id: 'tasks', label: '📋 Task', icon: '📋' },
    { id: 'commission-plans', label: '💰 Piani Commissioni', icon: '💰' },
    { id: 'commissions', label: '💸 Commissioni Generate', icon: '💸' },
    { id: 'sales', label: '🛍️ Vendite', icon: '🛍️' },
    { id: 'kyc', label: '🔐 KYC', icon: '🔐' },
    { id: 'analytics', label: '📈 Analytics', icon: '📈' }
  ];

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
                    Gestione completa della piattaforma Wash The World
                  </p>
                </div>
                
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

            {/* Stats Cards - Only show in overview */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Utenti Totali</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Task Totali</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 text-white">
                      <span className="text-2xl">⭐</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ambassador Attivi</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeAmbassadors}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Commissioni Totali</p>
                      <p className="text-2xl font-bold text-gray-900">€{stats.totalCommissions}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Azioni Rapide</h3>
                    <div className="space-y-3">
                      <button className="w-full text-left p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-200 border border-blue-200">
                        ➕ Crea Nuovo Task
                      </button>
                      <button className="w-full text-left p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all duration-200 border border-green-200">
                        👥 Gestisci Utenti
                      </button>
                      <button className="w-full text-left p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all duration-200 border border-purple-200">
                        💰 Configura Commissioni
                      </button>
                      <button className="w-full text-left p-4 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl transition-all duration-200 border border-orange-200">
                        🔐 Gestisci KYC
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Attività Recente</h3>
                    <div className="space-y-3">
                      {stats.recentActivity?.length > 0 ? (
                        stats.recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <span className="mr-3">{activity.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                              <p className="text-xs text-gray-600">{activity.time}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>Nessuna attività recente</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="bg-white rounded-2xl shadow-sm border">
                  <UserManager />
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="bg-white rounded-2xl shadow-sm border">
                  <TaskManager />
                </div>
              )}

              {activeTab === 'commission-plans' && (
                <div className="bg-white rounded-2xl shadow-sm border">
                  <CommissionPlansManager />
                </div>
              )}

              {activeTab === 'commissions' && (
                <div className="bg-white rounded-2xl shadow-sm border">
                  <CommissionManager />
                </div>
              )}

              {activeTab === 'kyc' && (
                <div className="bg-white rounded-2xl shadow-sm border">
                  <KYCManager />
                </div>
              )}

              {activeTab === 'sales' && (
                <div className="bg-white rounded-2xl shadow-sm border">
                  <SalesManager />
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
    </div>
  );
}

export default AdminDashboard; 