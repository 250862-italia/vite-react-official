import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { useWebSocket } from '../hooks/useWebSocket';

function CommunicationsPage() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // WebSocket per sincronizzazione in tempo reale
  const token = localStorage.getItem('token');
  const { isConnected, notifications: wsNotifications } = useWebSocket(token);

  useEffect(() => {
    loadUserData();
    loadMessages();
    loadNotifications();
  }, []);

  // Aggiorna notifiche quando arrivano nuovi messaggi via WebSocket
  useEffect(() => {
    if (wsNotifications.length > 0) {
      // Ricarica messaggi e notifiche quando arrivano nuovi dati
      loadMessages();
      loadNotifications();
    }
  }, [wsNotifications]);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(getApiUrl('/auth/me'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Errore nel caricamento utente:', error);
      navigate('/login');
    }
  };

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(getApiUrl('/messages'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessages(response.data.data || []);
      }
    } catch (error) {
      console.error('Errore nel caricamento messaggi:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(getApiUrl('/notifications'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Errore nel caricamento notifiche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '📧';
    }
  };

  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case 'commission':
        return '💰';
      case 'referral':
        return '👥';
      case 'kyc':
        return '🆔';
      case 'task':
        return '📋';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento comunicazioni...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Errore</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBackToDashboard}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span className="text-2xl">←</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">📞 Comunicazioni</h1>
                <p className="text-sm text-gray-600">Gestisci messaggi e notifiche</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* WebSocket Status Indicator */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? '🟢 Connesso' : '🔴 Disconnesso'}
                </span>
              </div>
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📧</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Messaggi</p>
                <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">🔔</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Notifiche</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">📬</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Non Lette</p>
                <p className="text-2xl font-bold text-gray-900">{messages.filter(m => !m.read).length + notifications.filter(n => !n.read).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📞</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Supporto</p>
                <p className="text-lg font-bold text-gray-900">Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Messaggi</h2>
            <p className="text-sm text-gray-600">I tuoi messaggi personali</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <div key={index} className={`px-6 py-4 hover:bg-gray-50 transition-colors ${!message.read ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <span className="text-lg">{getMessageTypeIcon(message.type)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{message.title}</h3>
                        <span className="text-sm text-gray-500">{new Date(message.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600">{message.content}</p>
                      {!message.read && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Nuovo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="text-6xl mb-4">📧</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun messaggio</h3>
                <p className="text-gray-500">I tuoi messaggi appariranno qui</p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Notifiche</h2>
            <p className="text-sm text-gray-600">Le tue notifiche recenti</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div key={index} className={`px-6 py-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-green-50' : ''}`}>
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <span className="text-lg">{getNotificationTypeIcon(notification.type)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        <span className="text-sm text-gray-500">{new Date(notification.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      {!notification.read && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Nuovo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="text-6xl mb-4">🔔</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna notifica</h3>
                <p className="text-gray-500">Le tue notifiche appariranno qui</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-2">Nuovo Messaggio</h3>
              <p className="text-blue-100 mb-4">Invia un messaggio al supporto</p>
              <button className="bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200">
                💬 Scrivi Messaggio
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="text-center">
              <div className="text-4xl mb-4">📞</div>
              <h3 className="text-xl font-bold mb-2">Supporto Live</h3>
              <p className="text-green-100 mb-4">Contatta il supporto in tempo reale</p>
              <button className="bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200">
                📞 Chatta Ora
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CommunicationsPage; 