import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  Star,
  Award,
  Target,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { getApiUrl } from '../../config/api';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const NetworkVisualizer = () => {
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('all');

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user'))?.id;
      
      console.log('🔍 NetworkVisualizer - Token:', token ? 'Presente' : 'Mancante');
      console.log('🔍 NetworkVisualizer - User ID:', userId);
      
      if (!userId) {
        console.error('❌ User ID non trovato');
        setLoading(false);
        return;
      }
      
      if (!token) {
        console.error('❌ Token non trovato');
        setLoading(false);
        return;
      }
      
      const url = getApiUrl(`/ambassador/network/${userId}`);
      console.log('🔍 NetworkVisualizer - URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 NetworkVisualizer - Response status:', response.status);
      
      const data = await response.json();
      console.log('🔍 NetworkVisualizer - Response data:', data);
      
      if (data.success) {
        setNetworkData(data.data);
        console.log('✅ NetworkVisualizer - Dati caricati con successo');
      } else {
        console.error('❌ NetworkVisualizer - API error:', data.error);
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento dati rete:', error);
    } finally {
      setLoading(false);
    }
  };



  const getPlanColor = (plan) => {
    switch (plan) {
      case 'ambassador':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pentagame':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlanIcon = (plan) => {
    switch (plan) {
      case 'ambassador':
        return '🌊';
      case 'pentagame':
        return '⭐';
      default:
        return '👤';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!networkData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500">Errore nel caricamento della rete</p>
      </div>
    );
  }

  const { userNetwork, networkMembers, networkByLevel, totalMembers, levels } = networkData;

  // Gestione difensiva per evitare errori
  const safeNetworkMembers = networkMembers || [];
  const safeNetworkByLevel = networkByLevel || {};
  const safeTotalMembers = totalMembers || 0;
  const safeLevels = levels || 0;

  // Filtra membri per livello selezionato
  const filteredMembers = selectedLevel === 'all' 
    ? safeNetworkMembers 
    : safeNetworkMembers.filter(member => member.level === parseInt(selectedLevel));

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">
            🌐 Struttura Rete MLM
          </h2>
          <p className="text-neutral-600">
            Visualizza la tua rete e le commissioni multi-livello
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {safeTotalMembers} membri
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {safeLevels} livelli
          </div>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stats-card">
          <div className="stats-icon bg-blue-100 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div className="stats-content">
            <div className="stats-number text-blue-600">{safeTotalMembers}</div>
            <div className="stats-label">Membri Totali</div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon bg-green-100 text-green-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="stats-content">
            <div className="stats-number text-green-600">{safeLevels}</div>
            <div className="stats-label">Livelli Attivi</div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon bg-purple-100 text-purple-600">
            <Star className="h-5 w-5" />
          </div>
          <div className="stats-content">
            <div className="stats-number text-purple-600">
              {safeNetworkMembers.filter(m => m.plan === 'pentagame').length}
            </div>
            <div className="stats-label">Pentagame</div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon bg-orange-100 text-orange-600">
            <Award className="h-5 w-5" />
          </div>
          <div className="stats-content">
            <div className="stats-number text-orange-600">
              {safeNetworkMembers.filter(m => m.plan === 'ambassador').length}
            </div>
            <div className="stats-label">Ambassador</div>
          </div>
        </div>
      </div>

      {/* Level Filter */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-3">
          📊 Filtra per Livello
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedLevel('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedLevel === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tutti i Livelli
          </button>
          {Object.keys(safeNetworkByLevel).map(level => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedLevel === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Livello {level}
            </button>
          ))}
        </div>
      </div>

      {/* Network Structure */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          👥 Membri della Rete
        </h3>
        
        {filteredMembers.length > 0 ? (
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div key={member.id} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">
                      {getPlanIcon(member.plan)}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-800">
                        {member.user ? `${member.user.firstName} ${member.user.lastName}` : `Membro ${member.userId}`}
                      </div>
                      <div className="text-sm text-neutral-600">
                        {member.user?.email || 'email@example.com'}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPlanColor(member.plan)}`}>
                          {member.plan === 'ambassador' ? 'MY.PENTASHOP.WORLD AMBASSADOR' : 'PENTAGAME'}
                        </span>
                        <span className="text-xs text-neutral-500">
                          Livello {member.level}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-neutral-600">
                        {member.downline.length} referral
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      Registrato: {new Date(member.joinDate).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </div>
                
                {/* Network Path */}
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center space-x-2 text-xs text-neutral-600">
                    <span>Percorso:</span>
                    {member.upline.length > 0 ? (
                      member.upline.map((uplineId, index) => (
                        <React.Fragment key={uplineId}>
                          <span className="text-blue-600">Livello {index + 1}</span>
                          {index < member.upline.length - 1 && <span>→</span>}
                        </React.Fragment>
                      ))
                    ) : (
                      <span className="text-green-600">Diretto</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🌐</div>
            <p className="text-neutral-600">
              Nessun membro trovato per questo livello
            </p>
          </div>
        )}
      </div>

      {/* Level Breakdown */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          📈 Distribuzione per Livello
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(networkByLevel).map(([level, members]) => (
            <div key={level} className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">
                    {level === '0' ? '👑' : '🌐'}
                  </div>
                  <div>
                    <div className="font-semibold text-blue-800">
                      {level === '0' ? 'Tu' : `${level}° Livello`}
                    </div>
                    <div className="text-xs text-blue-600">
                      {members.length} membri
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">
                    {members.length}
                  </div>
                  <div className="text-xs text-blue-600">
                    membri
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                {members.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-700">
                      {member.user ? `${member.user.firstName} ${member.user.lastName}` : `Membro ${member.userId}`}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getPlanColor(member.plan)}`}>
                      {member.plan}
                    </span>
                  </div>
                ))}
                {members.length > 3 && (
                  <div className="text-xs text-neutral-500 text-center">
                    +{members.length - 3} altri
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Potential */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          💰 Potenziale Commissioni
        </h3>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-green-800 mb-2">🌊 Ambassador</h4>
              <div className="space-y-1 text-sm text-green-700">
                <div>• Vendita diretta: 20%</div>
                <div>• 1° livello: 6%</div>
                <div>• 2° livello: 5%</div>
                <div>• 3° livello: 4%</div>
                <div>• 4° livello: 3%</div>
                <div>• 5° livello: 2%</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-purple-800 mb-2">⭐ Pentagame</h4>
              <div className="space-y-1 text-sm text-purple-700">
                <div>• Vendita diretta: 31,5%</div>
                <div>• 1° livello: 5,5%</div>
                <div>• 2° livello: 3,8%</div>
                <div>• 3° livello: 1,8%</div>
                <div>• 4° livello: 1%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkVisualizer; 