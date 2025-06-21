import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Badges = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/badges', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBadges(data);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'Tutti', icon: '🏆', color: 'from-purple-500 to-pink-500' },
    { id: 'achievement', name: 'Achievement', icon: '⭐', color: 'from-yellow-400 to-orange-500' },
    { id: 'milestone', name: 'Milestone', icon: '🎯', color: 'from-blue-500 to-cyan-500' },
    { id: 'special', name: 'Speciali', icon: '💎', color: 'from-indigo-500 to-purple-500' },
    { id: 'event', name: 'Eventi', icon: '🎉', color: 'from-pink-500 to-rose-500' },
    { id: 'rank', name: 'Rank', icon: '👑', color: 'from-amber-500 to-yellow-500' }
  ];

  const filteredBadges = badges
    .filter(badge => selectedCategory === 'all' || badge.category === selectedCategory)
    .filter(badge => 
      badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      badge.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const earnedBadges = badges.filter(b => b.earned);
  const unearnedBadges = badges.filter(b => !b.earned);
  const completionRate = badges.length > 0 ? Math.round((earnedBadges.length / badges.length) * 100) : 0;

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-600 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
          </div>
          <p className="text-gray-600 font-medium">Caricamento badge...</p>
          <p className="text-gray-400 text-sm mt-2">Preparando la tua collezione</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/onboarding')}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">I Miei Badge</h1>
                <p className="text-sm text-gray-500">Raccolta dei tuoi successi</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{earnedBadges.length}/{badges.length}</p>
                <p className="text-xs text-gray-500">Badge Ottenuti</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                {completionRate}%
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl animate-bounce">🏆</div>
                <h2 className="text-4xl font-bold">
                  I Tuoi Successi
                </h2>
              </div>
              <p className="text-purple-100 text-lg max-w-2xl">
                Ogni badge rappresenta un traguardo raggiunto nel tuo viaggio con Wash The World. 
                Continua a crescere e sblocca nuovi successi!
              </p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cerca badge..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white rounded-2xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg shadow-purple-600/25`
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-purple-300'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        {filteredBadges.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Nessun badge trovato</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {selectedCategory === 'all' && searchTerm === ''
                ? 'Non hai ancora ottenuto nessun badge. Completa le attività per sbloccare i tuoi primi successi!'
                : `Nessun badge corrisponde ai tuoi criteri di ricerca.`
              }
            </p>
            {(selectedCategory !== 'all' || searchTerm !== '') && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                }}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                Mostra tutti i badge
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBadges.map((badge, index) => (
              <div
                key={badge.id}
                onClick={() => handleBadgeClick(badge)}
                className={`group cursor-pointer transition-all duration-500 hover:scale-105 hover:rotate-1 ${
                  badge.earned ? 'animate-fade-in' : 'opacity-60'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-purple-200 transition-all duration-500 group-hover:-translate-y-2 relative overflow-hidden">
                  {/* Badge Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Badge Icon */}
                  <div className={`w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center text-4xl relative z-10 transition-all duration-500 group-hover:scale-110 ${
                    badge.earned 
                      ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-lg shadow-yellow-500/25 animate-pulse' 
                      : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-400'
                  }`}>
                    {badge.earned ? badge.icon : '🔒'}
                    {badge.earned && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Badge Info */}
                  <div className="relative z-10">
                    <h3 className={`text-xl font-bold mb-3 text-center ${
                      badge.earned ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {badge.name}
                    </h3>
                    
                    <p className={`text-sm mb-4 text-center line-clamp-2 ${
                      badge.earned ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {badge.description}
                    </p>

                    {/* Category Tag */}
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 mx-auto block w-fit">
                      <span>{categories.find(c => c.id === badge.category)?.icon}</span>
                      {categories.find(c => c.id === badge.category)?.name}
                    </div>

                    {/* Earned Date */}
                    {badge.earned && badge.earnedAt && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 text-center">
                          Ottenuto il {new Date(badge.earnedAt).toLocaleDateString('it-IT')}
                        </p>
                      </div>
                    )}

                    {/* Progress Bar for Unearned Badges */}
                    {!badge.earned && badge.progress && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                          <span>Progresso</span>
                          <span>{badge.progress.current}/{badge.progress.target}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${(badge.progress.current / badge.progress.target) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Stats Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Le tue statistiche</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {earnedBadges.length}
                </h3>
                <p className="text-gray-600 font-medium">Badge Ottenuti</p>
                <p className="text-xs text-green-600 mt-1">+{earnedBadges.length * 10} punti totali</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {unearnedBadges.length}
                </h3>
                <p className="text-gray-600 font-medium">Da Sbloccare</p>
                <p className="text-xs text-blue-600 mt-1">Continua a crescere!</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {completionRate}%
                </h3>
                <p className="text-gray-600 font-medium">Completamento</p>
                <p className="text-xs text-purple-600 mt-1">Ottimo progresso!</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {Math.max(...badges.map(b => b.rarity || 1))}
                </h3>
                <p className="text-gray-600 font-medium">Rarità Max</p>
                <p className="text-xs text-orange-600 mt-1">Badge esclusivi!</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Badge Detail Modal */}
      {showModal && selectedBadge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className={`w-32 h-32 mx-auto mb-6 rounded-3xl flex items-center justify-center text-6xl ${
                selectedBadge.earned 
                  ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-lg shadow-yellow-500/25' 
                  : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-400'
              }`}>
                {selectedBadge.earned ? selectedBadge.icon : '🔒'}
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {selectedBadge.name}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {selectedBadge.description}
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">Categoria</span>
                  <span className="font-medium">{categories.find(c => c.id === selectedBadge.category)?.name}</span>
                </div>
                
                {selectedBadge.earned && selectedBadge.earnedAt && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <span className="text-gray-600">Ottenuto il</span>
                    <span className="font-medium text-green-700">
                      {new Date(selectedBadge.earnedAt).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                )}

                {selectedBadge.rarity && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                    <span className="text-gray-600">Rarità</span>
                    <span className="font-medium text-purple-700">{selectedBadge.rarity}/5</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="mt-8 w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Badges; 