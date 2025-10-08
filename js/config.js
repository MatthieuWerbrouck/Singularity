// Configuration Supabase
// ⚠️ IMPORTANT: Remplacez ces valeurs par vos vraies clés Supabase
export const SUPABASE_CONFIG = {
    url: 'https://fgnpwzlwwldneuvzsvjr.supabase.co', // À remplacer par votre URL Supabase
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnbnB3emx3d2xkbmV1dnpzdmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzE3ODMsImV4cCI6MjA3NTQwNzc4M30.ha_zLj8jPD5MSuYb3ncdjvOeOdmjmx0uSuzYvMLYByg' // À remplacer par votre clé anonyme Supabase
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

// Configuration Tuya Smart
// ⚠️ IMPORTANT: Credentials pour l'API Tuya IoT
export const TUYA_CONFIG = {
    accessId: 'gmxydg3hn4fgxkkxgkjw',
    accessSecret: 'afd2800334ae4b3cad9314b0d81d5726',
    dataCenter: 'us', // Data center par défaut
    baseUrl: 'https://openapi.tuyaus.com', // US data center
    version: 'v1.0'
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
    lights: {
        enabled: true,
        name: 'Lumières Connectées'
    },
    health: {
        enabled: false, // À activer plus tard
        name: 'Suivi Santé'
    }
};