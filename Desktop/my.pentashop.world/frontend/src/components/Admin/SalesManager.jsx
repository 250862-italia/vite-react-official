import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  Users,
  Package,
  Calendar
} from 'lucide-react';

const SalesManager = () => {
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    productName: '',
    amount: '',
    commissionRate: '',
    status: 'completed'
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadSales();
    loadUsers();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/sales', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSales(response.data.data.sales);
      }
    } catch (error) {
      console.error('Errore caricamento vendite:', error);
      setError('Errore nel caricamento delle vendite');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento utenti:', error);
    }
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/sales', formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuccess('Vendita creata con successo!');
        setShowCreateModal(false);
        setFormData({
          userId: '',
          productName: '',
          amount: '',
          commissionRate: '',
          status: 'completed'
        });
        loadSales();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Errore nella creazione della vendita');
    }
  };

  const handleUpdateSale = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/admin/sales/${selectedSale.id}`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuccess('Vendita aggiornata con successo!');
        setShowEditModal(false);
        setSelectedSale(null);
        setFormData({
          userId: '',
          productName: '',
          amount: '',
          commissionRate: '',
          status: 'completed'
        });
        loadSales();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Errore nell\'aggiornamento della vendita');
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa vendita?')) {
      return;
    }
    
    try {
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/admin/sales/${saleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSuccess('Vendita eliminata con successo!');
        loadSales();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Errore nell\'eliminazione della vendita');
    }
  };

  const openEditModal = (sale) => {
    setSelectedSale(sale);
    setFormData({
      userId: sale.userId.toString(),
      productName: sale.product || sale.products?.[0]?.name || '',
      amount: sale.amount.toString(),
      commissionRate: sale.commissionRate?.toString() || '',
      status: sale.status
    });
    setShowEditModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Utente Sconosciuto';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">
            🛍️ Gestione Vendite
          </h2>
          <p className="text-neutral-600">
            Gestisci tutte le vendite del sistema
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuova Vendita
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
          {success}
        </div>
      )}

      {/* Sales List */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Utente</th>
              <th className="px-6 py-3">Prodotto</th>
              <th className="px-6 py-3">Importo</th>
              <th className="px-6 py-3">Commissione</th>
              <th className="px-6 py-3">Stato</th>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">#{sale.id}</td>
                <td className="px-6 py-4">{getUserName(sale.userId)}</td>
                <td className="px-6 py-4">
                  {sale.product || sale.products?.[0]?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 font-medium">
                  {formatCurrency(sale.amount)}
                </td>
                <td className="px-6 py-4">
                  {formatCurrency(sale.commissionEarned)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    sale.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sale.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {formatDate(sale.date)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(sale)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteSale(sale.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Nuova Vendita</h3>
            <form onSubmit={handleCreateSale}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Utente
                  </label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Seleziona utente</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.username})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Prodotto
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importo (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tasso Commissione (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({...formData, commissionRate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="5.0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stato
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="completed">Completata</option>
                    <option value="pending">In attesa</option>
                    <option value="cancelled">Cancellata</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Crea Vendita
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Modifica Vendita #{selectedSale.id}</h3>
            <form onSubmit={handleUpdateSale}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Prodotto
                  </label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importo (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tasso Commissione (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({...formData, commissionRate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stato
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="completed">Completata</option>
                    <option value="pending">In attesa</option>
                    <option value="cancelled">Cancellata</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Aggiorna Vendita
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesManager; 