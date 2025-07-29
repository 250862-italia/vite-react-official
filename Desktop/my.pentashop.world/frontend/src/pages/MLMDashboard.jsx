import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import AmbassadorUpgrade from '../components/MLM/AmbassadorUpgrade';
import CommissionTracker from '../components/MLM/CommissionTracker';
import ReferralSystem from '../components/MLM/ReferralSystem';
import SalesManager from '../components/MLM/SalesManager';
import NetworkVisualizer from '../components/MLM/NetworkVisualizer';
import CommissionCalculator from '../components/MLM/CommissionCalculator';
import CommissionPlansViewer from '../components/MLM/CommissionPlansViewer';
import AmbassadorStatus from '../components/MLM/AmbassadorStatus';
import PackagePurchase from '../components/MLM/PackagePurchase';
import KYCForm from '../components/KYC/KYCForm';

function MLMDashboard() {
  const [user, setUser] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    // Carica i dati utente dal backend per avere i dati aggiornati
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/onboarding/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.data.user);
            // Aggiorna anche il localStorage
            localStorage.setItem('user', JSON.stringify(data.data.user));
          }
        } else {
          console.error('Errore caricamento dati utente');
          // Fallback al localStorage
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Errore caricamento dati:', error);
        // Fallback al localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          navigate('/login');
        }
      }
    };

    loadUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUpgrade = (upgradeData) => {
    // Aggiorna i dati utente
    const updatedUser = {
      ...user,
      role: upgradeData.newRole,
      commissionRate: upgradeData.newCommissionRate
    };
    
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    // Mostra messaggio di successo
    setUpgradeMessage({
      type: 'success',
      title: '🎉 Upgrade Completato!',
      message: upgradeData.message,
      details: `Nuovo ruolo: ${upgradeData.newRole.replace('_', ' ')} • Commissione: ${(upgradeData.newCommissionRate * 100).toFixed(0)}%`
    });

    // Nascondi il messaggio dopo 5 secondi
    setTimeout(() => {
      setUpgradeMessage(null);
    }, 5000);
  };

  // Funzione per aggiornare l'utente con il referral code
  const updateUserReferralCode = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Esponi la funzione globalmente per il componente ReferralSystem
  useEffect(() => {
    window.updateUserReferralCode = updateUserReferralCode;
    return () => {
      delete window.updateUserReferralCode;
    };
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Header user={user} onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Upgrade Message */}
        {upgradeMessage && (
          <div className={`mb-6 p-4 rounded-lg border ${
            upgradeMessage.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{upgradeMessage.title}</h3>
                <p className="text-sm">{upgradeMessage.message}</p>
                {upgradeMessage.details && (
                  <p className="text-sm mt-1">{upgradeMessage.details}</p>
                )}
              </div>
              <button
                onClick={() => setUpgradeMessage(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-800">
                🏢 MLM Dashboard
              </h1>
              <p className="text-neutral-600 mt-2">
                Gestisci la tua rete MLM e monitora le commissioni
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline"
            >
              ← Torna al Dashboard
            </button>
          </div>
        </div>

                {/* Ambassador Status Completo */}
        <AmbassadorStatus user={user} />
        
        {/* Acquisto Pacchetti */}
        <PackagePurchase user={user} />

        {/* Navigation Tabs */}
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
            onClick={() => setActiveTab('commissions')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'commissions'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            💰 Commissioni
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'calculator'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            🧮 Calcolatore
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'network'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            🌐 Rete MLM
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'referrals'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            👥 Referral
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'plans'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            💰 Piani
          </button>
          <button
            onClick={() => setActiveTab('kyc')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'kyc'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            🆔 KYC
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Commission Tracker */}
            <CommissionTracker />
            
            {/* Sales Manager */}
            <SalesManager />
          </div>
        )}

        {activeTab === 'commissions' && (
          <CommissionTracker />
        )}

        {activeTab === 'calculator' && (
          <CommissionCalculator />
        )}

        {activeTab === 'network' && (
          <NetworkVisualizer />
        )}

        {activeTab === 'referrals' && (
          <ReferralSystem user={user} />
        )}

        {activeTab === 'plans' && (
          <CommissionPlansViewer />
        )}

        {activeTab === 'kyc' && (
          <div className="card">
            <div className="mb-6">
              <h2 className="text-2xl font-bold gradient-text">
                🆔 Verifica Identità (KYC)
              </h2>
              <p className="text-neutral-600 mt-2">
                Completa la verifica della tua identità per accedere a tutte le funzionalità MLM
              </p>
            </div>
            <KYCForm 
              onKYCComplete={(kycData) => {
                // Aggiorna lo stato utente con i dati KYC
                const updatedUser = {
                  ...user,
                  kycStatus: 'completed',
                  kycData: kycData
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                // Mostra messaggio di successo
                setUpgradeMessage({
                  type: 'success',
                  title: '✅ KYC Completato!',
                  message: 'La tua verifica identità è stata completata con successo.',
                  details: 'Ora puoi accedere a tutte le funzionalità MLM avanzate.'
                });
                
                setTimeout(() => {
                  setUpgradeMessage(null);
                }, 5000);
              }}
            />
          </div>
        )}

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <AmbassadorUpgrade
            user={user}
            onUpgrade={handleUpgrade}
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default MLMDashboard; 