import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const MLMUpgradeBox = ({ userData, onUpgrade }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Mostra solo per Entry Ambassador
  if (user?.role !== 'entry_ambassador') {
    return null;
  }

  const handleUpgrade = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/ambassador/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Upgrade completato con successo! 🎉');
        if (onUpgrade) {
          onUpgrade();
        }
      } else {
        setMessage(data.message || 'Errore durante l\'upgrade');
      }
    } catch (error) {
      setMessage('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  // Se l'utente è già MLM Ambassador, mostra un badge di successo
  if (userData?.role === 'mlm_ambassador') {
    return (
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 animate-fade-in">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-green-900 mb-1">MLM Ambassador</h3>
              <p className="text-green-700 mb-3">
                Congratulazioni! Hai già completato l'upgrade a MLM Ambassador.
              </p>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Accesso completo alle funzionalità MLM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 animate-fade-in">
      <div className="card-body">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-blue-900 mb-2">Upgrade a MLM Ambassador</h3>
            <p className="text-blue-700 mb-4">
              Sblocca il tuo potenziale completo e accedi a commissioni più alte, 
              funzionalità avanzate e opportunità di crescita illimitate.
            </p>
            
            {/* Benefits List */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Commissioni del 25% su tutte le vendite</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Accesso al sistema di referral avanzato</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Dashboard analytics avanzate</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Supporto prioritario dedicato</span>
              </div>
            </div>

            {/* Upgrade Button */}
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="btn btn-primary btn-lg w-full group relative overflow-hidden"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Upgrade in corso...</span>
                </div>
              ) : (
                <>
                  <span className="relative z-10">Upgrade a MLM Ambassador</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </>
              )}
            </button>

            {/* Message */}
            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
                message.includes('successo') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            {/* Price Info */}
            <div className="mt-4 p-3 bg-blue-100/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Prezzo upgrade:</span>
                <span className="font-bold text-blue-900">€99.00</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Pagamento una tantum - Nessun costo ricorrente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLMUpgradeBox; 