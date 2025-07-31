import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api';
import { CheckCircle, XCircle, RefreshCw, CreditCard } from 'lucide-react';

const CommissionPaymentAuthorizationManager = () => {
  const [isPaymentAuthorized, setIsPaymentAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadPaymentAuthorization();
  }, []);

  const loadPaymentAuthorization = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/admin/commission-payment/authorization-status'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setIsPaymentAuthorized(response.data.data.isPaymentAuthorized);
      } else {
        setError('Errore nel caricamento dello stato di autorizzazione');
      }
    } catch (err) {
      console.error('❌ Errore caricamento autorizzazione pagamento:', err);
      setError('Errore nel caricamento dello stato di autorizzazione');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizationToggle = async () => {
    try {
      setUpdating(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.put(getApiUrl('/admin/commission-payment/authorize'), {
        isPaymentAuthorized: !isPaymentAuthorized
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setIsPaymentAuthorized(!isPaymentAuthorized);
        console.log('✅ Autorizzazione pagamento aggiornata:', response.data.message);
      } else {
        setError('Errore nell\'aggiornamento dell\'autorizzazione');
      }
    } catch (err) {
      console.error('❌ Errore aggiornamento autorizzazione pagamento:', err);
      setError('Errore nell\'aggiornamento dell\'autorizzazione');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (isAuthorized) => {
    return isAuthorized 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const getStatusIcon = (isAuthorized) => {
    return isAuthorized ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            💰 Autorizzazione Pagamento Commissioni
          </h2>
          <p className="text-gray-600">
            Gestisci l'autorizzazione per il pagamento delle commissioni da parte degli ambassador
          </p>
        </div>
        <button
          onClick={loadPaymentAuthorization}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Aggiorna</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <CreditCard className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Pagamento Commissioni</h3>
                <p className="text-gray-600">Stato attuale del sistema di pagamento</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(isPaymentAuthorized)}`}>
                {getStatusIcon(isPaymentAuthorized)}
                <span className="ml-2">
                  {isPaymentAuthorized ? 'Autorizzato' : 'Non Autorizzato'}
                </span>
              </span>
            </div>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Stato:</strong> {isPaymentAuthorized ? 'Attivo' : 'Inattivo'}</p>
              <p><strong>Impatto:</strong> {isPaymentAuthorized 
                ? 'Gli ambassador possono richiedere il pagamento delle commissioni' 
                : 'Gli ambassador vedranno "Diventa Ambassador" (bottone viola)'
              }</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAuthorizationToggle}
              disabled={updating}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isPaymentAuthorized
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {updating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Aggiornando...</span>
                </div>
              ) : (
                <span>
                  {isPaymentAuthorized ? 'Disautorizza' : 'Autorizza'}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Come Funziona</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Non Autorizzato:</strong> Gli ambassador vedono "Diventa Ambassador" (bottone viola)</li>
          <li>• <strong>Autorizzato:</strong> Gli ambassador vedono "Richiedi Pagamento" (bottone verde)</li>
          <li>• Solo l'admin può cambiare lo stato di autorizzazione</li>
          <li>• Le modifiche sono immediate per tutti gli ambassador</li>
          <li>• Il sistema controlla automaticamente lo stato prima di ogni richiesta</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Attenzione</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• L'autorizzazione del pagamento è globale per tutti gli ambassador</li>
          <li>• Quando disabilitato, nessun ambassador può richiedere pagamenti</li>
          <li>• Le commissioni continuano ad accumularsi anche quando disabilitato</li>
          <li>• Riabilita l'autorizzazione per permettere i pagamenti</li>
        </ul>
      </div>
    </div>
  );
};

export default CommissionPaymentAuthorizationManager; 