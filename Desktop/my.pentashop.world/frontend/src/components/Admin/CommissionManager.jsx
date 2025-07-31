import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  CreditCard,
  BarChart3,
  Calendar,
  Filter,
  Users,
  Star,
  Target,
  Award,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter as FilterIcon
} from 'lucide-react';

const CommissionManager = () => {
  const [commissions, setCommissions] = useState([]);
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('commissions');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    userId: 'all'
  });
  const [stats, setStats] = useState({
    totalCommissions: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
    totalSales: 0,
    totalOrders: 0,
    averageCommission: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [commissionForm, setCommissionForm] = useState({
    userId: '',
    type: 'direct_sale',
    amount: '',
    commissionRate: '',
    description: '',
    status: 'pending',
    level: 0,
    plan: 'manual'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Carica commissioni
      const commissionsResponse = await axios.get(getApiUrl('/admin/commissions'), { headers });
      if (commissionsResponse.data.success) {
        setCommissions(commissionsResponse.data.data || []);
      }

      // Carica vendite
      const salesResponse = await axios.get(getApiUrl('/admin/sales'), { headers });
      if (salesResponse.data.success) {
        setSales(salesResponse.data.data || []);
      }

      // Carica statistiche
      const statsResponse = await axios.get(getApiUrl('/admin/sales/stats'), { headers });
      if (statsResponse.data.success) {
        const salesStats = statsResponse.data.data || {};
        const commissions = commissionsResponse.data.data || [];
        
        const totalCommissions = commissions.reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
        const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
        const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commissionAmount || 0), 0);
        const averageCommission = commissions.length > 0 ? totalCommissions / commissions.length : 0;
        
        setStats({
          totalCommissions,
          pendingCommissions,
          paidCommissions,
          totalSales: salesStats.totalAmount || 0,
          totalOrders: salesStats.total || 0,
          averageCommission
        });
      }

      // Carica utenti
      const usersResponse = await axios.get(getApiUrl('/admin/users'), { headers });
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.data || []);
      }

    } catch (error) {
      console.error('Errore nel caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getFilteredCommissions = () => {
    return commissions.filter(commission => {
      if (filters.status !== 'all' && commission.status !== filters.status) return false;
      if (filters.type !== 'all' && commission.type !== filters.type) return false;
      if (filters.userId !== 'all' && commission.userId !== parseInt(filters.userId)) return false;
      if (filters.dateFrom && new Date(commission.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(commission.date) > new Date(filters.dateTo)) return false;
      return true;
    });
  };

  const getFilteredSales = () => {
    return sales.filter(sale => {
      if (filters.status !== 'all' && sale.status !== filters.status) return false;
      if (filters.userId !== 'all' && sale.ambassadorId !== parseInt(filters.userId)) return false;
      if (filters.dateFrom && new Date(sale.createdAt || sale.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(sale.createdAt || sale.date) > new Date(filters.dateTo)) return false;
      return true;
    });
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Utente Sconosciuto';
  };

  const getUserEmail = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : 'N/A';
  };

  const exportData = (type) => {
    const data = type === 'commissions' ? getFilteredCommissions() : getFilteredSales();
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ];
    return csvRows.join('\n');
  };

  // CRUD Functions
  const handleCreateCommission = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(getApiUrl('/admin/commissions'), commissionForm, { headers });
      if (response.data.success) {
        setShowCreateModal(false);
        resetCommissionForm();
        loadData();
        setMessage({ type: 'success', text: 'Commissione creata con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore creazione commissione:', error);
      setMessage({ type: 'error', text: 'Errore nella creazione della commissione' });
    }
  };

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.put(getApiUrl(`/admin/commissions/${selectedCommission.id}`), commissionForm, { headers });
      if (response.data.success) {
        setShowEditModal(false);
        setSelectedCommission(null);
        resetCommissionForm();
        loadData();
        setMessage({ type: 'success', text: 'Commissione aggiornata con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore aggiornamento commissione:', error);
      setMessage({ type: 'error', text: 'Errore nell\'aggiornamento della commissione' });
    }
  };

  const handleDeleteCommission = async (commissionId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa commissione?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.delete(getApiUrl(`/admin/commissions/${commissionId}`), { headers });
      if (response.data.success) {
        loadData();
        setMessage({ type: 'success', text: 'Commissione eliminata con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore eliminazione commissione:', error);
      setMessage({ type: 'error', text: 'Errore nell\'eliminazione della commissione' });
    }
  };

  const handleEditCommission = (commission) => {
    setSelectedCommission(commission);
    setCommissionForm({
      userId: commission.userId.toString(),
      type: commission.type,
      amount: commission.amount.toString(),
      commissionRate: commission.commissionRate.toString(),
      description: commission.description,
      status: commission.status,
      level: commission.level,
      plan: commission.plan
    });
    setShowEditModal(true);
  };

  const resetCommissionForm = () => {
    setCommissionForm({
      userId: '',
      type: 'direct_sale',
      amount: '',
      commissionRate: '',
      description: '',
      status: 'pending',
      level: 0,
      plan: 'manual'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">💰 Gestione Commissioni</h2>
          <p className="text-gray-600">Monitora commissioni e vendite del sistema MLM</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Commissione</span>
          </button>
          <button
            onClick={() => exportData(activeTab)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span>Esporta {activeTab === 'commissions' ? 'Commissioni' : 'Vendite'}</span>
          </button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Commissioni Totali</p>
                              <p className="text-2xl font-bold text-gray-900">€{Math.round(stats.totalCommissions)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Attesa</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingCommissions)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pagate</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.paidCommissions)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vendite Totali</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSales)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('commissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'commissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              💰 Commissioni
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sales'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🛒 Vendite
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Filtri */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {activeTab === 'commissions' ? 'Commissioni Generate' : 'Vendite Registrate'}
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <FilterIcon className="w-4 h-4" />
                <span>Filtri</span>
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tutti</option>
                    <option value="pending">In Attesa</option>
                    <option value="paid">Pagate</option>
                    <option value="cancelled">Cancellate</option>
                  </select>
                </div>

                {activeTab === 'commissions' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tutti</option>
                      <option value="direct_sale">Vendita Diretta</option>
                      <option value="referral">Referral</option>
                      <option value="bonus">Bonus</option>
                      <option value="upline_commission">Commissione Upline</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Utente</label>
                  <select
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tutti</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Da</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data A</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tabella Commissioni */}
          {activeTab === 'commissions' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Importo Vendita
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commissione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredCommissions().map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getUserName(commission.userId)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getUserEmail(commission.userId)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {commission.type === 'direct_sale' ? 'Vendita Diretta' :
                           commission.type === 'referral' ? 'Referral' :
                           commission.type === 'bonus' ? 'Bonus' :
                           commission.type === 'upline_commission' ? 'Upline' : commission.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(commission.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(commission.commissionAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(commission.commissionRate * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(commission.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(commission.status)}`}>
                          {getStatusIcon(commission.status)}
                          <span className="ml-1">
                            {commission.status === 'paid' ? 'Pagata' :
                             commission.status === 'pending' ? 'In Attesa' :
                             commission.status === 'cancelled' ? 'Cancellata' : commission.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCommission(commission)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifica"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCommission(commission.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Elimina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabella Vendite */}
          {activeTab === 'sales' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Venditore
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prodotto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Importo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commissione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredSales().map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {sale.ambassadorInfo?.username || sale.ambassadorName || getUserName(sale.ambassadorId)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {sale.ambassadorInfo?.email || getUserEmail(sale.ambassadorId)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.productName || sale.description || 'Prodotto non specificato'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(sale.totalAmount || sale.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(sale.commissionAmount || sale.commission)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.commissionRate ? (sale.commissionRate * 100).toFixed(1) + '%' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(sale.createdAt || sale.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                          {getStatusIcon(sale.status)}
                          <span className="ml-1">
                            {sale.status === 'completed' ? 'Completata' :
                             sale.status === 'pending' ? 'In Attesa' :
                             sale.status === 'cancelled' ? 'Cancellata' : sale.status}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Messaggio se nessun dato */}
          {((activeTab === 'commissions' && getFilteredCommissions().length === 0) ||
            (activeTab === 'sales' && getFilteredSales().length === 0)) && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <DollarSign className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessun {activeTab === 'commissions' ? 'commissione' : 'vendita'} trovata
              </h3>
              <p className="text-gray-500">
                Prova a modificare i filtri o aggiungi nuovi dati
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crea Commissione */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Crea Nuova Commissione</h3>
            <form onSubmit={handleCreateCommission}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Utente
                  </label>
                  <select
                    value={commissionForm.userId}
                    onChange={(e) => setCommissionForm({...commissionForm, userId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleziona utente</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={commissionForm.type}
                    onChange={(e) => setCommissionForm({...commissionForm, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="direct_sale">Vendita Diretta</option>
                    <option value="upline_commission">Commissione Upline</option>
                    <option value="bonus">Bonus</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importo Vendita
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={commissionForm.amount}
                    onChange={(e) => setCommissionForm({...commissionForm, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
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
                    value={commissionForm.commissionRate}
                    onChange={(e) => setCommissionForm({...commissionForm, commissionRate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione
                  </label>
                  <textarea
                    value={commissionForm.description}
                    onChange={(e) => setCommissionForm({...commissionForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Descrizione della commissione"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stato
                  </label>
                  <select
                    value={commissionForm.status}
                    onChange={(e) => setCommissionForm({...commissionForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="pending">In Attesa</option>
                    <option value="paid">Pagata</option>
                    <option value="cancelled">Cancellata</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Crea Commissione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifica Commissione */}
      {showEditModal && selectedCommission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Modifica Commissione</h3>
            <form onSubmit={handleUpdateCommission}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Utente
                  </label>
                  <select
                    value={commissionForm.userId}
                    onChange={(e) => setCommissionForm({...commissionForm, userId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleziona utente</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={commissionForm.type}
                    onChange={(e) => setCommissionForm({...commissionForm, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="direct_sale">Vendita Diretta</option>
                    <option value="upline_commission">Commissione Upline</option>
                    <option value="bonus">Bonus</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importo Vendita
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={commissionForm.amount}
                    onChange={(e) => setCommissionForm({...commissionForm, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
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
                    value={commissionForm.commissionRate}
                    onChange={(e) => setCommissionForm({...commissionForm, commissionRate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione
                  </label>
                  <textarea
                    value={commissionForm.description}
                    onChange={(e) => setCommissionForm({...commissionForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Descrizione della commissione"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stato
                  </label>
                  <select
                    value={commissionForm.status}
                    onChange={(e) => setCommissionForm({...commissionForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="pending">In Attesa</option>
                    <option value="paid">Pagata</option>
                    <option value="cancelled">Cancellata</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Aggiorna Commissione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messaggio di feedback */}
      {message.text && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default CommissionManager; 