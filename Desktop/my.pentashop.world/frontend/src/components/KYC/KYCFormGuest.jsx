import React, { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api';

const KYCFormGuest = ({ onKYCComplete, onClose }) => {
  console.log('🔍 KYCFormGuest renderizzato!'); // DEBUG LOG
  
  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    nationality: '',
    address: '',
    phone: '',
    fiscalCode: ''
  });
  
  const [documents, setDocuments] = useState({
    identity: null,
    address: null,
    fiscal: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validazione file
  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (file.size > maxSize) {
      throw new Error('File troppo grande (max 5MB)');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Formato non supportato (solo JPEG/PNG/PDF)');
    }
    
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Formattazione Codice Fiscale
    if (name === 'fiscalCode') {
      formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    setError('');
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    
    try {
      validateFile(file);
      setDocuments(prev => ({
        ...prev,
        [fileType]: file
      }));
      setError('');
    } catch (error) {
      setError(error.message);
      e.target.value = '';
    }
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.birthDate || !formData.nationality || 
        !formData.address || !formData.phone || !formData.fiscalCode) {
      setError('Tutti i campi sono obbligatori');
      return false;
    }
    
    // Validazione Codice Fiscale
    const fiscalCodeRegex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/;
    if (!fiscalCodeRegex.test(formData.fiscalCode.toUpperCase())) {
      setError('Codice fiscale non valido');
      return false;
    }
    
    if (!documents.identity || !documents.address || !documents.fiscal) {
      setError('Carica tutti i documenti richiesti');
      return false;
    }
    
    return true;
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Rimuovi il prefisso data:image/...;base64,
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Converti i file in base64
      const documentsBase64 = {};
      for (const [key, file] of Object.entries(documents)) {
        if (file) {
          documentsBase64[key] = await convertFileToBase64(file);
        }
      }

      const kycData = {
        documents: documentsBase64,
        personalInfo: formData
      };

      const response = await axios.post(getApiUrl('/kyc/submit'), kycData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSuccess(true);
        
        if (onKYCComplete) {
          onKYCComplete(response.data.data);
        }
      } else {
        setError('Errore durante l\'invio del KYC');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-4xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">KYC Inviato con Successo!</h3>
        <p className="text-green-700 mb-4">
          La tua richiesta di verifica identità è stata inviata. 
          Riceverai una notifica quando sarà stata esaminata.
        </p>
        <button
          onClick={onClose}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Chiudi
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">🆔 Verifica Identità (KYC)</h2>
        <p className="text-sm text-gray-600">Completa la verifica della tua identità per procedere</p>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informazioni Personali */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-4">📋 Informazioni Personali</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Nome e Cognome"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data di Nascita *
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nazionalità *
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  placeholder="es. Italiana"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+39 333 1234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Indirizzo Completo *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Via Roma 123, Milano, 20100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codice Fiscale *
              </label>
              <input
                type="text"
                name="fiscalCode"
                value={formData.fiscalCode}
                onChange={handleInputChange}
                placeholder="RSSMRA80A01H501U"
                maxLength="16"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                required
              />
            </div>
          </div>

          {/* Documenti */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-4">📄 Documenti Richiesti</h3>
            <p className="text-sm text-gray-600 mb-4">
              Carica i seguenti documenti in formato JPEG, PNG o PDF (max 5MB ciascuno)
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🆔 Documento d'Identità *
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileChange(e, 'identity')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Carta d'identità o passaporto</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏠 Certificato di Residenza *
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileChange(e, 'address')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Certificato di residenza o domicilio</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💳 Codice Fiscale *
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileChange(e, 'fiscal')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Tessera sanitaria o codice fiscale</p>
              </div>
            </div>
          </div>

          {/* Pulsanti */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annulla
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Invio in corso...
                </span>
              ) : (
                'Invia KYC'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KYCFormGuest; 