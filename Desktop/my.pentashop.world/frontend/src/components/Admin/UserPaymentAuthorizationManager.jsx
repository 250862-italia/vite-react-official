import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api';
import { CheckCircle, XCircle, RefreshCw, Users, UserCheck, UserX } from 'lucide-react';

const UserPaymentAuthorizationManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState('all'); // all, authorized, unauthorized

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/admin/users/payment-authorization'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setUsers(response.data.data);
      } else {
        setError('Errore nel caricamento degli utenti');
      }
    } catch (err) {
      console.error('❌ Errore caricamento utenti autorizzazione:', err);
      setError('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizationToggle = async (userId, currentStatus) => {
    try {
      setUpdating(userId);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.put(getApiUrl(`/admin/users/${userId}/payment-authorization`), {
        isPaymentAuthorized: !currentStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Aggiorna lo stato locale
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, isPaymentAuthorized: !currentStatus }
              : user
          )
        );
        console.log('✅ Autorizzazione utente aggiornata:', response.data.message);
      } else {
        setError('Errore nell\'aggiornamento dell\'autorizzazione');
      }
    } catch (err) {
      console.error('❌ Errore aggiornamento autorizzazione utente:', err);
      setError('Errore nell\'aggiornamento dell\'autorizzazione');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (isAuthorized) => {
    return isAuthorized 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusIcon = (isAuthorized) => {
    return isAuthorized ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />;
  };

  const getFilteredUsers = () => {
    switch (filter) {
      case 'authorized':
        return users.filter(user => user.isPaymentAuthorized);
      case 'unauthorized':
        return users.filter(user => !user.isPaymentAuthorized);
      default:
        return users;
    }
  };

  const getStats = () => {
    const total = users.length;
    const authorized = users.filter(u => u.isPaymentAuthorized).length;
    const unauthorized = total - authorized;
    return { total, authorized, unauthorized };
  };

  const stats = getStats();
  const filteredUsers = getFilteredUsers();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            👥 Autorizzazione Pagamento per Utente
          </h2>
          <p className="text-gray-600">
            Gestisci l'autorizzazione del pagamento delle commissioni per ogni ambassador individualmente
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Aggiorna</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Totale Ambassador</p>
              <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Autorizzati</p>
              <p className="text-2xl font-bold text-green-800">{stats.authorized}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Non Autorizzati</p>
              <p className="text-2xl font-bold text-red-800">{stats.unauthorized}</p>
            </div>
            <UserX className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tutti ({stats.total})
          </button>
          <button
            onClick={() => setFilter('authorized')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'authorized' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Autorizzati ({stats.authorized})
          </button>
          <button
            onClick={() => setFilter('unauthorized')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unauthorized' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Non Autorizzati ({stats.unauthorized})
          </button>
        </div>
      </div>

      {/* Lista Utenti */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessun utente trovato con i filtri selezionati</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.isPaymentAuthorized)}`}>
                      {getStatusIcon(user.isPaymentAuthorized)}
                      <span className="ml-1">
                        {user.isPaymentAuthorized ? 'Autorizzato' : 'Non Autorizzato'}
                      </span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Email:</strong> {user.email}</p>
                    </div>
                    <div>
                      <p><strong>Ruolo:</strong> {user.role === 'ambassador' ? 'Ambassador' : 'Entry Ambassador'}</p>
                    </div>
                    <div>
                      <p><strong>Commissioni:</strong> €{Math.round(user.totalCommissions || 0)}</p>
                    </div>
                    <div>
                      <p><strong>Stato:</strong> {user.isActive ? 'Attivo' : 'Inattivo'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleAuthorizationToggle(user.id, user.isPaymentAuthorized)}
                    disabled={updating === user.id}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      user.isPaymentAuthorized
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    } disabled:opacity-50`}
                  >
                    {updating === user.id ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Aggiornando...</span>
                      </div>
                    ) : (
                      <span>
                        {user.isPaymentAuthorized ? 'Disautorizza' : 'Autorizza'}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Come Funziona</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Autorizzazione Globale:</strong> Controlla se tutti gli ambassador possono richiedere pagamenti</li>
          <li>• <strong>Autorizzazione Individuale:</strong> Controlla se un ambassador specifico può richiedere pagamenti</li>
          <li>• <strong>Doppio Controllo:</strong> L'ambassador deve essere autorizzato sia globalmente che individualmente</li>
          <li>• <strong>Filtri:</strong> Visualizza solo gli utenti che ti interessano</li>
          <li>• <strong>Modifiche Immediate:</strong> Le autorizzazioni cambiano istantaneamente</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Attenzione</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• L'autorizzazione individuale sovrascrive quella globale</li>
          <li>• Se un utente è disautorizzato individualmente, non può richiedere pagamenti</li>
          <li>• Le commissioni continuano ad accumularsi anche quando disabilitato</li>
          <li>• Riabilita l'autorizzazione per permettere i pagamenti</li>
        </ul>
      </div>
    </div>
  );
};

export default UserPaymentAuthorizationManager; 