import React, { useState, useEffect } from 'react';
import axios from 'axios';

const KYCManager = () => {
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showFilters, setShowFilters] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    loadKYCRequests();
  }, []);

  const loadKYCRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/admin/kyc', { headers: getHeaders() });
      if (response.data.success) {
        setKycRequests(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento KYC:', error);
      setMessage({ type: 'error', text: 'Errore nel caricamento delle richieste KYC' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveKYC = async () => {
    try {
      const response = await axios.put(`http://localhost:3000/api/admin/kyc/${selectedKYC.id}/approve`, {}, { headers: getHeaders() });
      if (response.data.success) {
        setShowApproveModal(false);
        setSelectedKYC(null);
        loadKYCRequests();
        setMessage({ type: 'success', text: 'KYC approvato con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore approvazione KYC:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Errore nell\'approvazione del KYC' });
    }
  };

  const handleRejectKYC = async () => {
    try {
      const response = await axios.put(`http://localhost:3000/api/admin/kyc/${selectedKYC.id}/reject`, {}, { headers: getHeaders() });
      if (response.data.success) {
        setShowRejectModal(false);
        setSelectedKYC(null);
        loadKYCRequests();
        setMessage({ type: 'success', text: 'KYC rifiutato con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore rifiuto KYC:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Errore nel rifiuto del KYC' });
    }
  };

  const handleViewKYC = (kyc) => {
    setSelectedKYC(kyc);
    setShowViewModal(true);
  };

  const handleApproveClick = (kyc) => {
    setSelectedKYC(kyc);
    setShowApproveModal(true);
  };

  const handleRejectClick = (kyc) => {
    setSelectedKYC(kyc);
    setShowRejectModal(true);
  };

  const getStatusLabel = (status) => {
    const statuses = {
      'pending': '⏳ In Attesa',
      'approved': '✅ Approvato',
      'rejected': '❌ Rifiutato'
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Filtri e ordinamento
  const filteredKYC = kycRequests.filter(kyc => {
    const matchesSearch = kyc.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kyc.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kyc.documentType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || kyc.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const sortedKYC = [...filteredKYC].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'createdAt') {
      aValue = new Date(a.createdAt);
      bValue = new Date(b.createdAt);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(sortedKYC.length / itemsPerPage);
  const paginatedKYC = sortedKYC.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🔐 Gestione KYC</h2>
          <p className="text-gray-600">Gestisci le richieste di verifica identità</p>
        </div>
        <div className="flex space-x-3">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <div className="text-sm text-blue-600">In Attesa</div>
            <div className="text-xl font-bold text-blue-800">
              {kycRequests.filter(k => k.status === 'pending').length}
            </div>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-lg">
            <div className="text-sm text-green-600">Approvati</div>
            <div className="text-xl font-bold text-green-800">
              {kycRequests.filter(k => k.status === 'approved').length}
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca KYC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <span className="absolute left-3 top-3 text-gray-400">🔍</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tutti gli stati</option>
              <option value="pending">In Attesa</option>
              <option value="approved">Approvato</option>
              <option value="rejected">Rifiutato</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              ⚙️ Filtri Avanzati
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordina per</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="createdAt">Data creazione</option>
                  <option value="status">Stato</option>
                  <option value="documentType">Tipo documento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordine</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="desc">Decrescente</option>
                  <option value="asc">Crescente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Risultati per pagina</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KYC Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento KYC...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo Documento
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Richiesta
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedKYC.map((kyc) => (
                    <tr key={kyc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                              {kyc.user?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{kyc.user?.username}</div>
                            <div className="text-sm text-gray-500">{kyc.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {kyc.documentType || 'Documento'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(kyc.status)}`}>
                          {getStatusLabel(kyc.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(kyc.createdAt).toLocaleDateString('it-IT')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewKYC(kyc)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Visualizza"
                          >
                            👁️
                          </button>
                          {kyc.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveClick(kyc)}
                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                title="Approva"
                              >
                                ✅
                              </button>
                              <button
                                onClick={() => handleRejectClick(kyc)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                title="Rifiuta"
                              >
                                ❌
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Precedente
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Successivo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedKYC.length)}</span> di{' '}
                      <span className="font-medium">{sortedKYC.length}</span> risultati
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View KYC Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">👁️ Dettagli KYC</h3>
            {selectedKYC && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Utente</label>
                    <p className="text-sm text-gray-900">{selectedKYC.user?.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedKYC.user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo Documento</label>
                    <p className="text-sm text-gray-900">{selectedKYC.documentType || 'Non specificato'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stato</label>
                    <p className="text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedKYC.status)}`}>
                        {getStatusLabel(selectedKYC.status)}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Note</label>
                  <p className="text-sm text-gray-900">{selectedKYC.notes || 'Nessuna nota'}</p>
                </div>
                {selectedKYC.documentUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Documento</label>
                    <a
                      href={selectedKYC.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 underline"
                    >
                      Visualizza documento
                    </a>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Richiesta</label>
                    <p className="text-sm text-gray-900">{new Date(selectedKYC.createdAt).toLocaleString('it-IT')}</p>
                  </div>
                  {selectedKYC.updatedAt && selectedKYC.updatedAt !== selectedKYC.createdAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ultima Modifica</label>
                      <p className="text-sm text-gray-900">{new Date(selectedKYC.updatedAt).toLocaleString('it-IT')}</p>
                    </div>
                  )}
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">✅ Conferma Approvazione</h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler approvare il KYC di <strong>{selectedKYC?.user?.username}</strong>? 
              Questa azione non può essere annullata.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleApproveKYC}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Approva
              </button>
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">❌ Conferma Rifiuto</h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler rifiutare il KYC di <strong>{selectedKYC?.user?.username}</strong>? 
              Questa azione non può essere annullata.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleRejectKYC}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Rifiuta
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCManager; 