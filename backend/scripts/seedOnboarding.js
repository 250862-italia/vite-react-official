const mongoose = require('mongoose');
const Badge = require('../src/models/Badge');
const OnboardingTask = require('../src/models/OnboardingTask');
require('dotenv').config();

// Connessione MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connesso a MongoDB'))
  .catch(err => console.error('❌ Errore connessione MongoDB:', err));

// Badge di esempio
const badges = [
  {
    name: 'Primo Passo',
    description: 'Completa il primo task di onboarding',
    icon: '🎯',
    category: 'onboarding',
    level: 1,
    requirements: new Map([['tasksCompleted', 1]]),
    rewards: {
      points: 50,
      tokens: 10,
      experience: 25
    }
  },
  {
    name: 'Studente Diligente',
    description: 'Guarda 3 video di formazione',
    icon: '📚',
    category: 'onboarding',
    level: 1,
    requirements: new Map([['videosWatched', 3]]),
    rewards: {
      points: 75,
      tokens: 15,
      experience: 30
    }
  },
  {
    name: 'Quiz Master',
    description: 'Completa 5 quiz con successo',
    icon: '🧠',
    category: 'onboarding',
    level: 2,
    requirements: new Map([['quizzesPassed', 5]]),
    rewards: {
      points: 100,
      tokens: 25,
      experience: 50
    }
  },
  {
    name: 'Contratto Firmato',
    description: 'Firma il contratto di collaborazione',
    icon: '✍️',
    category: 'onboarding',
    level: 2,
    requirements: new Map([['contractSigned', true]]),
    rewards: {
      points: 150,
      tokens: 50,
      experience: 75
    }
  },
  {
    name: 'Wavemaker',
    description: 'Completa tutto l\'onboarding',
    icon: '🌊',
    category: 'onboarding',
    level: 3,
    requirements: new Map([['onboardingComplete', true]]),
    rewards: {
      points: 500,
      tokens: 100,
      experience: 200
    }
  },
  {
    name: 'Prima Vendita',
    description: 'Completa la prima vendita',
    icon: '💰',
    category: 'sales',
    level: 2,
    requirements: new Map([['salesCount', 1]]),
    rewards: {
      points: 200,
      tokens: 50,
      experience: 100
    }
  },
  {
    name: 'Referral King',
    description: 'Invita 5 nuovi wavemaker',
    icon: '👥',
    category: 'referral',
    level: 3,
    requirements: new Map([['referralsCount', 5]]),
    rewards: {
      points: 300,
      tokens: 75,
      experience: 150
    }
  }
];

// Task di onboarding
const tasks = [
  {
    title: 'Benvenuto in Wash The World',
    description: 'Guarda il video di benvenuto e scopri la nostra missione',
    type: 'video',
    level: 1,
    order: 1,
    isRequired: true,
    isBlocking: true,
    requirements: {
      videoId: 'welcome_video_001'
    },
    rewards: {
      points: 25,
      tokens: 5,
      experience: 15
    },
    estimatedTime: 3
  },
  {
    title: 'Quiz: Conosci Wash The World?',
    description: 'Testa la tua conoscenza sui nostri prodotti e valori',
    type: 'quiz',
    level: 1,
    order: 2,
    isRequired: true,
    isBlocking: true,
    requirements: {
      quizQuestions: [
        {
          question: 'Qual è la missione di Wash The World?',
          options: [
            'Vendere più prodotti possibili',
            'Rendere il mondo più pulito e sostenibile',
            'Diventare leader del mercato',
            'Massimizzare i profitti'
          ],
          correctAnswer: 1
        },
        {
          question: 'Quale prodotto è il nostro bestseller?',
          options: [
            'Detersivo liquido',
            'Detersivo in polvere',
            'Ammorbidente',
            'Sapone per mani'
          ],
          correctAnswer: 0
        },
        {
          question: 'I nostri prodotti sono:',
          options: [
            'Solo economici',
            'Solo ecologici',
            'Economici ed ecologici',
            'Solo di alta qualità'
          ],
          correctAnswer: 2
        }
      ]
    },
    rewards: {
      points: 50,
      tokens: 10,
      experience: 25
    },
    estimatedTime: 5
  },
  {
    title: 'Video: Come Funziona il Sistema',
    description: 'Scopri come funziona il sistema di commissioni e referral',
    type: 'video',
    level: 1,
    order: 3,
    isRequired: true,
    isBlocking: false,
    requirements: {
      videoId: 'system_overview_002'
    },
    rewards: {
      points: 30,
      tokens: 8,
      experience: 20
    },
    estimatedTime: 4
  },
  {
    title: 'Quiz: Sistema di Commissioni',
    description: 'Verifica la tua comprensione del sistema di guadagno',
    type: 'quiz',
    level: 2,
    order: 4,
    isRequired: true,
    isBlocking: true,
    requirements: {
      quizQuestions: [
        {
          question: 'Qual è la commissione base per una vendita?',
          options: [
            '5%',
            '10%',
            '15%',
            '20%'
          ],
          correctAnswer: 2
        },
        {
          question: 'Come funziona il sistema di referral?',
          options: [
            'Solo commissioni dirette',
            'Commissioni dirette + indirette',
            'Solo commissioni indirette',
            'Nessuna commissione'
          ],
          correctAnswer: 1
        },
        {
          question: 'I token WTW servono per:',
          options: [
            'Solo per staking',
            'Staking e cashback',
            'Solo per cashback',
            'Nessuna utilità'
          ],
          correctAnswer: 1
        }
      ]
    },
    rewards: {
      points: 75,
      tokens: 15,
      experience: 35
    },
    estimatedTime: 6
  },
  {
    title: 'Video: Tecniche di Vendita',
    description: 'Impara le migliori tecniche per vendere i nostri prodotti',
    type: 'video',
    level: 2,
    order: 5,
    isRequired: true,
    isBlocking: false,
    requirements: {
      videoId: 'sales_techniques_003'
    },
    rewards: {
      points: 40,
      tokens: 12,
      experience: 25
    },
    estimatedTime: 7
  },
  {
    title: 'Carica Documenti',
    description: 'Carica i documenti richiesti per la verifica',
    type: 'document',
    level: 2,
    order: 6,
    isRequired: true,
    isBlocking: true,
    requirements: {
      documentType: 'verification'
    },
    rewards: {
      points: 60,
      tokens: 20,
      experience: 30
    },
    estimatedTime: 5
  },
  {
    title: 'Quiz: Normative e Compliance',
    description: 'Testa la tua conoscenza delle normative di vendita',
    type: 'quiz',
    level: 3,
    order: 7,
    isRequired: true,
    isBlocking: true,
    requirements: {
      quizQuestions: [
        {
          question: 'È obbligatorio fornire ricevuta fiscale?',
          options: [
            'Sì, sempre',
            'Solo per vendite > 100€',
            'Solo per vendite > 500€',
            'No, mai'
          ],
          correctAnswer: 0
        },
        {
          question: 'Come gestire le lamentele clienti?',
          options: [
            'Ignorarle',
            'Riferirle al supporto',
            'Offrire rimborso immediato',
            'Bloccare il cliente'
          ],
          correctAnswer: 1
        },
        {
          question: 'La privacy dei clienti va:',
          options: [
            'Condivisa sui social',
            'Protetta sempre',
            'Venduta a terzi',
            'Ignorata'
          ],
          correctAnswer: 1
        }
      ]
    },
    rewards: {
      points: 100,
      tokens: 25,
      experience: 50
    },
    estimatedTime: 8
  },
  {
    title: 'Video: App Mobile',
    description: 'Scopri come utilizzare l\'app mobile per le vendite',
    type: 'video',
    level: 3,
    order: 8,
    isRequired: true,
    isBlocking: false,
    requirements: {
      videoId: 'mobile_app_004'
    },
    rewards: {
      points: 35,
      tokens: 10,
      experience: 20
    },
    estimatedTime: 5
  },
  {
    title: 'Firma Contratto',
    description: 'Firma il contratto di collaborazione digitale',
    type: 'action',
    level: 4,
    order: 9,
    isRequired: true,
    isBlocking: true,
    requirements: {
      actionType: 'contract_signature'
    },
    rewards: {
      points: 200,
      tokens: 50,
      experience: 100
    },
    estimatedTime: 3
  },
  {
    title: 'Prima Vendita Simulata',
    description: 'Completa una vendita simulata per testare il sistema',
    type: 'purchase',
    level: 4,
    order: 10,
    isRequired: true,
    isBlocking: true,
    requirements: {
      minimumAmount: 25
    },
    rewards: {
      points: 150,
      tokens: 30,
      experience: 75
    },
    estimatedTime: 10
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Inizializzazione database onboarding...');

    // Pulisci i dati esistenti
    await Badge.deleteMany({});
    await OnboardingTask.deleteMany({});

    console.log('🧹 Database pulito');

    // Inserisci badge
    const createdBadges = await Badge.insertMany(badges);
    console.log(`✅ ${createdBadges.length} badge creati`);

    // Inserisci task
    const createdTasks = await OnboardingTask.insertMany(tasks);
    console.log(`✅ ${createdTasks.length} task creati`);

    // Aggiorna i task con i riferimenti ai badge
    for (const task of createdTasks) {
      if (task.title === 'Benvenuto in Wash The World') {
        const firstStepBadge = createdBadges.find(b => b.name === 'Primo Passo');
        if (firstStepBadge) {
          task.rewards.badges = [firstStepBadge._id];
          await task.save();
        }
      }
      
      if (task.title === 'Firma Contratto') {
        const contractBadge = createdBadges.find(b => b.name === 'Contratto Firmato');
        if (contractBadge) {
          task.rewards.badges = [contractBadge._id];
          await task.save();
        }
      }
    }

    console.log('🎯 Badge collegati ai task');

    console.log('\n🎉 Database onboarding popolato con successo!');
    console.log('\n📊 Statistiche:');
    console.log(`   • Badge creati: ${createdBadges.length}`);
    console.log(`   • Task creati: ${createdTasks.length}`);
    console.log(`   • Livelli onboarding: 4`);
    console.log(`   • Task per livello: ${Math.ceil(createdTasks.length / 4)}`);

  } catch (error) {
    console.error('❌ Errore durante il seeding:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Connessione MongoDB chiusa');
  }
}

// Esegui il seeding
seedDatabase(); 