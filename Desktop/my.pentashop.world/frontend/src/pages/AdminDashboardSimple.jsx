import React, { useState, useEffect } from 'react';
import Header from '../components/Layout/Header';

function AdminDashboardSimple() {
  const [user] = useState({
    username: 'admin',
    role: 'admin'
  });

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header user={user} onLogout={handleLogout} />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">🛠️ Admin Dashboard</h1>
            <p className="text-gray-600 mb-6">Versione semplificata per test</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-semibold text-blue-800">Utenti</h3>
                <p className="text-2xl font-bold text-blue-600">12</p>
              </div>
              
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="font-semibold text-green-800">Vendite</h3>
                <p className="text-2xl font-bold text-green-600">€1,234</p>
              </div>
              
              <div className="bg-purple-50 rounded-xl p-6">
                <h3 className="font-semibold text-purple-800">Commissioni</h3>
                <p className="text-2xl font-bold text-purple-600">€567</p>
              </div>
              
              <div className="bg-orange-50 rounded-xl p-6">
                <h3 className="font-semibold text-orange-800">Task</h3>
                <p className="text-2xl font-bold text-orange-600">8</p>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-green-100 rounded-lg">
              <p className="text-green-800 font-medium">✅ AdminDashboard semplificato funziona!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardSimple; 