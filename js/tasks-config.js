// tasks-config.js - Configuration spécifique au module des tâches
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';
import { SUPABASE_CONFIG } from './config.js';
import { authManager } from './auth.js';
import { ToastManager } from './main.js';

// Client Supabase centralisé pour les tâches
export let supabaseClient = null;

// Initialiser la configuration des tâches
export function initTasksConfig() {
    try {
        // Créer le client Supabase
        if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL') {
            supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            console.log('✅ Client Supabase configuré pour les tâches');
        } else {
            console.log('⚠️ Supabase non configuré, utilisation du mode démo');
        }
        
        // Exposer globalement pour les tests et le débogage
        window.supabaseClient = supabaseClient;
        window.authManager = authManager;
        window.ToastManager = ToastManager;
        
        return true;
    } catch (error) {
        console.error('❌ Erreur configuration tâches:', error);
        return false;
    }
}

// Fonction helper pour obtenir l'utilisateur actuel
export async function getCurrentUser() {
    try {
        return authManager?.getUser() || null;
    } catch (error) {
        console.error('Erreur getCurrentUser:', error);
        return null;
    }
}

// Vérifier si l'utilisateur est authentifié
export function isAuthenticated() {
    return authManager?.isAuthenticated() || false;
}

// Configuration par défaut du module
export const TASKS_CONFIG = {
    defaultTheme: 'Personal',
    defaultPriority: 'normal',
    defaultStatus: 'todo',
    maxTitleLength: 200,
    maxDescriptionLength: 1000,
    enableNotifications: true,
    autoSave: true,
    autoSaveDelay: 2000, // 2 secondes
    pagination: {
        defaultLimit: 50,
        maxLimit: 100
    }
};

// Initialiser automatiquement
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initTasksConfig, 100);
});