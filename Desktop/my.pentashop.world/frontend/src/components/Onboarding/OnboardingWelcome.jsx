import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OnboardingWelcome = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [videoWatched, setVideoWatched] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [user, setUser] = useState(null);

  // Quiz domande
  const quizQuestions = [
    {
      id: 1,
              question: "Qual è la missione di MY.PENTASHOP.WORLD?",
      options: [
        "Vendere prodotti di pulizia",
        "Ridurre l'inquinamento dei mari attraverso prodotti ecologici",
        "Diventare leader nel mercato della pulizia",
        "Fare profitti"
      ],
      correct: 1
    },
    {
      id: 2,
      question: "Come funziona il sistema di commissioni?",
      options: [
        "Solo vendite dirette",
        "Vendite dirette + commissioni dalla rete di referral",
        "Solo commissioni dalla rete",
        "Nessuna commissione"
      ],
      correct: 1
    },
    {
      id: 3,
      question: "Quali sono i vantaggi di essere Ambassador?",
      options: [
        "Solo guadagni economici",
        "Guadagni economici + impatto ambientale positivo",
        "Solo impatto ambientale",
        "Nessun vantaggio"
      ],
      correct: 1
    }
  ];

  // Carica stato utente
  useEffect(() => {
    loadUserStatus();
  }, []);

  const loadUserStatus = async () => {
    try {
      const response = await axios.get('/api/onboarding/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento stato utente:', error);
    }
  };

  const handleVideoEnd = () => {
    setVideoWatched(true);
  };

  const handleQuizAnswer = (questionId, answerIndex) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleQuizSubmit = () => {
    const allAnswered = quizQuestions.every(q => quizAnswers[q.id] !== undefined);
    const allCorrect = quizQuestions.every(q => quizAnswers[q.id] === q.correct);
    
    if (!allAnswered) {
      setError('Rispondi a tutte le domande');
      return;
    }
    
    if (allCorrect) {
      setQuizCompleted(true);
      setError('');
    } else {
      setError('Alcune risposte non sono corrette. Riprova!');
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      setLoading(true);
      
      const response = await axios.post('/api/onboarding/complete-task', {
        taskId: 1,
        type: 'welcome_video',
        completed: true
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        if (onComplete) {
          onComplete(response.data.data);
        }
      }
    } catch (error) {
      setError('Errore durante il completamento dell\'onboarding');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    let progress = 0;
    if (videoWatched) progress += 50;
    if (quizCompleted) progress += 50;
    return progress;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎬 Benvenuto nel tuo percorso Ambassador!
          </h1>
          <p className="text-xl text-gray-600">
            Completa l'onboarding per iniziare la tua avventura
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progresso: {calculateProgress()}%
            </span>
            <span className="text-sm text-gray-500">
              {videoWatched ? '✅' : '⏳'} Video | {quizCompleted ? '✅' : '⏳'} Quiz
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Video di Benvenuto */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                🎬 Video di Benvenuto
              </h2>
              <p className="text-gray-600">
                Guarda il video per conoscere la missione di MY.PENTASHOP.WORLD
              </p>
            </div>

            <div className="aspect-video bg-gray-100 rounded-lg mb-6 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-gray-600">Video di benvenuto</p>
                <p className="text-sm text-gray-500 mt-2">
                  (Simulazione - in produzione sarebbe un video reale)
                </p>
                <button
                  onClick={handleVideoEnd}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Simula Fine Video
                </button>
              </div>
            </div>

            {videoWatched && (
              <div className="text-center">
                <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
                  <span className="mr-2">✅</span>
                  Video completato!
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continua con il Quiz
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Quiz */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                🧠 Quiz di Verifica
              </h2>
              <p className="text-gray-600">
                Rispondi alle domande per verificare la tua comprensione
              </p>
            </div>

            <div className="space-y-6">
              {quizQuestions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    Domanda {index + 1}: {question.question}
                  </h3>
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={optionIndex}
                          checked={quizAnswers[question.id] === optionIndex}
                          onChange={() => handleQuizAnswer(question.id, optionIndex)}
                          className="mr-3"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
              >
                ← Indietro
              </button>
              <button
                onClick={handleQuizSubmit}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Verifica Risposte
              </button>
            </div>

            {quizCompleted && (
              <div className="text-center mt-6">
                <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
                  <span className="mr-2">✅</span>
                  Quiz completato con successo!
                </div>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Completa Onboarding
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Completamento */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Onboarding Completato!
              </h2>
              <p className="text-gray-600 mb-6">
                Congratulazioni! Hai completato con successo l'onboarding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold text-blue-800 mb-1">Punti Guadagnati</h3>
                <p className="text-blue-600">+25 punti</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl mb-2">🚀</div>
                <h3 className="font-semibold text-green-800 mb-1">Livello Onboarding</h3>
                <p className="text-green-600">Livello 2</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl mb-2">⭐</div>
                <h3 className="font-semibold text-purple-800 mb-1">Badge Sbloccato</h3>
                <p className="text-purple-600">Onboarding Complete</p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleCompleteOnboarding}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Completamento in corso...
                  </div>
                ) : (
                  'Continua al Dashboard'
                )}
              </button>
              
              <button
                onClick={() => window.location.href = '/plans'}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
              >
                Scegli Piano di Abbonamento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingWelcome; 