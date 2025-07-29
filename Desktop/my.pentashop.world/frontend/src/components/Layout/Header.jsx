import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowUserMenu(false);
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
    if (user.role === 'entry_ambassador') return 'Ambassador';
    if (user.role === 'senior_ambassador') return 'Senior Ambassador';
    if (user.role === 'executive_ambassador') return 'Executive Ambassador';
    return user.role?.replace('_', ' ') || 'Utente';
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-neutral-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-glow">
              <span className="text-white font-bold text-2xl">🌊</span>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">
                Wash The World
              </h1>
              <p className="text-xs text-neutral-500">
                Piattaforma Gamificata
              </p>
            </div>
          </div>

          {/* User Info and Actions */}
          {user && (
            <div className="flex items-center space-x-4">
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

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-100 transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.firstName ? user.firstName.charAt(0).toUpperCase() : '👤'}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-neutral-800">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {getRoleDisplayName()}
                    </p>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 animate-fade-in">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-neutral-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.firstName ? user.firstName.charAt(0).toUpperCase() : '👤'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-neutral-800">
                            {getUserDisplayName()}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {getRoleDisplayName()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="px-4 py-3 border-b border-neutral-200">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-neutral-500">Punti</p>
                          <p className="text-lg font-bold text-blue-600">{user.points || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Token</p>
                          <p className="text-lg font-bold text-green-600">{user.tokens || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Livello</p>
                          <p className="text-lg font-bold text-purple-600">{user.level || 1}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/dashboard');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
                      >
                        <span>📊</span>
                        <span>Dashboard</span>
                      </button>
                      
                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/admin');
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
                        >
                          <span>⚙️</span>
                          <span>Admin Panel</span>
                        </button>
                      )}
                      
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate('/mlm');
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
                        >
                          <span>🏢</span>
                          <span>MLM Dashboard</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          // Navigate to profile or settings
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
                      >
                        <span>👤</span>
                        <span>Profilo</span>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-neutral-200 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
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
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 