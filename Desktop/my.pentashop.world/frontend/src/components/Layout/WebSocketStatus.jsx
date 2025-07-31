import React from 'react';

const WebSocketStatus = ({ isConnected, notifications }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Status Indicator */}
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg ${
        isConnected 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-300' : 'bg-red-300'
        } animate-pulse`}></div>
        <span className="text-xs font-medium">
          {isConnected ? '🟢 Connesso' : '🔴 Disconnesso'}
        </span>
      </div>
      
      {/* Notifications Counter */}
      {notifications.length > 0 && (
        <div className="mt-2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg">
          <div className="text-xs font-medium">
            🔔 {notifications.length} notifiche
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketStatus; 