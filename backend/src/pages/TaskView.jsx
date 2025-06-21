import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Star, 
  Zap, 
  TrendingUp,
  Video,
  FileText,
  HelpCircle
} from 'lucide-react';
import axios from 'axios';

const TaskView = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState([]);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      // Per ora usiamo dati mock
      const mockTask = {
        id: parseInt(taskId),
        title: taskId === '1' ? 'Benvenuto in Wash The World' : 'Quiz: Conosci Wash The World?',
        description: taskId === '1' 
          ? 'Guarda il video di benvenuto e scopri la nostra missione' 
          : 'Testa la tua conoscenza sui nostri prodotti e valori',
        type: taskId === '1' ? 'video' : 'quiz',
        rewards: { points: taskId === '1' ? 25 : 50, tokens: taskId === '1' ? 5 : 10, experience: taskId === '1' ? 15 : 25 },
        requirements: taskId === '2' ? {
          quizQuestions: [
            {
              question: 'Qual è la missione di Wash The World?',
              options: [
                'Vendere più prodotti possibili',
                'Rendere il mondo più pulito e sostenibile',
                'Diventare leader del mercato',
                'Massimizzare i profitti'
              ],
              correctAnswer: 1
            },
            {
              question: 'Quale prodotto è il nostro bestseller?',
              options: [
                'Detersivo liquido',
                'Detersivo in polvere',
                'Ammorbidente',
                'Sapone per mani'
              ],
              correctAnswer: 0
            }
          ]
        } : null
      };
      
      setTask(mockTask);
    } catch (error) {
      console.error('Errore caricamento task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoWatched = async () => {
    try {
      await axios.post('/onboarding/video/watched', { videoId: `video_${taskId}` });
      setCompleted(true);
    } catch (error) {
      console.error('Errore marcatura video:', error);
    }
  };

  const handleQuizSubmit = async () => {
    try {
      const response = await axios.post('/onboarding/quiz/complete', {
        quizId: taskId,
        answers: quizAnswers
      });
      
      if (response.data.success) {
        setCompleted(true);
      }
    } catch (error) {
      console.error('Errore completamento quiz:', error);
    }
  };

  const handleCompleteTask = async () => {
    try {
      await axios.post('/onboarding/task/complete', { taskId: parseInt(taskId) });
      setCompleted(true);
    } catch (error) {
      console.error('Errore completamento task:', error);
    }
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-6 h-6" />;
      case 'quiz': return <HelpCircle className="w-6 h-6" />;
      case 'document': return <FileText className="w-6 h-6" />;
      default: return <Play className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Task non trovato</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={() => navigate('/onboarding')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {getTaskIcon(task.type)}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{task.title}</h1>
                <p className="text-sm text-gray-500">Task #{task.id}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-8 border border-gray-100"
        >
          {/* Task Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
            <p className="text-gray-600 mb-6">{task.description}</p>
            
            {/* Rewards */}
            <div className="flex items-center space-x-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">{task.rewards.points} punti</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">{task.rewards.tokens} token</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">{task.rewards.experience} exp</span>
              </div>
            </div>
          </div>

          {/* Task Content */}
          {task.type === 'video' && (
            <div className="mb-8">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <div className="text-center">
                  <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Video di benvenuto</p>
                  <p className="text-sm text-gray-500">Durata: 3 minuti</p>
                </div>
              </div>
              
              <button
                onClick={handleVideoWatched}
                disabled={completed}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completed ? (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Video completato
                  </div>
                ) : (
                  'Segna come guardato'
                )}
              </button>
            </div>
          )}

          {task.type === 'quiz' && task.requirements?.quizQuestions && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quiz</h3>
              
              <div className="space-y-6">
                {task.requirements.quizQuestions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">
                      {index + 1}. {question.question}
                    </h4>
                    
                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={optionIndex}
                            onChange={(e) => {
                              const newAnswers = [...quizAnswers];
                              newAnswers[index] = parseInt(e.target.value);
                              setQuizAnswers(newAnswers);
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleQuizSubmit}
                disabled={quizAnswers.length !== task.requirements.quizQuestions.length || completed}
                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completed ? (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Quiz completato
                  </div>
                ) : (
                  'Invia risposte'
                )}
              </button>
            </div>
          )}

          {/* Completion Status */}
          {completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-6 bg-green-50 border border-green-200 rounded-lg"
            >
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Task completato con successo!
              </h3>
              <p className="text-green-600 mb-4">
                Hai guadagnato {task.rewards.points} punti, {task.rewards.tokens} token e {task.rewards.experience} esperienza!
              </p>
              <button
                onClick={() => navigate('/onboarding')}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Torna alla dashboard
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TaskView; 