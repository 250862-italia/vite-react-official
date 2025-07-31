import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users,
  Star,
  Award,
  Target,
  BarChart3,
  CheckCircle,
  Info
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const CommissionPlansViewer = () => {
  const [commissionPlans, setCommissionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadCommissionPlans();
  }, []);

  const loadCommissionPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ambassador/commission-plans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCommissionPlans(data.data);
        if (data.data.length > 0) {
          setSelectedPlan(data.data[0]);
        }
      } else {
        setMessage({
          type: 'error',
          title: '❌ Errore',
          message: data.error || 'Errore nel caricamento dei piani commissioni.'
        });
      }
    } catch (error) {
      console.error('Errore caricamento piani:', error);
      setMessage({
        type: 'error',
        title: '❌ Errore',
        message: 'Errore di connessione.'
      });
    } finally {
      setLoading(false);
    }
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
            💰 Piani Commissioni Disponibili
          </h2>
          <p className="text-neutral-600">
            Visualizza tutti i piani commissioni attivi nel sistema
          </p>
        </div>
        <div className="text-2xl">💰</div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{message.title}</h3>
              <p className="text-sm">{message.message}</p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {commissionPlans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-lg p-6 transition-all cursor-pointer ${
              selectedPlan?.id === plan.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-neutral-200 hover:border-blue-300'
            }`}
            onClick={() => setSelectedPlan(plan)}
          >
            {/* Plan Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-800">
                  {plan.name}
                </h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Codice: {plan.code}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                plan.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {plan.isActive ? 'Attivo' : 'Inattivo'}
              </div>
            </div>

            {/* Plan Description */}
            <p className="text-neutral-600 mb-4">
              {plan.description}
            </p>

            {/* Commission Rates */}
            <div className="space-y-3">
              <h4 className="font-semibold text-neutral-800 mb-3">
                📊 Struttura Commissioni
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 bg-neutral-50 rounded">
                  <span className="text-sm font-medium">Vendita Diretta</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatPercentage(plan.directSale)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-neutral-50 rounded">
                  <span className="text-sm font-medium">Livello 1</span>
                  <span className="text-sm font-bold text-blue-600">
                    {formatPercentage(plan.level1)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-neutral-50 rounded">
                  <span className="text-sm font-medium">Livello 2</span>
                  <span className="text-sm font-bold text-purple-600">
                    {formatPercentage(plan.level2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-neutral-50 rounded">
                  <span className="text-sm font-medium">Livello 3</span>
                  <span className="text-sm font-bold text-orange-600">
                    {formatPercentage(plan.level3)}
                  </span>
                </div>
                
                {plan.level4 > 0 && (
                  <div className="flex items-center justify-between p-2 bg-neutral-50 rounded">
                    <span className="text-sm font-medium">Livello 4</span>
                    <span className="text-sm font-bold text-red-600">
                      {formatPercentage(plan.level4)}
                    </span>
                  </div>
                )}
                
                {plan.level5 > 0 && (
                  <div className="flex items-center justify-between p-2 bg-neutral-50 rounded">
                    <span className="text-sm font-medium">Livello 5</span>
                    <span className="text-sm font-bold text-pink-600">
                      {formatPercentage(plan.level5)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <h4 className="font-semibold text-neutral-800 mb-3">
                🎯 Requisiti Minimi
              </h4>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Punti Minimi</span>
                  <span className="text-sm font-bold">{plan.minPoints}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Task Completati</span>
                  <span className="text-sm font-bold">{plan.minTasks}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Vendite Minime</span>
                  <span className="text-sm font-bold">{formatCurrency(plan.minSales)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Costo Piano</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(plan.cost)}</span>
                </div>
              </div>
            </div>

            {/* Created Date */}
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Creato: {new Date(plan.createdAt).toLocaleDateString('it-IT')}</span>
                <span>Aggiornato: {new Date(plan.updatedAt).toLocaleDateString('it-IT')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Plan Details */}
      {selectedPlan && (
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-neutral-800">
              📋 Dettagli Piano Selezionato: {selectedPlan.name}
            </h3>
            <div className="text-2xl">🎯</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-neutral-800 mb-3">
                💡 Informazioni Generali
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Nome Piano:</span>
                  <span className="text-sm font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Codice:</span>
                  <span className="text-sm font-medium">{selectedPlan.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Stato:</span>
                  <span className={`text-sm font-medium ${
                    selectedPlan.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedPlan.isActive ? 'Attivo' : 'Inattivo'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-neutral-800 mb-3">
                📈 Performance
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Commissione Diretta:</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatPercentage(selectedPlan.directSale)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Commissione Totale Max:</span>
                  <span className="text-sm font-bold text-blue-600">
                    {formatPercentage(
                      selectedPlan.directSale + 
                      selectedPlan.level1 + 
                      selectedPlan.level2 + 
                      selectedPlan.level3 + 
                      selectedPlan.level4 + 
                      selectedPlan.level5
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-neutral-600">
              <Info className="inline w-4 h-4 mr-1" />
              Questo piano è gestito dall'amministrazione e può essere aggiornato in qualsiasi momento.
              Le commissioni vengono calcolate automaticamente in base a questo piano.
            </p>
          </div>
        </div>
      )}

      {/* No Plans Message */}
      {commissionPlans.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-neutral-800 mb-2">
            Nessun Piano Disponibile
          </h3>
          <p className="text-neutral-600">
            Al momento non ci sono piani commissioni attivi nel sistema.
          </p>
        </div>
      )}
    </div>
  );
};

export default CommissionPlansViewer; 