import { initSupabase, authManager } from './auth.js';
import { APP_CONFIG } from './config.js';

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
function setupDashboard() {
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    
    dashboardCards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h3').textContent;
            showMessage(`Module "${title}" en développement`, 'info');
        });
    });
}

// Mode demo (quand Supabase n'est pas configuré)
function enableDemoMode() {
    console.log('🎭 Mode démo activé - Supabase non configuré');
    
    // Simuler une connexion en mode demo
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (e) => {
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
        
        // Initialiser l'authentification
        await authManager.init();
        
        // Configurer les formulaires et événements
        setupAuthForms();
        setupDashboard();
        
        // Si Supabase n'est pas configuré, activer le mode demo
        if (!supabaseInitialized) {
            enableDemoMode();
            showMessage('⚠️ Mode démo - Configurez Supabase pour la production', 'error');
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