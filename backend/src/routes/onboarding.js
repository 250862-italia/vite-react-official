const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { authenticateToken } = require('../middleware/auth');

// Applica middleware di autenticazione a tutte le routes
router.use(authenticateToken);

// Dashboard onboarding
router.get('/dashboard', onboardingController.getOnboardingDashboard);

// Gestione task
router.post('/task/start', onboardingController.startTask);
router.post('/task/complete', onboardingController.completeTask);

// Video e contenuti
router.post('/video/watched', onboardingController.markVideoWatched);

// Quiz
router.post('/quiz/complete', onboardingController.completeQuiz);

// Badge
router.get('/badges', onboardingController.getUserBadges);

module.exports = router; 