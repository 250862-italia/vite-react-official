import React, { useState } from 'react';
import axios from 'axios';

const AmbassadorUpgrade = ({ user, onUpgrade, onClose }) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const currentRole = user.role;
  const isEntryAmbassador = currentRole === 'entry_ambassador';
  const isMLMAmbassador = currentRole === 'mlm_ambassador';

  const upgradeInfo = {
    entry_ambassador: {
      title: 'Upgrade a MLM Ambassador',
      description: 'Sblocca il tuo potenziale completo con l\'upgrade a MLM Ambassador',
      benefits: [
        'Commissioni del 10% (vs 5% attuali)',
        'Accesso al sistema referral avanzato',
        'Network building tools',
        'Performance analytics',
        'Supporto dedicato'
      ],
      requirements: [
        'Completamento onboarding (100%)',
        'Minimo 50 punti accumulati',
        'Almeno 1 task completato'
      ],
      cost: 'Gratuito (dopo completamento requisiti)'
    },
    mlm_ambassador: {
      title: 'Sei già MLM Ambassador!',
      description: 'Hai già raggiunto il livello massimo. Continua a crescere!',
      benefits: [
        'Commissioni del 10% attive',
        'Sistema referral completo',
        'Tutti i tools disponibili',
        'Analytics avanzate',
        'Supporto prioritario'
      ],
      requirements: [],
      cost: 'N/A'
    }
  };

  const info = upgradeInfo[currentRole];

  const handleUpgrade = async () => {
    if (!isEntryAmbassador) return;

    setIsUpgrading(true);
    setError(null);

    try {
      const response = await axios.post('/api/ambassador/upgrade', {
        userId: user.id,
        currentRole: user.role,
        upgradeTo: 'mlm_ambassador'
      });

      if (response.data.success) {
        onUpgrade({
          newRole: 'mlm_ambassador',
          newCommissionRate: 0.10,
          message: 'Upgrade completato con successo!'
        });
      }
    } catch (err) {
      console.error('Errore upgrade:', err);
      setError(err.response?.data?.error || 'Errore durante l\'upgrade. Riprova.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const canUpgrade = isEntryAmbassador && user.points >= 50;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h1 className="text-xl font-semibold text-neutral-800">
            {info.title}
          </h1>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-neutral-600 mb-4">
              {info.description}
            </p>

            {/* Current Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Stato Attuale</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-600">Ruolo:</span>
                  <span className="ml-2 font-medium capitalize">{user.role.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-neutral-600">Commissione:</span>
                  <span className="ml-2 font-medium">{(user.commissionRate * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-neutral-600">Punti:</span>
                  <span className="ml-2 font-medium">{user.points}</span>
                </div>
                <div>
                  <span className="text-neutral-600">Token:</span>
                  <span className="ml-2 font-medium">{user.tokens}</span>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-6">
              <h3 className="font-semibold text-neutral-800 mb-3">Benefici dell'Upgrade</h3>
              <div className="space-y-2">
                {info.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-green-500">✅</span>
                    <span className="text-neutral-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            {info.requirements.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-neutral-800 mb-3">Requisiti per l'Upgrade</h3>
                <div className="space-y-2">
                  {info.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className={canUpgrade ? "text-green-500" : "text-yellow-500"}>
                        {canUpgrade ? "✅" : "⚠️"}
                      </span>
                      <span className="text-neutral-700">{requirement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost */}
            <div className="mb-6">
              <h3 className="font-semibold text-neutral-800 mb-2">Costo Upgrade</h3>
              <p className="text-neutral-600">{info.cost}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="btn btn-outline flex-1"
            >
              Chiudi
            </button>
            
            {isEntryAmbassador && (
              <button
                onClick={() => setShowConfirmation(true)}
                disabled={!canUpgrade || isUpgrading}
                className={`btn flex-1 ${canUpgrade ? 'btn-primary' : 'btn-outline opacity-50'}`}
              >
                {isUpgrading ? 'Upgrading...' : 'Upgrade a MLM Ambassador'}
              </button>
            )}
          </div>

          {!canUpgrade && isEntryAmbassador && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                ⚠️ Devi completare tutti i requisiti per effettuare l'upgrade.
              </p>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                Conferma Upgrade
              </h3>
              <p className="text-neutral-600 mb-6">
                Sei sicuro di voler effettuare l'upgrade a MLM Ambassador? 
                Questa azione non può essere annullata.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="btn btn-outline flex-1"
                >
                  Annulla
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="btn btn-primary flex-1"
                >
                  {isUpgrading ? 'Upgrading...' : 'Conferma Upgrade'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmbassadorUpgrade; 