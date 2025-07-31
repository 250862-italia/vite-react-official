import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api';
import { formatCurrency, formatPercentage, formatNumber, safeReduce } from '../../utils/formatters';

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

      const token = localStorage.getItem('token');
      const statusResponse = await axios.get(getApiUrl(`/ambassador/status/${user.id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (statusResponse.data.success) {
        setStatusData(statusResponse.data.data);
      } else {
        console.error('❌ Status API error:', statusResponse.data);
      }

      // Carica network tree
      const networkResponse = await axios.get(getApiUrl(`/ambassador/network/${user.id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (networkResponse.data.success) {
        setNetworkData(networkResponse.data.data);
      } else {
        console.error('❌ Network API error:', networkResponse.data);
      }

      // Carica performance analytics
      const performanceResponse = await axios.get(getApiUrl(`/ambassador/performance/${user.id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
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
          { id: 'requirements', label: '🚀 MLM', icon: '🚀' },
          { id: 'overview', label: '📊 Panoramica', icon: '📊' },
          { id: 'network', label: '🌳 Network', icon: '🌳' },
          { id: 'performance', label: '📈 Performance', icon: '📈' }
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
                  <p className="text-2xl font-bold text-green-600">€{Math.round(statusData.totalCommissions)}</p>
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
      {activeTab === 'network' && networkData && networkData.stats && (
        <div className="space-y-6">
          {/* Network Stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Statistiche Network</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Totale Referral</p>
                <p className="text-xl font-bold text-blue-600">{networkData.stats.totalReferrals || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Attivi</p>
                <p className="text-xl font-bold text-green-600">{networkData.stats.activeReferrals || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Commissioni Totali</p>
                <p className="text-xl font-bold text-purple-600">€{Math.round(networkData.stats.totalCommissionsEarned || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Media per Referral</p>
                <p className="text-xl font-bold text-orange-600">€{(networkData.stats.averageCommissionPerReferral || 0).toFixed(2)}</p>
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
                    <h4 className="font-bold">{networkData.root?.firstName || 'User'} {networkData.root?.lastName || ''}</h4>
                    <p className="text-sm opacity-90">{(networkData.root?.role || 'ambassador').replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Commissioni</p>
                    <p className="font-bold">€{Math.round(networkData.root?.totalCommissions || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Levels */}
            {networkData.networkByLevel && Object.entries(networkData.networkByLevel).map(([level, members]) => (
              <div key={level} className="mb-6">
                <h4 className="font-semibold mb-3 text-gray-700">
                  Livello {level} - {members.length} referral
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member, index) => (
                    <div key={member.id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h5 className="font-medium">{member.user?.firstName || 'User'} {member.user?.lastName || ''}</h5>
                          <p className="text-sm text-gray-600">{(member.plan || 'ambassador').replace('_', ' ')}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          member.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.isActive ? 'Attivo' : 'Inattivo'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">Commissioni</p>
                          <p className="font-medium">€{Math.round(member.totalCommissions || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Guadagnate</p>
                          <p className="font-medium text-green-600">€{member.commissionEarned || 0}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Totale</p>
                      <p className="font-medium">{members.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Attivi</p>
                      <p className="font-medium text-green-600">{members.filter(m => m.isActive).length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Commissioni</p>
                      <p className="font-medium text-purple-600">€{Math.round(members.reduce((sum, m) => sum + (m.totalCommissions || 0), 0))}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && performanceData && performanceData.networkGrowth && (
        <div className="space-y-6">
          {/* Network Growth */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📈 Crescita Network</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Crescita Totale</p>
                <p className="text-xl font-bold text-blue-600">{performanceData.networkGrowth.totalGrowth || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mensile</p>
                <p className="text-xl font-bold text-green-600">+{performanceData.networkGrowth.monthlyGrowth || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Settimanale</p>
                <p className="text-xl font-bold text-purple-600">+{performanceData.networkGrowth.weeklyGrowth || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tasso Crescita</p>
                <p className="text-xl font-bold text-orange-600">{performanceData.networkGrowth.growthRate || 0}%</p>
              </div>
            </div>
          </div>

          {/* Commission Performance */}
          {performanceData.commissionPerformance && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">💰 Performance Commissioni</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Totali Guadagnate</p>
                  <p className="text-xl font-bold text-green-600">€{performanceData.commissionPerformance.totalEarned || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Media Mensile</p>
                  <p className="text-xl font-bold text-blue-600">€{performanceData.commissionPerformance.monthlyAverage || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Media Settimanale</p>
                  <p className="text-xl font-bold text-purple-600">€{performanceData.commissionPerformance.weeklyAverage || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Per Referral</p>
                  <p className="text-xl font-bold text-orange-600">€{(performanceData.commissionPerformance.commissionPerReferral || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Conversion Metrics */}
          {performanceData.conversionMetrics && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">📊 Metriche Conversione</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tasso Conversione</p>
                  <p className="text-xl font-bold text-green-600">{(performanceData.conversionMetrics.conversionRate || 0).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tasso Retention</p>
                  <p className="text-xl font-bold text-blue-600">{(performanceData.conversionMetrics.retentionRate || 0).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tasso Attivazione</p>
                  <p className="text-xl font-bold text-purple-600">{(performanceData.conversionMetrics.activationRate || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Sales Performance */}
          {performanceData.salesPerformance && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">🛒 Performance Vendite</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Vendite Totali</p>
                  <p className="text-xl font-bold text-green-600">€{performanceData.salesPerformance.totalSales || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mensili</p>
                  <p className="text-xl font-bold text-blue-600">€{Math.round(performanceData.salesPerformance.monthlySales || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Settimanali</p>
                  <p className="text-xl font-bold text-purple-600">€{performanceData.salesPerformance.weeklySales || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valore Medio Ordine</p>
                  <p className="text-xl font-bold text-orange-600">€{performanceData.salesPerformance.averageOrderValue || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MLM Navigation Tab */}
      {activeTab === 'requirements' && statusData && (
        <div className="space-y-6">
          {/* Main MLM Navigation Card */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-3xl font-bold mb-2">Dashboard MLM</h3>
              <p className="text-blue-100 text-lg">Gestisci tutte le funzionalità MLM</p>
            </div>
            
            {/* MLM Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Commissioni */}
              <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">💰</span>
                  <h4 className="text-lg font-semibold">Commissioni</h4>
                </div>
                <p className="text-blue-100 mb-4 text-sm">
                  Traccia i tuoi guadagni e commissioni
                </p>
                <div className="text-2xl font-bold mb-2">€{Math.round(statusData.totalCommissions)}</div>
                <button
                  onClick={() => window.location.href = 'http://localhost:5173/mlm#:~:text=%F0%9F%91%A5-,Referral,-%F0%9F%86%94%20KYC'}
                  className="w-full bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  📊 Vai alle Commissioni
                </button>
              </div>

              {/* Rete MLM */}
              <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">🌐</span>
                  <h4 className="text-lg font-semibold">Rete MLM</h4>
                </div>
                <p className="text-blue-100 mb-4 text-sm">
                  Visualizza la tua rete e gerarchia
                </p>
                <div className="text-2xl font-bold mb-2">{statusData.totalNetworkSize}</div>
                <button
                  onClick={() => window.location.href = 'http://localhost:5173/mlm#:~:text=%F0%9F%91%A5-,Referral,-%F0%9F%86%94%20KYC'}
                  className="w-full bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  🌳 Vai alla Rete
                </button>
              </div>

              {/* Referral */}
              <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">👥</span>
                  <h4 className="text-lg font-semibold">Referral</h4>
                </div>
                <p className="text-blue-100 mb-4 text-sm">
                  Gestisci i tuoi referral e inviti
                </p>
                <div className="text-2xl font-bold mb-2">🎯</div>
                <button
                  onClick={() => window.location.href = 'http://localhost:5173/mlm#:~:text=%F0%9F%91%A5-,Referral,-%F0%9F%86%94%20KYC'}
                  className="w-full bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  👥 Vai ai Referral
                </button>
              </div>

              {/* KYC */}
              <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">🆔</span>
                  <h4 className="text-lg font-semibold">KYC</h4>
                </div>
                <p className="text-blue-100 mb-4 text-sm">
                  Verifica la tua identità
                </p>
                <div className="text-2xl font-bold mb-2">🔐</div>
                <button
                  onClick={() => window.location.href = 'http://localhost:5173/mlm#:~:text=%F0%9F%91%A5-,Referral,-%F0%9F%86%94%20KYC'}
                  className="w-full bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  🆔 Vai al KYC
                </button>
              </div>

              {/* Comunicazioni */}
              <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">📞</span>
                  <h4 className="text-lg font-semibold">Comunicazioni</h4>
                </div>
                <p className="text-blue-100 mb-4 text-sm">
                  Messaggi e notifiche
                </p>
                <div className="text-2xl font-bold mb-2">💬</div>
                <button
                  onClick={() => window.location.href = 'http://localhost:5173/mlm#:~:text=%F0%9F%91%A5-,Referral,-%F0%9F%86%94%20KYC'}
                  className="w-full bg-white bg-opacity-25 hover:bg-opacity-35 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  📞 Vai alle Comunicazioni
                </button>
              </div>


            </div>

            {/* Quick Stats Banner */}
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">€{Math.round(statusData.totalCommissions)}</div>
                  <div className="text-sm text-blue-100">Commissioni</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{statusData.totalNetworkSize}</div>
                  <div className="text-sm text-blue-100">Network</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{(statusData.commissionRate * 100).toFixed(0)}%</div>
                  <div className="text-sm text-blue-100">Commission Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{statusData.points}</div>
                  <div className="text-sm text-blue-100">Punti</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Status Summary */}
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
        </div>
      )}
    </div>
  );
};

export default AmbassadorStatus; 