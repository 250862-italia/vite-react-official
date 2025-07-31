import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';

function CommissionsPage() {
  const [user, setUser] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
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
        const userData = response.data.user;
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
        
        // Carica dati specifici per il ruolo
        if (userData.role === 'admin') {
          await Promise.all([
            loadAdminCommissions(),
            loadAdminSales(),
            loadAdminStats()
          ]);
        } else {
          await loadUserCommissions();
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento utente:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadUserCommissions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(getApiUrl('/commissions'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCommissions(response.data.commissions || []);
        setStats(response.data.stats || {});
      }
    } catch (error) {
      console.error('Errore nel caricamento commissioni:', error);
      setError('Errore nel caricamento delle commissioni');
    }
  };

  const loadAdminCommissions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(getApiUrl('/admin/commissions'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCommissions(response.data.data || []);
      }
    } catch (error) {
      console.error('Errore nel caricamento commissioni admin:', error);
      setError('Errore nel caricamento delle commissioni');
    }
  };

  const loadAdminSales = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(getApiUrl('/admin/sales'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSales(response.data.data || []);
      }
    } catch (error) {
      console.error('Errore nel caricamento vendite admin:', error);
      setError('Errore nel caricamento delle vendite');
    }
  };

  const loadAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Carica statistiche vendite
      const salesResponse = await axios.get(getApiUrl('/admin/sales/stats'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Carica statistiche commissioni
      const commissionsResponse = await axios.get(getApiUrl('/admin/commissions/stats'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (salesResponse.data.success && commissionsResponse.data.success) {
        const salesStats = salesResponse.data.data || {};
        const commissionsStats = commissionsResponse.data.data || {};
        
        // Combina le statistiche
        setStats({
          ...salesStats,
          ...commissionsStats,
          // Priorità alle statistiche delle commissioni per i totali
          totalCommissions: commissionsStats.totalCommissions || salesStats.totalCommissions || 0,
          pendingCommissions: commissionsStats.pendingCommissions || 0,
          paidCommissions: commissionsStats.paidCommissions || 0
        });
      }
    } catch (error) {
      console.error('Errore nel caricamento statistiche:', error);
      // Fallback: carica solo le statistiche delle vendite
      try {
        const token = localStorage.getItem('token');
        const salesResponse = await axios.get(getApiUrl('/admin/sales/stats'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (salesResponse.data.success) {
          setStats(salesResponse.data.data || {});
        }
      } catch (fallbackError) {
        console.error('Errore anche nel fallback:', fallbackError);
        setStats({});
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Funzione per collegare vendite e commissioni
  const getSaleForCommission = (commission) => {
    return sales.find(sale => {
      // 1. Cerca per saleId esatto (può essere numerico o stringa)
      if (commission.saleId) {
        // Se la commissione ha saleId numerico, cerca per id numerico
        if (typeof commission.saleId === 'number' && sale.id === commission.saleId) {
          return true;
        }
        // Se la commissione ha saleId stringa, cerca per saleId stringa
        if (typeof commission.saleId === 'string' && sale.saleId === commission.saleId) {
          return true;
        }
      }
      
      // 2. Cerca per corrispondenza ambassador e importo
      const saleAmbassadorId = sale.ambassadorId || sale.userId;
      const commissionAmbassadorId = commission.userId || commission.ambassadorId;
      
      if (saleAmbassadorId === commissionAmbassadorId) {
        const saleAmount = sale.totalAmount || sale.amount;
        const commissionAmount1 = commission.amount;
        
        // Confronta importi con tolleranza
        if (Math.abs(saleAmount - commissionAmount1) < 0.01) {
          return true;
        }
      }
      
      // 3. Cerca per corrispondenza ambassador e commissione
      if (saleAmbassadorId === commissionAmbassadorId) {
        const saleCommission = sale.commissionAmount || sale.commission;
        const commissionAmount2 = commission.commissionAmount;
        
        if (Math.abs(saleCommission - commissionAmount2) < 0.01) {
          return true;
        }
      }
      
      // 4. Cerca per corrispondenza importo vendita e commissione (per admin)
      const saleAmount2 = sale.totalAmount || sale.amount;
      const commissionAmount3 = commission.amount;
      
      if (Math.abs(saleAmount2 - commissionAmount3) < 0.01) {
        // Verifica che la commissione abbia una descrizione che menziona la vendita
        if (commission.description && (
          commission.description.includes(`vendita ${sale.id}`) ||
          commission.description.includes(sale.customerName) ||
          commission.description.includes(sale.saleId)
        )) {
          return true;
        }
      }
      
      // 5. Cerca per corrispondenza commissione vendita e commissione
      const saleCommission2 = sale.commissionAmount || sale.commission;
      const commissionAmount4 = commission.commissionAmount;
      
      if (Math.abs(saleCommission2 - commissionAmount4) < 0.01) {
        // Verifica che la commissione abbia una descrizione che menziona la vendita
        if (commission.description && (
          commission.description.includes(`vendita ${sale.id}`) ||
          commission.description.includes(sale.customerName) ||
          commission.description.includes(sale.saleId)
        )) {
          return true;
        }
      }
      
      return false;
    });
  };

  // Funzione per ottenere il nome dell'ambassador
  const getAmbassadorName = (sale) => {
    if (sale.ambassadorInfo && sale.ambassadorInfo.username) return sale.ambassadorInfo.username;
    if (sale.username) return sale.username;
    if (sale.ambassadorName) return sale.ambassadorName;
    return 'Ambassador non trovato';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento commissioni...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Errore</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBackToDashboard}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Torna alla Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                💰 Traccia i tuoi guadagni e commissioni
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Benvenuto, {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-green-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-3xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isAdmin ? 'Commissioni Totali Sistema' : 'Commissioni Totali'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(isAdmin ? stats.totalCommissions : stats.totalEarned)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-3xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isAdmin ? 'Vendite Totali' : 'Media Commissione'}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {isAdmin ? formatCurrency(stats.totalAmount || 0) : formatCurrency(stats.averageCommission || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-yellow-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <span className="text-3xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isAdmin ? 'Commissioni Pagate' : 'Commissioni Pagate'}
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(isAdmin ? stats.paidCommissions || 0 : stats.totalPaid || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <span className="text-3xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {isAdmin ? 'Commissioni in Attesa' : 'Commissioni in Attesa'}
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(isAdmin ? stats.pendingCommissions || 0 : stats.totalPending || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Summary Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAdmin ? '📊 Riepilogo Commissioni Sistema' : '💰 Riepilogo Commissioni Personali'}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(isAdmin ? stats.totalCommissions : stats.totalEarned)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {isAdmin ? 'Totale Sistema' : 'Guadagni Totali'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {formatCurrency(isAdmin ? stats.paidCommissions : stats.totalPaid)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Commissioni Pagate
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(isAdmin ? stats.pendingCommissions : stats.totalPending)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Commissioni in Attesa
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Sales Section */}
        {isAdmin && sales.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">📈 Vendite Sistema</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ambassador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prodotto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Importo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Riferimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => {
                    const linkedCommission = commissions.find(c => {
                      // Cerca per saleId esatto
                      if (c.saleId) {
                        if (typeof c.saleId === 'number' && sale.id === c.saleId) return true;
                        if (typeof c.saleId === 'string' && sale.saleId === c.saleId) return true;
                      }
                      
                      // Cerca per ambassador e importo
                      const saleAmbassadorId = sale.ambassadorId || sale.userId;
                      const commissionAmbassadorId = c.userId || c.ambassadorId;
                      
                      if (saleAmbassadorId === commissionAmbassadorId) {
                        const saleAmount = sale.totalAmount || sale.amount;
                        const commissionAmount = c.amount;
                        if (Math.abs(saleAmount - commissionAmount) < 0.01) return true;
                      }
                      
                      // Cerca per corrispondenza importo e descrizione (per admin)
                      const saleAmount = sale.totalAmount || sale.amount;
                      const commissionAmount = c.amount;
                      
                      if (Math.abs(saleAmount - commissionAmount) < 0.01) {
                        if (c.description && (
                          c.description.includes(`vendita ${sale.id}`) ||
                          c.description.includes(sale.customerName) ||
                          c.description.includes(sale.saleId)
                        )) {
                          return true;
                        }
                      }
                      
                      return false;
                    });
                    
                    return (
                      <tr key={sale.id || sale.saleId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getAmbassadorName(sale)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.productName || sale.description || 'Prodotto non specificato'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(sale.totalAmount || sale.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.customerName || 'Cliente non specificato'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {linkedCommission ? (
                            <span className="text-green-600 font-medium">
                              Commissione: {formatCurrency(linkedCommission.commissionAmount)}
                            </span>
                          ) : (
                            <span className="text-gray-400">Nessuna commissione</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(sale.date || sale.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                            sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {sale.status === 'completed' ? 'Completata' :
                             sale.status === 'pending' ? 'In attesa' : sale.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Commissions List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAdmin ? '💰 Commissioni Sistema' : '💰 Le tue Commissioni'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ambassador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importo Commissione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Riferimento Vendita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commissions.map((commission) => {
                  const linkedSale = getSaleForCommission(commission);
                  
                  return (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {commission.ambassadorName || 'Ambassador non specificato'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(commission.commissionAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {linkedSale ? (
                          <span className="text-blue-600 font-medium">
                            Vendita: {formatCurrency(linkedSale.totalAmount || linkedSale.amount)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Nessuna vendita collegata</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(commission.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          commission.status === 'paid' ? 'bg-green-100 text-green-800' :
                          commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {commission.status === 'paid' ? 'Pagata' :
                           commission.status === 'pending' ? 'In attesa' : commission.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CommissionsPage; 