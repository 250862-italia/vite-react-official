import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Star, 
  CheckCircle, 
  Clock, 
  Award,
  Droplets,
  Sparkles,
  Target,
  Trophy
} from 'lucide-react';
import axios from 'axios';

const TaskView = () => {
  const { taskId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      console.log('🔄 Caricamento task ID:', taskId);
      const response = await axios.get(`http://localhost:5000/api/onboarding/tasks/${taskId}`);
      console.log('✅ Task ricevuto:', response.data);
      setTask(response.data.data.task);
      setCompleted(response.data.data.task.completed);
      console.log('📋 Task impostato nel state');
    } catch (error) {
      console.error('❌ Errore nel caricamento del task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    setSubmitting(true);
    try {
      console.log('🏁 Completamento task ID:', taskId);
      const response = await axios.post(`http://localhost:5000/api/onboarding/tasks/${taskId}/complete`);
      console.log('✅ Task completato:', response.data);
      setCompleted(true);
      setShowSuccess(true);
      
      // Mostra l'animazione di successo per 3 secondi
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('❌ Errore nel completamento del task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Task non trovato</h2>
          <p className="text-gray-600 mb-4">Il task che stai cercando non esiste.</p>
          <button
            onClick={() => navigate('/onboarding')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Success Animation Overlay */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-2xl p-8 text-center max-w-md mx-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Task Completato!</h3>
            <p className="text-gray-600 mb-4">
              Hai guadagnato <span className="font-bold text-yellow-600">{task.experiencePoints} XP</span>!
            </p>
            <div className="flex items-center justify-center space-x-2 text-yellow-600">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-medium">+{task.experiencePoints} Esperienza</span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={() => navigate('/onboarding')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Torna alla Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* Task Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    {completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Target className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{task.title}</h1>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm">{task.experiencePoints} XP</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{task.estimatedTime || '5-10 min'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {completed && (
                <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Completato</span>
                </div>
              )}
            </div>
          </div>

          {/* Task Content */}
          <div className="p-6">
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Descrizione</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">{task.description}</p>

              {task.instructions && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Istruzioni</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-gray-700 whitespace-pre-wrap">{task.instructions}</p>
                  </div>
                </>
              )}

              {task.tips && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Suggerimenti</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-2">
                      <Sparkles className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">{task.tips}</p>
                    </div>
                  </div>
                </>
              )}

              {task.resources && task.resources.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Risorse Utili</h3>
                  <div className="space-y-2 mb-6">
                    {task.resources.map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Droplets className="w-4 h-4" />
                        <span>{resource.title}</span>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6">
              {!completed ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleCompleteTask}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Completando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Completa Task</span>
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => navigate('/onboarding')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Torna alla Dashboard
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-medium">Task completato con successo!</span>
                  </div>
                  <button
                    onClick={() => navigate('/onboarding')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Continua con altri Task
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TaskView; 