import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api';

const NetworkTreeViewer = () => {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadNetworkData();
  }, []);

  const loadNetworkData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/admin/network-tree'), {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Il backend restituisce direttamente l'array di utenti
      if (Array.isArray(response.data)) {
        setNetworkData(response.data);
        console.log('✅ Dati rete caricati:', response.data.length, 'utenti');
        console.log('📊 Primi 3 utenti:', response.data.slice(0, 3).map(u => ({ id: u.id, username: u.username, role: u.role })));
      } else {
        setError('Formato dati non valido');
        console.error('Errore formato dati:', response.data);
      }
    } catch (err) {
      setError('Errore nel caricamento della rete');
      console.error('Errore caricamento rete:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (userId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderUserNode = (user, level = 0) => {
    const isExpanded = expandedNodes.has(user.id);
    const hasChildren = user.children && user.children.length > 0;
    const indent = level * 24;
    const nodeLevel = getNodeLevel(networkData, user);

    return (
      <div key={user.id} className="mb-3">
        {/* Connection line */}
        {level > 0 && (
          <div 
            className="absolute w-px bg-gray-300"
            style={{ 
              left: `${indent - 12}px`, 
              top: '0px', 
              height: '20px',
              transform: 'translateY(-20px)'
            }}
          />
        )}
        
        <div 
          className={`relative flex items-center p-4 rounded-xl border-2 transition-all duration-200 ${
            selectedUser?.id === user.id 
              ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-400 shadow-lg' 
              : 'bg-white border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-md'
          }`}
          style={{ marginLeft: `${indent}px` }}
        >
          {/* Level indicator */}
          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {nodeLevel}
          </div>

          {/* Toggle button */}
          {hasChildren && (
            <button
              onClick={() => toggleNode(user.id)}
              className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                {isExpanded ? '📂' : '📁'}
              </div>
            </button>
          )}
          {!hasChildren && (
            <div className="mr-4 w-8 h-8 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            </div>
          )}

          {/* User Avatar with Role Color */}
          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${getRoleGradient(user.role)}`}>
            {user.username?.charAt(0).toUpperCase() || 'U'}
          </div>

          {/* User info */}
          <div className="flex-1 ml-4">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-bold text-gray-900 text-lg">{user.username}</h3>
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${getRoleBadgeColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
              {user.isActive === false && (
                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-medium">
                  ⚠️ Inattivo
                </span>
              )}
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="font-medium text-gray-600">💰 Commissioni</div>
                <div className="font-bold text-green-600">€{Math.round(user.totalCommissions || 0)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="font-medium text-gray-600">👥 Figli</div>
                <div className="font-bold text-blue-600">{user.children?.length || 0}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="font-medium text-gray-600">📊 Livello</div>
                <div className="font-bold text-purple-600">{user.level || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="font-medium text-gray-600">🆔 ID</div>
                <div className="font-bold text-gray-600">{user.id}</div>
              </div>
            </div>

            {/* Sponsor info */}
            {user.sponsorId && (
              <div className="mt-2 text-xs text-gray-500">
                <span className="font-medium">Sponsor:</span> {user.sponsorId}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedUser(user)}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              👁️ Dettagli
            </button>
          </div>
        </div>

        {/* Children with connection lines */}
        {isExpanded && hasChildren && (
          <div className="relative">
            {/* Vertical line connecting to children */}
            <div 
              className="absolute w-px bg-gray-300"
              style={{ 
                left: `${indent + 12}px`, 
                top: '0px', 
                height: '100%'
              }}
            />
            <div className="ml-6">
              {user.children.map((child, index) => (
                <div key={child.id} className="relative">
                  {renderUserNode(child, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'admin': 'bg-purple-100 text-purple-800',
      'entry_ambassador': 'bg-gray-100 text-gray-800',
      'wtw_ambassador': 'bg-blue-100 text-blue-800',
      'mlm_ambassador': 'bg-green-100 text-green-800',
      'pentagame_ambassador': 'bg-yellow-100 text-yellow-800',
      'silver_ambassador': 'bg-gray-100 text-gray-800',
      'gold_ambassador': 'bg-yellow-100 text-yellow-800',
      'platinum_ambassador': 'bg-purple-100 text-purple-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleGradient = (role) => {
    const gradients = {
      'admin': 'bg-gradient-to-r from-purple-500 to-purple-700',
      'entry_ambassador': 'bg-gradient-to-r from-gray-500 to-gray-700',
      'wtw_ambassador': 'bg-gradient-to-r from-blue-500 to-blue-700',
      'mlm_ambassador': 'bg-gradient-to-r from-green-500 to-green-700',
      'pentagame_ambassador': 'bg-gradient-to-r from-yellow-500 to-yellow-700',
      'silver_ambassador': 'bg-gradient-to-r from-gray-400 to-gray-600',
      'gold_ambassador': 'bg-gradient-to-r from-yellow-400 to-yellow-600',
      'platinum_ambassador': 'bg-gradient-to-r from-purple-400 to-purple-600'
    };
    return gradients[role] || 'bg-gradient-to-r from-gray-500 to-gray-700';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'admin': '👑 Admin',
      'entry_ambassador': '⭐ Entry',
      'wtw_ambassador': '🌍 WTW',
      'mlm_ambassador': '🌊 MLM',
      'pentagame_ambassador': '🎮 Pentagame',
      'silver_ambassador': '🥈 Silver',
      'gold_ambassador': '🥇 Gold',
      'platinum_ambassador': '💎 Platinum'
    };
    return labels[role] || role;
  };

  const expandAll = () => {
    const allUserIds = getAllUserIds(networkData);
    setExpandedNodes(new Set(allUserIds));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const getAllUserIds = (data) => {
    if (!data) return [];
    const ids = [];
    const traverse = (user) => {
      ids.push(user.id);
      if (user.children) {
        user.children.forEach(traverse);
      }
    };
    data.forEach(traverse);
    return ids;
  };

  const filterUsers = (users) => {
    if (!users) return [];
    
    return users.filter(user => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id?.toString().includes(searchTerm);
      
      // Role filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive !== false) ||
        (statusFilter === 'inactive' && user.isActive === false);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  };

  const getFilteredNetworkData = () => {
    if (!networkData) return [];
    return filterUsers(networkData);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento rete MLM...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadNetworkData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🌳 Albero Rete MLM</h1>
              <p className="text-gray-600">Visualizza la struttura completa della rete degli ambassador</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={expandAll}
                disabled={!networkData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📂 Espandi Tutto
              </button>
              <button
                onClick={collapseAll}
                disabled={!networkData}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📁 Comprimi Tutto
              </button>
              <button
                onClick={loadNetworkData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Caricamento...' : '🔄 Aggiorna'}
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento albero rete...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="text-red-600 text-2xl mr-3">⚠️</div>
              <div>
                <h3 className="text-lg font-medium text-red-800">Errore nel caricamento</h3>
                <p className="text-red-600">{error}</p>
                <button
                  onClick={loadNetworkData}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  🔄 Riprova
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {networkData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Utenti Totali</p>
                  <p className="text-2xl font-bold text-gray-900">{getAllUserIds(networkData).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ambassador Attivi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getAllUserIds(networkData).filter(id => {
                      const user = findUserById(networkData, id);
                      return user && user.role !== 'admin' && user.isActive !== false;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Commissioni Totali</p>
                  <p className="text-2xl font-bold text-gray-900">
                    €{Math.round(getAllUserIds(networkData).reduce((sum, id) => {
                      const user = findUserById(networkData, id);
                      return sum + (user?.totalCommissions || 0);
                    }, 0))}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <span className="text-2xl">🌳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Livelli Massimi</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.max(...getAllUserIds(networkData).map(id => {
                      const user = findUserById(networkData, id);
                      return getNodeLevel(networkData, user);
                    }))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Network Tree */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Struttura Rete</h2>
            
            {/* Filters and Search */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Cerca</label>
                  <input
                    type="text"
                    placeholder="Nome utente o ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">👤 Ruolo</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tutti i ruoli</option>
                    <option value="admin">👑 Admin</option>
                    <option value="entry_ambassador">⭐ Entry</option>
                    <option value="wtw_ambassador">🌍 WTW</option>
                    <option value="mlm_ambassador">🌊 MLM</option>
                    <option value="pentagame_ambassador">🎮 Pentagame</option>
                    <option value="silver_ambassador">🥈 Silver</option>
                    <option value="gold_ambassador">🥇 Gold</option>
                    <option value="platinum_ambassador">💎 Platinum</option>
                  </select>
                </div>
                
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📊 Stato</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tutti</option>
                    <option value="active">✅ Attivi</option>
                    <option value="inactive">⚠️ Inattivi</option>
                  </select>
                </div>
                
                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('all');
                      setStatusFilter('all');
                    }}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    🗑️ Pulisci Filtri
                  </button>
                </div>
              </div>
              
              {/* Results count */}
              <div className="mt-3 text-sm text-gray-600">
                Mostrando {getFilteredNetworkData().length} di {networkData?.length || 0} utenti
              </div>
            </div>
            
            {networkData && networkData.length > 0 ? (
              <div>
                {/* Info banner se tutti sono root */}
                {networkData.every(user => !user.sponsorId) && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-yellow-600 text-xl mr-3">💡</div>
                      <div>
                        <h4 className="font-medium text-yellow-800">Struttura Rete</h4>
                        <p className="text-sm text-yellow-700">
                          Tutti gli utenti sono al livello root. Per creare una struttura gerarchica, 
                          assegna degli sponsor agli utenti tramite la gestione utenti.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {getFilteredNetworkData().map(user => renderUserNode(user))}
                </div>
              </div>
            ) : !loading && !error ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌳</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun utente trovato</h3>
                <p className="text-gray-500">La rete è vuota o non ci sono utenti da visualizzare.</p>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Nota:</strong> Tutti gli utenti sono al livello root perché non hanno sponsor definiti.
                    <br />Per creare una struttura gerarchica, assegna degli sponsor agli utenti.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">👤 Dettagli Utente</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xl">
                    {selectedUser.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{selectedUser.username}</h4>
                    <p className="text-gray-600">ID: {selectedUser.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Informazioni Base</h5>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Ruolo:</span> {getRoleLabel(selectedUser.role)}</div>
                      <div><span className="font-medium">Livello:</span> {selectedUser.level || 'N/A'}</div>
                      <div><span className="font-medium">Stato:</span> 
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          selectedUser.isActive === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedUser.isActive === false ? 'Inattivo' : 'Attivo'}
                        </span>
                      </div>
                      <div><span className="font-medium">Sponsor ID:</span> {selectedUser.sponsorId || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Performance</h5>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Commissioni Totali:</span> €{Math.round(selectedUser.totalCommissions || 0)}</div>
                      <div><span className="font-medium">Figli Diretti:</span> {selectedUser.children?.length || 0}</div>
                      <div><span className="font-medium">Livello Rete:</span> {getNodeLevel(networkData, selectedUser)}</div>
                      <div><span className="font-medium">Data Registrazione:</span> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('it-IT') : 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {selectedUser.children && selectedUser.children.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-2">Figli Diretti ({selectedUser.children.length})</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedUser.children.map(child => (
                        <div key={child.id} className="flex items-center space-x-2 p-2 bg-white rounded border">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            {child.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{child.username}</div>
                            <div className="text-xs text-gray-500">{getRoleLabel(child.role)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
const findUserById = (data, userId) => {
  const traverse = (users) => {
    for (const user of users) {
      if (user.id === userId) return user;
      if (user.children) {
        const found = traverse(user.children);
        if (found) return found;
      }
    }
    return null;
  };
  return traverse(data);
};

const getNodeLevel = (data, user) => {
  const findLevel = (users, targetId, currentLevel = 0) => {
    for (const u of users) {
      if (u.id === targetId) return currentLevel;
      if (u.children) {
        const found = findLevel(u.children, targetId, currentLevel + 1);
        if (found !== -1) return found;
      }
    }
    return -1;
  };
  return findLevel(data, user.id);
};

export default NetworkTreeViewer; 