import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TaskView = () => {
  const { taskId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/onboarding/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const taskData = await response.json();
        setTask(taskData);
        setProgress(taskData.progress || 0);
      }
    } catch (error) {
      console.error('Errore nel caricamento del task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/onboarding/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          answers,
          timeSpent
        })
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/onboarding');
        }, 2000);
      }
    } catch (error) {
      console.error('Errore nel completamento del task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Caricamento task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Task non trovato</h2>
          <p className="text-gray-600 mb-4">Il task richiesto non esiste o non è disponibile.</p>
          <button
            onClick={() => navigate('/onboarding')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header con progresso */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{task.title}</h1>
              <p className="text-gray-600 text-lg">{task.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{task.points} pts</div>
              <div className="text-sm text-gray-500">Punti disponibili</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progresso</span>
              <span className="text-sm font-medium text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Timer e Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{formatTime(timeSpent)}</div>
              <div className="text-sm text-blue-500">Tempo impiegato</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{task.difficulty}</div>
              <div className="text-sm text-green-500">Difficoltà</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{task.category}</div>
              <div className="text-sm text-purple-500">Categoria</div>
            </div>
          </div>
        </div>

        {/* Contenuto del Task */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {task.type === 'quiz' && (
            <div className="space-y-6">
              {task.questions?.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-300">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Domanda {index + 1}: {question.text}
                  </h3>
                  
                  {question.type === 'multiple_choice' && (
                    <div className="space-y-3">
                      {question.options.map((option, optIndex) => (
                        <label key={optIndex} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-3 text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'text' && (
                    <textarea
                      placeholder="Scrivi la tua risposta..."
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows="4"
                    />
                  )}

                  {question.hint && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowHint(!showHint)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                      >
                        <span className="mr-1">💡</span>
                        {showHint ? 'Nascondi suggerimento' : 'Mostra suggerimento'}
                      </button>
                      {showHint && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-yellow-800 text-sm">{question.hint}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {task.type === 'video' && (
            <div className="text-center">
              <div className="bg-gray-100 rounded-xl p-8 mb-6">
                <div className="text-6xl mb-4">🎥</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Video Tutorial</h3>
                <p className="text-gray-600">Guarda il video per completare questo task</p>
              </div>
              <div className="space-y-4">
                <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                  ▶️ Guarda Video
                </button>
                <div className="text-sm text-gray-500">
                  Durata stimata: {task.duration || '5 minuti'}
                </div>
              </div>
            </div>
          )}

          {task.type === 'interactive' && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-8 mb-6">
                <div className="text-6xl mb-4">🎮</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Attività Interattiva</h3>
                <p className="text-gray-600">Completa l'attività per guadagnare punti</p>
              </div>
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                🚀 Inizia Attività
              </button>
            </div>
          )}
        </div>

        {/* Azioni */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => navigate('/onboarding')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            ← Torna alla Dashboard
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Completando...
              </span>
            ) : (
              '✅ Completa Task'
            )}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4 animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Completato!</h2>
            <p className="text-gray-600 mb-4">Hai guadagnato {task.points} punti!</p>
            <div className="text-sm text-gray-500">
              Reindirizzamento alla dashboard...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskView; 