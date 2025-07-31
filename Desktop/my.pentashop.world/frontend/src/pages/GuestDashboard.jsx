import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

function GuestDashboard() {
  const [user, setUser] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const userObj = JSON.parse(userData);
    setUser(userObj);

    // Se l'utente non è guest, redirect appropriato
    if (userObj.role === 'admin') {
      navigate('/admin');
      return;
    } else if (userObj.role === 'ambassador') {
      navigate('/dashboard');
      return;
    }

    // Carica status KYC per guest
    loadKycStatus();
  }, [navigate]);

  const loadKycStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/kyc/status'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const kycData = response.data.data;
        setKycStatus(kycData);
        
        // 🔒 PROTEZIONE: Se l'admin ha approvato il guest, redirect alla dashboard
        if (kycData.adminApproved && kycData.state === 'approved') {
          console.log('🔓 Guest approvato dall\'admin, redirect alla dashboard');
          navigate('/dashboard');
          return;
        }
      }
    } catch (err) {
      console.error('Errore caricamento status KYC:', err);
      setError('Errore nel caricamento dello status KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': 
      case 'auto_approved': 
        return 'text-green-600';
      case 'submitted': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': 
      case 'auto_approved': 
        return 'Approvato';
      case 'submitted': return 'In attesa di approvazione';
      case 'rejected': return 'Rifiutato';
      default: return 'Non completato';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento dashboard guest...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="text-center">
            <div className="text-6xl mb-4">👋</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Benvenuto, {user?.firstName || user?.username}!
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Sei registrato come Guest. Completa i passaggi per diventare Ambassador.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🆔</span>
                <div>
                  <h3 className="font-semibold text-blue-800">Verifica Identità Richiesta</h3>
                  <p className="text-blue-700">Completa la verifica KYC per procedere con l'approvazione</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Step 1: KYC */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-blue-500">
                    1
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-800">Dati Personali</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Completa i tuoi dati personali per procedere.
                </p>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                >
                  👤 Completa Profilo
                </button>
              </div>

          {/* Step 2: Contract */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                kycStatus?.contractStatus === 'signed' ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                2
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Firma Contratto</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Firma il contratto digitale per procedere con l'approvazione.
            </p>
            <div className="mb-4">
              <span className={`text-sm font-medium ${getStatusColor(kycStatus?.contractStatus)}`}>
                Status: {getStatusText(kycStatus?.contractStatus)}
              </span>
            </div>
            <button
              onClick={() => navigate('/contract')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              {kycStatus?.contractStatus === 'signed' ? 'Visualizza Contratto' : 'Firma Contratto'}
            </button>
          </div>

          {/* Step 3: Admin Approval */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                kycStatus?.adminApproved ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                3
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Approvazione Admin</h3>
            </div>
            <p className="text-gray-600 mb-4">
              In attesa dell'approvazione da parte dell'amministratore.
            </p>
            <div className="mb-4">
              <span className={`text-sm font-medium ${kycStatus?.adminApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                Status: {kycStatus?.adminApproved ? 'Approvato' : 'In attesa'}
              </span>
            </div>
            <div className="w-full bg-gray-200 text-gray-500 font-medium py-2 px-4 rounded-lg text-center">
              In attesa di approvazione
            </div>
          </div>

          {/* Step 4: Become Ambassador */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                kycStatus?.adminApproved ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                4
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-800">Diventa Ambassador</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Dopo l'approvazione, potrai acquistare pacchetti e iniziare a guadagnare.
            </p>
            <div className="mb-4">
              <span className={`text-sm font-medium ${kycStatus?.adminApproved ? 'text-green-600' : 'text-gray-600'}`}>
                Status: {kycStatus?.adminApproved ? 'Disponibile' : 'Non disponibile'}
              </span>
            </div>
            <div className={`w-full font-medium py-2 px-4 rounded-lg text-center ${
              kycStatus?.adminApproved 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {kycStatus?.adminApproved ? '✅ Disponibile' : '⏳ In attesa di approvazione'}
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Stato Attuale</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Stato Generale:</span>
              <span className={`font-medium ${getStatusColor(kycStatus?.state)}`}>
                {kycStatus?.state === 'pending_approval' ? 'In attesa di completamento' :
                 kycStatus?.state === 'pending_admin_approval' ? 'In attesa di approvazione admin' :
                 kycStatus?.state === 'approved' ? 'Approvato' :
                 kycStatus?.state === 'rejected' ? 'Rifiutato' : 'Non definito'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Acquisto Pacchetti:</span>
              <span className={`font-medium ${kycStatus?.canPurchasePackages ? 'text-green-600' : 'text-red-600'}`}>
                {kycStatus?.canPurchasePackages ? 'Abilitato' : 'Non abilitato'}
              </span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Prossimi Passi</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <p className="text-blue-700">Completa i tuoi dati personali nel profilo</p>
            </div>
            {kycStatus?.contractStatus !== 'signed' && (
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
                <p className="text-blue-700">Firma il contratto digitale per procedere</p>
              </div>
            )}
            {kycStatus?.contractStatus === 'signed' && !kycStatus?.adminApproved && (
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
                <p className="text-blue-700">In attesa dell'approvazione da parte dell'amministratore</p>
              </div>
            )}
            {kycStatus?.adminApproved && (
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></div>
                <p className="text-green-700">Sei stato approvato! Ora puoi acquistare pacchetti e diventare Ambassador</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default GuestDashboard; 