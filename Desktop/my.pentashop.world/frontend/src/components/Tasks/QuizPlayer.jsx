import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QuizPlayer = ({ task, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carica i dati quiz dal backend
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:3000/api/tasks/${task.id}/quiz`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          setQuizData(response.data.data);
        } else {
          setError('Errore nel caricamento del quiz');
        }
      } catch (err) {
        console.error('Errore caricamento quiz:', err);
        setError('Errore nel caricamento del quiz');
      } finally {
        setLoading(false);
      }
    };

    if (task && task.id) {
      loadQuizData();
    }
  }, [task]);

  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:3000/api/tasks/${task.id}/quiz/validate`, {
        answers
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const { score, passed, rewards } = response.data.data;
        
        if (passed) {
          setIsCompleted(true);
          onComplete({
            ...task,
            score,
            rewards
          });
        } else {
          setError(`Quiz non superato. Punteggio: ${score}%. Devi ottenere almeno il 70%.`);
        }
      }
    } catch (err) {
      console.error('Errore validazione quiz:', err);
      setError('Errore durante la validazione del quiz');
    }
  };

  if (loading) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Caricamento quiz...</p>
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

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">
            Quiz non disponibile
          </h2>
          <p className="text-neutral-600">
            Questo task non contiene domande quiz. Contatta l'amministratore per assistenza.
          </p>
        </div>
      </div>
    );
  }

  const currentQ = quizData.questions[currentQuestion];

  if (showResults) {
    // Calcola il punteggio localmente per mostrare i risultati
    let correct = 0;
    quizData.questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    const score = Math.round((correct / quizData.questions.length) * 100);
    const passed = score >= 70;

    return (
      <div className="card max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">
            Risultati Quiz
          </h2>
          <p className="text-neutral-600">
            {task.title}
          </p>
        </div>

        <div className="text-center mb-6">
          <div className={`text-6xl mb-4 ${passed ? 'text-green-500' : 'text-red-500'}`}>
            {passed ? '🎉' : '😔'}
          </div>
          <h3 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {passed ? 'Congratulazioni!' : 'Riprova'}
          </h3>
          <p className="text-neutral-600 mb-4">
            Hai ottenuto {score}% di risposte corrette
          </p>
          
          <div className="progress mb-4">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${score}%`,
                background: passed ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
              }}
            ></div>
          </div>

          <p className="text-sm text-neutral-500">
            {passed ? 'Hai superato il quiz!' : 'Devi ottenere almeno 70% per superare il quiz'}
          </p>
        </div>

        {/* Rewards */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h4 className="font-semibold text-blue-800 mb-2">Ricompense:</h4>
          <div className="flex items-center space-x-4">
            <span className="badge badge-primary">🎯 {task.rewards.points} punti</span>
            <span className="badge badge-success">💎 {task.rewards.tokens} token</span>
            <span className="badge badge-warning">⭐ {task.rewards.experience} exp</span>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setShowResults(false)}
            className="btn btn-outline flex-1"
          >
            Rivedi Risposte
          </button>
          
          {passed && (
            <button
              onClick={handleComplete}
              className="btn btn-primary flex-1"
            >
              Conferma Completamento
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">
          {task.title}
        </h2>
        <p className="text-neutral-600 mb-4">
          {task.description}
        </p>
        
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-neutral-600">
              Domanda {currentQuestion + 1} di {quizData.questions.length}
            </span>
            <span className="text-sm text-neutral-600">
              {Math.round(((currentQuestion + 1) / quizData.questions.length) * 100)}%
            </span>
          </div>
          <div className="progress">
            <div 
              className="progress-bar" 
              style={{ width: `${((currentQuestion + 1) / quizData.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">
          {currentQ.question}
        </h3>
        
        <div className="space-y-3">
          {currentQ.options.map((option, index) => (
            <label
              key={index}
              className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                answers[currentQ.id] === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-neutral-200 hover:border-blue-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQ.id}`}
                value={index}
                checked={answers[currentQ.id] === index}
                onChange={() => handleAnswerSelect(currentQ.id, index)}
                className="sr-only"
              />
              <div className="flex items-center">
                <div className={`w-4 h-4 border-2 rounded-full mr-3 ${
                  answers[currentQ.id] === index
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-neutral-300'
                }`}>
                  {answers[currentQ.id] === index && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <span className="text-neutral-700">{option}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestion === 0}
          className="btn btn-outline"
        >
          ← Precedente
        </button>
        
        <button
          onClick={handleNextQuestion}
          disabled={answers[currentQ.id] === undefined}
          className="btn btn-primary"
        >
          {currentQuestion === quizData.questions.length - 1 ? 'Finisci Quiz' : 'Prossima →'}
        </button>
      </div>
    </div>
  );
};

export default QuizPlayer; 