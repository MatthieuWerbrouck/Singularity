import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';
import { SUPABASE_CONFIG, ADMIN_ACCOUNT } from './config.js';

// Client Supabase
let supabase = null;

// Initialiser Supabase (sera appelé une fois les vraies clés configurées)
export function initSupabase() {
    if (SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
        return false;
    }
    
    supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
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
        // Vérifier d'abord si c'est le compte admin spécial
        if (email === ADMIN_ACCOUNT.username && password === ADMIN_ACCOUNT.password) {
            // Simuler un utilisateur connecté pour le compte admin spécial
            this.user = {
                id: 'admin-special',
                email: ADMIN_ACCOUNT.profile.email,
                user_metadata: {
                    name: ADMIN_ACCOUNT.profile.name,
                    isSpecialAdmin: true
                }
            };
            
            this.updateUI();
            
            return {
                user: this.user,
                session: {
                    user: this.user,
                    access_token: 'admin-special-token'
                }
            };
        }

        if (!supabase) {
            throw new Error('Supabase non configuré');
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            // Améliorer les messages d'erreur pour l'utilisateur
            let userMessage = error.message;
            
            if (error.message.includes('Invalid login credentials')) {
                userMessage = 'Email ou mot de passe incorrect. Vérifiez vos identifiants ou créez un nouveau compte.';
            } else if (error.message.includes('Email not confirmed')) {
                userMessage = 'Email non confirmé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.';
            } else if (error.message.includes('Too many requests')) {
                userMessage = 'Trop de tentatives de connexion. Veuillez patienter quelques minutes.';
            }
            
            const enhancedError = new Error(userMessage);
            enhancedError.originalError = error;
            throw enhancedError;
        }
        return data;
    }

    async signOut() {
        // Gérer la déconnexion du compte admin spécial
        if (this.user && this.user.user_metadata?.isSpecialAdmin) {
            this.user = null;
            this.updateUI();
            return { success: true, message: 'Déconnexion administrateur réussie' };
        }

        if (!supabase) {
            this.user = null;
            this.updateUI();
            return { success: true };
        }

        try {
            // Vérifier si on a une session avant d'essayer de se déconnecter
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                this.user = null;
                this.updateUI();
                return { success: true, message: 'Déjà déconnecté' };
            }

            // Tentative de déconnexion avec Supabase
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                // Si c'est une erreur de session manquante, on considère que c'est OK
                if (error.message.includes('Auth session missing') || 
                    error.message.includes('session_not_found')) {
                    this.user = null;
                    this.updateUI();
                    return { success: true, message: 'Session expirée' };
                }
                
                // Pour d'autres erreurs, on nettoie quand même localement mais on signale l'erreur
                this.user = null;
                this.updateUI();
                throw error;
            }
            
            this.user = null;
            this.updateUI();
            return { success: true, message: 'Déconnexion réussie' };
            
        } catch (error) {
            // En cas d'erreur, forcer le nettoyage local
            this.user = null;
            this.updateUI();
            
            // Retourner l'erreur seulement si ce n'est pas une erreur de session
            if (!error.message.includes('Auth session missing') && 
                !error.message.includes('session_not_found')) {
                throw error;
            }
            
            return { success: true, message: 'Déconnexion forcée' };
        }
    }

    isAuthenticated() {
        return !!this.user;
    }

    getUser() {
        return this.user;
    }

    // Charger le profil complet avec rôles et permissions
    async getUserProfile() {
        // Retourner le profil admin spécial si applicable
        if (this.user && this.user.user_metadata?.isSpecialAdmin) {
            return {
                id: this.user.id,
                email: this.user.email,
                name: this.user.user_metadata.name,
                is_super_admin: true,
                roles: {
                    id: 'admin-special',
                    name: 'admin',
                    display_name: 'Administrateur Spécial',
                    level: 100,
                    color: '#dc2626',
                    icon: '👑'
                }
            };
        }

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
                return null;
            }

            return profile;
        } catch (error) {
            return null;
        }
    }

    // Vérifier si l'utilisateur a accès à l'administration
    async hasAdminAccess() {
        // Vérifier d'abord si c'est le compte admin spécial
        if (this.user && this.user.user_metadata?.isSpecialAdmin) {
            return true;
        }

        const profile = await this.getUserProfile();
        
        if (!profile) {
            return false;
        }
        
        // Vérifier is_super_admin
        if (profile.is_super_admin) {
            return true;
        }
        
        // Vérifier le niveau du rôle (admin = niveau 80+)
        const roleLevel = profile.roles?.level;
        if (roleLevel && roleLevel >= 80) {
            return true;
        }
        
        // Vérifier le nom du rôle directement
        const roleName = profile.roles?.name;
        if (roleName && ['admin', 'super_admin'].includes(roleName)) {
            return true;
        }
        
        return false;
    }

    updateUI() {
        // Vérifier si nous sommes sur la page principale (avec les éléments du dashboard)
        const loginPage = document.getElementById('loginPage');
        const registerPage = document.getElementById('registerPage');
        const dashboardPage = document.getElementById('dashboardPage');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        // Si nous ne sommes pas sur la page principale, ne pas modifier l'UI
        if (!loginPage || !dashboardPage) {
            return;
        }

        if (this.isAuthenticated()) {
            // Utilisateur connecté
            loginPage.style.display = 'none';
            if (registerPage) registerPage.style.display = 'none';
            dashboardPage.style.display = 'block';
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            // Déclencher un événement pour que le dashboard se mette à jour
            window.dispatchEvent(new CustomEvent('userAuthenticated'));
        } else {
            // Utilisateur non connecté
            loginPage.style.display = 'block';
            if (registerPage) registerPage.style.display = 'none';
            dashboardPage.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }
}

// Instance globale du gestionnaire d'authentification
export const authManager = new AuthManager();

// Exposer globalement pour le debugging
window.authManager = authManager;