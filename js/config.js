// Configuration Supabase
// ⚠️ IMPORTANT: Remplacez ces valeurs par vos vraies clés Supabase
export const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // À remplacer par votre URL Supabase
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // À remplacer par votre clé anonyme Supabase
};

// Configuration de l'application
export const APP_CONFIG = {
    name: 'Singularity',
    version: '1.0.0',
    environment: 'development' // 'development' | 'production'
};

// URLs et endpoints
export const API_ENDPOINTS = {
    // Ajoutez ici vos endpoints d'API personnalisés si nécessaire
};

// Configuration des modules de l'application
export const MODULES = {
    finance: {
        enabled: true,
        name: 'Gestion Financière'
    },
    tasks: {
        enabled: true,
        name: 'Gestion des Tâches'
    },
    goals: {
        enabled: true,
        name: 'Suivi des Objectifs'
    },
    health: {
        enabled: false, // À activer plus tard
        name: 'Suivi Santé'
    }
};