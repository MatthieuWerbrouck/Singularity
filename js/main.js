import { initSupabase, authManager } from './auth.js';
import { APP_CONFIG } from './config.js';
import { AdminManager } from './admin.js';

// Utilitaires pour l'affichage des messages
function showMessage(text, type = 'info') {
    // Supprimer les messages existants
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Créer le nouveau message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;

    // Ajouter au début de la page active
    const activePage = document.querySelector('.page[style*="block"]') || document.getElementById('loginPage');
    const container = activePage.querySelector('.login-container, .dashboard-container') || activePage;
    container.insertBefore(message, container.firstChild);

    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 5000);
}

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
    
    // Ajouter un bouton de debug temporaire
    addDebugButton();
    
    // Vérifier si l'utilisateur est admin pour ajouter le module admin
    console.log('🔍 Vérification accès admin...');
    const isAdmin = await checkAdminAccess();
    console.log('👑 Accès admin:', isAdmin);
    
    if (isAdmin) {
        console.log('✅ Ajout carte admin');
        addAdminCard();
    } else {
        console.log('❌ Pas d\'accès admin');
        // Forcer l'ajout de la carte pour le debug
        console.log('🔧 Ajout forcé pour debug');
        addAdminCard();
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

// Vérification des droits administrateur
async function checkAdminAccess() {
    console.log('🔐 checkAdminAccess - Début');
    
    if (!authManager.isAuthenticated()) {
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

// Fonction de debug temporaire
function addDebugButton() {
    const dashboardPage = document.getElementById('dashboardPage');
    if (!dashboardPage || document.querySelector('#debugBtn')) return;
    
    const debugBtn = document.createElement('button');
    debugBtn.id = 'debugBtn';
    debugBtn.textContent = '🔍 Debug Profile';
    debugBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:1000;background:#dc2626;color:white;border:none;padding:10px;border-radius:5px;cursor:pointer;';
    
    debugBtn.addEventListener('click', async () => {
        console.log('=== DEBUG PROFILE ===');
        console.log('User:', authManager.user);
        console.log('IsAuthenticated:', authManager.isAuthenticated());
        
        const profile = await authManager.getUserProfile();
        console.log('Profile complet:', profile);
        
        if (profile) {
            console.log('Role data:', profile.roles);
            console.log('Is super admin:', profile.is_super_admin);
            console.log('Role level:', profile.roles?.level);
            console.log('Role name:', profile.roles?.name);
        }
        
        const hasAccess = await authManager.hasAdminAccess();
        console.log('Has admin access:', hasAccess);
    });
    
    dashboardPage.appendChild(debugBtn);
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