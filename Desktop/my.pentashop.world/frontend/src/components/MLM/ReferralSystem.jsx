import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency, formatPercentage, safeReduce } from '../../utils/formatters';

const ReferralSystem = ({ user }) => {
  const [referrals, setReferrals] = useState([]);
  const [referralStats, setReferralStats] = useState({
    total: 0,
    active: 0,
    totalCommissionEarned: 0
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Carica i dati referral all'avvio
  useEffect(() => {
    if (user && user.id) {
      console.log('🔍 ReferralSystem - User data:', user);
      console.log('🔍 ReferralSystem - ReferralCode:', user.referralCode);
      
      // Se il referral code non è presente, caricalo dall'API
      if (!user.referralCode) {
        const loadReferralCode = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/auth/me', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
              const updatedUser = { ...user, referralCode: response.data.user.referralCode };
              console.log('✅ Referral code caricato:', response.data.user.referralCode);
              // Notifica il parent component dell'aggiornamento
              if (window.updateUserReferralCode) {
                window.updateUserReferralCode(updatedUser);
              }
            }
          } catch (error) {
            console.error('Errore caricamento referral code:', error);
          }
        };
        loadReferralCode();
      }
      
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Carica lista referral usando il nuovo endpoint
      const token = localStorage.getItem('token');
      const referralsResponse = await axios.get('/api/referrals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (referralsResponse.data.success) {
        setReferrals(referralsResponse.data.referrals || []);
        setReferralStats(referralsResponse.data.stats || {
          totalReferrals: 0,
          activeReferrals: 0,
          totalCommissionEarned: 0,
          averageCommissionPerReferral: 0
        });
      }

    } catch (err) {
      console.error('Errore caricamento referral:', err);
      setError('Errore nel caricamento dei dati referral');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteFirstName || !inviteLastName) {
      setError('Tutti i campi sono obbligatori');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/referrals/invite', {
        email: inviteEmail,
        firstName: inviteFirstName,
        lastName: inviteLastName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMessage('Invito inviato con successo!');
        setInviteEmail('');
        setInviteFirstName('');
        setInviteLastName('');
        setShowInviteModal(false);
        
        // Ricarica i dati referral
        setTimeout(() => {
          loadReferralData();
          setSuccessMessage(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Errore invio invito:', err);
      setError(err.response?.data?.error || 'Errore durante l\'invio dell\'invito');
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(user.referralCode);
      setSuccessMessage('Codice referral copiato negli appunti!');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      console.error('Errore copia codice:', err);
      setError('Errore durante la copia del codice');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'pending':
        return '🟡';
      case 'inactive':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Attivo';
      case 'pending':
        return 'In Attesa';
      case 'inactive':
        return 'Inattivo';
      default:
        return 'Sconosciuto';
    }
  };

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.status === 'active').length;
  const totalCommissionEarned = referrals.reduce((sum, r) => sum + r.commissionEarned, 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">
          👥 Sistema Referral
        </h2>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? '⏳' : '+'} Invita Amico
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          ✅ {successMessage}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          ❌ {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stats-card">
          <div className="stats-number text-blue-600">{totalReferrals}</div>
          <div className="stats-label">Referral Totali</div>
        </div>
        
        <div className="stats-card">
          <div className="stats-number text-green-600">{activeReferrals}</div>
          <div className="stats-label">Referral Attivi</div>
        </div>
        
        <div className="stats-card">
          <div className="stats-number text-purple-600">€{totalCommissionEarned.toFixed(2)}</div>
          <div className="stats-label">Commissioni Referral</div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-green-800 mb-2">
          🎯 Il Tuo Codice Referral
        </h3>
        <div className="flex items-center space-x-4">
          <div className="bg-white border border-green-300 rounded-lg px-4 py-2 font-mono text-lg font-bold text-green-700">
            {user.referralCode || 'MARO879395-EU2W-*-O'}
          </div>
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500">
              Debug: {user.referralCode ? 'Presente' : 'Mancante'}
            </div>
          )}
          <button 
            onClick={copyReferralCode}
            className="btn btn-outline btn-sm"
            disabled={!user.referralCode}
          >
            📋 Copia
          </button>
        </div>
        <p className="text-sm text-green-700 mt-2">
          Condividi questo codice con i tuoi amici per guadagnare commissioni!
        </p>
      </div>

      {/* Referrals List */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          📋 I Tuoi Referral
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Caricamento referral...</p>
          </div>
        ) : referrals.length > 0 ? (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {getStatusIcon(referral.status)}
                  </div>
                  <div>
                    <div className="font-medium text-neutral-800">
                      {referral.firstName} {referral.lastName}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {referral.email} • {getStatusLabel(referral.status)}
                    </div>
                    <div className="text-xs text-neutral-500">
                      Registrato: {new Date(referral.joinDate).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    €{referral.commissionEarned.toFixed(2)}
                  </div>
                  <div className="text-xs text-neutral-500">
                    Commissione
                  </div>
                  <div className="text-xs text-neutral-500 capitalize">
                    {referral.role.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-neutral-600">
              Nessun referral ancora. Inizia a invitare amici!
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          ⚡ Azioni Rapide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
                            onClick={() => window.open(`mailto:?subject=Unisciti a MY.PENTASHOP.WORLD&body=Usa il mio codice referral: ${user.referralCode}`)}
            className="btn btn-outline"
          >
            📧 Condividi via Email
          </button>
          <button 
            onClick={() => {
                              const text = `Unisciti a MY.PENTASHOP.WORLD! Usa il mio codice referral: ${user.referralCode}`;
              if (navigator.share) {
                navigator.share({ text });
              } else {
                copyReferralCode();
              }
            }}
            className="btn btn-outline"
          >
            📱 Condividi Codice
          </button>
          <button 
            onClick={loadReferralData}
            className="btn btn-outline"
            disabled={isLoading}
          >
            🔄 Aggiorna
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4">
              📧 Invita Amico
            </h3>
            
            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome dell'amico"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Cognome *
                </label>
                <input
                  type="text"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cognome dell'amico"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email dell'amico *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="amico@example.com"
                  required
                />
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Codice Referral:</strong> {user.referralCode}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Il tuo amico riceverà un invito con questo codice.
                </p>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn btn-outline flex-1"
                  disabled={isLoading}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Invio...' : 'Invia Invito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralSystem; 