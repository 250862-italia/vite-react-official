import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SurveyPlayer = ({ task, onComplete }) => {
  const [surveyData, setSurveyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carica i dati survey dal backend
  useEffect(() => {
    const loadSurveyData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(getApiUrl(`/tasks/${task.id}/survey`)), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          setSurveyData(response.data.data);
        } else {
          setError('Errore nel caricamento del survey');
        }
      } catch (err) {
        console.error('Errore caricamento survey:', err);
        setError('Errore nel caricamento del survey');
      } finally {
        setLoading(false);
      }
    };

    if (task && task.id) {
      loadSurveyData();
    }
  }, [task]);

  const handleAnswerChange = (questionId, value, type = 'text') => {
    if (type === 'checkbox') {
      setAnswers(prev => ({
        ...prev,
        [questionId]: prev[questionId] ? [...prev[questionId], value] : [value]
      }));
    } else if (type === 'radio') {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(getApiUrl(`/tasks/${task.id}/survey/submit`)), {
        answers
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const { completed, rewards } = response.data.data;
        
        if (completed) {
          onComplete({
            ...task,
            rewards
          });
        }
      }
    } catch (err) {
      console.error('Errore invio survey:', err);
      setError('Errore durante l\'invio del survey');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Caricamento survey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card max-w-2xl mx-auto">
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

  if (!surveyData || !surveyData.questions || surveyData.questions.length === 0) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">
            Survey non disponibile
          </h2>
          <p className="text-neutral-600">
            Questo task non contiene domande survey. Contatta l'amministratore per assistenza.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">
          {surveyData.title}
        </h2>
        <p className="text-neutral-600">
          {surveyData.description}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {surveyData.questions.map((question, index) => (
          <div key={question.id} className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">
              {index + 1}. {question.question}
            </label>
            
            {question.type === 'select' && (
              <select
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleziona un'opzione</option>
                {question.options.map((option, optIndex) => (
                  <option key={optIndex} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
            
            {question.type === 'radio' && (
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <label key={optIndex} className="flex items-center">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value, 'radio')}
                      className="mr-2"
                      required
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
            
            {question.type === 'checkbox' && (
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <label key={optIndex} className="flex items-center">
                    <input
                      type="checkbox"
                      value={option}
                      checked={answers[question.id]?.includes(option) || false}
                      onChange={(e) => handleAnswerChange(question.id, option, 'checkbox')}
                      className="mr-2"
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
            
            {question.type === 'text' && (
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Inserisci la tua risposta..."
                required
              />
            )}
          </div>
        ))}
        
        <div className="flex justify-center pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-lg"
          >
            {isSubmitting ? '⏳ Invio in corso...' : '📊 Invia Survey'}
          </button>
        </div>
      </form>

      {/* Fallback per survey non disponibile */}
      {(!surveyData.questions || surveyData.questions.length === 0) && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            💡 <strong>Nota:</strong> Questo task non contiene domande survey. 
            In produzione, qui verrebbero caricate le domande reali per il task "{surveyData.title}".
          </p>
        </div>
      )}
    </div>
  );
};

export default SurveyPlayer; 