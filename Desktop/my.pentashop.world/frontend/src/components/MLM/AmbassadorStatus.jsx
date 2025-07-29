import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AmbassadorStatus = ({ user }) => {
  const [statusData, setStatusData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user && user.id) {
      loadAmbassadorData();
    }
  }, [user]);

  const loadAmbassadorData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 AmbassadorStatus - Caricamento dati per user:', user);

      // Carica status completo
      console.log('📊 Caricamento status...');
      const token = localStorage.getItem('token');
      const statusResponse = await axios.get(`/api/ambassador/status/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Status response:', statusResponse.data);
      if (statusResponse.data.success) {
        setStatusData(statusResponse.data.data);
      } else {
        console.error('❌ Status API error:', statusResponse.data);
      }

      // Carica network tree
      console.log('🌳 Caricamento network...');
      const networkResponse = await axios.get(`/api/ambassador/network/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Network response:', networkResponse.data);
      if (networkResponse.data.success) {
        setNetworkData(networkResponse.data.data);
      } else {
        console.error('❌ Network API error:', networkResponse.data);
      }

      // Carica performance analytics
      console.log('📈 Caricamento performance...');
      const performanceResponse = await axios.get(`/api/ambassador/performance/${user.id}`, {
        headers: {
          'Authorization': 'Bearer test-jwt-token-123',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Performance response:', performanceResponse.data);
      if (performanceResponse.data.success) {
        setPerformanceData(performanceResponse.data.data);
      } else {
        console.error('❌ Performance API error:', performanceResponse.data);
      }

    } catch (err) {
      console.error('❌ Errore caricamento dati ambasciatore:', err);
      console.error('❌ Error details:', err.response?.data || err.message);
      setError(`Errore nel caricamento dei dati ambasciatore: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (level) => {
    const colors = {
      'DIAMOND': 'bg-gradient-to-r from-blue-400 to-purple-600',
      'PLATINUM': 'bg-gradient-to-r from-gray-300 to-gray-500',
      'GOLD': 'bg-gradient-to-r from-yellow-400 to-yellow-600',
      'SILVER': 'bg-gradient-to-r from-gray-400 to-gray-600',
      'BRONZE': 'bg-gradient-to-r from-orange-600 to-orange-800',
      'ENTRY': 'bg-gradient-to-r from-green-400 to-green-600'
    };
    return colors[level] || colors['ENTRY'];
  };

  const getStatusIcon = (level) => {
    const icons = {
      'DIAMOND': '💎',
      'PLATINUM': '🥇',
      'GOLD': '🥇',
      'SILVER': '🥈',
      'BRONZE': '🥉',
      'ENTRY': '⭐'
    };
    return icons[level] || icons['ENTRY'];
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-neutral-600">Caricamento Status Ambasciatore...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          ❌ {error}
        </div>
      </div>
    );
  }

  if (!statusData) {
    return (
      <div className="card">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          ⚠️ Dati status non disponibili
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">
          👤 Status Ambasciatore Completo
        </h2>
        <button
          onClick={loadAmbassadorData}
          className="btn btn-outline"
        >
          🔄 Aggiorna
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: '📊 Panoramica', icon: '📊' },
          { id: 'network', label: '🌳 Network', icon: '🌳' },
          { id: 'performance', label: '📈 Performance', icon: '📈' },
          { id: 'requirements', label: '✅ Requisiti', icon: '✅' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Status Level */}
          <div className={`p-6 rounded-lg text-white ${getStatusColor(statusData.statusLevel)}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getStatusIcon(statusData.statusLevel)}</span>
                  <div>
                    <h3 className="text-xl font-bold">{statusData.statusTitle}</h3>
                    <p className="text-sm opacity-90">{statusData.statusDescription}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{statusData.statusLevel}</div>
                <div className="text-sm opacity-90">Level</div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Commissioni Totali</p>
                  <p className="text-2xl font-bold text-green-600">€{statusData.totalCommissions}</p>
                </div>
                <span className="text-2xl">💰</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Network Size</p>
                  <p className="text-2xl font-bold text-blue-600">{statusData.totalNetworkSize}</p>
                </div>
                <span className="text-2xl">👥</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Commission Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{(statusData.commissionRate * 100).toFixed(0)}%</p>
                </div>
                <span className="text-2xl">📊</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Punti</p>
                  <p className="text-2xl font-bold text-orange-600">{statusData.points}</p>
                </div>
                <span className="text-2xl">⭐</span>
              </div>
            </div>

            {/* KYC Status Indicator */}
            <div className={`border rounded-lg p-4 ${
              user?.kycStatus === 'completed' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verifica Identità</p>
                  <p className={`text-lg font-bold ${
                    user?.kycStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {user?.kycStatus === 'completed' ? '✅ Completata' : '⚠️ Necessaria'}
                  </p>
                </div>
                <span className="text-2xl">
                  {user?.kycStatus === 'completed' ? '🆔' : '🆔'}
                </span>
              </div>
              {user?.kycStatus !== 'completed' && (
                <p className="text-xs text-yellow-700 mt-1">
                  Completa il KYC per sbloccare tutte le funzionalità
                </p>
              )}
            </div>
          </div>

          {/* Commission Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">💰 Dettagli Commissioni</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Mensili</p>
                <p className="text-xl font-bold text-green-600">€{statusData.monthlyCommissions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Settimanali</p>
                <p className="text-xl font-bold text-blue-600">€{statusData.weeklyCommissions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">In Attesa</p>
                <p className="text-xl font-bold text-yellow-600">€{statusData.pendingCommissions}</p>
              </div>
            </div>
          </div>

          {/* Network Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">🌳 Riepilogo Network</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Referral Diretti</p>
                <p className="text-xl font-bold text-green-600">{statusData.directReferrals}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Referral Indiretti</p>
                <p className="text-xl font-bold text-blue-600">{statusData.indirectReferrals}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Attivi</p>
                <p className="text-xl font-bold text-purple-600">{statusData.activeReferrals}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network Tab */}
      {activeTab === 'network' && networkData && (
        <div className="space-y-6">
          {/* Network Stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Statistiche Network</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Totale Referral</p>
                <p className="text-xl font-bold text-blue-600">{networkData.stats.totalReferrals}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Attivi</p>
                <p className="text-xl font-bold text-green-600">{networkData.stats.activeReferrals}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Commissioni Totali</p>
                <p className="text-xl font-bold text-purple-600">€{networkData.stats.totalCommissionsEarned}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Media per Referral</p>
                <p className="text-xl font-bold text-orange-600">€{networkData.stats.averageCommissionPerReferral.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Network Tree */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">🌳 Albero Network</h3>
            
            {/* Root Node */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">{networkData.root.firstName} {networkData.root.lastName}</h4>
                    <p className="text-sm opacity-90">{networkData.root.role.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Commissioni</p>
                    <p className="font-bold">€{networkData.root.totalCommissions}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Levels */}
            {networkData.levels.map((level, levelIndex) => (
              <div key={level.level} className="mb-6">
                <h4 className="font-semibold mb-3 text-gray-700">
                  Livello {level.level} - {level.totalCount} referral
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {level.referrals.map((referral, index) => (
                    <div key={referral.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h5 className="font-medium">{referral.firstName} {referral.lastName}</h5>
                          <p className="text-sm text-gray-600">{referral.role.replace('_', ' ')}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          referral.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {referral.isActive ? 'Attivo' : 'Inattivo'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Commissioni</p>
                          <p className="font-medium">€{referral.totalCommissions}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Guadagnate</p>
                          <p className="font-medium text-green-600">€{referral.commissionEarned}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Totale</p>
                      <p className="font-medium">{level.totalCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Attivi</p>
                      <p className="font-medium text-green-600">{level.activeCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Commissioni</p>
                      <p className="font-medium text-purple-600">€{level.totalCommissions}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && performanceData && (
        <div className="space-y-6">
          {/* Network Growth */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📈 Crescita Network</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Crescita Totale</p>
                <p className="text-xl font-bold text-blue-600">{performanceData.networkGrowth.totalGrowth}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mensile</p>
                <p className="text-xl font-bold text-green-600">+{performanceData.networkGrowth.monthlyGrowth}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Settimanale</p>
                <p className="text-xl font-bold text-purple-600">+{performanceData.networkGrowth.weeklyGrowth}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tasso Crescita</p>
                <p className="text-xl font-bold text-orange-600">{performanceData.networkGrowth.growthRate}%</p>
              </div>
            </div>
          </div>

          {/* Commission Performance */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">💰 Performance Commissioni</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Totali Guadagnate</p>
                <p className="text-xl font-bold text-green-600">€{performanceData.commissionPerformance.totalEarned}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Media Mensile</p>
                <p className="text-xl font-bold text-blue-600">€{performanceData.commissionPerformance.monthlyAverage}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Media Settimanale</p>
                <p className="text-xl font-bold text-purple-600">€{performanceData.commissionPerformance.weeklyAverage}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Per Referral</p>
                <p className="text-xl font-bold text-orange-600">€{performanceData.commissionPerformance.commissionPerReferral.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Conversion Metrics */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Metriche Conversione</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Tasso Conversione</p>
                <p className="text-xl font-bold text-green-600">{performanceData.conversionMetrics.conversionRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tasso Retention</p>
                <p className="text-xl font-bold text-blue-600">{performanceData.conversionMetrics.retentionRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tasso Attivazione</p>
                <p className="text-xl font-bold text-purple-600">{performanceData.conversionMetrics.activationRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Sales Performance */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">🛒 Performance Vendite</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Vendite Totali</p>
                <p className="text-xl font-bold text-green-600">€{performanceData.salesPerformance.totalSales}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mensili</p>
                <p className="text-xl font-bold text-blue-600">€{performanceData.salesPerformance.monthlySales}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Settimanali</p>
                <p className="text-xl font-bold text-purple-600">€{performanceData.salesPerformance.weeklySales}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valore Medio Ordine</p>
                <p className="text-xl font-bold text-orange-600">€{performanceData.salesPerformance.averageOrderValue}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requirements Tab */}
      {activeTab === 'requirements' && statusData && (
        <div className="space-y-6">
          {/* Upgrade Requirements */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">✅ Requisiti per Upgrade</h3>
            
            <div className="space-y-4">
              {Object.entries(statusData.upgradeRequirements.requirements).map(([key, requirement]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`text-xl ${requirement.met ? 'text-green-500' : 'text-yellow-500'}`}>
                      {requirement.met ? '✅' : '⚠️'}
                    </span>
                    <div>
                      <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-sm text-gray-600">
                        {requirement.current} / {requirement.required}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${requirement.met ? 'text-green-600' : 'text-yellow-600'}`}>
                      {requirement.met ? 'Completato' : 'In corso'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {requirement.current >= requirement.required ? '100%' : 
                       `${Math.round((requirement.current / requirement.required) * 100)}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-800">Stato Upgrade</h4>
                  <p className="text-sm text-blue-600">
                    {statusData.upgradeRequirements.allMet 
                      ? 'Tutti i requisiti sono soddisfatti! Puoi procedere con l\'upgrade.'
                      : 'Devi completare tutti i requisiti per procedere con l\'upgrade.'}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  statusData.upgradeRequirements.allMet
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {statusData.upgradeRequirements.allMet ? 'Pronto per Upgrade' : 'In Progresso'}
                </div>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Status Attuale</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Ruolo Attuale</p>
                <p className="text-lg font-bold text-blue-600">{statusData.role.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Commission Rate</p>
                <p className="text-lg font-bold text-green-600">{(statusData.commissionRate * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Punti Accumulati</p>
                <p className="text-lg font-bold text-purple-600">{statusData.points}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Token Disponibili</p>
                <p className="text-lg font-bold text-orange-600">{statusData.tokens}</p>
              </div>
            </div>
          </div>

          {/* Achievements */}
          {statusData.achievements && statusData.achievements.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">🏆 Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statusData.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="text-2xl">🏆</span>
                    <span className="font-medium text-yellow-800">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AmbassadorStatus; 