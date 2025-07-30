import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import QuizPlayer from './QuizPlayer';
import DocumentReader from './DocumentReader';
import SurveyPlayer from './SurveyPlayer';
import axios from 'axios';

const TaskExecutor = ({ task, onComplete, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleTaskComplete = async (completedTask) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Simula l'invio al backend
      const response = await axios.post(getApiUrl(`/onboarding/tasks/${completedTask.id}/complete`)), {
        taskId: completedTask.id,
        completedAt: new Date().toISOString()
      });

      if (response.data.success) {
        // Mostra le ricompense
        const rewards = response.data.data.rewards;
        
        // Notifica completamento
        onComplete({
          task: completedTask,
          rewards: rewards,
          message: 'Task completato con successo!'
        });
      }
    } catch (err) {
      console.error('Errore completamento task:', err);
      setError('Errore durante il completamento del task. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTaskContent = () => {
    switch (task.type) {
      case 'video':
        return <VideoPlayer task={task} onComplete={handleTaskComplete} />;
      case 'quiz':
        return <QuizPlayer task={task} onComplete={handleTaskComplete} />;
      case 'document':
        return <DocumentReader task={task} onComplete={handleTaskComplete} />;
      case 'survey':
        return <SurveyPlayer task={task} onComplete={handleTaskComplete} />;
      default:
        return (
          <div className="card max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">
                Tipo di task non supportato
              </h2>
              <p className="text-neutral-600">
                Questo tipo di task non è ancora supportato. Contatta l'amministratore per assistenza.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-800">
            {task.title}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              ❌ {error}
            </div>
          )}

          {renderTaskContent()}
        </div>
      </div>
    </div>
  );
};

export default TaskExecutor; 