import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Caricamento...', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-pulse`}></div>
        
        {/* Spinning ring */}
        <div 
          className={`${sizeClasses[size]} border-4 border-transparent border-t-blue-600 rounded-full animate-spin absolute top-0 left-0`}
          style={{ animationDuration: '1s' }}
        ></div>
        
        {/* Inner ring */}
        <div 
          className={`${sizeClasses[size]} border-4 border-transparent border-b-purple-600 rounded-full animate-spin absolute top-0 left-0`}
          style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
        ></div>
      </div>
      
      {text && (
        <p className="mt-4 text-gray-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 