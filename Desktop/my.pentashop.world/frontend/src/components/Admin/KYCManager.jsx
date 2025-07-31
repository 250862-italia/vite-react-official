import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api';

const KYCManager = () => {
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadKYCRequests();
    loadStats();
  }, []);

  const loadKYCRequests = async () => {
    try {
      console.log('🔄 Caricamento richieste KYC...');
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/admin/kyc'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Richieste KYC caricate:', response.data.data.length);
      setKycRequests(response.data.data);
    } catch (err) {
      console.error('❌ Errore caricamento KYC:', err);
      console.error('❌ Dettagli errore:', err.response?.data || err.message);
      setError(`Errore nel caricamento delle richieste KYC: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/admin/kyc/stats'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(response.data.data);
    } catch (err) {
      console.error('Errore caricamento statistiche KYC:', err);
    }
  };

  const handleStatusUpdate = async (kycId, newStatus, notes = '') => {
    try {
      console.log('🔄 Aggiornamento stato KYC:', { kycId, newStatus, notes });
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(getApiUrl(`/admin/kyc/${kycId}/status`), {
        status: newStatus,
        notes: notes
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Risposta aggiornamento KYC:', response.data);
      
      // Ricarica i dati
      await loadKYCRequests();
      await loadStats();
      setShowModal(false);
      setSelectedKYC(null);
      
      const statusText = {
        'approved': 'Approvato',
        'accepted': 'Accettato',
        'rejected': 'Rifiutato',
        'cancelled': 'Annullato',
        'pending': 'Rimesso in attesa',
        'paused': 'Messo in pausa',
        'modified': 'Modificato'
      };
      
      setMessage({ 
        type: 'success', 
        text: `KYC ${statusText[newStatus]} con successo!` 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('❌ Errore aggiornamento stato KYC:', err);
      console.error('❌ Dettagli errore:', err.response?.data || err.message);
      setMessage({ 
        type: 'error', 
        text: `Errore nell'aggiornamento dello stato KYC: ${err.response?.data?.error || err.message}` 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteKYC = async (kycId) => {
    if (!confirm('Sei sicuro di voler eliminare questa richiesta KYC?')) {
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(getApiUrl(`/admin/kyc/${kycId}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Ricarica i dati
      await loadKYCRequests();
      await loadStats();
      
      setMessage({ 
        type: 'success', 
        text: 'Richiesta KYC eliminata con successo!' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Errore eliminazione KYC:', err);
      setMessage({ 
        type: 'error', 
        text: 'Errore nell\'eliminazione della richiesta KYC' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      case 'modified': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Approvato';
      case 'accepted': return 'Accettato';
      case 'rejected': return 'Rifiutato';
      case 'cancelled': return 'Annullato';
      case 'pending': return 'In Attesa';
      case 'paused': return 'In Pausa';
      case 'modified': return 'Modificato';
      default: return status;
    }
  };

  const getActionButtons = (kyc) => {
    // Usa kycId se disponibile, altrimenti usa id
    const kycIdentifier = kyc.kycId || kyc.id;
    
    if (kyc.status === 'approved' || kyc.status === 'accepted') {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'modified')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            ✏️ Modifica
          </button>
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'paused')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            ⏸️ Pausa
          </button>
          <button
            onClick={() => handleDeleteKYC(kycIdentifier)}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            🗑️ Elimina
          </button>
        </div>
      );
    } else if (kyc.status === 'rejected' || kyc.status === 'cancelled') {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'pending')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            🔄 Riprova
          </button>
          <button
            onClick={() => handleDeleteKYC(kycIdentifier)}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            🗑️ Elimina
          </button>
        </div>
      );
    } else if (kyc.status === 'pending' || kyc.status === 'submitted') {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'accepted')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            ✅ Accetta
          </button>
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'approved')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            ✅ Approva
          </button>
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'rejected')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            ❌ Rifiuta
          </button>
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'cancelled')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            ❌ Annulla
          </button>
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'paused')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            ⏸️ Pausa
          </button>
        </div>
      );
    } else if (kyc.status === 'paused') {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'accepted')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            ✅ Accetta
          </button>
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'approved')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            ✅ Approva
          </button>
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'rejected')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            ❌ Rifiuta
          </button>
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'cancelled')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            ❌ Annulla
          </button>
        </div>
      );
    } else if (kyc.status === 'modified') {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'accepted')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            ✅ Accetta
          </button>
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'approved')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            ✅ Approva
          </button>
          <button
            onClick={() => handleStatusUpdate(kycIdentifier, 'cancelled')}
            disabled={actionLoading}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            ❌ Annulla
          </button>
        </div>
      );
    }
    return null;
  };

  const filteredKYC = kycRequests
    .filter(kyc => {
      const kycIdentifier = kyc.kycId || kyc.id;
      const matchesSearch = kyc.userInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           kyc.userInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           kyc.userInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           kycIdentifier?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || kyc.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'submittedAt') {
        aValue = new Date(a.submittedAt);
        bValue = new Date(b.submittedAt);
      } else if (sortBy === 'status') {
        aValue = a.status;
        bValue = b.status;
      } else {
        aValue = a[sortBy];
        bValue = b[sortBy];
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento richieste KYC...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadKYCRequests}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Messaggi */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Header con Statistiche */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🆔 Gestione KYC</h1>
              <p className="text-gray-600 mt-2">Gestisci le richieste di verifica identità degli utenti</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{kycRequests.length}</div>
              <div className="text-sm text-gray-500">Richieste Totali</div>
            </div>
          </div>
          
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Totali</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">In Attesa</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-sm text-gray-600">Approvati</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-sm text-gray-600">Rifiutati</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{stats.paused}</div>
                <div className="text-sm text-gray-600">In Pausa</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.today}</div>
                <div className="text-sm text-gray-600">Oggi</div>
              </div>
            </div>
          )}
        </div>

        {/* Filtri e Ricerca */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Ricerca</label>
              <input
                type="text"
                placeholder="Cerca per nome, email o ID KYC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">📊 Filtra Stato</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tutti gli Stati</option>
                <option value="pending">In Attesa</option>
                <option value="approved">Approvati</option>
                <option value="rejected">Rifiutati</option>
                <option value="paused">In Pausa</option>
              </select>
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">📊 Ordina per</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="submittedAt">Data Invio</option>
                <option value="status">Stato</option>
                <option value="kycId">ID KYC</option>
              </select>
            </div>
            <div className="md:w-32">
              <label className="block text-sm font-medium text-gray-700 mb-2">📈 Ordine</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">Decrescente</option>
                <option value="asc">Crescente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabella KYC */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID KYC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Invio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKYC.map((kyc) => {
                  const kycIdentifier = kyc.kycId || kyc.id;
                  return (
                    <tr key={kycIdentifier} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                            {kyc.userInfo?.firstName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{kyc.userInfo?.firstName} {kyc.userInfo?.lastName}</div>
                            <div className="text-sm text-gray-500">{kyc.userInfo?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {kycIdentifier}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(kyc.status)}`}>
                        {getStatusText(kyc.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(kyc.submittedAt).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {getActionButtons(kyc)}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

        {filteredKYC.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna richiesta KYC trovata</h3>
            <p className="text-gray-500">Non ci sono richieste KYC che corrispondono ai criteri di ricerca.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KYCManager; 