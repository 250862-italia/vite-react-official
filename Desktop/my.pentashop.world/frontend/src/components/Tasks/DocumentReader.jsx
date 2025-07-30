import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DocumentReader = ({ task, onComplete }) => {
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readTime, setReadTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  // Carica i dati documento dal backend
  useEffect(() => {
    const loadDocumentData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(getApiUrl(`/tasks/${task.id}/document`)), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          setDocumentData(response.data.data);
          setStartTime(Date.now());
        } else {
          setError('Errore nel caricamento del documento');
        }
      } catch (err) {
        console.error('Errore caricamento documento:', err);
        setError('Errore nel caricamento del documento');
      } finally {
        setLoading(false);
      }
    };

    if (task && task.id) {
      loadDocumentData();
    }
  }, [task]);

  // Timer per tracciare il tempo di lettura
  useEffect(() => {
    if (startTime && !isCompleted) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setReadTime(elapsed);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [startTime, isCompleted]);

  const handleComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(getApiUrl(`/tasks/${task.id}/document/complete`)), {
        readTime
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const { completed, rewards } = response.data.data;
        
        if (completed) {
          setIsCompleted(true);
          onComplete({
            ...task,
            rewards
          });
        } else {
          setError(`Documento non completato. Tempo di lettura: ${readTime}s. Devi leggere per almeno 30 secondi.`);
        }
      }
    } catch (err) {
      console.error('Errore completamento documento:', err);
      setError('Errore durante il completamento del documento');
    }
  };

  if (loading) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Caricamento documento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Errore
          </h2>
          <p className="text-neutral-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">
            Documento non disponibile
          </h2>
          <p className="text-neutral-600">
            Questo task non contiene un documento. Contatta l'amministratore per assistenza.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">
          {documentData.title}
        </h2>
        <p className="text-neutral-600 mb-4">
          {documentData.description}
        </p>
        
        {/* Timer di lettura */}
        <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">⏱️</span>
            <span className="text-sm font-medium text-blue-800">
              Tempo di lettura: {readTime}s
            </span>
          </div>
          <div className="text-sm text-blue-600">
            Minimo: 30s
          </div>
        </div>
      </div>

      {/* Contenuto documento */}
      <div className="prose prose-lg max-w-none">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          {documentData.content ? (
            <div 
              className="text-neutral-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: documentData.content }}
            />
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-neutral-600">Contenuto documento non disponibile</p>
              <p className="text-sm text-neutral-500 mt-2">
                Contatta l'amministratore per aggiungere il contenuto del documento.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pulsante completamento */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleComplete}
          disabled={readTime < 30 || isCompleted}
          className={`btn ${readTime >= 30 && !isCompleted ? 'btn-primary' : 'btn-disabled'}`}
        >
          {isCompleted ? '✅ Completato' : readTime >= 30 ? '✅ Conferma Lettura' : `⏳ Leggi ancora (${30 - readTime}s)`}
        </button>
      </div>

      {/* Completion Status */}
      {isCompleted && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-green-600 text-xl mr-2">✅</span>
            <span className="text-green-800 font-medium">
              Documento completato! Puoi procedere al prossimo task.
            </span>
          </div>
        </div>
      )}

      {/* Fallback per documento non disponibile */}
      {!documentData.content && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            💡 <strong>Nota:</strong> Questo task non contiene contenuto. 
            In produzione, qui verrebbe caricato il documento reale per il task "{documentData.title}".
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentReader; 