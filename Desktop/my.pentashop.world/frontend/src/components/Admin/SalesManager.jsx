import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SalesManager = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ambassadorFilter, setAmbassadorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [ambassadors, setAmbassadors] = useState([]);
  const [formData, setFormData] = useState({
    ambassadorId: '',
    customerName: '',
    customerEmail: '',
    products: [{ name: '', quantity: 1, price: 0 }],
    totalAmount: 0,
    commissionRate: 0.05,
    status: 'pending',
    notes: ''
  });

  useEffect(() => {
    loadSales();
    loadStats();
    loadAmbassadors();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/admin/sales')), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSales(response.data.data);
    } catch (err) {
      console.error('Errore caricamento vendite:', err);
      setError('Errore nel caricamento delle vendite');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/admin/sales/stats')), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStats(response.data.data);
    } catch (err) {
      console.error('Errore caricamento statistiche vendite:', err);
    }
  };

  const loadAmbassadors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/admin/users')), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ambassadorUsers = response.data.data.filter(user => user.role === 'ambassador');
      setAmbassadors(ambassadorUsers);
    } catch (err) {
      console.error('Errore caricamento ambassadors:', err);
    }
  };

  const handleCreateSale = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      // Calcola il totale
      const total = formData.products.reduce((sum, product) => sum + (product.quantity * product.price), 0);
      const saleData = {
        ...formData,
        totalAmount: total
      };

      await axios.post(getApiUrl('/admin/sales')), saleData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      await loadSales();
      await loadStats();
      setShowCreateModal(false);
      setFormData({
        ambassadorId: '',
        customerName: '',
        customerEmail: '',
        products: [{ name: '', quantity: 1, price: 0 }],
        totalAmount: 0,
        commissionRate: 0.05,
        status: 'pending',
        notes: ''
      });
      
      setMessage({ 
        type: 'success', 
        text: 'Vendita creata con successo!' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Errore creazione vendita:', err);
      setMessage({ 
        type: 'error', 
        text: 'Errore nella creazione della vendita' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSale = async (saleId, updatedData) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(getApiUrl(`/admin/sales/${saleId}`)), updatedData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      await loadSales();
      await loadStats();
      setShowModal(false);
      setSelectedSale(null);
      
      setMessage({ 
        type: 'success', 
        text: 'Vendita aggiornata con successo!' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Errore aggiornamento vendita:', err);
      setMessage({ 
        type: 'error', 
        text: 'Errore nell\'aggiornamento della vendita' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!confirm('Sei sicuro di voler eliminare questa vendita?')) {
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(getApiUrl(`/admin/sales/${saleId}`)), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      await loadSales();
      await loadStats();
      
      setMessage({ 
        type: 'success', 
        text: 'Vendita eliminata con successo!' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Errore eliminazione vendita:', err);
      setMessage({ 
        type: 'error', 
        text: 'Errore nell\'eliminazione della vendita' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completata';
      case 'pending': return 'In Attesa';
      case 'cancelled': return 'Annullata';
      default: return status;
    }
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { name: '', quantity: 1, price: 0 }]
    }));
  };

  const removeProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const updateProduct = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  const filteredSales = sales
    .filter(sale => {
      const matchesSearch = sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sale.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sale.saleId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sale.ambassadorInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sale.ambassadorInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
      const matchesAmbassador = ambassadorFilter === 'all' || sale.ambassadorId === parseInt(ambassadorFilter);
      
      return matchesSearch && matchesStatus && matchesAmbassador;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'createdAt') {
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
      } else if (sortBy === 'totalAmount') {
        aValue = a.totalAmount;
        bValue = b.totalAmount;
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento vendite...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadSales}
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
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
              <h1 className="text-3xl font-bold text-gray-900">💰 Gestione Vendite</h1>
              <p className="text-gray-600 mt-2">Gestisci tutte le vendite del sistema</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{sales.length}</div>
              <div className="text-sm text-gray-500">Vendite Totali</div>
            </div>
          </div>
          
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-8 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Totali</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">€{stats.totalAmount?.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Fatturato</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">€{stats.totalCommissions?.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Commissioni</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">In Attesa</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-gray-600">Completate</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
                <div className="text-sm text-gray-600">Annullate</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.today}</div>
                <div className="text-sm text-gray-600">Oggi</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">€{stats.averageSale?.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Media</div>
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
                placeholder="Cerca per cliente, email, ID vendita o ambassador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">📊 Filtra Stato</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Tutti gli Stati</option>
                <option value="pending">In Attesa</option>
                <option value="completed">Completate</option>
                <option value="cancelled">Annullate</option>
              </select>
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">👤 Filtra Ambassador</label>
              <select
                value={ambassadorFilter}
                onChange={(e) => setAmbassadorFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Tutti gli Ambassador</option>
                {ambassadors.map(ambassador => (
                  <option key={ambassador.id} value={ambassador.id}>
                    {ambassador.firstName} {ambassador.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">📊 Ordina per</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="createdAt">Data Creazione</option>
                <option value="totalAmount">Importo</option>
                <option value="status">Stato</option>
                <option value="saleId">ID Vendita</option>
              </select>
            </div>
            <div className="md:w-32">
              <label className="block text-sm font-medium text-gray-700 mb-2">📈 Ordine</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="desc">Decrescente</option>
                <option value="asc">Crescente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pulsante Crea Nuova Vendita */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
          >
            ➕ Crea Nuova Vendita
          </button>
        </div>

        {/* Tabella Vendite */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Vendita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ambassador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commissione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.saleId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {sale.saleId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{sale.customerName}</div>
                        <div className="text-sm text-gray-500">{sale.customerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                          {sale.ambassadorInfo?.firstName?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {sale.ambassadorInfo?.firstName} {sale.ambassadorInfo?.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      €{sale.totalAmount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{sale.commissionAmount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                        {getStatusText(sale.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sale.createdAt).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setShowModal(true);
                          }}
                          disabled={actionLoading}
                          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                          👁️ Visualizza
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale.saleId)}
                          disabled={actionLoading}
                          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          🗑️ Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredSales.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna vendita trovata</h3>
            <p className="text-gray-500">Non ci sono vendite che corrispondono ai criteri di ricerca.</p>
          </div>
        )}

        {/* Modal Crea Vendita */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">➕ Crea Nuova Vendita</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">👤 Ambassador</label>
                  <select
                    value={formData.ambassadorId}
                    onChange={(e) => setFormData(prev => ({ ...prev, ambassadorId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Seleziona Ambassador</option>
                    {ambassadors.map(ambassador => (
                      <option key={ambassador.id} value={ambassador.id}>
                        {ambassador.firstName} {ambassador.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">👤 Nome Cliente</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nome completo del cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📧 Email Cliente</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="email@cliente.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📊 Tasso Commissione</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.05"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📋 Stato</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="pending">In Attesa</option>
                    <option value="completed">Completata</option>
                    <option value="cancelled">Annullata</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">📝 Note</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows="3"
                  placeholder="Note sulla vendita..."
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">🛍️ Prodotti</label>
                {formData.products.map((product, index) => (
                  <div key={index} className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => updateProduct(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Nome prodotto"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Qty"
                        min="1"
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.01"
                        value={product.price}
                        onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Prezzo"
                        min="0"
                      />
                    </div>
                    <button
                      onClick={() => removeProduct(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <button
                  onClick={addProduct}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  ➕ Aggiungi Prodotto
                </button>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Annulla
                </button>
                <button
                  onClick={handleCreateSale}
                  disabled={actionLoading || !formData.ambassadorId || !formData.customerName}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Creazione...' : 'Crea Vendita'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Visualizza/Modifica Vendita */}
        {showModal && selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">👁️ Dettagli Vendita</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Vendita</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedSale.saleId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stato</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedSale.status)}`}>
                    {getStatusText(selectedSale.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cliente</label>
                  <p className="text-sm text-gray-900">{selectedSale.customerName}</p>
                  <p className="text-sm text-gray-500">{selectedSale.customerEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ambassador</label>
                  <p className="text-sm text-gray-900">
                    {selectedSale.ambassadorInfo?.firstName} {selectedSale.ambassadorInfo?.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Importo Totale</label>
                  <p className="text-sm text-gray-900 font-bold">€{selectedSale.totalAmount?.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commissione</label>
                  <p className="text-sm text-gray-900">€{selectedSale.commissionAmount?.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data Creazione</label>
                  <p className="text-sm text-gray-900">{new Date(selectedSale.createdAt).toLocaleString('it-IT')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ultimo Aggiornamento</label>
                  <p className="text-sm text-gray-900">{new Date(selectedSale.updatedAt).toLocaleString('it-IT')}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">🛍️ Prodotti</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedSale.products.map((product, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">Qty: {product.quantity} x €{product.price}</p>
                      </div>
                      <p className="font-bold">€{product.total}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSale.notes && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">📝 Note</label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-4">{selectedSale.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesManager; 