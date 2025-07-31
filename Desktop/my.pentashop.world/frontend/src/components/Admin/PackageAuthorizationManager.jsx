import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const PackageAuthorizationManager = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/admin/packages/authorization-status'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setPackages(response.data.data);
      } else {
        setError('Errore nel caricamento dei pacchetti');
      }
    } catch (err) {
      console.error('❌ Errore caricamento pacchetti:', err);
      setError('Errore nel caricamento dei pacchetti');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizationToggle = async (packageId, currentStatus) => {
    try {
      setUpdating(packageId);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.put(getApiUrl(`/admin/packages/${packageId}/authorize`), {
        isAuthorized: !currentStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Aggiorna lo stato locale
        setPackages(prevPackages => 
          prevPackages.map(pkg => 
            pkg.id === packageId 
              ? { ...pkg, isAuthorized: !currentStatus }
              : pkg
          )
        );
        
        console.log('✅ Pacchetto aggiornato:', response.data.message);
      } else {
        setError('Errore nell\'aggiornamento del pacchetto');
      }
    } catch (err) {
      console.error('❌ Errore aggiornamento pacchetto:', err);
      setError('Errore nell\'aggiornamento del pacchetto');
    } finally {
      setUpdating(null);
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
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            🔓 Autorizzazione Pacchetti MLM
          </h2>
          <p className="text-gray-600">
            Gestisci l'autorizzazione per l'acquisto dei pacchetti da parte degli ambassador
          </p>
        </div>
        <button
          onClick={loadPackages}
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

      <div className="space-y-4">
        {packages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nessun pacchetto disponibile
          </div>
        ) : (
          packages.map((pkg) => (
            <div key={pkg.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{pkg.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(pkg.isAuthorized)}`}>
                      {getStatusIcon(pkg.isAuthorized)}
                      <span className="ml-1">
                        {pkg.isAuthorized ? 'Autorizzato' : 'Non Autorizzato'}
                      </span>
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p><strong>ID:</strong> {pkg.id}</p>
                    <p><strong>Stato:</strong> {pkg.isActive ? 'Attivo' : 'Inattivo'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleAuthorizationToggle(pkg.id, pkg.isAuthorized)}
                    disabled={updating === pkg.id}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pkg.isAuthorized
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    } disabled:opacity-50`}
                  >
                    {updating === pkg.id ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Aggiornando...</span>
                      </div>
                    ) : (
                      <span>
                        {pkg.isAuthorized ? 'Disautorizza' : 'Autorizza'}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Descrizione:</strong> {pkg.isAuthorized 
                    ? 'Gli ambassador possono acquistare questo pacchetto' 
                    : 'Gli ambassador vedranno "Richiedi Pagamento" (bottone viola)'
                  }
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Come Funziona</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Non Autorizzato:</strong> Gli ambassador vedono "Richiedi Pagamento" (bottone viola)</li>
          <li>• <strong>Autorizzato:</strong> Gli ambassador vedono "Acquista Pacchetto" (bottone verde)</li>
          <li>• Solo l'admin può cambiare lo stato di autorizzazione</li>
          <li>• Le modifiche sono immediate per tutti gli ambassador</li>
        </ul>
      </div>
    </div>
  );
};

export default PackageAuthorizationManager; 