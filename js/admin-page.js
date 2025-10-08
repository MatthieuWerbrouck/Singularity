// Script principal pour la page d'administration
// Ce fichier gère l'initialisation et l'interface de la page admin.html

import { initSupabase, authManager } from './auth.js';
import { APP_CONFIG, SUPABASE_CONFIG } from './config.js';
import { AdminManager } from './admin.js';

// Système de Toast Notifications (copie depuis main.js pour autonomie)
class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'info', title = null, duration = 5000) {
        const toast = this.createToast(message, type, title);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        setTimeout(() => toast.classList.add('show'), 100);

        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }

        return toast;
    }

    createToast(message, type, title) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✅',
            error: '❌', 
            warning: '⚠️',
            info: 'ℹ️'
        };

        const titles = {
            success: title || 'Succès',
            error: title || 'Erreur',
            warning: title || 'Attention',
            info: title || 'Information'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="window.toastManager.hide(this.parentElement)">×</button>
        `;

        return toast;
    }

    hide(toast) {
        if (!toast || !toast.parentNode) return;

        toast.classList.remove('show');
        toast.classList.add('hide');

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
                this.toasts = this.toasts.filter(t => t !== toast);
            }
        }, 300);
    }
}

// Application d'administration
class AdminApp {
    constructor() {
        this.adminManager = null;
        this.toastManager = new ToastManager();
        
        // Exposer globalement
        window.toastManager = this.toastManager;
        window.showToast = (message, type = 'info', title = null, duration = 5000) => {
            return this.toastManager.show(message, type, title, duration);
        };
    }

    async init() {
        try {
            console.log('🚀 Initialisation de l\'application admin...');

            // Initialiser Supabase
            const supabaseReady = initSupabase();
            if (!supabaseReady) {
                throw new Error('Supabase non configuré. Veuillez configurer vos clés dans config.js');
            }

            // Initialiser l'authentification
            await authManager.init();

            // Vérifier si l'utilisateur est connecté
            if (!authManager.isAuthenticated()) {
                console.log('❌ Utilisateur non connecté - Redirection');
                showToast('Vous devez être connecté pour accéder à cette page', 'warning');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }

            // Afficher les infos utilisateur
            document.getElementById('currentUserEmail').textContent = authManager.user.email;

            // Vérifier les permissions admin avec logs détaillés
            console.log('🔍 Vérification des permissions admin...');
            console.log('👤 Utilisateur:', authManager.user);
            
            const hasAdminAccess = await authManager.hasAdminAccess();
            console.log('🎯 Résultat hasAdminAccess:', hasAdminAccess);
            
            // Debug supplémentaire - charger le profil manuellement
            const profile = await authManager.getUserProfile();
            console.log('👤 Profil complet:', profile);
            console.log('👑 is_super_admin:', profile?.is_super_admin);
            console.log('🏷️ Rôle:', profile?.roles);
            
            if (!hasAdminAccess) {
                console.log('❌ Pas de permissions admin');
                showToast('Accès refusé: Permissions administrateur requises', 'error');
                this.showAccessError();
                return;
            }

            // Initialiser le panel admin
            await this.initAdminPanel();

        } catch (error) {
            console.error('❌ Erreur initialisation admin:', error);
            showToast('Erreur lors de l\'initialisation: ' + error.message, 'error');
            this.showAccessError();
        }
    }

    async initAdminPanel() {
        console.log('🔧 Initialisation du panel admin...');

        try {
            // Créer et initialiser AdminManager
            this.adminManager = new AdminManager();
            await this.adminManager.init();

            // Injecter le contenu dans la page
            const adminContent = document.getElementById('adminContent');
            const adminContainer = document.getElementById('adminContainer');
            
            if (adminContainer) {
                adminContent.innerHTML = adminContainer.innerHTML;
                adminContainer.remove();
            }

            // Masquer le loading et afficher le contenu
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('adminContent').style.display = 'block';

            showToast('Panel d\'administration chargé avec succès', 'success');

        } catch (error) {
            console.error('❌ Erreur panel admin:', error);
            showToast('Erreur lors du chargement du panel: ' + error.message, 'error');
            this.showAccessError();
        }
    }

    showAccessError() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('adminContent').style.display = 'none';
        document.getElementById('accessError').style.display = 'flex';
    }

    async handleLogout() {
        try {
            await authManager.signOut();
            showToast('Déconnexion réussie', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            console.error('Erreur déconnexion:', error);
            showToast('Erreur lors de la déconnexion', 'error');
        }
    }
}

// Export pour utilisation
export { AdminApp };

    // Fonction de debug pour tester les permissions manuellement
    window.debugAdminAccess = async () => {
        console.log('🔧 Debug permissions admin...');
        console.log('👤 Utilisateur:', authManager?.user);
        
        if (authManager) {
            try {
                const hasAccess = await authManager.hasAdminAccess();
                const profile = await authManager.getUserProfile();
                
                console.log('🎯 hasAdminAccess:', hasAccess);
                console.log('👤 Profil:', profile);
                console.log('👑 is_super_admin:', profile?.is_super_admin);
                console.log('🏷️ Rôle level:', profile?.roles?.level);
                console.log('🏷️ Rôle name:', profile?.roles?.name);
                
                return { hasAccess, profile };
            } catch (error) {
                console.error('❌ Erreur debug:', error);
                return { error };
            }
        } else {
            console.log('❌ authManager non disponible');
        }
    };

    // Auto-initialisation si on est sur la page admin
if (window.location.pathname.includes('admin.html')) {
    const adminApp = new AdminApp();    // Gestion des événements
    document.addEventListener('DOMContentLoaded', () => {
        // Initialiser l'app
        adminApp.init();
        
        // Event listener pour la déconnexion
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            adminApp.handleLogout();
        });
    });

    // Gestion des erreurs globales
    window.addEventListener('error', (event) => {
        console.error('Erreur globale:', event.error);
        if (window.showToast) {
            showToast('Une erreur inattendue s\'est produite', 'error');
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Promise rejetée:', event.reason);
        if (window.showToast) {
            showToast('Erreur de traitement', 'error');
        }
    });
}