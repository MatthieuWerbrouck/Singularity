// demo-tasks-data.js - Données de démonstration pour les tâches
// Utilisé pour tester l'interface sans connexion Supabase

const DEMO_THEMES = [
    {
        id: 'theme-1',
        name: 'Travail',
        icon: '💼',
        color: '#3b82f6',
        user_id: 'demo-user'
    },
    {
        id: 'theme-2', 
        name: 'Personnel',
        icon: '🏠',
        color: '#10b981',
        user_id: 'demo-user'
    },
    {
        id: 'theme-3',
        name: 'Projets',
        icon: '🎯',
        color: '#f59e0b', 
        user_id: 'demo-user'
    },
    {
        id: 'theme-4',
        name: 'Urgences',
        icon: '⚡',
        color: '#ef4444',
        user_id: 'demo-user'
    },
    {
        id: 'theme-5',
        name: 'Apprentissage',
        icon: '📚',
        color: '#8b5cf6',
        user_id: 'demo-user'
    }
];

const DEMO_TASKS = [
    {
        id: 'task-1',
        title: 'Finaliser le rapport mensuel',
        description: 'Compiler les données de vente et analyser les tendances du marché pour la présentation de demain.',
        status: 'in_progress',
        priority: 'high',
        theme_id: 'theme-1',
        due_date: '2025-01-15T09:00:00.000Z',
        created_at: '2025-01-10T08:30:00.000Z',
        completed_at: null,
        user_id: 'demo-user',
        theme: DEMO_THEMES[0]
    },
    {
        id: 'task-2',
        title: 'Faire les courses pour la semaine',
        description: 'Liste: pain, lait, légumes, fruits, viande pour les repas de la semaine.',
        status: 'todo',
        priority: 'normal', 
        theme_id: 'theme-2',
        due_date: '2025-01-12T18:00:00.000Z',
        created_at: '2025-01-10T10:15:00.000Z',
        completed_at: null,
        user_id: 'demo-user',
        theme: DEMO_THEMES[1]
    },
    {
        id: 'task-3',
        title: 'Réviser le code du module authentication',
        description: 'Vérifier la sécurité, optimiser les performances et ajouter des tests unitaires.',
        status: 'todo',
        priority: 'high',
        theme_id: 'theme-3',
        due_date: '2025-01-14T16:00:00.000Z',
        created_at: '2025-01-09T14:20:00.000Z', 
        completed_at: null,
        user_id: 'demo-user',
        theme: DEMO_THEMES[2]
    },
    {
        id: 'task-4',
        title: 'Réparer la fuite du robinet',
        description: null,
        status: 'completed',
        priority: 'urgent',
        theme_id: 'theme-4',
        due_date: null,
        created_at: '2025-01-08T20:00:00.000Z',
        completed_at: '2025-01-09T11:30:00.000Z',
        user_id: 'demo-user',
        theme: DEMO_THEMES[3]
    },
    {
        id: 'task-5',
        title: 'Lire le livre "Clean Code"',
        description: 'Continuer la lecture du chapitre 5 sur les fonctions et prendre des notes.',
        status: 'in_progress',
        priority: 'low',
        theme_id: 'theme-5', 
        due_date: '2025-01-20T12:00:00.000Z',
        created_at: '2025-01-05T19:45:00.000Z',
        completed_at: null,
        user_id: 'demo-user',
        theme: DEMO_THEMES[4]
    },
    {
        id: 'task-6',
        title: 'Préparer la réunion équipe',
        description: 'Agenda: nouveaux objectifs, répartition des tâches, planning du sprint.',
        status: 'todo',
        priority: 'normal',
        theme_id: 'theme-1',
        due_date: '2025-01-13T14:30:00.000Z',
        created_at: '2025-01-10T16:00:00.000Z',
        completed_at: null,
        user_id: 'demo-user',
        theme: DEMO_THEMES[0]
    },
    {
        id: 'task-7',
        title: 'Ranger le bureau',
        description: 'Trier les papiers, nettoyer l\'écran et organiser les câbles.',
        status: 'todo',
        priority: 'low',
        theme_id: 'theme-2',
        due_date: null,
        created_at: '2025-01-10T12:00:00.000Z',
        completed_at: null,
        user_id: 'demo-user', 
        theme: DEMO_THEMES[1]
    },
    {
        id: 'task-8',
        title: 'Backup des données importantes',
        description: 'Sauvegarder les projets, documents et photos sur le cloud.',
        status: 'completed',
        priority: 'high',
        theme_id: 'theme-3',
        due_date: null,
        created_at: '2025-01-07T09:00:00.000Z',
        completed_at: '2025-01-08T17:45:00.000Z',
        user_id: 'demo-user',
        theme: DEMO_THEMES[2]
    }
];

// Mode démonstration pour tester sans Supabase
let isDemoMode = false;

// Activer/désactiver le mode démo
window.toggleDemoMode = function(enabled = true) {
    isDemoMode = enabled;
    console.log(`🎭 Mode démonstration ${enabled ? 'activé' : 'désactivé'}`);
    
    if (enabled && typeof window.loadDemoData === 'function') {
        window.loadDemoData();
    }
};

// Charger les données de démonstration
window.loadDemoData = function() {
    console.log('📝 Chargement des données de démonstration...');
    
    // Simuler le chargement des thèmes
    if (typeof window.loadThemes === 'function') {
        // Remplacer temporairement les fonctions
        const originalLoadThemes = window.loadThemes;
        window.loadThemes = async function() {
            window.currentThemes = [...DEMO_THEMES];
            console.log('✅ Thèmes de démo chargés:', window.currentThemes.length);
            window.updateThemeFilter();
        };
    }
    
    // Simuler le chargement des tâches
    if (typeof window.loadTasks === 'function') {
        const originalLoadTasks = window.loadTasks;
        window.loadTasks = async function() {
            window.currentTasks = [...DEMO_TASKS];
            console.log('✅ Tâches de démo chargées:', window.currentTasks.length);
            window.renderCurrentView();
        };
    }
    
    // Recharger les données
    if (window.currentThemes !== undefined) {
        window.loadThemes();
    }
    if (window.currentTasks !== undefined) {
        window.loadTasks();
    }
};

// Auto-activation du mode démo si Supabase n'est pas disponible
document.addEventListener('DOMContentLoaded', () => {
    // Attendre un peu que les modules se chargent
    setTimeout(() => {
        // Vérifier si Supabase est configuré
        if (typeof window.supabaseClient === 'undefined' || !window.supabaseClient) {
            console.log('⚠️ Supabase non configuré, activation du mode démonstration');
            window.toggleDemoMode(true);
        }
    }, 1000);
});

// Export des données pour utilisation externe
window.DEMO_TASKS_DATA = {
    themes: DEMO_THEMES,
    tasks: DEMO_TASKS,
    isDemoMode: () => isDemoMode,
    toggleDemoMode: window.toggleDemoMode,
    loadDemoData: window.loadDemoData
};