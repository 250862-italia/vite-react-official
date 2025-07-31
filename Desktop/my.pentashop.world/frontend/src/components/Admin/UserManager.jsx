import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAuthorizeModal, setShowAuthorizeModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [bulkActions, setBulkActions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [userPackages, setUserPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [showPackagesModal, setShowPackagesModal] = useState(false);
  const [showAddPackageModal, setShowAddPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [packageFormData, setPackageFormData] = useState({
    packageId: '',
    packageName: '',
    cost: 0,
    packageCode: '',
    commissionRates: {
      directSale: 0.1,
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      level5: 0
    }
  });

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    phone: '',
    country: '',
    city: '',
    userType: 'private',
    fiscalCode: '',
    vatNumber: '',
    iban: '',
    role: 'entry_ambassador',
    level: 1,
    points: 0,
    tokens: 0,
    experience: 0,
    isActive: true,
    referralCode: '',
    commissionRate: 0.1,
    totalSales: 0,
    totalCommissions: 0
  });

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(getApiUrl('/admin/users'), { headers: getHeaders() });
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento utenti:', error);
      setMessage({ type: 'error', text: 'Errore nel caricamento degli utenti' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(getApiUrl('/admin/users'), formData, { headers: getHeaders() });
      if (response.data.success) {
        setShowCreateModal(false);
        resetForm();
        loadUsers();
        setMessage({ type: 'success', text: 'Utente creato con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore creazione utente:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Errore nella creazione dell\'utente' });
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(getApiUrl(`/admin/users/${selectedUser.id}`), formData, { headers: getHeaders() });
      if (response.data.success) {
        setShowEditModal(false);
        setSelectedUser(null);
        loadUsers();
        setMessage({ type: 'success', text: 'Utente aggiornato con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore aggiornamento utente:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Errore nell\'aggiornamento dell\'utente' });
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await axios.delete(getApiUrl(`/admin/users/${selectedUser.id}`), { headers: getHeaders() });
      if (response.data.success) {
        setShowDeleteModal(false);
        setSelectedUser(null);
        loadUsers();
        setMessage({ type: 'success', text: 'Utente eliminato con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore eliminazione utente:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Errore nell\'eliminazione dell\'utente' });
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      password: '',
      phone: user.phone || '',
      country: user.country || '',
      city: user.city || '',
      userType: user.userType || 'private',
      fiscalCode: user.fiscalCode || '',
      vatNumber: user.vatNumber || '',
      iban: user.iban || '',
      role: user.role,
      level: user.level || 1,
      points: user.points || 0,
      tokens: user.tokens || 0,
      experience: user.experience || 0,
      isActive: user.isActive,
      referralCode: user.referralCode || '',
      sponsorCode: user.sponsorCode || '',
      commissionRate: user.commissionRate || 0.1,
      totalSales: user.totalSales || 0,
      totalCommissions: user.totalCommissions || 0
    });
    setShowEditModal(true);
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
    await loadUserPackages(user.id);
  };

  const loadUserPackages = async (userId) => {
    try {
      setPackagesLoading(true);
      const response = await axios.get(getApiUrl(`/packages/purchased/${userId}`), { 
        headers: getHeaders() 
      });
      if (response.data.success) {
        // Verifica che i pacchetti non siano mock
        const packages = response.data.data.packages || [];
        const realPackages = packages.filter(pkg => 
          pkg.packageName && 
          !pkg.packageName.includes('Test') && 
          !pkg.packageName.includes('Mock') &&
          pkg.packageId
        );
        setUserPackages(realPackages);
      }
    } catch (error) {
      console.error('Errore caricamento pacchetti utente:', error);
      setUserPackages([]);
    } finally {
      setPackagesLoading(false);
    }
  };

  const loadAvailablePackages = async () => {
    try {
      const response = await axios.get(getApiUrl('/admin/commission-plans'), { 
        headers: getHeaders() 
      });
      if (response.data.success) {
        setAvailablePackages(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento pacchetti disponibili:', error);
      setAvailablePackages([]);
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleAuthorizeUser = (user) => {
    setSelectedUser(user);
    setShowAuthorizeModal(true);
  };

  const handleSuspendUser = (user) => {
    setSelectedUser(user);
    setShowSuspendModal(true);
  };

  const confirmAuthorizeUser = async () => {
    try {
      const response = await axios.put(getApiUrl(`/admin/users/${selectedUser.id}/authorize`), {}, { 
        headers: getHeaders() 
      });
      if (response.data.success) {
        setShowAuthorizeModal(false);
        setSelectedUser(null);
        loadUsers();
        setMessage({ type: 'success', text: 'Utente autorizzato con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore autorizzazione utente:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Errore nell\'autorizzazione dell\'utente' });
    }
  };

  const confirmSuspendUser = async () => {
    try {
      const response = await axios.put(getApiUrl(`/admin/users/${selectedUser.id}/suspend`), {}, { 
        headers: getHeaders() 
      });
      if (response.data.success) {
        setShowSuspendModal(false);
        setSelectedUser(null);
        loadUsers();
        setMessage({ type: 'success', text: 'Utente sospeso con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore sospensione utente:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Errore nella sospensione dell\'utente' });
    }
  };

  // Funzioni per gestione pacchetti
  const handleManagePackages = async (user) => {
    setSelectedUser(user);
    setShowPackagesModal(true);
    await loadUserPackages(user.id);
    await loadAvailablePackages();
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(getApiUrl(`/admin/users/${selectedUser.id}/packages`), packageFormData, {
        headers: getHeaders()
      });
      if (response.data.success) {
        setShowAddPackageModal(false);
        resetPackageForm();
        await loadUserPackages(selectedUser.id);
        setMessage({ type: 'success', text: 'Pacchetto aggiunto con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore aggiunta pacchetto:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Errore nell\'aggiunta del pacchetto' });
    }
  };

  const handleDeletePackage = async (packageId) => {
    if (!confirm('Sei sicuro di voler rimuovere questo pacchetto?')) {
      return;
    }

    try {
      const response = await axios.delete(getApiUrl(`/admin/users/${selectedUser.id}/packages/${packageId}`), {
        headers: getHeaders()
      });
      if (response.data.success) {
        await loadUserPackages(selectedUser.id);
        setMessage({ type: 'success', text: 'Pacchetto rimosso con successo!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      console.error('Errore rimozione pacchetto:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Errore nella rimozione del pacchetto' });
    }
  };

  const resetPackageForm = () => {
    setPackageFormData({
      packageId: '',
      packageName: '',
      cost: 0,
      packageCode: '',
      commissionRates: {
        directSale: 0.1,
        level1: 0,
        level2: 0,
        level3: 0,
        level4: 0,
        level5: 0
      }
    });
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      phone: '',
      country: '',
      city: '',
      userType: 'private',
      fiscalCode: '',
      vatNumber: '',
      iban: '',
      role: 'entry_ambassador',
      level: 1,
      points: 0,
      tokens: 0,
      experience: 0,
      isActive: true,
      referralCode: '',
      sponsorCode: '',
      commissionRate: 0.1,
      totalSales: 0,
      totalCommissions: 0
    });
  };

  const getRoleLabel = (role) => {
    const roles = {
      'admin': '👑 Admin',
      'entry_ambassador': '⭐ Entry Ambassador',
      'wtw_ambassador': '🌍 WTW Ambassador (€299)',
      'mlm_ambassador': '🌊 MLM Ambassador (€139)',
      'pentagame_ambassador': '🎮 Pentagame Ambassador (€199)'
    };
    return roles[role] || role;
  };

  const getLevelLabel = (level) => {
    const levelLabels = {
      'ENTRY': 'Entry',
      'WTW': 'WTW Ambassador',
      'MLM': 'MLM Ambassador',
      'PENTAGAME': 'Pentagame Ambassador'
    };
    return levelLabels[level] || level;
  };

  const getStatusIcon = (isActive) => {
    return isActive ? '🟢' : '🔴';
  };

  const getStatusLabel = (isActive) => {
    return isActive ? 'Attivo' : 'Inattivo';
  };

  const getSponsorName = (user) => {
    if (!user.sponsorCode) return 'N/A';
    
    // Trova lo sponsor tra gli utenti usando il referralCode
    const sponsor = users.find(u => u.referralCode === user.sponsorCode);
    if (sponsor) {
      return `${sponsor.firstName} ${sponsor.lastName}`;
    }
    
    // Fallback: mostra il codice sponsor se non trova il nome
    return user.sponsorCode || 'N/A';
  };

  // Filtri e ordinamento
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
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

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">👥 Gestione Utenti</h2>
          <p className="text-gray-600">Gestisci tutti gli utenti della piattaforma</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          ➕ Nuovo Utente
        </button>
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
                placeholder="Cerca utenti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute left-3 top-3 text-gray-400">🔍</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tutti i ruoli</option>
              <option value="admin">Admin</option>
              <option value="entry_ambassador">Entry Ambassador</option>
              <option value="wtw_ambassador">WTW Ambassador (17,90€)</option>
              <option value="mlm_ambassador">MLM Ambassador (69,50€)</option>
              <option value="pentagame_ambassador">Pentagame Ambassador (242€)</option>
              <option value="silver_ambassador">Silver Ambassador</option>
              <option value="gold_ambassador">Gold Ambassador</option>
              <option value="platinum_ambassador">Platinum Ambassador</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tutti gli stati</option>
              <option value="active">Attivo</option>
              <option value="inactive">Inattivo</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="createdAt">Data creazione</option>
                  <option value="username">Username</option>
                  <option value="email">Email</option>
                  <option value="role">Ruolo</option>
                  <option value="points">Punti</option>
                  <option value="level">Livello</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordine</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento utenti...</p>
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
                      Ruolo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referral Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sponsor Diretto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Punti
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Livello
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {getStatusIcon(user.isActive)} {getStatusLabel(user.isActive)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium text-blue-600">
                            {user.referralCode || 'N/A'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Codice Cliente
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium text-green-600">
                            {getSponsorName(user) || 'N/A'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Sponsor Diretto
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.points || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.level || 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Visualizza"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Modifica"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleManagePackages(user)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                            title="Gestisci Pacchetti"
                          >
                            📦
                          </button>
                          {!user.isActive ? (
                            <button
                              onClick={() => handleAuthorizeUser(user)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Autorizza"
                            >
                              ✅
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspendUser(user)}
                              className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                              title="Sospendi"
                            >
                              ⏸️
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Elimina"
                          >
                            🗑️
                          </button>
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
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedUsers.length)}</span> di{' '}
                      <span className="font-medium">{sortedUsers.length}</span> risultati
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
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">➕ Crea Nuovo Utente</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Nuovi campi del profilo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paese</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Utente</label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData({...formData, userType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="private">👤 Privato</option>
                  <option value="company">🏢 Azienda</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
                <input
                  type="text"
                  value={formData.fiscalCode}
                  onChange={(e) => setFormData({...formData, fiscalCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formData.userType === 'company' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA</label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({...formData, vatNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={(e) => setFormData({...formData, iban: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="IT60X0542811101000000123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="entry_ambassador">Entry Ambassador</option>
                  <option value="mlm_ambassador">MLM Ambassador (€139)</option>
                  <option value="pentagame_ambassador">Pentagame Ambassador (€199)</option>
                  <option value="wtw_ambassador">WTW Ambassador (€299)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crea Utente
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">✏️ Modifica Utente</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password (lasciare vuoto per non modificare)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Nuovi campi del profilo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paese</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Utente</label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData({...formData, userType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="private">👤 Privato</option>
                  <option value="company">🏢 Azienda</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
                <input
                  type="text"
                  value={formData.fiscalCode}
                  onChange={(e) => setFormData({...formData, fiscalCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formData.userType === 'company' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA</label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({...formData, vatNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={(e) => setFormData({...formData, iban: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="IT60X0542811101000000123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="entry_ambassador">Entry Ambassador</option>
                  <option value="mlm_ambassador">MLM Ambassador (€139)</option>
                  <option value="pentagame_ambassador">Pentagame Ambassador (€199)</option>
                  <option value="wtw_ambassador">WTW Ambassador (€299)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Livello</label>
                  <input
                    type="number"
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Punti</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
                  <input
                    type="number"
                    value={formData.tokens}
                    onChange={(e) => setFormData({...formData, tokens: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Esperienza</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referral Cliente</label>
                  <input
                    type="text"
                    value={formData.referralCode}
                    onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Codice referral del cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor Diretto</label>
                  <input
                    type="text"
                    value={formData.sponsorCode}
                    onChange={(e) => setFormData({...formData, sponsorCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Codice dello sponsor diretto"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Utente attivo</span>
                </label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Aggiorna
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🗑️ Conferma Eliminazione</h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare l'utente <strong>{selectedUser?.username}</strong>? 
              Questa azione non può essere annullata.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Elimina
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">👁️ Dettagli Utente</h3>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <p className="text-sm text-gray-900">{selectedUser.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <p className="text-sm text-gray-900">{selectedUser.firstName || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cognome</label>
                    <p className="text-sm text-gray-900">{selectedUser.lastName || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ruolo</label>
                    <p className="text-sm text-gray-900">{getRoleLabel(selectedUser.role)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stato</label>
                    <p className="text-sm text-gray-900">
                      {getStatusIcon(selectedUser.isActive)} {getStatusLabel(selectedUser.isActive)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Livello</label>
                    <p className="text-sm text-gray-900">{selectedUser.level || 1}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Punti</label>
                    <p className="text-sm text-gray-900">{selectedUser.points || 0}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Token</label>
                    <p className="text-sm text-gray-900">{selectedUser.tokens || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Esperienza</label>
                    <p className="text-sm text-gray-900">{selectedUser.experience || 0}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Referral Cliente</label>
                    <p className="text-sm text-blue-600 font-medium">{selectedUser.referralCode || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sponsor Diretto</label>
                    <p className="text-sm text-green-600 font-medium">{getSponsorName(selectedUser)}</p>
                  </div>
                </div>

                {/* Nuovi campi del profilo */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">📋 Dati Fiscali e Bancari</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tipo Utente</label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.userType === 'company' ? '🏢 Azienda' : '👤 Privato'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Codice Fiscale</label>
                      <p className="text-sm text-gray-900">{selectedUser.fiscalCode || 'Non specificato'}</p>
                    </div>
                  </div>
                  {selectedUser.userType === 'company' && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Partita IVA</label>
                        <p className="text-sm text-gray-900">{selectedUser.vatNumber || 'Non specificata'}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">IBAN</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedUser.iban || 'Non specificato'}</p>
                    </div>
                  </div>
                </div>

                {/* Dati di contatto */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">📞 Dati di Contatto</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Telefono</label>
                      <p className="text-sm text-gray-900">{selectedUser.phone || 'Non specificato'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Paese</label>
                      <p className="text-sm text-gray-900">{selectedUser.country || 'Non specificato'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Città</label>
                      <p className="text-sm text-gray-900">{selectedUser.city || 'Non specificata'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Sezione Pacchetti Acquistati */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">📦 Pacchetti Acquistati</h4>
                  {packagesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  ) : userPackages.length > 0 ? (
                    <div className="space-y-2">
                      {userPackages.map((pkg, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{pkg.packageName}</p>
                              <p className="text-xs text-gray-600">
                                Acquistato: {new Date(pkg.purchaseDate).toLocaleDateString('it-IT')}
                              </p>
                              <p className="text-xs text-gray-600">
                                Costo: €{pkg.cost}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">
                                Commissione: {(pkg.commissionRates?.directSale * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">Nessun pacchetto acquistato</p>
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

      {/* Authorize User Modal */}
      {showAuthorizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">✅ Autorizza Utente</h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler autorizzare l'utente <strong>{selectedUser?.username}</strong>? 
              L'utente potrà accedere al sistema e utilizzare tutte le funzionalità.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmAuthorizeUser}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Autorizza
              </button>
              <button
                onClick={() => setShowAuthorizeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">⏸️ Sospendi Utente</h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler sospendere l'utente <strong>{selectedUser?.username}</strong>? 
              L'utente non potrà più accedere al sistema fino a nuova autorizzazione.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmSuspendUser}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Sospendi
              </button>
              <button
                onClick={() => setShowSuspendModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Packages Management Modal */}
      {showPackagesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                📦 Gestione Pacchetti - {selectedUser?.username}
              </h3>
              <button
                onClick={() => setShowPackagesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Add Package Button */}
            <div className="mb-4">
              <button
                onClick={() => setShowAddPackageModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ➕ Aggiungi Pacchetto
              </button>
            </div>

            {/* Packages List */}
            {packagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : userPackages.length > 0 ? (
              <div className="space-y-4">
                {userPackages.map((pkg, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{pkg.packageName}</h4>
                        <p className="text-sm text-gray-600">ID: {pkg.packageId}</p>
                        <p className="text-sm text-gray-600">Costo: €{pkg.cost}</p>
                        <p className="text-sm text-gray-600">
                          Data acquisto: {new Date(pkg.purchaseDate).toLocaleDateString()}
                        </p>
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">Commissioni:</p>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            <span className="text-xs">Diretta: {pkg.commissionRates.directSale * 100}%</span>
                            <span className="text-xs">Liv.1: {pkg.commissionRates.level1 * 100}%</span>
                            <span className="text-xs">Liv.2: {pkg.commissionRates.level2 * 100}%</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePackage(pkg.packageId)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Rimuovi Pacchetto"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Nessun pacchetto acquistato</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Package Modal */}
      {showAddPackageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">➕ Aggiungi Pacchetto</h3>
            <form onSubmit={handleAddPackage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seleziona Pacchetto</label>
                <select
                  value={packageFormData.packageId}
                  onChange={(e) => {
                    const selected = availablePackages.find(p => p.id === parseInt(e.target.value));
                    if (selected) {
                      setPackageFormData({
                        ...packageFormData,
                        packageId: selected.id,
                        packageName: selected.name,
                        cost: selected.cost,
                        packageCode: selected.code,
                        commissionRates: {
                          directSale: selected.directSale || 0.1,
                          level1: selected.level1 || 0,
                          level2: selected.level2 || 0,
                          level3: selected.level3 || 0,
                          level4: selected.level4 || 0,
                          level5: selected.level5 || 0
                        }
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleziona un pacchetto...</option>
                  {availablePackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - €{pkg.cost}
                    </option>
                  ))}
                </select>
              </div>
              {packageFormData.packageId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Pacchetto</label>
                    <input
                      type="text"
                      value={packageFormData.packageName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={packageFormData.cost}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commissione Diretta (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={packageFormData.commissionRates.directSale * 100}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                </>
              )}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={!packageFormData.packageId}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Aggiungi
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPackageModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
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

export default UserManager; 