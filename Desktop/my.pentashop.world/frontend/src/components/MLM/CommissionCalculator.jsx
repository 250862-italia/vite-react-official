import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Users,
  Star,
  Award,
  Target,
  BarChart3
} from 'lucide-react';
import { formatCurrency, formatPercentage, safeCalculate } from '../../utils/formatters';

const CommissionCalculator = () => {
  const [saleAmount, setSaleAmount] = useState(1000);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [sellerId, setSellerId] = useState(1);
  const [calculationResult, setCalculationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [commissionPlans, setCommissionPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

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
      }
    } catch (error) {
      console.error('Errore caricamento piani:', error);
    } finally {
      setPlansLoading(false);
    }
  };

  const calculateCommission = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mlm/calculate-commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          saleAmount: parseFloat(saleAmount),
          sellerId: parseInt(sellerId),
          productType: 'Prodotto Eco-Friendly'
        })
      });

      const data = await response.json();
      if (data.success) {
        setCalculationResult(data.data);
      }
    } catch (error) {
      console.error('Errore nel calcolo commissioni:', error);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    if (saleAmount > 0) {
      calculateCommission();
    }
  }, [saleAmount, sellerId]);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">
            🧮 Calcolatore Commissioni MLM
          </h2>
          <p className="text-neutral-600">
            Calcola le commissioni in tempo reale per entrambi i piani
          </p>
        </div>
        <div className="text-2xl">🧮</div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            💰 Importo Vendita
          </label>
          <input
            type="number"
            value={saleAmount}
            onChange={(e) => setSaleAmount(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1000"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            👤 ID Venditore
          </label>
          <select
            value={sellerId}
            onChange={(e) => setSellerId(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>Mario Rossi (Ambassador)</option>
            <option value={2}>Admin System (Pentagame)</option>
            <option value={3}>Giulia Bianchi (MLM Ambassador)</option>
          </select>
        </div>
      </div>

      {/* Plan Selection */}
      {!plansLoading && commissionPlans.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-neutral-800 mb-4">
            🎯 Scegli il tuo Piano Commissioni
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {commissionPlans.map((plan, index) => (
              <div 
                key={plan.id}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedPlan?.id === plan.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-neutral-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                {selectedPlan?.id === plan.id && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                    ✓
                  </div>
                )}
                
                <div className="text-center mb-3">
                  <div className="text-2xl mb-2">
                    {index === 0 ? '🌊' : index === 1 ? '⭐' : '🏆'}
                  </div>
                  <h4 className="font-bold text-lg text-neutral-800">
                    {plan.name}
                  </h4>
                  <div className="text-sm text-neutral-600">
                    {plan.description?.split('\n')[0] || 'Piano commissioni'}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Vendita Diretta:</span>
                    <span className="font-bold text-green-600">
                      {formatPercentage(plan.directSale)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">1° Livello:</span>
                    <span className="font-semibold text-blue-600">
                      {formatPercentage(plan.level1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">2° Livello:</span>
                    <span className="font-semibold text-blue-600">
                      {formatPercentage(plan.level2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">3° Livello:</span>
                    <span className="font-semibold text-blue-600">
                      {formatPercentage(plan.level3)}
                    </span>
                  </div>
                  
                  <div className="border-t border-neutral-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Costo Piano:</span>
                      <span className="font-bold text-purple-600">
                        {formatCurrency(plan.cost)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan(plan);
                    }}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      selectedPlan?.id === plan.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-blue-100 hover:text-blue-700'
                    }`}
                  >
                    {selectedPlan?.id === plan.id ? 'Piano Selezionato' : 'Seleziona Piano'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Comparison */}
      {selectedPlan && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">
            🎯 Benefici del Piano Selezionato: {selectedPlan.name}
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-800 mb-3">💰 Struttura Commissioni</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Vendita Diretta:</span>
                    <span className="font-bold text-green-600">{formatPercentage(selectedPlan.directSale)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">1° Livello (Team):</span>
                    <span className="font-semibold text-blue-600">{formatPercentage(selectedPlan.level1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">2° Livello:</span>
                    <span className="font-semibold text-blue-600">{formatPercentage(selectedPlan.level2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">3° Livello:</span>
                    <span className="font-semibold text-blue-600">{formatPercentage(selectedPlan.level3)}</span>
                  </div>
                  {selectedPlan.level4 > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">4° Livello:</span>
                      <span className="font-semibold text-blue-600">{formatPercentage(selectedPlan.level4)}</span>
                    </div>
                  )}
                  {selectedPlan.level5 > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">5° Livello:</span>
                      <span className="font-semibold text-blue-600">{formatPercentage(selectedPlan.level5)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-purple-800 mb-3">🎁 Incluso nel Piano</h4>
                <div className="space-y-2 text-sm text-purple-700">
                  {selectedPlan.description?.split('\n').map((line, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{line.trim()}</span>
                    </div>
                  )) || (
                    <>
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Accesso al sistema MLM completo</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Strumenti di gestione rete</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Supporto dedicato</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Formazione continua</span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-purple-800">Costo Piano:</span>
                    <span className="text-xl font-bold text-purple-600">{formatCurrency(selectedPlan.cost)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Plan Selected Message */}
      {!selectedPlan && !plansLoading && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-neutral-800 mb-2">
            Seleziona un Piano per Iniziare
          </h3>
          <p className="text-neutral-600 mb-4">
            Scegli il piano commissioni che preferisci per calcolare le tue potenziali commissioni
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="text-sm text-blue-800">
              <div className="font-semibold mb-2">💡 Come funziona:</div>
              <div className="space-y-1">
                <div>• Seleziona un piano commissioni</div>
                <div>• Inserisci l'importo della vendita</div>
                <div>• Visualizza i risultati in tempo reale</div>
                <div>• Confronta i diversi piani disponibili</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculation Results */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Calcolando commissioni...</p>
        </div>
      ) : calculationResult && selectedPlan ? (
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">
            💰 Risultati Calcolo
          </h3>
          
          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-blue-800">
                📊 Risultati Calcolo - Piano: {selectedPlan.name}
              </h4>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {formatPercentage(selectedPlan.directSale)} diretta
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(calculationResult.sale.amount)}
                </div>
                <div className="text-sm text-blue-600">Importo Vendita</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculationResult.totalCommissions)}
                </div>
                <div className="text-sm text-green-600">Commissioni Totali</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {calculationResult.summary.commissionPercentage}%
                </div>
                <div className="text-sm text-purple-600">% Commissione</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(selectedPlan.cost)}
                </div>
                <div className="text-sm text-orange-600">Costo Piano</div>
              </div>
            </div>
          </div>

          {/* Commission Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commission Details */}
            <div>
              <h4 className="font-semibold text-neutral-800 mb-3">
                📋 Dettaglio Commissioni
              </h4>
              <div className="space-y-3">
                {calculationResult.calculatedCommissions.map((commission, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {commission.type === 'direct_sale' ? '💰' : '🌐'}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-800">
                          {commission.description}
                        </div>
                        <div className="text-sm text-neutral-600">
                          {commission.plan} • Livello {commission.level}
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

            {/* Commission by Level */}
            <div>
              <h4 className="font-semibold text-neutral-800 mb-3">
                📊 Commissioni per Livello
              </h4>
              <div className="space-y-3">
                {Object.entries(calculationResult.commissionsByLevel).map(([level, commissions]) => (
                  <div key={level} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="text-xl">
                          {level === '0' ? '💰' : '🌐'}
                        </div>
                        <div>
                          <div className="font-semibold text-blue-800">
                            {level === '0' ? 'Vendita Diretta' : `${level.split('_')[1]}° Livello`}
                          </div>
                          <div className="text-xs text-blue-600">
                            {commissions.length} commissioni
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">
                          {formatCurrency(commissions.reduce((sum, c) => sum + c.commissionAmount, 0))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(commissions.reduce((sum, c) => sum + c.commissionAmount, 0) / calculationResult.totalCommissions) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Network Impact */}
          <div className="mt-6">
            <h4 className="font-semibold text-neutral-800 mb-3">
              🌐 Impatto sulla Rete
            </h4>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-semibold text-green-800 mb-2">🌊 Ambassador</h5>
                  <div className="space-y-1 text-sm text-green-700">
                    <div>• Vendita diretta: {formatCurrency(calculationResult.sale.amount * 0.20)}</div>
                    <div>• 1° livello: {formatCurrency(calculationResult.sale.amount * 0.06)}</div>
                    <div>• 2° livello: {formatCurrency(calculationResult.sale.amount * 0.05)}</div>
                    <div>• 3° livello: {formatCurrency(calculationResult.sale.amount * 0.04)}</div>
                    <div>• 4° livello: {formatCurrency(calculationResult.sale.amount * 0.03)}</div>
                    <div>• 5° livello: {formatCurrency(calculationResult.sale.amount * 0.02)}</div>
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold text-purple-800 mb-2">⭐ Pentagame</h5>
                  <div className="space-y-1 text-sm text-purple-700">
                    <div>• Vendita diretta: {formatCurrency(calculationResult.sale.amount * 0.315)}</div>
                    <div>• 1° livello: {formatCurrency(calculationResult.sale.amount * 0.055)}</div>
                    <div>• 2° livello: {formatCurrency(calculationResult.sale.amount * 0.038)}</div>
                    <div>• 3° livello: {formatCurrency(calculationResult.sale.amount * 0.018)}</div>
                    <div>• 4° livello: {formatCurrency(calculationResult.sale.amount * 0.01)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CommissionCalculator; 