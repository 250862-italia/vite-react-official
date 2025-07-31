import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import KYCForm from '../components/KYC/KYCForm';
import KYCFormSimple from '../components/KYC/KYCFormSimple';

function KYCPage() {
  const [user, setUser] = useState(null);
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
    loadKYCData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(getApiUrl('/auth/me'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Errore nel caricamento utente:', error);
      navigate('/login');
    }
  };

  const loadKYCData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(getApiUrl('/kyc/status'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setKycData(response.data.kyc || {});
      }
    } catch (error) {
      console.error('Errore nel caricamento KYC:', error);
      setError('Errore nel caricamento dei dati KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'auto_approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
      case 'auto_approved':
        return 'Approvato';
      case 'pending':
        return 'In Attesa';
      case 'rejected':
        return 'Rifiutato';
      default:
        return 'Non Inviato';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento KYC...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Torna alla Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-800">🆔 Verifica Identità (KYC)</h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Guest KYC Semplificato */}
        {user?.role === 'guest' && kycData?.status !== 'approved' && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-6">🆔</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Verifica Identità (KYC)
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Completa la verifica della tua identità per procedere con l'approvazione.
                <br />
                <strong>I tuoi dati saranno protetti e utilizzati solo per la verifica.</strong>
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📋</span>
                  <div>
                    <h3 className="font-semibold text-blue-800">Dati Richiesti:</h3>
                    <ul className="text-blue-700 mt-2 space-y-1">
                      <li>• Dati personali (nome, cognome, data di nascita, ecc.)</li>
                      <li>• Dati di contatto (indirizzo, telefono, email)</li>
                      <li>• Documenti di identità e residenza</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* KYC Form Semplificato */}
            {kycData?.status === 'not_submitted' || kycData?.status === 'in_progress' || !kycData ? (
              <KYCFormSimple 
                onKYCComplete={(kycData) => {
                  setKycData({
                    ...kycData,
                    status: 'submitted',
                    submittedAt: new Date().toISOString()
                  });
                  alert('✅ KYC inviato con successo! La verifica è in corso.');
                }}
              />
            ) : kycData?.status === 'submitted' ? (
              <div className="text-center">
                <div className="text-4xl mb-4">⏳</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">KYC Inviato</h3>
                <p className="text-gray-600 mb-6">Il tuo KYC è stato inviato e sarà verificato dall'amministratore.</p>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => navigate('/contract')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    📄 Firma Contratto
                  </button>
                  <button
                    onClick={() => navigate('/guest-dashboard')}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    🏠 Torna alla Dashboard
                  </button>
                </div>
              </div>
            ) : kycData?.status === 'approved' ? (
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">KYC Approvato</h3>
                <p className="text-gray-600 mb-6">Il tuo KYC è stato approvato dall'amministratore.</p>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => navigate('/contract')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    📄 Firma Contratto
                  </button>
                  <button
                    onClick={() => navigate('/guest-dashboard')}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    🏠 Torna alla Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-4">❌</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">KYC Rifiutato</h3>
                <p className="text-gray-600 mb-6">Il tuo KYC è stato rifiutato. Contatta l'amministratore per maggiori informazioni.</p>
                
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    🔄 Riprova KYC
                  </button>
                  <button
                    onClick={() => navigate('/guest-dashboard')}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    🏠 Torna alla Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ambassador KYC Form */}
        {user?.role !== 'guest' && (
          <>
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Stato KYC</p>
                    <div className={`px-3 py-1 rounded-md text-sm font-medium ${getStatusColor(kycData?.status)}`}>
                      {getStatusText(kycData?.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Verifica</p>
                    <p className="text-lg font-bold text-gray-900">
                      {kycData?.status === 'approved' ? 'Completata' : 'In Corso'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">📅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Data Invio</p>
                    <p className="text-lg font-bold text-gray-900">
                      {kycData?.submittedAt ? new Date(kycData.submittedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* KYC Form Section */}
            {kycData?.status === 'not_submitted' || !kycData ? (
              <div className="bg-white rounded-lg shadow-sm border mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">🆔 Verifica Identità (KYC)</h2>
                  <p className="text-sm text-gray-600">
                    Completa la verifica della tua identità per accedere a tutte le funzionalità MLM
                  </p>
                </div>
                
                <div className="p-6">
                  <KYCForm 
                    onKYCComplete={(kycData) => {
                      setKycData({
                        ...kycData,
                        status: 'pending',
                        submittedAt: new Date().toISOString()
                      });
                      alert('✅ KYC inviato con successo! La verifica è in corso.');
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">📋 Dettagli KYC</h2>
                  <p className="text-sm text-gray-600">Informazioni sulla tua verifica identità</p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stato</label>
                      <div className={`px-3 py-2 rounded-md ${getStatusColor(kycData?.status)}`}>
                        {getStatusText(kycData?.status)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data Invio</label>
                      <input
                        type="text"
                        value={kycData?.submittedAt ? new Date(kycData.submittedAt).toLocaleDateString('it-IT') : 'N/A'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ID KYC</label>
                      <input
                        type="text"
                        value={kycData?.kycId || 'N/A'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                      <input
                        type="text"
                        value={kycData?.notes || 'Nessuna nota'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Guest KYC Approvato */}
        {user?.role === 'guest' && kycData?.status === 'approved' && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-6">✅</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                KYC Approvato
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                La tua verifica identità è stata completata e approvata.
                <br />
                <strong>Puoi procedere con l'acquisto dei pacchetti.</strong>
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => navigate('/plans')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  📦 Acquista Pacchetti
                </button>
                <button
                  onClick={() => navigate('/guest-dashboard')}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  🏠 Torna alla Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default KYCPage; 