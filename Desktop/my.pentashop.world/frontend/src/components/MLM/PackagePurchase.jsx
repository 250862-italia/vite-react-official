import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const PackagePurchase = ({ user }) => {
  const [availablePackages, setAvailablePackages] = useState([]);
  const [purchasedPackages, setPurchasedPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      loadPackages();
    }
  }, [user]);

  const loadPackages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Carica pacchetti disponibili
      const availableResponse = await axios.get(getApiUrl(`/packages/available?userId=${user.id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (availableResponse.data.success) {
        setAvailablePackages(availableResponse.data.data.packages);
      } else {
        console.error('❌ Errore risposta pacchetti disponibili:', availableResponse.data);
      }

      // Carica pacchetti acquistati
      const purchasedResponse = await axios.get(getApiUrl(`/packages/purchased/${user.id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (purchasedResponse.data.success) {
        setPurchasedPackages(purchasedResponse.data.data.packages);
      } else {
        console.error('❌ Errore risposta pacchetti acquistati:', purchasedResponse.data);
      }

    } catch (err) {
      console.error('❌ Errore caricamento pacchetti:', err);
      console.error('❌ Dettagli errore:', err.response?.data);
      setError('Errore nel caricamento dei pacchetti');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    try {
      setIsPurchasing(true);
      setError(null);

      const response = await axios.post(getApiUrl('/packages/purchase'), {
        userId: user.id,
        packageId: selectedPackage.id,
        paymentMethod: paymentMethod
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setPurchaseSuccess(true);
        setSelectedPackage(null);
        // Ricarica i pacchetti
        await loadPackages();
        
        // Reset success message after 3 seconds
        setTimeout(() => setPurchaseSuccess(false), 3000);
      }

    } catch (err) {
      console.error('Errore acquisto:', err);
      setError(err.response?.data?.error || 'Errore nell\'acquisto del pacchetto');
    } finally {
      setIsPurchasing(false);
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

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-neutral-600">Caricamento pacchetti...</span>
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

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {purchaseSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          ✅ Pacchetto acquistato con successo!
        </div>
      )}

      {/* Pacchetti Disponibili */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">📦 Pacchetti Disponibili</h2>
        
        {availablePackages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nessun pacchetto disponibile al momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePackages.map((pkg) => (
              <div key={pkg.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                  <span className="text-2xl font-bold text-blue-600">€{pkg.cost || pkg.price || 0}</span>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="text-sm text-gray-600">
                    <strong>Commissioni:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• Vendita diretta: {(pkg.directSale * 100).toFixed(1)}%</li>
                      <li>• Livello 1: {(pkg.level1 * 100).toFixed(1)}%</li>
                      <li>• Livello 2: {(pkg.level2 * 100).toFixed(1)}%</li>
                      <li>• Livello 3: {(pkg.level3 * 100).toFixed(1)}%</li>
                      <li>• Livello 4: {(pkg.level4 * 100).toFixed(1)}%</li>
                      <li>• Livello 5: {(pkg.level5 * 100).toFixed(1)}%</li>
                    </ul>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <strong>Requisiti:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• Punti: {pkg.minPoints}</li>
                      <li>• Task: {pkg.minTasks}</li>
                      <li>• Vendite: €{pkg.minSales}</li>
                    </ul>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <strong>Contenuto:</strong>
                    <p className="mt-1 whitespace-pre-line">{pkg.description}</p>
                  </div>
                </div>
                
                {pkg.isAuthorized ? (
                  <button
                    onClick={() => setSelectedPackage(pkg)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Acquista Pacchetto
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg opacity-75 cursor-not-allowed"
                  >
                    Diventa Ambassador
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pacchetti Acquistati */}
      {purchasedPackages.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">✅ Pacchetti Acquistati</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchasedPackages.map((pkg, index) => (
              <div key={index} className="border border-green-200 bg-green-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{pkg.packageName}</h3>
                  <span className="text-green-600">✓ Acquistato</span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Data acquisto:</strong> {new Date(pkg.purchaseDate).toLocaleDateString()}</p>
                  <p><strong>Costo:</strong> €{pkg.cost}</p>
                  <p><strong>Commissione diretta:</strong> {(pkg.commissionRates.directSale * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Acquisto */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Acquista {selectedPackage.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Metodo di pagamento:</p>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="card">Carta di credito</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank">Bonifico bancario</option>
                </select>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Riepilogo ordine:</p>
                <p className="font-semibold text-lg">€{selectedPackage.cost}</p>
                <p className="text-sm text-gray-600">{selectedPackage.name}</p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isPurchasing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Acquisto...
                    </>
                  ) : (
                    'Conferma Acquisto'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagePurchase; 