import React, { useEffect, useState } from 'react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-xl shadow-2xl border transform transition-all duration-300";
    
    if (!isVisible) {
      return `${baseStyles} translate-x-full opacity-0`;
    }
    
    return `${baseStyles} translate-x-0 opacity-100`;
  };

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          borderColor: 'border-green-200',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          iconColor: 'text-green-600'
        };
      case 'error':
        return {
          icon: '❌',
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          icon: '⚠️',
          borderColor: 'border-yellow-200',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600'
        };
      default:
        return {
          icon: 'ℹ️',
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        };
    }
  };

  const { icon, borderColor, bgColor, textColor, iconColor } = getIconAndColor();

  return (
    <div className={getToastStyles()}>
      <div className={`p-4 border-l-4 ${borderColor} ${bgColor}`}>
        <div className="flex items-start">
          <div className={`text-xl mr-3 ${iconColor}`}>
            {icon}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${textColor}`}>
              {message}
            </p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast; 