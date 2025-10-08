import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';
import { SUPABASE_CONFIG } from './config.js';

// Client Supabase
let supabase = null;

// Initialiser Supabase (sera appelé une fois les vraies clés configurées)
export function initSupabase() {
    if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
        console.warn('⚠️ Supabase non configuré. Veuillez ajouter vos clés dans config.js');
        return false;
    }
    
    supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Supabase initialisé');
    return true;
}

// Gestion de l'authentification
export class AuthManager {
    constructor() {
        this.user = null;
        this.isInitialized = false;
    }

    async init() {
        if (!supabase) {
            console.warn('Supabase non initialisé - mode demo');
            this.isInitialized = true;
            return;
        }

        // Vérifier la session existante
        const { data: { session } } = await supabase.auth.getSession();
        this.user = session?.user || null;
        
        // Écouter les changements d'authentification
        supabase.auth.onAuthStateChange((event, session) => {
            this.user = session?.user || null;
            this.updateUI();
        });
        
        this.isInitialized = true;
        this.updateUI();
    }

    async signUp(email, password) {
        if (!supabase) {
            throw new Error('Supabase non configuré');
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;
        return data;
    }

    async signIn(email, password) {
        if (!supabase) {
            throw new Error('Supabase non configuré');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    }

    async signOut() {
        if (!supabase) {
            this.user = null;
            this.updateUI();
            return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    isAuthenticated() {
        return !!this.user;
    }

    getUser() {
        return this.user;
    }

    // Charger le profil complet avec rôles et permissions
    async getUserProfile() {
        if (!supabase || !this.user) {
            return null;
        }

        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    roles (
                        id,
                        name,
                        display_name,
                        level,
                        color,
                        icon
                    )
                `)
                .eq('id', this.user.id)
                .single();

            if (error) {
                console.error('Erreur chargement profil:', error);
                return null;
            }

            return profile;
        } catch (error) {
            console.error('Erreur getUserProfile:', error);
            return null;
        }
    }

    // Vérifier si l'utilisateur a accès à l'administration
    async hasAdminAccess() {
        const profile = await this.getUserProfile();
        if (!profile) return false;
        
        // Super admin ou niveau 80+ (admin/super_admin)
        return profile.is_super_admin || (profile.roles?.level >= 80);
    }

    updateUI() {
        const loginPage = document.getElementById('loginPage');
        const registerPage = document.getElementById('registerPage');
        const dashboardPage = document.getElementById('dashboardPage');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        if (this.isAuthenticated()) {
            // Utilisateur connecté
            loginPage.style.display = 'none';
            registerPage.style.display = 'none';
            dashboardPage.style.display = 'block';
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
        } else {
            // Utilisateur non connecté
            loginPage.style.display = 'block';
            registerPage.style.display = 'none';
            dashboardPage.style.display = 'none';
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
        }
    }
}

// Instance globale du gestionnaire d'authentification
export const authManager = new AuthManager();

// Exposer globalement pour le debugging
window.authManager = authManager;