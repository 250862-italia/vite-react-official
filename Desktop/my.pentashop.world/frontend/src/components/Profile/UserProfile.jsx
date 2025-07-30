import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [badges, setBadges] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [profileRes, statsRes, walletRes, badgesRes] = await Promise.all([
        axios.get(getApiUrl('/profile'), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(getApiUrl('/profile/stats'), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(getApiUrl('/profile/wallet'), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(getApiUrl('/profile/badges'), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      setProfile(profileRes.data.data);
      setStats(statsRes.data.data);
      setWallet(walletRes.data.data);
      setBadges(badgesRes.data.data);
      setEditForm({
        firstName: profileRes.data.data.firstName,
        lastName: profileRes.data.data.lastName,
        email: profileRes.data.data.email,
        phone: profileRes.data.data.phone,
        country: profileRes.data.data.country,
        city: profileRes.data.data.city
      });
    } catch (err) {
      console.error('Errore caricamento profilo:', err);
      setError('Errore nel caricamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      country: profile.country,
      city: profile.city
    });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(getApiUrl('/profile'), editForm, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setProfile(response.data.data.user);
      setIsEditing(false);
      loadProfileData(); // Ricarica tutti i dati
    } catch (err) {
      console.error('Errore aggiornamento profilo:', err);
      setError('Errore nell\'aggiornamento del profilo');
    }
  };

  const handleInputChange = (e) => {
    setEditForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Caricamento profilo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadProfileData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile?.firstName} {profile?.lastName}
                </h1>
                <p className="text-gray-600">{profile?.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    profile?.role === 'ambassador' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {profile?.role === 'ambassador' ? '👑 Ambassador' : '🌟 Entry Ambassador'}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Livello {profile?.level}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleEdit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Modifica Profilo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informazioni Personali */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Informazioni Personali</h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                      <input
                        type="text"
                        name="firstName"
                        value={editForm.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cognome</label>
                      <input
                        type="text"
                        name="lastName"
                        value={editForm.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefono</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Paese</label>
                      <input
                        type="text"
                        name="country"
                        value={editForm.country}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Città</label>
                      <input
                        type="text"
                        name="city"
                        value={editForm.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Salva
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dati Personali</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Nome</span>
                        <p className="font-medium">{profile?.firstName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Cognome</span>
                        <p className="font-medium">{profile?.lastName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Email</span>
                        <p className="font-medium">{profile?.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Telefono</span>
                        <p className="font-medium">{profile?.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Indirizzo</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Paese</span>
                        <p className="font-medium">{profile?.country}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Città</span>
                        <p className="font-medium">{profile?.city}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Referral Code</span>
                        <p className="font-medium font-mono bg-gray-100 px-2 py-1 rounded">{profile?.referralCode}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Statistiche */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Statistiche</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats?.totalPoints}</div>
                  <div className="text-sm text-gray-600">Punti</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats?.totalTokens}</div>
                  <div className="text-sm text-gray-600">Token</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats?.totalExperience}</div>
                  <div className="text-sm text-gray-600">Esperienza</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats?.completedTasks}/{stats?.totalTasks}</div>
                  <div className="text-sm text-gray-600">Task Completati</div>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progresso Onboarding</span>
                  <span>{stats?.progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats?.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Wallet */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">💰 Wallet</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">€{wallet?.balance}</div>
                  <div className="text-sm text-gray-600">Saldo</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">€{wallet?.totalEarnings}</div>
                  <div className="text-sm text-gray-600">Guadagni Totali</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">€{wallet?.pendingAmount}</div>
                  <div className="text-sm text-gray-600">In Attesa</div>
                </div>
              </div>
              
              {wallet?.transactions?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ultime Transazioni</h3>
                  <div className="space-y-2">
                    {wallet.transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{transaction.type}</span>
                          <p className="text-sm text-gray-500">{transaction.date}</p>
                        </div>
                        <span className={`font-bold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          €{transaction.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Badge */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🏆 Badge</h2>
              <div className="space-y-3">
                {badges?.availableBadges?.map((badge) => (
                  <div key={badge.id} className={`flex items-center space-x-3 p-3 rounded-lg ${
                    badge.unlocked ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <span className="text-2xl">{badge.icon}</span>
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        badge.unlocked ? 'text-green-800' : 'text-gray-500'
                      }`}>
                        {badge.title}
                      </h3>
                      <p className={`text-sm ${
                        badge.unlocked ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {badge.description}
                      </p>
                    </div>
                    {badge.unlocked && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-600">
                  {badges?.totalBadges}/{badges?.totalAvailable} badge sbloccati
                </span>
              </div>
            </div>

            {/* Informazioni MLM */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 MLM</h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Commissione</span>
                  <p className="font-medium text-lg">{(profile?.commissionRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Vendite Totali</span>
                  <p className="font-medium text-lg">{profile?.totalSales}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Commissioni Totali</span>
                  <p className="font-medium text-lg">€{profile?.totalCommissions}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Sponsor Code</span>
                  <p className="font-medium font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {profile?.sponsorCode || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Informazioni Account */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Account</h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Username</span>
                  <p className="font-medium">{profile?.username}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Stato</span>
                  <p className={`font-medium ${
                    profile?.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {profile?.isActive ? 'Attivo' : 'Inattivo'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Membro dal</span>
                  <p className="font-medium">
                    {new Date(profile?.createdAt).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Ultimo accesso</span>
                  <p className="font-medium">
                    {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString('it-IT') : 'Mai'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 