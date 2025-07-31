import React, { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../config/api';

const KYCForm = ({ onKYCComplete, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    birthDate: '',
    address: '',
    city: '',
    country: '',
    citizenship: '',
    fiscalCode: '',
    iban: '',
    isCompany: false,
    companyName: '',
    vatNumber: '',
    sdiCode: ''
  });
  
  const [contractAccepted, setContractAccepted] = useState(false);
  const [showContract, setShowContract] = useState(false);
  
  const [files, setFiles] = useState({
    idFront: null,
    idBack: null,
    selfie: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [kycId, setKycId] = useState('');

  // Validazione file
  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png'];
    
    if (file.size > maxSize) {
      throw new Error('File troppo grande (max 5MB)');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Formato non supportato (solo JPEG/PNG)');
    }
    
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Formattazione IBAN
    if (name === 'iban') {
      // Rimuovi spazi e caratteri speciali, poi formatta
      const cleanIban = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (cleanIban.length <= 34) {
        formattedValue = cleanIban.replace(/(.{4})/g, '$1 ').trim();
      }
    }
    
    // Formattazione Codice Fiscale
    if (name === 'fiscalCode') {
      formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    
    // Formattazione Partita IVA
    if (name === 'vatNumber') {
      formattedValue = value.replace(/[^0-9]/g, '');
    }
    
    // Formattazione Codice SDI
    if (name === 'sdiCode') {
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
      setFiles(prev => ({
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
    if (!formData.birthDate || !formData.address || !formData.city || 
        !formData.country || !formData.citizenship || !formData.iban) {
      setError('Tutti i campi sono obbligatori');
      return false;
    }
    
    // Validazione IBAN
    const ibanRegex = /^IT\d{2}[A-Z]\d{3}[A-Z]\d{4}[A-Z]\d{4}[A-Z]\d{4}[A-Z]\d{3}$/;
    if (!ibanRegex.test(formData.iban.replace(/\s/g, ''))) {
      setError('IBAN non valido. Inserisci un IBAN italiano valido');
      return false;
    }
    
    // Validazione per Privati
    if (!formData.isCompany) {
      if (!formData.fiscalCode) {
        setError('Codice fiscale obbligatorio per privati');
        return false;
      }
      
      const fiscalCodeRegex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/;
      if (!fiscalCodeRegex.test(formData.fiscalCode.toUpperCase())) {
        setError('Codice fiscale non valido');
        return false;
      }
    }
    
    // Validazione per Aziende
    if (formData.isCompany) {
      if (!formData.companyName || !formData.vatNumber || !formData.sdiCode) {
        setError('Tutti i campi aziendali sono obbligatori');
        return false;
      }
      
      // Validazione Partita IVA (11 cifre)
      const vatRegex = /^\d{11}$/;
      if (!vatRegex.test(formData.vatNumber.replace(/\s/g, ''))) {
        setError('Partita IVA non valida (11 cifre)');
        return false;
      }
      
      // Validazione Codice SDI (7 caratteri)
      const sdiRegex = /^[A-Z0-9]{7}$/;
      if (!sdiRegex.test(formData.sdiCode.toUpperCase())) {
        setError('Codice SDI non valido (7 caratteri alfanumerici)');
        return false;
      }
    }
    
    if (!files.idFront || !files.idBack || !files.selfie) {
      setError('Carica tutti i documenti richiesti');
      return false;
    }
    
    if (!contractAccepted) {
      setError('Devi accettare il contratto per procedere');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formDataToSend = new FormData();
      
      // Aggiungi dati anagrafici
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Aggiungi accettazione contratto
      formDataToSend.append('contractAccepted', contractAccepted.toString());
      
      // Aggiungi file
      Object.keys(files).forEach(key => {
        if (files[key]) {
          formDataToSend.append(key, files[key]);
        }
      });

      const response = await axios.post(getApiUrl('/kyc/submit'), formDataToSend, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccess(true);
        setKycId(response.data.data.kycId);
        
        // Chiama le callback appropriate
        if (onKYCComplete) {
          onKYCComplete(response.data.data);
        }
        if (onSuccess) {
          onSuccess(response.data.data);
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

  // Se onClose è fornito, renderizza come modal
  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold gradient-text">
                🆔 Verifica Identità (KYC)
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 mt-2">
              Completa la verifica della tua identità per accedere a tutte le funzionalità MLM
            </p>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dati Anagrafici */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  📋 Dati Anagrafici
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Cittadinanza *
                    </label>
                    <input
                      type="text"
                      name="citizenship"
                      value={formData.citizenship}
                      onChange={handleInputChange}
                      placeholder="es. Italiana"
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
                    placeholder="es. Via Roma 123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Città *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="es. Milano"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paese *
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="es. Italia"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Tipo Soggetto */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    👤 Tipo Soggetto
                  </h3>
                  
                  <div className="flex space-x-4 mb-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isCompany"
                        value="false"
                        checked={!formData.isCompany}
                        onChange={() => setFormData(prev => ({ ...prev, isCompany: false }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Privato</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isCompany"
                        value="true"
                        checked={formData.isCompany}
                        onChange={() => setFormData(prev => ({ ...prev, isCompany: true }))}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">Azienda</span>
                    </label>
                  </div>
                </div>

                {/* Dati Fiscali e Bancari */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    💳 Dati Fiscali e Bancari
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Questi dati sono necessari per il pagamento delle commissioni MLM e la compliance fiscale
                  </p>
                  
                  {/* Campi per Privati */}
                  {!formData.isCompany && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Codice Fiscale *
                        </label>
                        <input
                          type="text"
                          name="fiscalCode"
                          value={formData.fiscalCode}
                          onChange={handleInputChange}
                          placeholder="es. RSSMRA80A01H501U"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                          maxLength="16"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Inserisci il tuo codice fiscale (16 caratteri)
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IBAN per Pagamenti *
                        </label>
                        <input
                          type="text"
                          name="iban"
                          value={formData.iban}
                          onChange={handleInputChange}
                          placeholder="es. IT60 X054 2811 1010 0000 0123 456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                          maxLength="34"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          IBAN per ricevere le commissioni MLM
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Campi per Aziende */}
                  {formData.isCompany && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome Azienda *
                          </label>
                          <input
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            placeholder="es. Pentawash Srl"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Nome completo dell'azienda
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Partita IVA *
                          </label>
                          <input
                            type="text"
                            name="vatNumber"
                            value={formData.vatNumber}
                            onChange={handleInputChange}
                            placeholder="es. 12345678901"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength="11"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Partita IVA (11 cifre)
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Codice SDI *
                          </label>
                          <input
                            type="text"
                            name="sdiCode"
                            value={formData.sdiCode}
                            onChange={handleInputChange}
                            placeholder="es. ABC1234"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                            maxLength="7"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Codice Sistema di Interscambio (7 caratteri)
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            IBAN per Pagamenti *
                          </label>
                          <input
                            type="text"
                            name="iban"
                            value={formData.iban}
                            onChange={handleInputChange}
                            placeholder="es. IT60 X054 2811 1010 0000 0123 456"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                            maxLength="34"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            IBAN per ricevere le commissioni MLM
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                   
                   <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                     <div className="flex items-start">
                       <span className="text-blue-600 mr-2">🔒</span>
                       <div className="text-sm text-blue-800">
                         <p className="font-medium">Sicurezza Garantita</p>
                         <p className="text-xs mt-1">
                           I tuoi dati sono protetti con crittografia SSL e utilizzati solo per i pagamenti delle commissioni MLM
                         </p>
                       </div>
                     </div>
                   </div>
                 </div>
              </div>

              {/* Upload Documenti */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  📄 Documenti Richiesti
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fronte Documento d'Identità *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'idFront')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Carta d'identità, passaporto o patente (max 5MB)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Retro Documento d'Identità *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'idBack')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Retro del documento (max 5MB)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selfie per Riconoscimento *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'selfie')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Foto del tuo viso (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Informazioni Sicurezza */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">🔒 Sicurezza</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• I tuoi documenti sono crittografati e sicuri</li>
                  <li>• Utilizziamo solo servizi KYC certificati</li>
                  <li>• I dati sono protetti secondo GDPR</li>
                  <li>• La verifica richiede 24-48 ore lavorative</li>
                </ul>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Invio in corso...
                    </div>
                  ) : (
                    'Invia Documenti per Verifica'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              KYC Inviato!
            </h1>
            <p className="text-gray-600 mb-6">
              I tuoi documenti sono stati ricevuti e sono in fase di verifica.
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">🆔 ID KYC</h3>
            <p className="text-blue-600 font-mono text-sm">{kycId}</p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">⏱️ Tempo di Verifica</h3>
            <p className="text-yellow-700">24-48 ore lavorative</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/kyc/status'}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Controlla Stato KYC
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Torna al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🆔 Verifica Identità (KYC)
            </h1>
            <p className="text-gray-600">
              Completa la verifica della tua identità per procedere con l'acquisto
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dati Anagrafici */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📋 Dati Anagrafici
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Cittadinanza *
                  </label>
                  <input
                    type="text"
                    name="citizenship"
                    value={formData.citizenship}
                    onChange={handleInputChange}
                    placeholder="es. Italiana"
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
                  placeholder="es. Via Roma 123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Città *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="es. Milano"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paese *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="es. Italia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Tipo Soggetto */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  👤 Tipo Soggetto
                </h3>
                
                <div className="flex space-x-4 mb-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isCompany"
                      value="false"
                      checked={!formData.isCompany}
                      onChange={() => setFormData(prev => ({ ...prev, isCompany: false }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Privato</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isCompany"
                      value="true"
                      checked={formData.isCompany}
                      onChange={() => setFormData(prev => ({ ...prev, isCompany: true }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Azienda</span>
                  </label>
                </div>
              </div>

              {/* Dati Fiscali e Bancari */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  💳 Dati Fiscali e Bancari
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Questi dati sono necessari per il pagamento delle commissioni MLM e la compliance fiscale
                </p>
                
                                {/* Campi per Privati */}
                {!formData.isCompany && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Codice Fiscale *
                      </label>
                      <input
                        type="text"
                        name="fiscalCode"
                        value={formData.fiscalCode}
                        onChange={handleInputChange}
                        placeholder="es. RSSMRA80A01H501U"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                        maxLength="16"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Inserisci il tuo codice fiscale (16 caratteri)
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IBAN per Pagamenti *
                      </label>
                      <input
                        type="text"
                        name="iban"
                        value={formData.iban}
                        onChange={handleInputChange}
                        placeholder="es. IT60 X054 2811 1010 0000 0123 456"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                        maxLength="34"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        IBAN per ricevere le commissioni MLM
                      </p>
                    </div>
                  </div>
                )}

                {/* Campi per Aziende */}
                {formData.isCompany && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome Azienda *
                        </label>
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          placeholder="es. Pentawash Srl"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Nome completo dell'azienda
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Partita IVA *
                        </label>
                        <input
                          type="text"
                          name="vatNumber"
                          value={formData.vatNumber}
                          onChange={handleInputChange}
                          placeholder="es. 12345678901"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          maxLength="11"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Partita IVA (11 cifre)
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Codice SDI *
                        </label>
                        <input
                          type="text"
                          name="sdiCode"
                          value={formData.sdiCode}
                          onChange={handleInputChange}
                          placeholder="es. ABC1234"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                          maxLength="7"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Codice Sistema di Interscambio (7 caratteri)
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IBAN per Pagamenti *
                        </label>
                        <input
                          type="text"
                          name="iban"
                          value={formData.iban}
                          onChange={handleInputChange}
                          placeholder="es. IT60 X054 2811 1010 0000 0123 456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                          maxLength="34"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          IBAN per ricevere le commissioni MLM
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                 
                 <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                   <div className="flex items-start">
                     <span className="text-blue-600 mr-2">🔒</span>
                     <div className="text-sm text-blue-800">
                       <p className="font-medium">Sicurezza Garantita</p>
                       <p className="text-xs mt-1">
                         I tuoi dati sono protetti con crittografia SSL e utilizzati solo per i pagamenti delle commissioni MLM
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
            </div>

            {/* Upload Documenti */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📄 Documenti Richiesti
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fronte Documento d'Identità *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'idFront')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Carta d'identità, passaporto o patente (max 5MB)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retro Documento d'Identità *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'idBack')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Retro del documento (max 5MB)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selfie per Riconoscimento *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'selfie')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Foto del tuo viso (max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Contratto Digitale */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-3">📋 Contratto di Collaborazione</h3>
              
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowContract(!showContract)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                >
                  {showContract ? 'Nascondi Contratto' : 'Leggi Contratto Completo'}
                </button>
              </div>
              
              {showContract && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto text-sm">
                  <h4 className="font-semibold mb-2">CONTRATTO DI COLLABORAZIONE MY.PENTASHOP.WORLD</h4>
                  
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Art. 1 - Oggetto</strong></p>
                    <p>Il presente contratto regola la collaborazione tra MY.PENTASHOP.WORLD (di seguito "Società") e il Collaboratore per la vendita di prodotti eco-friendly e la partecipazione al programma MLM.</p>
                    
                    <p><strong>Art. 2 - Obblighi del Collaboratore</strong></p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Rispettare le normative fiscali e commerciali vigenti</li>
                      <li>Utilizzare solo materiali promozionali approvati dalla Società</li>
                      <li>Non effettuare vendite al di fuori del territorio autorizzato</li>
                      <li>Mantenere un comportamento professionale e etico</li>
                    </ul>
                    
                    <p><strong>Art. 3 - Commissioni</strong></p>
                    <p>Le commissioni sono calcolate sull'importo netto (esclusa IVA) e pagate secondo i termini stabiliti nel piano commissioni.</p>
                    
                    <p><strong>Art. 4 - Privacy e GDPR</strong></p>
                    <p>Il trattamento dei dati personali avviene nel rispetto del GDPR e della normativa vigente.</p>
                    
                    <p><strong>Art. 5 - Durata e Recesso</strong></p>
                    <p>Il contratto ha durata annuale e può essere disdetto con preavviso di 30 giorni.</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="contractAccepted"
                  checked={contractAccepted}
                  onChange={(e) => setContractAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="contractAccepted" className="text-sm text-gray-700">
                  <span className="font-medium">Accetto il contratto di collaborazione</span>
                  <br />
                  <span className="text-xs text-gray-500">
                    Dichiaro di aver letto e compreso il contratto e accetto di rispettare tutti i termini e condizioni per la vendita e l'acquisto di prodotti MY.PENTASHOP.WORLD
                  </span>
                </label>
              </div>
            </div>

            {/* Informazioni Sicurezza */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🔒 Sicurezza</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• I tuoi documenti sono crittografati e sicuri</li>
                <li>• Utilizziamo solo servizi KYC certificati</li>
                <li>• I dati sono protetti secondo GDPR</li>
                <li>• La verifica richiede 24-48 ore lavorative</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Invio in corso...
                </div>
              ) : (
                'Invia Documenti per Verifica'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Hai domande sul processo KYC?{' '}
              <a href="/support" className="text-blue-600 hover:text-blue-700">
                Contattaci
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCForm; 