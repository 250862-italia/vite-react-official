import React from 'react';

function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">✅ Test Page</h1>
        <p className="text-gray-600 mb-6">React è funzionante!</p>
        <div className="bg-green-100 rounded-lg p-4">
          <p className="text-green-800 font-medium">🎉 Il sistema funziona correttamente</p>
        </div>
      </div>
    </div>
  );
}

export default TestPage; 