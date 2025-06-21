import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Award, 
  Trophy, 
  Star,
  CheckCircle,
  Lock
} from 'lucide-react';
import axios from 'axios';

const Badges = () => {
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const response = await axios.get('/onboarding/badges');
      setBadges(response.data.data.badges);
    } catch (error) {
      console.error('Errore caricamento badge:', error);
      // Fallback con dati mock
      setBadges([
        {
          id: 1,
          name: "Primo Passo",
          description: "Completa il primo task di onboarding",
          icon: "complete",
          category: "onboarding",
          level: 1,
          earned: true,
          earnedAt: new Date(),
          progress: 100
        },
        {
          id: 2,
          name: "Studente Diligente",
          description: "Guarda 3 video di formazione",
          icon: "locked",
          category: "onboarding",
          level: 1,
          earned: false,
          progress: 33
        },
        {
          id: 3,
          name: "Quiz Master",
          description: "Completa 5 quiz con successo",
          icon: "locked",
          category: "onboarding",
          level: 2,
          earned: false,
          progress: 0
        },
        {
          id: 4,
          name: "Contratto Firmato",
          description: "Firma il contratto di collaborazione",
          icon: "locked",
          category: "onboarding",
          level: 2,
          earned: false,
          progress: 0
        },
        {
          id: 5,
          name: "Wavemaker",
          description: "Completa tutto l'onboarding",
          icon: "locked",
          category: "onboarding",
          level: 3,
          earned: false,
          progress: 20
        },
        {
          id: 6,
          name: "Prima Vendita",
          description: "Completa la prima vendita",
          icon: "locked",
          category: "sales",
          level: 2,
          earned: false,
          progress: 0
        },
        {
          id: 7,
          name: "Referral King",
          description: "Invita 5 nuovi wavemaker",
          icon: "locked",
          category: "referral",
          level: 3,
          earned: false,
          progress: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'onboarding': return 'bg-blue-100 text-blue-600';
      case 'sales': return 'bg-green-100 text-green-600';
      case 'referral': return 'bg-purple-100 text-purple-600';
      case 'achievement': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'onboarding': return '🎯';
      case 'sales': return '💰';
      case 'referral': return '👥';
      case 'achievement': return '🏆';
      default: return '⭐';
    }
  };

  const getBadgeIcon = (iconType) => {
    switch (iconType) {
      case 'complete':
        return <img src="/images/badge-complete.svg" alt="Badge completato" className="w-12 h-12" />;
      case 'locked':
        return <img src="/images/badge-locked.svg" alt="Badge bloccato" className="w-12 h-12" />;
      default:
        return <img src="/images/badge-locked.svg" alt="Badge" className="w-12 h-12" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const earnedBadges = badges.filter(badge => badge.earned);
  const availableBadges = badges.filter(badge => !badge.earned);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={() => navigate('/onboarding')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Badge e Achievement</h1>
                <p className="text-sm text-gray-500">Raccogli tutti i badge disponibili</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Badge Guadagnati</p>
                <p className="text-2xl font-bold text-gray-900">{earnedBadges.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Badge Disponibili</p>
                <p className="text-2xl font-bold text-gray-900">{availableBadges.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completamento</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((earnedBadges.length / badges.length) * 100)}%
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className={`relative bg-white rounded-xl shadow-sm p-6 border-2 transition-all duration-200 hover:shadow-md ${
                badge.earned 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200'
              }`}
            >
              {/* Badge Icon */}
              <div className="text-center mb-4">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                  badge.earned 
                    ? 'bg-gradient-to-r from-green-400 to-blue-500' 
                    : 'bg-gray-200'
                }`}>
                  {getBadgeIcon(badge.icon)}
                </div>
                
                {/* Status Icon */}
                {badge.earned ? (
                  <div className="absolute top-4 right-4">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                ) : (
                  <div className="absolute top-4 right-4">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Badge Info */}
              <div className="text-center">
                <h3 className={`font-semibold text-lg mb-2 ${
                  badge.earned ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {badge.name}
                </h3>
                
                <p className={`text-sm mb-3 ${
                  badge.earned ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  {badge.description}
                </p>

                {/* Category */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-3 ${getCategoryColor(badge.category)}`}>
                  <span className="mr-1">{getCategoryIcon(badge.category)}</span>
                  {badge.category}
                </div>

                {/* Progress */}
                {!badge.earned && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progresso</span>
                      <span>{badge.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Earned Date */}
                {badge.earned && badge.earnedAt && (
                  <p className="text-xs text-gray-500">
                    Guadagnato il {new Date(badge.earnedAt).toLocaleDateString('it-IT')}
                  </p>
                )}

                {/* Level */}
                <div className="mt-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Livello {badge.level}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {badges.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun badge disponibile
            </h3>
            <p className="text-gray-500">
              Completa i task per sbloccare i primi badge!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Badges; 