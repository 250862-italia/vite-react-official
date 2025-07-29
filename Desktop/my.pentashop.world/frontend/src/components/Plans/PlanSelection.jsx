import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PlanSelection = ({ onPlanSelected }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [processing, setProcessing] = useState(false);

  // Metodi di pagamento disponibili
  const paymentMethods = [
    {
      id: 'stripe',
      name: 'Carta di Credito/Debito',
      icon: '💳',
      description: 'Visa, Mastercard, American Express'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: '🔗',
      description: 'Paga con il tuo account PayPal'
    },
    {
      id: 'crypto',
      name: 'Criptovalute',
      icon: '₿',
      description: 'Bitcoin, Ethereum, USDT'
    },
    {
      id: 'bank_transfer',
      name: 'Bonifico Bancario',
      icon: '🏦',
      description: 'Bonifico SEPA (1-3 giorni lavorativi)'
    }
  ];

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/plans');
      
      if (response.data.success) {
        setPlans(response.data.data);
      } else {
        setError('Errore nel caricamento dei piani');
      }
    } catch (error) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handlePaymentMethodSelect = (methodId) => {
    setPaymentMethod(methodId);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) {
      setError('Seleziona un piano');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const response = await axios.post('/api/plans/select', {
        planId: selectedPlan.id,
        paymentMethod: paymentMethod
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        if (paymentMethod === 'bank_transfer') {
          // Per bonifico, mostra i dettagli
          handleBankTransfer(response.data.data);
        } else {
          // Per altri metodi, redirect al checkout
          window.location.href = response.data.data.checkoutUrl;
        }
      } else {
        setError('Errore durante la selezione del piano');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Errore di connessione');
    } finally {
      setProcessing(false);
    }
  };

  const handleBankTransfer = async (data) => {
    try {
      const response = await axios.post('/api/payments/bank-transfer', {
        planId: selectedPlan.id,
        amount: selectedPlan.price
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        // Mostra dettagli bonifico
        showBankTransferDetails(response.data.data);
      }
    } catch (error) {
      setError('Errore nella generazione del bonifico');
    }
  };

  const showBankTransferDetails = (bankData) => {
    const details = `
🏦 DETTAGLI BONIFICO

IBAN: ${bankData.iban}
Causale: ${bankData.causale}
Importo: €${bankData.amount}
Scade il: ${new Date(bankData.expiresAt).toLocaleDateString('it-IT')}

⚠️ IMPORTANTE: Includi sempre la causale nel bonifico per identificare il pagamento.
    `;
    
    alert(details);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento piani...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            💳 Scegli il tuo Piano
          </h1>
          <p className="text-xl text-gray-600">
            Seleziona il piano che meglio si adatta alle tue esigenze
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Piani Disponibili */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg p-8 border-2 transition-all duration-300 cursor-pointer ${
                selectedPlan?.id === plan.id
                  ? 'border-blue-500 shadow-xl scale-105'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-xl'
              }`}
              onClick={() => handlePlanSelect(plan)}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {plan.name}
                </h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  €{plan.price}
                </div>
                <p className="text-gray-600">al mese</p>
              </div>

              <div className="mb-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-500 mr-3">✅</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-center">
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-600">
                    Commissione: {(plan.commissionRate * 100).toFixed(0)}%
                  </p>
                </div>
                
                {selectedPlan?.id === plan.id && (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
                    ✅ Piano Selezionato
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Metodo di Pagamento */}
        {selectedPlan && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              💳 Metodo di Pagamento
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                    paymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{method.icon}</span>
                    <span className="font-semibold text-gray-800">
                      {method.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{method.description}</p>
                  
                  {paymentMethod === method.id && (
                    <div className="mt-2">
                      <span className="text-blue-600 text-sm">✓ Selezionato</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Riepilogo e Acquisto */}
        {selectedPlan && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              📋 Riepilogo Ordine
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Piano Selezionato</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{selectedPlan.name}</span>
                    <span className="font-bold text-blue-600">€{selectedPlan.price}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Commissione: {(selectedPlan.commissionRate * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Metodo di Pagamento</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-xl mr-3">
                      {paymentMethods.find(m => m.id === paymentMethod)?.icon}
                    </span>
                    <span className="font-medium">
                      {paymentMethods.find(m => m.id === paymentMethod)?.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 mt-6 pt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-gray-800">Totale</span>
                <span className="text-2xl font-bold text-blue-600">€{selectedPlan.price}</span>
              </div>
              
              <button
                onClick={handlePurchase}
                disabled={processing}
                className="w-full bg-blue-600 text-white py-4 px-8 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {processing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Elaborazione in corso...
                  </div>
                ) : (
                  `Acquista ${selectedPlan.name}`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Informazioni Aggiuntive */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Hai domande sui piani? Contattaci per assistenza
          </p>
          <div className="flex justify-center space-x-4">
            <button className="text-blue-600 hover:text-blue-700">
              📞 Supporto
            </button>
            <button className="text-blue-600 hover:text-blue-700">
              📧 Email
            </button>
            <button className="text-blue-600 hover:text-blue-700">
              💬 Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSelection; 