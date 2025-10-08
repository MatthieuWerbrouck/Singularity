import { initSupabase, authManager } from './auth.js';
import { APP_CONFIG } from './config.js';
import { AdminManager } from './admin.js';

// Vérification des accès administrateur
async function checkAdminAccess() {
    if (!authManager.user) {
        console.log('❌ Utilisateur non connecté');
        return false;
    }
    
    try {
        console.log('🔍 Appel hasAdminAccess...');
        const hasAccess = await authManager.hasAdminAccess();
        console.log('🎯 Résultat hasAdminAccess:', hasAccess);
        return hasAccess;
    } catch (error) {
        console.log('❌ Vérification admin échouée:', error);
        return false;
    }
}

// Fonction pour l'affichage des messages (ancienne version - garde pour compatibilité)
function showMessage(text, type = 'info') {
    // Utiliser le nouveau système de toast
    showToast(text, type);
}

// Système de Toast Notifications moderne
class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        // Créer le conteneur de toasts s'il n'existe pas
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

        // Animation d'entrée
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto-suppression
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
            <button class="toast-close" onclick="toastManager.hide(this.parentElement)">×</button>
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

    clear() {
        this.toasts.forEach(toast => this.hide(toast));
    }
}

// Instance globale du gestionnaire de toasts
const toastManager = new ToastManager();

// Fonction helper pour afficher des toasts
function showToast(message, type = 'info', title = null, duration = 5000) {
    return toastManager.show(message, type, title, duration);
}

// Exposer globalement pour le debugging et l'utilisation
window.toastManager = toastManager;
window.showToast = showToast;

// Gestion des formulaires d'authentification
function setupAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const logoutBtn = document.getElementById('logoutBtn');

    // Éviter les gestionnaires d'événements multiples
    if (loginForm.hasAttribute('data-handlers-attached')) {
        return;
    }
    loginForm.setAttribute('data-handlers-attached', 'true');

    // Basculer entre connexion et inscription
    switchToRegister.addEventListener('click', () => {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('registerPage').style.display = 'block';
    });

    switchToLogin.addEventListener('click', () => {
        document.getElementById('registerPage').style.display = 'none';
        document.getElementById('loginPage').style.display = 'block';
    });

    // Formulaire de connexion
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            loginForm.classList.add('loading');
            await authManager.signIn(email, password);
            showMessage('Connexion réussie !', 'success');
        } catch (error) {
            console.error('Erreur de connexion:', error);
            showMessage(error.message || 'Erreur de connexion', 'error');
        } finally {
            loginForm.classList.remove('loading');
        }
    });

    // Formulaire d'inscription
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            registerForm.classList.add('loading');
            await authManager.signUp(email, password);
            showMessage('Inscription réussie ! Vérifiez votre email.', 'success');
            
            // Basculer vers la page de connexion après inscription
            setTimeout(() => {
                document.getElementById('registerPage').style.display = 'none';
                document.getElementById('loginPage').style.display = 'block';
            }, 2000);
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            showMessage(error.message || 'Erreur d\'inscription', 'error');
        } finally {
            registerForm.classList.remove('loading');
        }
    });

    // Déconnexion
    logoutBtn.addEventListener('click', async () => {
        try {
            await authManager.signOut();
            showMessage('Déconnexion réussie', 'success');
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            showMessage('Erreur de déconnexion', 'error');
        }
    });
}

// Initialisation du dashboard
async function setupDashboard() {
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    
    // Vérifier si l'utilisateur est admin pour ajouter le module admin
    console.log('🔍 Vérification accès admin...');
    console.log('👤 Utilisateur actuel:', authManager.user);
    
    const isAdmin = await checkAdminAccess();
    console.log('👑 Accès admin:', isAdmin);
    
    // Debug supplémentaire
    if (authManager.user) {
        const profile = await authManager.getUserProfile();
        console.log('👤 Profil complet:', profile);
        console.log('🏷️ Is super admin?', profile?.is_super_admin);
        console.log('🎭 Rôle:', profile?.roles);
    }
    
    if (isAdmin) {
        console.log('✅ Ajout carte admin');
        addAdminCard();
    } else {
        console.log('❌ Pas d\'accès admin');
    }
    
    dashboardCards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h3').textContent;
            
            // Gestion spécifique pour le module admin
            if (title.includes('Administration')) {
                initAdminModule();
            } else {
                showMessage(`Module "${title}" - À développer prochainement`, 'info');
            }
        });
    });
}

// Ajouter la carte d'administration au dashboard
function addAdminCard() {
    const dashboardGrid = document.querySelector('.dashboard-grid');
    if (!dashboardGrid) return;
    
    // Vérifier si la carte admin existe déjà
    if (document.querySelector('[data-module="admin"]')) return;
    
    const adminCard = document.createElement('div');
    adminCard.className = 'dashboard-card';
    adminCard.setAttribute('data-module', 'admin');
    adminCard.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
    adminCard.style.color = 'white';
    
    adminCard.innerHTML = `
        <h3>👑 Administration</h3>
        <p>Gestion des utilisateurs et rôles</p>
    `;
    
    // Ajouter l'événement clic directement
    adminCard.addEventListener('click', () => {
        console.log('🖱️ Clic sur carte admin - Redirection vers admin.html');
        window.location.href = 'admin.html';
    });
    
    dashboardGrid.appendChild(adminCard);
}

// Initialisation du module administration
async function initAdminModule() {
    try {
        const adminManager = new AdminManager();
        await adminManager.init();
        showMessage('👑 Panel d\'administration chargé', 'success');
    } catch (error) {
        console.error('Erreur initialisation admin:', error);
        showMessage(error.message || 'Erreur lors du chargement du panel d\'administration', 'error');
    }
}

// Mode demo (quand Supabase n'est pas configuré)
function enableDemoMode() {
    console.log('🎭 Mode démo activé - Supabase non configuré');
    
    // Remplacer le gestionnaire de connexion par le mode démo
    const loginForm = document.getElementById('loginForm');
    
    // Supprimer les gestionnaires existants en recréant l'élément
    const newLoginForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newLoginForm, loginForm);
    
    // Ajouter le gestionnaire de mode démo
    newLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showMessage('Mode démo - Connexion simulée', 'success');
        
        // Simuler un utilisateur connecté
        authManager.user = { email: 'demo@singularity.com' };
        authManager.updateUI();
    });
}

// Initialisation de l'application
async function initApp() {
    console.log(`🚀 Initialisation de ${APP_CONFIG.name} v${APP_CONFIG.version}`);
    
    try {
        // Initialiser Supabase
        const supabaseInitialized = initSupabase();
        
        // Configurer les formulaires et événements
        setupAuthForms();
        setupDashboard();
        
        // Si Supabase n'est pas configuré, activer le mode demo
        if (!supabaseInitialized) {
            enableDemoMode();
            showMessage('⚠️ Mode démo - Configurez Supabase pour la production', 'error');
        } else {
            // Initialiser l'authentification seulement si Supabase est configuré
            await authManager.init();
        }
        
        console.log('✅ Application initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur d\'initialisation:', error);
        showMessage('Erreur d\'initialisation de l\'application', 'error');
    }
}

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
    console.error('Erreur globale:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejetée:', event.reason);
});

// Écouter les changements d'authentification pour mettre à jour le dashboard
window.addEventListener('userAuthenticated', () => {
    console.log('👤 Utilisateur authentifié - Mise à jour du dashboard');
    setupDashboard();
});