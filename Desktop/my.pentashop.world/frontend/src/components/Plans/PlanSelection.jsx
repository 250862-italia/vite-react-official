import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../../config/api';

const PlanSelection = ({ onPlanSelected }) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [processing, setProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

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
      const response = await axios.get(getApiUrl('/plans'));
      
      if (response.data.success) {
        setPlans(response.data.data);
      } else {
        setError('Errore nel caricamento dei piani');
      }
    } catch (error) {
      console.error('Errore caricamento piani:', error);
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

      const response = await axios.post(getApiUrl('/plans/select'), {
        planId: selectedPlan.id,
        paymentMethod: paymentMethod
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        if (paymentMethod === 'bank_transfer') {
          // Per bonifico, mostra i dettagli bancari
          showBankTransferDetails(response.data.data);
          setPurchaseSuccess(true);
        } else {
          // Per altri metodi, redirect al checkout
          window.open(response.data.data.checkoutUrl, '_blank');
          setPurchaseSuccess(true);
        }
      } else {
        setError('Errore durante la selezione del piano');
      }
    } catch (error) {
      console.error('Errore acquisto piano:', error);
      setError(error.response?.data?.error || 'Errore di connessione');
    } finally {
      setProcessing(false);
    }
  };

  const showBankTransferDetails = (bankData) => {
    const details = `
🏦 DETTAGLI BONIFICO

Banca: ${bankData.bankDetails.bankName}
Intestatario: ${bankData.bankDetails.accountName}
IBAN: ${bankData.bankDetails.iban}
SWIFT: ${bankData.bankDetails.swiftCode}
Importo: €${bankData.bankDetails.amount}
Causale: ${bankData.bankDetails.reference}

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
        <div className="relative mb-12">
          {/* Pulsante Ritorno */}
          <button
            onClick={() => navigate('/dashboard')}
            className="absolute left-0 top-0 flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg shadow-sm border transition-colors"
          >
            <span className="text-xl">←</span>
            <span className="font-medium">Torna alla Dashboard</span>
          </button>
          
          {/* Titolo Centrato */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              💳 Scegli il tuo Piano
            </h1>
            <p className="text-xl text-gray-600">
              Seleziona il piano che meglio si adatta alle tue esigenze
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {purchaseSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-green-600 text-2xl mr-3">✅</span>
              <div>
                <p className="text-green-800 font-semibold">Acquisto Iniziato!</p>
                <p className="text-green-600 text-sm">
                  {paymentMethod === 'bank_transfer' 
                    ? 'Controlla i dettagli del bonifico mostrati sopra.'
                    : 'Sei stato reindirizzato alla pagina di pagamento.'
                  }
                </p>
              </div>
            </div>
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
                <p className="text-gray-600 mb-4">{plan.duration}</p>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">📊 Caratteristiche del Piano</h4>
                <div className="grid grid-cols-1 gap-3">
                  {/* Commissioni */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h5 className="font-medium text-blue-800 mb-2">💰 Commissioni</h5>
                    <div className="space-y-1">
                      {plan.features.slice(0, 6).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <span className="text-blue-500 mr-2">•</span>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Requisiti */}
                  <div className="bg-green-50 rounded-lg p-3">
                    <h5 className="font-medium text-green-800 mb-2">📋 Requisiti</h5>
                    <div className="space-y-1">
                      {plan.features.slice(6).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <span className="text-green-500 mr-2">•</span>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                {plan.popular && (
                  <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg mb-4">
                    ⭐ Più Popolare
                  </div>
                )}
                
                {selectedPlan?.id === plan.id ? (
                  <div className="space-y-2">
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                      ✅ Piano Selezionato
                    </div>
                    <button
                      onClick={() => setSelectedPlan(null)}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      🔄 Cambia Piano
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handlePlanSelect(plan)}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    🛒 Seleziona Piano
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Metodo di Pagamento */}
        {!selectedPlan && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Seleziona un Piano
              </h3>
              <p className="text-blue-600">
                Scegli il piano che meglio si adatta alle tue esigenze per procedere con l'acquisto
              </p>
            </div>
          </div>
        )}
        
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
                <h3 className="font-semibold text-gray-800 mb-4">📦 Piano Selezionato</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{selectedPlan.name}</span>
                    <span className="font-bold text-blue-600">€{selectedPlan.price}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {selectedPlan.features[0]} {/* Commissione diretta */}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    {selectedPlan.description}
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <h4 className="font-medium text-gray-800 mb-2">✨ Vantaggi Principali:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {selectedPlan.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
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

        {/* Vantaggi di Salire di Categoria */}
        <div className="mt-12 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              🎯 Perché Salire di Categoria?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-3xl mb-4">💰</div>
                <h3 className="font-semibold text-gray-800 mb-2">Commissioni Maggiori</h3>
                <p className="text-gray-600 text-sm">
                  Più alto il piano, più alte le commissioni su ogni livello della tua rete
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-3xl mb-4">🌐</div>
                <h3 className="font-semibold text-gray-800 mb-2">Rete Più Profonda</h3>
                <p className="text-gray-600 text-sm">
                  Guadagni da più livelli della tua struttura MLM
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-3xl mb-4">🏆</div>
                <h3 className="font-semibold text-gray-800 mb-2">Prestigio e Status</h3>
                <p className="text-gray-600 text-sm">
                  Diventi un leader riconosciuto nella community
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messaggio Motivazionale */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
          <div className="max-w-4xl mx-auto">
            <div className="text-6xl mb-6">🚀</div>
            <h2 className="text-3xl font-bold mb-4">
              Non sei qui per restare nella media
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Scrivi al tuo sponsor, sali di categoria, e mostra chi sei davvero.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center">
                <span className="mr-2">💬</span>
                Contatta il tuo Sponsor
              </button>
              <button className="bg-yellow-400 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center">
                <span className="mr-2">⭐</span>
                Sali di Categoria
              </button>
            </div>
            <div className="mt-6 text-sm opacity-75">
              <p>💡 <strong>Consiglio:</strong> Il successo arriva quando superi i tuoi limiti</p>
            </div>
          </div>
        </div>

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