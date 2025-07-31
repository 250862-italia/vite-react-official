import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';

function NetworkMLMPage() {
  const [user, setUser] = useState(null);
  const [networkData, setNetworkData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
    loadNetworkData();
  }, []);

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

  const loadNetworkData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(getApiUrl('/mlm/network'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setNetworkData([response.data]); // Wrappa in array per compatibilità
      } else {
        setNetworkData([]);
      }
    } catch (error) {
      console.error('Errore nel caricamento rete:', error);
      setError('Errore nel caricamento della rete MLM');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento rete MLM...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Errore</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBackToDashboard}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
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
                <h1 className="text-2xl font-bold text-gray-900">🌐 Rete MLM</h1>
                <p className="text-sm text-gray-600">Visualizza e gestisci la tua rete MLM</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Membri Totali</p>
                <p className="text-2xl font-bold text-gray-900">{networkData.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Figli Diretti</p>
                <p className="text-2xl font-bold text-gray-900">{networkData[0]?.children?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Commissioni Rete</p>
                <p className="text-2xl font-bold text-gray-900">€{networkData[0]?.totalCommissions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Livello Attuale</p>
                <p className="text-2xl font-bold text-gray-900">{networkData[0]?.level || 1}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Network Tree */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">La Tua Rete MLM</h2>
            <p className="text-sm text-gray-600">Visualizza i membri della tua rete personale</p>
          </div>
          
          <div className="p-6">
            {networkData.length > 0 && networkData[0] ? (
              <div className="space-y-6">
                {/* Tu (Ambassador) */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white bg-opacity-25 rounded-lg">
                        <span className="text-2xl">👑</span>
                      </div>
                      <div>
                        <p className="font-bold text-lg">{networkData[0].firstName} {networkData[0].lastName}</p>
                        <p className="text-blue-100">Tu (Ambassador) • Livello {networkData[0].level || 1}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">€{networkData[0].totalCommissions || 0}</p>
                      <p className="text-blue-100">Commissioni Totali</p>
                    </div>
                  </div>
                </div>

                {/* I tuoi figli diretti */}
                {networkData[0].children && networkData[0].children.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">I tuoi figli diretti ({networkData[0].children.length})</h3>
                    <div className="space-y-3">
                      {networkData[0].children.map((child, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <span className="text-lg">👤</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{child.firstName} {child.lastName}</p>
                              <p className="text-sm text-gray-500">Livello {child.level || 1} • {child.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">€{child.totalCommissions || 0}</p>
                            <p className="text-xs text-gray-500">Commissioni</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-4">🌱</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun figlio diretto</h3>
                    <p className="text-gray-500">Inizia a reclutare per costruire la tua rete MLM</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌐</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun membro nella rete</h3>
                <p className="text-gray-500">La tua rete MLM apparirà qui quando inizierai a reclutare</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Analisi Rete</h3>
              <p className="text-green-100 mb-4">Visualizza statistiche dettagliate della tua rete</p>
              <button className="bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200">
                📊 Vedi Analisi
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Gestione Rete</h3>
              <p className="text-purple-100 mb-4">Gestisci e organizza i membri della tua rete</p>
              <button className="bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200">
                🎯 Gestisci Rete
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default NetworkMLMPage; 