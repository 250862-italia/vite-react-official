import React from 'react';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  trend = null, 
  subtitle = null,
  onClick = null 
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-100'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      hover: 'hover:bg-green-100'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      hover: 'hover:bg-purple-100'
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
      hover: 'hover:bg-orange-100'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      hover: 'hover:bg-red-100'
    }
  };

  const classes = colorClasses[color];
  const isClickable = onClick !== null;

  return (
    <div 
      className={`
        relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm
        transition-all duration-300 transform hover:scale-105 hover:shadow-lg
        ${isClickable ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full ${classes.bg} opacity-20 -mr-4 -mt-4`}></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${classes.bg} flex items-center justify-center`}>
            <span className="text-2xl">{icon}</span>
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend > 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <span>{trend > 0 ? '↗' : '↘'}</span>
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {subtitle && (
              <span className="text-sm text-gray-500">{subtitle}</span>
            )}
          </div>
        </div>

        {/* Progress bar (optional) */}
        {trend && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all duration-1000 ${
                  trend > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(Math.abs(trend), 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Hover effect */}
      {isClickable && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-0 hover:opacity-10 rounded-2xl transition-opacity duration-300"></div>
      )}
    </div>
  );
};

export default StatsCard; 