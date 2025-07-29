import React, { useState, useEffect } from 'react';
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
  Award
} from 'lucide-react';

const CommissionTracker = () => {
  const [commissionData, setCommissionData] = useState(null);
  const [mlmData, setMlmData] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('ambassador');

  useEffect(() => {
    fetchCommissionData();
    fetchMLMData();
    fetchPlans();
  }, []);

  const fetchCommissionData = async () => {
    try {
      const response = await fetch('/api/mlm/commissions');
      const data = await response.json();
      
      if (data.success) {
        setCommissionData(data.data);
      }
    } catch (error) {
      console.error('Errore nel caricamento dati commissioni:', error);
    }
  };

  const fetchMLMData = async () => {
    try {
      const response = await fetch('/api/mlm/commissions-advanced');
      const data = await response.json();
      
      if (data.success) {
        setMlmData(data.data);
      }
    } catch (error) {
      console.error('Errore nel caricamento dati MLM:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ambassador/commission-plans', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Errore nel caricamento piani:', error);
    }
  };

  const handleRequestPayment = async () => {
    try {
      const response = await fetch('/api/mlm/request-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentMessage({
          type: 'success',
          title: '✅ Pagamento Richiesto!',
          message: data.message,
          details: `Importo: €${data.data.totalAmount} • Commissioni: ${data.data.commissionsCount} • Tempo stimato: ${data.data.estimatedProcessingTime}`
        });
        
        fetchCommissionData();
        fetchMLMData();
      } else {
        setPaymentMessage({
          type: 'error',
          title: '❌ Errore',
          message: data.error
        });
      }
    } catch (error) {
      setPaymentMessage({
        type: 'error',
        title: '❌ Errore',
        message: 'Errore nella richiesta di pagamento'
      });
    }
    
    setShowPaymentModal(false);
    
    setTimeout(() => {
      setPaymentMessage(null);
    }, 5000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (rate) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!mlmData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500">Errore nel caricamento dei dati MLM</p>
      </div>
    );
  }

  const { stats, commissions, commissionsByLevel, plan } = mlmData;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">
            💰 Sistema Commissioni MLM
          </h2>
          <p className="text-neutral-600">
            {plan?.name || 'WASH THE WORLD AMBASSADOR'}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn btn-primary btn-sm"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Richiedi Pagamento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-neutral-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-neutral-800 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-800'
          }`}
        >
          📊 Panoramica
        </button>
        <button
          onClick={() => setActiveTab('levels')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'levels'
              ? 'bg-white text-neutral-800 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-800'
          }`}
        >
          🌐 Livelli Rete
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'plans'
              ? 'bg-white text-neutral-800 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-800'
          }`}
        >
          📋 Piani Commissioni
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="stats-card">
              <div className="stats-icon bg-green-100 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="stats-content">
                <div className="stats-number text-green-600">
                  {formatCurrency(stats.totalEarned)}
                </div>
                <div className="stats-label">Commissioni Totali</div>
              </div>
            </div>
            
            <div className="stats-card">
              <div className="stats-icon bg-blue-100 text-blue-600">
                <Clock className="h-5 w-5" />
              </div>
              <div className="stats-content">
                <div className="stats-number text-blue-600">
                  {formatCurrency(stats.pendingAmount)}
                </div>
                <div className="stats-label">In Attesa</div>
              </div>
            </div>
            
            <div className="stats-card">
              <div className="stats-icon bg-purple-100 text-purple-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="stats-content">
                <div className="stats-number text-purple-600">
                  {formatCurrency(stats.paidAmount)}
                </div>
                <div className="stats-label">Pagate</div>
              </div>
            </div>
            
            <div className="stats-card">
              <div className="stats-icon bg-orange-100 text-orange-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="stats-content">
                <div className="stats-number text-orange-600">
                  {formatCurrency(stats.thisMonth)}
                </div>
                <div className="stats-label">Questo Mese</div>
              </div>
            </div>
          </div>

          {/* Plan Rates */}
          {plan && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-3">
                🎯 Tassi Commissione - {plan.name}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="text-center">
                  <div className="font-bold text-blue-600">
                    {formatPercentage(plan.levels.direct_sale)}
                  </div>
                  <div className="text-xs text-blue-600">Vendita Diretta</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">
                    {formatPercentage(plan.levels.level_1)}
                  </div>
                  <div className="text-xs text-blue-600">1° Livello</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">
                    {formatPercentage(plan.levels.level_2)}
                  </div>
                  <div className="text-xs text-blue-600">2° Livello</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">
                    {formatPercentage(plan.levels.level_3)}
                  </div>
                  <div className="text-xs text-blue-600">3° Livello</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">
                    {formatPercentage(plan.levels.level_4)}
                  </div>
                  <div className="text-xs text-blue-600">4° Livello</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">
                    {formatPercentage(plan.levels.level_5 || 0)}
                  </div>
                  <div className="text-xs text-blue-600">5° Livello</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Commissions */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">
              📋 Commissioni Recenti
            </h3>
            <div className="space-y-3">
              {commissions.slice(0, 5).map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {commission.type === 'direct_sale' ? '💰' : '🌐'}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-800">
                        {commission.description}
                      </div>
                      <div className="text-sm text-neutral-600">
                        {new Date(commission.date).toLocaleDateString('it-IT')} • 
                        Livello {commission.level} • {commission.plan}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {formatCurrency(commission.commissionAmount)}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {formatPercentage(commission.rate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Levels Tab */}
      {activeTab === 'levels' && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">
            🌐 Commissioni per Livello
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(commissionsByLevel).map(([level, data]) => (
              <div key={level} className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl">
                      {level === 'level_0' ? '💰' : '🌐'}
                    </div>
                    <div>
                      <div className="font-semibold text-blue-800">
                        {level === 'level_0' ? 'Vendita Diretta' : `${level.split('_')[1]}° Livello`}
                      </div>
                      <div className="text-xs text-blue-600">
                        {data.count} commissioni
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">
                      {formatCurrency(data.amount)}
                    </div>
                    <div className="text-xs text-blue-600">
                      {formatPercentage(data.rate)}
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(data.amount / stats.totalEarned) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && plans && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">
            📋 Confronto Piani Commissioni
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ambassador Plan */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-green-800">
                  🌊 WASH THE WORLD AMBASSADOR
                </h4>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Piano Base
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Vendita Diretta:</span>
                  <span className="font-bold text-green-800">20%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">1° Livello:</span>
                  <span className="font-bold text-green-800">6%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">2° Livello:</span>
                  <span className="font-bold text-green-800">5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">3° Livello:</span>
                  <span className="font-bold text-green-800">4%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">4° Livello:</span>
                  <span className="font-bold text-green-800">3%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">5° Livello:</span>
                  <span className="font-bold text-green-800">2%</span>
                </div>
              </div>
              
              <div className="border-t border-green-200 pt-4">
                <h5 className="font-semibold text-green-800 mb-2">Requisiti:</h5>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Minimo {plans.ambassador.requirements.min_points} punti</li>
                  <li>• {plans.ambassador.requirements.min_tasks} task completati</li>
                  <li>• €{plans.ambassador.requirements.min_sales} vendite minime</li>
                </ul>
              </div>
            </div>

            {/* Pentagame Plan */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-purple-800">
                  ⭐ PENTAGAME
                </h4>
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  Piano Premium
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-purple-700">Vendita Diretta:</span>
                  <span className="font-bold text-purple-800">31,5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-700">1° Livello:</span>
                  <span className="font-bold text-purple-800">5,5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-700">2° Livello:</span>
                  <span className="font-bold text-purple-800">3,8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-700">3° Livello:</span>
                  <span className="font-bold text-purple-800">1,8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-700">4° Livello:</span>
                  <span className="font-bold text-purple-800">1%</span>
                </div>
              </div>
              
              <div className="border-t border-purple-200 pt-4">
                <h5 className="font-semibold text-purple-800 mb-2">Requisiti:</h5>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Minimo {plans.pentagame.requirements.min_points} punti</li>
                  <li>• {plans.pentagame.requirements.min_tasks} task completati</li>
                  <li>• €{plans.pentagame.requirements.min_sales} vendite minime</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">
              💳 Richiedi Pagamento
            </h3>
            <p className="text-neutral-600 mb-4">
              Richiedi il pagamento delle commissioni in attesa. Il pagamento verrà processato entro 3-5 giorni lavorativi.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleRequestPayment}
                className="btn btn-primary flex-1"
              >
                Conferma
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn btn-outline flex-1"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Message */}
      {paymentMessage && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          paymentMessage.type === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800' 
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          <div className="font-semibold">{paymentMessage.title}</div>
          <div className="text-sm">{paymentMessage.message}</div>
          {paymentMessage.details && (
            <div className="text-xs mt-1 opacity-75">{paymentMessage.details}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommissionTracker; 