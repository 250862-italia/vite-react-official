import React from 'react';

const TaskCard = ({ task, onStartTask, isCompleted = false }) => {
  const getTaskIcon = (type) => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'quiz':
        return '📝';
      case 'document':
        return '📄';
      case 'survey':
        return '📊';
      default:
        return '📋';
    }
  };

  const getTaskColor = (type) => {
    switch (type) {
      case 'video':
        return 'bg-blue-100 text-blue-800';
      case 'quiz':
        return 'bg-green-100 text-green-800';
      case 'document':
        return 'bg-purple-100 text-purple-800';
      case 'survey':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`card hover:shadow-lg transition-all duration-200 animate-fade-in ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${getTaskColor(task.type)}`}>
            {getTaskIcon(task.type)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-1">
              {task.title}
            </h3>
            <p className="text-sm text-neutral-600">
              {task.description}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          {isCompleted && (
            <div className="mb-2">
              <span className="badge badge-success">
                ✅ Completato
              </span>
            </div>
          )}
          <span className={`badge ${getTaskColor(task.type)}`}>
            {task.type}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-neutral-600">
          <div className="flex items-center space-x-1">
            <span className="text-blue-600 font-medium">🎯</span>
            <span>{task.rewards.points} punti</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-green-600 font-medium">💎</span>
            <span>{task.rewards.tokens} token</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-purple-600 font-medium">⭐</span>
            <span>{task.rewards.experience} exp</span>
          </div>
        </div>

        <button
          onClick={() => onStartTask(task)}
          className={`btn btn-sm ${isCompleted ? 'btn-success' : 'btn-primary'}`}
          disabled={isCompleted}
        >
          {isCompleted ? '✅ Completato' : 'Inizia Task'}
        </button>
      </div>

      {task.level && (
        <div className="mt-3 pt-3 border-t border-neutral-200">
          <span className="text-xs text-neutral-500">
            Livello richiesto: {task.level}
          </span>
        </div>
      )}
    </div>
  );
};

export default TaskCard; 