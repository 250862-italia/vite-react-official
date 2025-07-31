import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../config/api';

const Header = ({ user, onLogout }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
  };

  const getUserDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || 'Utente';
  };

  const getRoleDisplayName = () => {
    if (user.role === 'admin') return 'Amministratore';
    
    if (!user.purchasedPackages || user.purchasedPackages.length === 0) {
      return 'Ambasciatore Base';
    }

    // Mappa dei pacchetti ai ruoli specifici
    const packageRoles = {
      1: 'WTW Ambassador',
      2: 'MLM Ambassador', 
      3: 'Pentagame Ambassador'
    };

    // Trova il pacchetto più alto (ID più alto = pacchetto più avanzato)
    const highestPackage = user.purchasedPackages.reduce((highest, current) => {
      return current.packageId > highest.packageId ? current : highest;
    });

    return packageRoles[highestPackage.packageId] || 'Ambasciatore';
  };

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const loadNotifications = async () => {
    try {
      const response = await axios.get(getApiUrl('/notifications'), { headers: getHeaders() });
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      loadNotifications();
    }
  }, [user]);

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-neutral-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-glow">
              <span className="text-white font-bold text-2xl">🛍️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">
                MY.PENTASHOP.WORLD
              </h1>
              <p className="text-xs text-neutral-500">
                Piattaforma Gamificata
              </p>
            </div>
          </div>

          {/* User Info and Actions */}
          {user && (
            <div className="flex items-center space-x-4">
              {/* Logout Button - Always Visible */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm z-50"
              >
                <span>🚪</span>
                <span className="hidden md:block">Logout</span>
              </button>
              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors duration-200"
                >
                  <span className="text-xl">🔔</span>
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 animate-fade-in z-50">
                    <div className="px-4 py-2 border-b border-neutral-200">
                      <h3 className="font-semibold text-neutral-800">Notifiche</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div key={notification.id} className="px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0">
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                notification.priority === 'high' ? 'bg-red-500' : 
                                notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                              }`}></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-neutral-800">{notification.title}</p>
                                <p className="text-xs text-neutral-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-neutral-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleString('it-IT')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-neutral-500">
                          <p>Nessuna notifica</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 rounded-full">
                  <span className="text-blue-600 text-sm">🎯</span>
                  <span className="text-sm font-medium text-blue-700">{user.points || 0}</span>
                </div>
                <div className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 rounded-full">
                  <span className="text-green-600 text-sm">💎</span>
                  <span className="text-sm font-medium text-green-700">{user.tokens || 0}</span>
                </div>
                <div className="flex items-center space-x-1 px-3 py-1.5 bg-purple-50 rounded-full">
                  <span className="text-purple-600 text-sm">⭐</span>
                  <span className="text-sm font-medium text-purple-700">{user.level || 1}</span>
                </div>
              </div>


            </div>
          )}
        </div>
      </div>

      {/* Mobile Stats Bar */}
      {user && (
        <div className="md:hidden bg-neutral-50 border-t border-neutral-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className="text-blue-600 text-sm">🎯</span>
              <span className="text-sm font-medium text-neutral-700">{user.points || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-green-600 text-sm">💎</span>
              <span className="text-sm font-medium text-neutral-700">{user.tokens || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-purple-600 text-sm">⭐</span>
              <span className="text-sm font-medium text-neutral-700">{user.level || 1}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-orange-600 text-sm">🏆</span>
              <span className="text-sm font-medium text-neutral-700">
                {getRoleDisplayName()}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-2 py-1 bg-red-500 text-white rounded text-xs font-medium"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 