import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import TaskExecutor from '../components/Tasks/TaskExecutor';

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskExecutor, setShowTaskExecutor] = useState(false);
  const [completionMessage, setCompletionMessage] = useState(null);
  const [specialBadge, setSpecialBadge] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadTasks();
  }, [navigate]);

  const loadTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/tasks'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error('Errore nel caricamento dei task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = (task) => {
    setSelectedTask(task);
    setShowTaskExecutor(true);
  };

  const handleTaskComplete = async (completionData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        getApiUrl(`/tasks/${selectedTask.id}/complete`),
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setCompletionMessage({
          type: 'success',
          title: 'Task Completato! 🎉',
          message: 'Hai completato il task con successo!',
          rewards: response.data.data.rewards
        });

        // Controlla se è stato assegnato un badge speciale
        if (response.data.data.specialBadge) {
          setSpecialBadge(response.data.data.specialBadge);
          setShowBadgeModal(true);
        }

        // Ricarica i task per aggiornare lo stato
        await loadTasks();
      }
    } catch (error) {
      console.error('Errore nel completamento del task:', error);
      setCompletionMessage({
        type: 'error',
        title: 'Errore',
        message: 'Si è verificato un errore durante il completamento del task.'
      });
    }
  };

  const handleCloseTaskExecutor = () => {
    setShowTaskExecutor(false);
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento task...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Torna alla Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">📚 Task e Formazione</h1>
            </div>
            <div className="text-sm text-gray-500">
              MY.PENTASHOP.WORLD
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Completion Message */}
        {completionMessage && (
          <div className={`mb-6 p-4 rounded-lg border ${
            completionMessage.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">
                  {completionMessage.type === 'success' ? '🎉' : '⚠️'}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{completionMessage.title}</h3>
                  <p className="text-sm">{completionMessage.message}</p>
                  {completionMessage.rewards && (
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="text-sm font-medium">Ricompense:</span>
                      <span className="badge badge-primary">🎯 +{completionMessage.rewards.points} punti</span>
                      <span className="badge badge-success">💎 +{completionMessage.rewards.tokens} token</span>
                      <span className="badge badge-warning">⭐ +{completionMessage.rewards.experience} exp</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setCompletionMessage(null)}
                className="text-neutral-500 hover:text-neutral-700 text-2xl"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl">{task.icon || '📋'}</div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.isCompleted 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {task.isCompleted ? 'Completato' : 'Disponibile'}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{task.description}</p>
                
                {task.rewards && (
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-xs text-gray-500">Ricompense:</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">🎯 {task.rewards.points} punti</span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">💎 {task.rewards.tokens} token</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">⭐ {task.rewards.experience} exp</span>
                  </div>
                )}
                
                <button
                  onClick={() => handleStartTask(task)}
                  disabled={task.isCompleted}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    task.isCompleted
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white transform hover:scale-105'
                  }`}
                >
                  {task.isCompleted ? '✅ Completato' : '🚀 Inizia Task'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun task disponibile</h3>
            <p className="text-gray-600">Al momento non ci sono task da completare.</p>
          </div>
        )}
      </div>

      {/* Task Executor Modal */}
      {showTaskExecutor && selectedTask && (
        <TaskExecutor
          task={selectedTask}
          onComplete={handleTaskComplete}
          onClose={handleCloseTaskExecutor}
        />
      )}

      {/* Special Badge Modal */}
      {showBadgeModal && specialBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-bounce-in">
            <div className="text-6xl mb-4">{specialBadge.icon}</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{specialBadge.title}</h3>
            <p className="text-gray-600 mb-6">{specialBadge.description}</p>
            
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 mb-6">
              <div className="text-white font-bold text-lg">🎉 Congratulazioni!</div>
              <div className="text-white text-sm">Sei ora un Ambasciatore ufficiale di MY.PENTASHOP.WORLD</div>
            </div>
            
            <button
              onClick={() => {
                setShowBadgeModal(false);
                setSpecialBadge(null);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200"
            >
              🎊 Grazie!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TasksPage; 