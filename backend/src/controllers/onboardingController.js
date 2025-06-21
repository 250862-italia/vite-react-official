const User = require('../models/User');
const OnboardingTask = require('../models/OnboardingTask');
const Badge = require('../models/Badge');
const blockchainService = require('../services/blockchainService');

class OnboardingController {
  // Ottieni dashboard onboarding
  async getOnboardingDashboard(req, res) {
    try {
      const user = await User.findById(req.user.userId)
        .populate('onboardingProgress.currentTask')
        .populate('badges.badgeId')
        .populate('onboardingProgress.tasksCompleted.taskId');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      // Ottieni tutti i task disponibili per il livello corrente
      const availableTasks = await OnboardingTask.find({
        level: user.onboardingLevel + 1,
        isActive: true
      }).sort('order');

      // Calcola statistiche
      const totalTasks = await OnboardingTask.countDocuments({ isActive: true });
      const completedTasks = user.onboardingProgress.tasksCompleted.length;
      const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

      // Ottieni badge disponibili
      const availableBadges = await Badge.find({
        level: { $lte: user.level },
        isActive: true
      });

      res.json({
        success: true,
        data: {
          user: {
            level: user.level,
            experience: user.experience,
            experienceToNextLevel: user.experienceToNextLevel,
            onboardingLevel: user.onboardingLevel,
            points: user.points,
            tokens: user.tokens
          },
          progress: {
            percentage: progressPercentage,
            completedTasks,
            totalTasks,
            currentTask: user.onboardingProgress.currentTask
          },
          availableTasks,
          completedTasks: user.onboardingProgress.tasksCompleted,
          badges: user.badges,
          availableBadges,
          isOnboardingComplete: user.isOnboardingComplete()
        }
      });

    } catch (error) {
      console.error('❌ Errore dashboard onboarding:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Inizia un task
  async startTask(req, res) {
    try {
      const { taskId } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      const task = await OnboardingTask.findById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task non trovato'
        });
      }

      // Verifica se l'utente può accedere al task
      if (task.level > user.onboardingLevel + 1) {
        return res.status(403).json({
          success: false,
          error: 'Livello insufficiente per questo task'
        });
      }

      // Verifica se il task è già completato
      if (user.hasCompletedTask(taskId)) {
        return res.status(400).json({
          success: false,
          error: 'Task già completato'
        });
      }

      // Imposta il task corrente
      user.onboardingProgress.currentTask = taskId;
      await user.save();

      res.json({
        success: true,
        message: 'Task iniziato con successo',
        data: {
          task,
          estimatedTime: task.estimatedTime
        }
      });

    } catch (error) {
      console.error('❌ Errore avvio task:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Completa un task
  async completeTask(req, res) {
    try {
      const { taskId, answers, score } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      const task = await OnboardingTask.findById(taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task non trovato'
        });
      }

      // Verifica se il task è già completato
      if (user.hasCompletedTask(taskId)) {
        return res.status(400).json({
          success: false,
          error: 'Task già completato'
        });
      }

      // Valida le risposte se è un quiz
      let finalScore = score || 100;
      if (task.type === 'quiz' && answers) {
        finalScore = this.validateQuizAnswers(task.requirements.quizQuestions, answers);
      }

      // Completa il task
      await user.completeOnboardingTask(taskId, finalScore);

      // Assegna ricompense
      const rewards = {
        points: task.rewards.points,
        tokens: task.rewards.tokens,
        experience: task.rewards.experience
      };

      if (rewards.points > 0) await user.addPoints(rewards.points);
      if (rewards.tokens > 0) await user.addTokens(rewards.tokens);
      if (rewards.experience > 0) await user.addExperience(rewards.experience);

      // Assegna badge se previsti
      if (task.rewards.badges && task.rewards.badges.length > 0) {
        for (const badgeId of task.rewards.badges) {
          await user.addBadge(badgeId);
        }
      }

      // Emetti token se previsti
      if (rewards.tokens > 0) {
        await blockchainService.mintTokens(user.walletAddress, rewards.tokens, `task_completion_${taskId}`);
      }

      // Verifica se l'utente può salire di livello
      const canLevelUp = await this.checkLevelUp(user);

      // Registra evento blockchain
      await blockchainService.logEvent('task_completed', {
        userId: user._id,
        username: user.username,
        taskId,
        taskTitle: task.title,
        score: finalScore,
        rewards
      });

      res.json({
        success: true,
        message: 'Task completato con successo!',
        data: {
          task,
          score: finalScore,
          rewards,
          canLevelUp,
          newLevel: canLevelUp ? user.level + 1 : user.level
        }
      });

    } catch (error) {
      console.error('❌ Errore completamento task:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Marca video come guardato
  async markVideoWatched(req, res) {
    try {
      const { videoId } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      // Verifica se il video è già stato guardato
      if (user.onboardingProgress.videosWatched.includes(videoId)) {
        return res.status(400).json({
          success: false,
          error: 'Video già guardato'
        });
      }

      // Aggiungi il video alla lista dei guardati
      user.onboardingProgress.videosWatched.push(videoId);
      user.stats.videosWatched += 1;
      await user.save();

      // Assegna ricompense per aver guardato il video
      await user.addExperience(10);
      await user.addPoints(5);

      res.json({
        success: true,
        message: 'Video marcato come guardato',
        data: {
          videoId,
          rewards: {
            experience: 10,
            points: 5
          }
        }
      });

    } catch (error) {
      console.error('❌ Errore marcatura video:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Completa quiz
  async completeQuiz(req, res) {
    try {
      const { quizId, answers } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      // Trova il task del quiz
      const task = await OnboardingTask.findOne({
        _id: quizId,
        type: 'quiz'
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Quiz non trovato'
        });
      }

      // Valida le risposte
      const score = this.validateQuizAnswers(task.requirements.quizQuestions, answers);
      const passed = score >= 70; // Minimo 70% per passare

      if (passed) {
        // Completa il task
        await user.completeOnboardingTask(quizId, score);
        user.stats.quizzesPassed += 1;

        // Assegna ricompense
        const rewards = {
          points: task.rewards.points,
          tokens: task.rewards.tokens,
          experience: task.rewards.experience
        };

        if (rewards.points > 0) await user.addPoints(rewards.points);
        if (rewards.tokens > 0) await user.addTokens(rewards.tokens);
        if (rewards.experience > 0) await user.addExperience(rewards.experience);

        await user.save();

        res.json({
          success: true,
          message: 'Quiz completato con successo!',
          data: {
            score,
            passed: true,
            rewards
          }
        });
      } else {
        res.json({
          success: false,
          message: 'Quiz non superato. Riprova!',
          data: {
            score,
            passed: false,
            minimumScore: 70
          }
        });
      }

    } catch (error) {
      console.error('❌ Errore completamento quiz:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Ottieni badge dell'utente
  async getUserBadges(req, res) {
    try {
      const user = await User.findById(req.user.userId)
        .populate('badges.badgeId');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      // Ottieni tutti i badge disponibili
      const allBadges = await Badge.find({ isActive: true });
      
      // Mappa i badge dell'utente
      const userBadges = allBadges.map(badge => {
        const userBadge = user.badges.find(ub => ub.badgeId._id.toString() === badge._id.toString());
        return {
          ...badge.toObject(),
          earned: !!userBadge,
          earnedAt: userBadge?.earnedAt,
          progress: userBadge?.progress || 0
        };
      });

      res.json({
        success: true,
        data: {
          badges: userBadges,
          totalEarned: user.badges.length,
          totalAvailable: allBadges.length
        }
      });

    } catch (error) {
      console.error('❌ Errore badge utente:', error.message);
      res.status(500).json({
        success: false,
        error: 'Errore interno del server'
      });
    }
  }

  // Metodo helper per validare risposte quiz
  validateQuizAnswers(questions, answers) {
    let correctAnswers = 0;
    let totalQuestions = questions.length;

    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctAnswer) {
        correctAnswers++;
      }
    }

    return Math.round((correctAnswers / totalQuestions) * 100);
  }

  // Metodo helper per verificare se l'utente può salire di livello
  async checkLevelUp(user) {
    const originalLevel = user.level;
    await user.addExperience(0); // Questo aggiorna il livello se necessario
    return user.level > originalLevel;
  }
}

module.exports = new OnboardingController(); 