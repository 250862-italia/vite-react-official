import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Trophy, 
  Target, 
  Star, 
  Wallet, 
  Euro,
  Percent,
  Award
} from 'lucide-react';

const UserStats = ({ user, stats }) => {
  const statCards = [
    {
      title: 'Livello',
      value: user?.level || 1,
      icon: Trophy,
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      title: 'Punti',
      value: user?.points || 0,
      icon: Star,
      color: 'from-blue-400 to-purple-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Token WTW',
      value: user?.tokens || 0,
      icon: Wallet,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Commissioni',
      value: `€${user?.totalCommissions || 0}`,
      icon: Euro,
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              variants={cardVariants}
              className={`${stat.bgColor} rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Experience Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Progresso Esperienza</h3>
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-gray-600">
                {user?.experience || 0} / {user?.experienceToNextLevel || 100}
              </span>
            </div>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min(((user?.experience || 0) / (user?.experienceToNextLevel || 100)) * 100, 100)}%` 
              }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {user?.experienceToNextLevel - (user?.experience || 0)} punti per il prossimo livello
          </p>
        </div>

        {/* Onboarding Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Onboarding</h3>
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-secondary-600" />
              <span className="text-sm font-medium text-gray-600">
                {stats?.completedTasks || 0} / {stats?.totalTasks || 0}
              </span>
            </div>
          </div>
          <div className="progress-bar">
            <motion.div
              className="h-full bg-gradient-to-r from-secondary-500 to-purple-500 transition-all duration-500 ease-out"
              initial={{ width: 0 }}
              animate={{ 
                width: `${stats?.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` 
              }}
              transition={{ duration: 1, delay: 0.6 }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {stats?.totalTasks - (stats?.completedTasks || 0)} task rimanenti
          </p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg hover:shadow-md transition-all duration-200"
          >
            <TrendingUp className="w-6 h-6 text-primary-600" />
            <div className="text-left">
              <p className="font-medium text-primary-900">Upgrade MLM</p>
              <p className="text-sm text-primary-700">Aumenta le commissioni</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-secondary-50 to-secondary-100 border border-secondary-200 rounded-lg hover:shadow-md transition-all duration-200"
          >
            <Award className="w-6 h-6 text-secondary-600" />
            <div className="text-left">
              <p className="font-medium text-secondary-900">Sblocca Badge</p>
              <p className="text-sm text-secondary-700">Completa i task</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-lg hover:shadow-md transition-all duration-200"
          >
            <Wallet className="w-6 h-6 text-success-600" />
            <div className="text-left">
              <p className="font-medium text-success-900">Gestisci Wallet</p>
              <p className="text-sm text-success-700">Visualizza transazioni</p>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default UserStats; 