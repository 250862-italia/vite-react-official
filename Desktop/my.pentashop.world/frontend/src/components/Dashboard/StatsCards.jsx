import React from 'react';

const StatsCards = ({ user, progress }) => {
  const stats = [
    {
      label: 'Punti Totali',
      value: user.points,
      icon: '🎯',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      progress: Math.min((user.points / 1000) * 100, 100)
    },
    {
      label: 'Token Disponibili',
      value: user.tokens,
      icon: '💎',
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      progress: Math.min((user.tokens / 100) * 100, 100)
    },
    {
      label: 'Esperienza',
      value: user.experience,
      icon: '⭐',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      progress: Math.min((user.experience / user.experienceToNextLevel) * 100, 100)
    },
    {
      label: 'Task Completati',
      value: progress.completedTasks,
      icon: '✅',
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      progress: Math.min((progress.completedTasks / progress.totalTasks) * 100, 100)
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className={`stats-card ${stat.bgColor} animate-fade-in group`}
          style={{ 
            animationDelay: `${index * 0.1}s`,
            background: `linear-gradient(135deg, ${stat.bgColor.replace('bg-', '')} 0%, white 100%)`
          }}
        >
          {/* Icon and Value */}
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <span className="text-white text-xl">{stat.icon}</span>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${stat.textColor} group-hover:scale-110 transition-transform duration-300`}>
                {stat.value}
              </div>
              <div className="text-xs text-neutral-500 font-medium">
                {stat.label}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-neutral-600">Progresso</span>
              <span className="text-xs font-bold text-neutral-700">{Math.round(stat.progress)}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                style={{ 
                  width: `${stat.progress}%`,
                  animation: 'progressFill 1s ease-out'
                }}
              ></div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-neutral-500">
            {stat.label === 'Punti Totali' && (
              <span>Target: 1000 punti</span>
            )}
            {stat.label === 'Token Disponibili' && (
              <span>Target: 100 token</span>
            )}
            {stat.label === 'Esperienza' && (
              <span>Prossimo livello: {user.experienceToNextLevel} exp</span>
            )}
            {stat.label === 'Task Completati' && (
              <span>Totale: {progress.totalTasks} task</span>
            )}
          </div>

          {/* Hover Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards; 