import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Award, 
  ArrowLeft, 
  Star, 
  Lock, 
  CheckCircle,
  Trophy,
  Target,
  Zap
} from 'lucide-react';
import axios from 'axios';

const Badges = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    unlocked: 0,
    total: 0,
    percentage: 0
  });

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      console.log('🏆 Caricamento badge...');
      // Carica i badge dal backend
      const response = await axios.get('http://localhost:5000/api/onboarding/badges');
      console.log('✅ Badge ricevuti dal backend:', response.data);
      const backendBadges = response.data.data.badges;
      
      // Adatta i dati del backend alla struttura del frontend
      const adaptedBadges = backendBadges.map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        unlocked: badge.earned,
        unlockedAt: badge.earnedAt,
        rarity: badge.level === 1 ? 'common' : badge.level === 2 ? 'rare' : 'epic',
        progress: badge.progress
      }));
      
      console.log('🏅 Badge adattati:', adaptedBadges);
      setBadges(adaptedBadges);
      setStats({
        unlocked: adaptedBadges.filter(b => b.unlocked).length,
        total: adaptedBadges.length,
        percentage: adaptedBadges.length > 0 ? Math.round((adaptedBadges.filter(b => b.unlocked).length / adaptedBadges.length) * 100) : 0
      });
      console.log('📊 Statistiche badge aggiornate');
    } catch (error) {
      console.error('❌ Errore nel caricamento dei badge:', error);
      // Fallback con badge di esempio
      const fallbackBadges = [
        {
          id: 1,
          name: 'Primo Passo',
          description: 'Completato il primo task di onboarding',
          icon: '🌟',
          unlocked: true,
          unlockedAt: '2024-06-18',
          rarity: 'common'
        },
        {
          id: 2,
          name: 'Esploratore',
          description: 'Visitato 5 pagine diverse',
          icon: '🗺️',
          unlocked: true,
          unlockedAt: '2024-06-18',
          rarity: 'common'
        },
        {
          id: 3,
          name: 'Collezionista',
          description: 'Ottenuto 10 badge diversi',
          icon: '💎',
          unlocked: false,
          rarity: 'rare'
        },
        {
          id: 4,
          name: 'Innovatore',
          description: 'Completato tutti i task di livello avanzato',
          icon: '🚀',
          unlocked: false,
          rarity: 'epic'
        },
        {
          id: 5,
          name: 'Ambasciatore',
          description: 'Invita 5 amici alla piattaforma',
          icon: '🌍',
          unlocked: false,
          rarity: 'legendary'
        }
      ];
      
      setBadges(fallbackBadges);
      setStats({
        unlocked: 2,
        total: 5,
        percentage: 40
      });
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-500';
      case 'rare': return 'from-blue-400 to-blue-500';
      case 'epic': return 'from-purple-400 to-purple-500';
      case 'legendary': return 'from-yellow-400 to-orange-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityName = (rarity) => {
    switch (rarity) {
      case 'common': return 'Comune';
      case 'rare': return 'Raro';
      case 'epic': return 'Epico';
      case 'legendary': return 'Leggendario';
      default: return 'Comune';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">🏆 I Tuoi Badge</h1>
                <p className="text-sm text-gray-600">Raccogli successi e conquista traguardi</p>
              </div>
            </div>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Badge Sbloccati</h3>
              <p className="text-3xl font-bold text-green-600">{stats.unlocked}</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Totale Badge</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Completamento</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.percentage}%</p>
            </div>
          </div>
        </motion.div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-xl shadow-lg p-6 transition-all duration-300 transform hover:scale-105 ${
                badge.unlocked ? 'hover:shadow-xl' : 'opacity-60'
              }`}
            >
              {/* Badge Icon */}
              <div className="text-center mb-4">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-3 ${
                  badge.unlocked 
                    ? `bg-gradient-to-r ${getRarityColor(badge.rarity)}` 
                    : 'bg-gray-300'
                }`}>
                  {badge.unlocked ? badge.icon : <Lock className="w-8 h-8 text-gray-500" />}
                </div>
                
                {/* Rarity Badge */}
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  badge.unlocked 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {getRarityName(badge.rarity)}
                </span>
              </div>

              {/* Badge Info */}
              <div className="text-center">
                <h3 className={`text-lg font-semibold mb-2 ${
                  badge.unlocked ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {badge.name}
                </h3>
                <p className={`text-sm mb-4 ${
                  badge.unlocked ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {badge.description}
                </p>

                {/* Unlock Date */}
                {badge.unlocked && badge.unlockedAt && (
                  <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Sbloccato il {new Date(badge.unlockedAt).toLocaleDateString('it-IT')}</span>
                  </div>
                )}

                {/* Locked Status */}
                {!badge.unlocked && (
                  <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                    <Lock className="w-3 h-3" />
                    <span>Non ancora sbloccato</span>
                  </div>
                )}
              </div>

              {/* Shine Effect for Unlocked Badges */}
              {badge.unlocked && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            <Zap className="w-5 h-5" />
            <span>Continua l'Onboarding</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Badges; 