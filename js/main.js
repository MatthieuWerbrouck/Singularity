import { initSupabase, authManager } from './auth.js';
import { APP_CONFIG, SUPABASE_CONFIG, MODULES } from './config.js';
import { AdminManager } from './admin.js';


// Vérification des accès administrateur
async function checkAdminAccess() {
    if (!authManager.user) {
        return false;
    }
    
    try {
        const hasAccess = await authManager.hasAdminAccess();
        return hasAccess;
    } catch (error) {
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
            showMessage(error.message || 'Erreur d\'inscription', 'error');
        } finally {
            registerForm.classList.remove('loading');
        }
    });

    // Déconnexion
    logoutBtn.addEventListener('click', async () => {
        try {
            const result = await authManager.signOut();
            
            if (result.success) {
                const message = result.message || 'Déconnexion réussie';
                showToast(message, 'success');
            }
        } catch (error) {
            showToast('Problème de déconnexion - veuillez actualiser la page', 'warning');
        }
    });
}

// Initialisation du dashboard
async function setupDashboard() {
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    
    const isAdmin = await checkAdminAccess();
    
    if (isAdmin) {
        addAdminCard();
    }
    

    
    dashboardCards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h3').textContent;
            
            // Gestion des autres modules (admin est géré directement dans addAdminCard)
            if (!title.includes('Administration')) {
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
        window.location.href = 'admin.html';
    });
    
    dashboardGrid.appendChild(adminCard);
}

// Initialisation du module administration
async function initAdminModule() {
    try {
        // Vérifier si Supabase est configuré
        const supabaseConfigured = SUPABASE_CONFIG && 
                                 SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL' &&
                                 SUPABASE_CONFIG.url !== '' &&
                                 SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
                                 SUPABASE_CONFIG.anonKey !== '';
        
        if (!supabaseConfigured) {
            createDemoAdminPanel();
            showToast('Panel d\'administration (mode démo)', 'info');
            return;
        }

        // Mode production avec Supabase
        const adminManager = new AdminManager();
        await adminManager.init();
        showToast('Panel d\'administration chargé', 'success');
        
    } catch (error) {
        showToast(error.message || 'Erreur lors du chargement du panel d\'administration', 'error');
        
        // Fallback vers le panel démo
        createDemoAdminPanel();
    }
}

// Panel d'administration en mode démo
function createDemoAdminPanel() {
    // Trouver ou créer le container admin
    let container = document.getElementById('adminContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'adminContainer';
        const dashboardPage = document.getElementById('dashboardPage');
        if (dashboardPage) {
            dashboardPage.appendChild(container);
        }
    }

    container.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header Admin -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9;">
                <h2 style="color: #1e293b; margin: 0; display: flex; align-items: center; gap: 10px;">
                    👑 Panel d'Administration (Démo)
                </h2>
                <div style="background: #fbbf24; color: #92400e; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                    🎭 MODE DÉMO
                </div>
            </div>

            <!-- Message d'information -->
            <div style="background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px;">⚠️ Configuration requise</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.4;">
                    Pour accéder au panel d'administration complet, veuillez configurer Supabase dans le fichier <code>config.js</code>.
                    <br><br>
                    <strong>Fonctionnalités disponibles en mode démo :</strong>
                </p>
            </div>

            <!-- Fonctionnalités démo -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <!-- Statistiques fictives -->
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 8px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px;">📊 Statistiques (Simulées)</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
                        <div><strong>Utilisateurs:</strong> 25</div>
                        <div><strong>Actifs:</strong> 18</div>
                        <div><strong>Admins:</strong> 3</div>
                        <div><strong>Rôles:</strong> 5</div>
                    </div>
                </div>

                <!-- Actions disponibles -->
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1e293b;">🛠️ Actions Disponibles</h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <button onclick="showDemoFeature('users')" style="background: #3b82f6; color: white; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            👥 Gestion des utilisateurs
                        </button>
                        <button onclick="showDemoFeature('roles')" style="background: #10b981; color: white; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            🏷️ Gestion des rôles  
                        </button>
                        <button onclick="showDemoFeature('permissions')" style="background: #f59e0b; color: white; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            🔐 Gestion des permissions
                        </button>
                    </div>
                </div>

                <!-- Configuration -->
                <div style="background: #fee2e2; padding: 20px; border-radius: 8px; border: 1px solid #fca5a5;">
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #991b1b;">⚙️ Configuration</h3>
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #7f1d1d;">
                        Pour activer le panel complet :
                    </p>
                    <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #7f1d1d;">
                        <li>Créez un projet Supabase</li>
                        <li>Configurez les tables (users, roles, etc.)</li>
                        <li>Ajoutez vos clés dans config.js</li>
                        <li>Redémarrez l'application</li>
                    </ol>
                </div>
            </div>
        </div>
    `;
}

// Fonction pour les fonctionnalités démo
function showDemoFeature(feature) {
    const features = {
        'users': 'Gestion des utilisateurs',
        'roles': 'Gestion des rôles',  
        'permissions': 'Gestion des permissions'
    };
    
    showToast(`${features[feature]} - Disponible avec Supabase configuré`, 'info');
}

// Exposer globalement pour les boutons onclick
window.showDemoFeature = showDemoFeature;

// Mode demo (quand Supabase n'est pas configuré)
function enableDemoMode() {
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
        
    } catch (error) {
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
    // Gestion silencieuse des erreurs
});

window.addEventListener('unhandledrejection', (event) => {
    // Gestion silencieuse des promesses rejetées
});



// Écouter les changements d'authentification pour mettre à jour le dashboard
window.addEventListener('userAuthenticated', () => {
    setupDashboard();
});