import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import Header from '../components/Layout/Header';
import AmbassadorUpgrade from '../components/MLM/AmbassadorUpgrade';
import CommissionTracker from '../components/MLM/CommissionTracker';
import ReferralSystem from '../components/MLM/ReferralSystem';
import SalesManager from '../components/MLM/SalesManager';
import NetworkVisualizer from '../components/MLM/NetworkVisualizer';


import AmbassadorStatus from '../components/MLM/AmbassadorStatus';
import PackagePurchase from '../components/MLM/PackagePurchase';

import CommunicationHub from '../components/MLM/CommunicationHub';

function MLMDashboard() {
  const [user, setUser] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('commissions');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    // Gestisci l'anchor nell'URL
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#tasks') {
        // Naviga alla pagina dei task
        navigate('/dashboard');
        return;
      }
    };

    // Controlla l'anchor all'avvio
    handleHashChange();

    // Aggiungi listener per i cambiamenti dell'hash
    window.addEventListener('hashchange', handleHashChange);

    // Carica i dati utente dal backend per avere i dati aggiornati
    const loadUserData = async () => {
      try {
        const response = await axios.get(getApiUrl('/dashboard'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          setUser(response.data.data.user);
          // Aggiorna anche il localStorage
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
        } else {
          console.error('❌ Errore risposta dashboard:', response.data);
          // Fallback al localStorage
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('❌ Errore caricamento dati:', error);
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

    // Cleanup del listener
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Caricamento dati utente...</p>
        </div>
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
            onClick={() => setActiveTab('communications')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'communications'
                ? 'bg-white text-neutral-800 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-800'
            }`}
          >
            📞 Comunicazioni
          </button>
        </div>

        {/* Tab Content */}


        {activeTab === 'commissions' && (
          <CommissionTracker />
        )}



        {activeTab === 'network' && (
          <NetworkVisualizer />
        )}

        {activeTab === 'referrals' && (
          <ReferralSystem user={user} />
        )}





        {activeTab === 'communications' && (
          <CommunicationHub user={user} />
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