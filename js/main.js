import { initSupabase, authManager } from './auth.js';
import { APP_CONFIG, SUPABASE_CONFIG, MODULES } from './config.js';
import { AdminManager } from './admin.js';
import { TuyaLightManager } from './lights.js';

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
            console.log('🚪 Déconnexion depuis le dashboard...');
            const result = await authManager.signOut();
            
            if (result.success) {
                const message = result.message || 'Déconnexion réussie';
                showToast(message, 'success');
            }
        } catch (error) {
            console.error('❌ Erreur de déconnexion:', error);
            showToast('Problème de déconnexion - veuillez actualiser la page', 'warning');
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
    
    // Initialiser le module lumières si activé
    if (MODULES.lights?.enabled) {
        console.log('💡 Initialisation du module lumières');
        await initLightsModule();
    }
    
    dashboardCards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h3').textContent;
            
            // Gestion des autres modules (admin est géré directement dans addAdminCard)
            if (!title.includes('Administration') && !title.includes('Lumières')) {
                console.log('🎯 Clic sur autre module:', title);
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
        console.log('🖱️ Clic sur carte admin - Redirection vers page dédiée');
        window.location.href = 'admin.html';
    });
    
    dashboardGrid.appendChild(adminCard);
}

// Initialisation du module administration
async function initAdminModule() {
    console.log('🚀 Initialisation du module admin...');
    
    try {
        // Vérifier si Supabase est configuré
        console.log('🔍 Configuration Supabase:', SUPABASE_CONFIG);
        const supabaseConfigured = SUPABASE_CONFIG && 
                                 SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL' &&
                                 SUPABASE_CONFIG.url !== '' &&
                                 SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
                                 SUPABASE_CONFIG.anonKey !== '';
        
        console.log('✅ Supabase configuré?', supabaseConfigured);
        
        if (!supabaseConfigured) {
            // Mode démo - créer un panel admin simplifié
            console.log('📝 Mode démo - Panel admin simplifié');
            createDemoAdminPanel();
            showToast('Panel d\'administration (mode démo)', 'info');
            return;
        }

        // Mode production avec Supabase
        console.log('🔧 Mode production - Panel admin complet');
        const adminManager = new AdminManager();
        await adminManager.init();
        showToast('Panel d\'administration chargé', 'success');
        
    } catch (error) {
        console.error('❌ Erreur initialisation admin:', error);
        showToast(error.message || 'Erreur lors du chargement du panel d\'administration', 'error');
        
        // Fallback vers le panel démo
        console.log('🔄 Fallback vers le panel démo');
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

// === GESTION DU MODULE LUMIÈRES ===

let lightManager = null;

async function initLightsModule() {
    try {
        console.log('💡 Initialisation du gestionnaire de lumières Tuya...');
        
        // Créer l'instance du gestionnaire
        lightManager = new TuyaLightManager();
        
        // Mettre à jour le statut
        updateLightsStatus('connecting', 'Connexion à Tuya...');
        
        // Tenter la connexion
        await lightManager.authenticate();
        console.log('✅ Authentification Tuya réussie');
        
        // Charger les appareils
        await lightManager.getDevices();
        console.log(`💡 ${lightManager.devices.length} appareil(s) trouvé(s)`);
        
        // Mettre à jour l'interface
        updateLightsInterface();
        
        showToast(`${lightManager.devices.length} lumière(s) connectée(s)`, 'success');
        
    } catch (error) {
        console.error('❌ Erreur initialisation lumières:', error);
        updateLightsStatus('disconnected', 'Échec de connexion');
        showLightsError(error.message);
        showToast('Impossible de se connecter aux lumières Tuya', 'error');
    }
}

function updateLightsStatus(status, message) {
    const statusElement = document.getElementById('lightsStatus');
    const statusIndicator = statusElement?.querySelector('.status-indicator');
    const statusText = statusElement?.querySelector('.status-text');
    
    if (statusElement && statusIndicator && statusText) {
        statusElement.className = `connection-status ${status}`;
        
        const indicators = {
            connecting: '🔄',
            connected: '✅', 
            disconnected: '❌'
        };
        
        statusIndicator.textContent = indicators[status] || '❓';
        statusText.textContent = message;
    }
}

function updateLightsInterface() {
    const lightsContent = document.getElementById('lightsContent');
    const lightsControls = document.getElementById('lightsControls');
    
    if (!lightManager || !lightsContent) return;
    
    // Masquer le loading
    lightsContent.innerHTML = '';
    
    if (lightManager.devices.length === 0) {
        lightsContent.innerHTML = `
            <div class="lights-empty">
                <div class="lights-empty-icon">💡</div>
                <p>Aucune lumière trouvée</p>
                <small>Vérifiez que vos appareils Tuya Smart sont connectés</small>
            </div>
        `;
        updateLightsStatus('connected', '0 appareil trouvé');
        return;
    }
    
    // Afficher les appareils
    updateLightsStatus('connected', `${lightManager.devices.length} appareil(s)`);
    
    if (lightsControls) {
        lightsControls.style.display = 'block';
        lightsControls.innerHTML = '';
        
        lightManager.devices.forEach(device => {
            const deviceElement = createLightDeviceElement(device);
            lightsControls.appendChild(deviceElement);
        });
    }
}

function createLightDeviceElement(device) {
    const deviceDiv = document.createElement('div');
    deviceDiv.className = 'light-device';
    deviceDiv.setAttribute('data-device-id', device.id);
    
    // Déterminer si l'appareil est allumé (simulé pour l'instant)
    const isOn = Math.random() > 0.5; // Simulation - à remplacer par le vrai statut
    const brightness = Math.floor(Math.random() * 100) + 1; // Simulation
    
    deviceDiv.innerHTML = `
        <div class="light-header">
            <div class="light-info">
                <div class="light-icon">💡</div>
                <div>
                    <h4 class="light-name">${device.name || 'Lumière Sans Nom'}</h4>
                    <p class="light-status">${isOn ? `Allumée • ${brightness}%` : 'Éteinte'}</p>
                </div>
            </div>
            <button class="light-toggle ${isOn ? 'active' : ''}" 
                    onclick="toggleLight('${device.id}')" 
                    title="${isOn ? 'Éteindre' : 'Allumer'}">
            </button>
        </div>
        
        <div class="light-controls">
            <div class="control-group">
                <label class="control-label">Luminosité</label>
                <div class="brightness-control">
                    <input type="range" 
                           class="brightness-slider" 
                           min="1" 
                           max="100" 
                           value="${brightness}"
                           oninput="setBrightness('${device.id}', this.value)">
                    <span class="brightness-value">${brightness}%</span>
                </div>
            </div>
            
            <!-- Contrôles avancés si supportés -->
            ${device.category === 'dj' ? `
                <div class="color-controls">
                    <div class="control-group">
                        <label class="control-label">Couleur</label>
                        <input type="color" 
                               class="color-picker" 
                               value="#ffffff"
                               onchange="setColor('${device.id}', this.value)">
                    </div>
                    <div class="control-group">
                        <label class="control-label">Température</label>
                        <input type="range" 
                               class="temp-slider" 
                               min="0" 
                               max="100" 
                               value="50"
                               oninput="setColorTemp('${device.id}', this.value)">
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    if (isOn) {
        deviceDiv.classList.add('active');
    }
    
    return deviceDiv;
}

function showLightsError(message) {
    const lightsContent = document.getElementById('lightsContent');
    if (lightsContent) {
        lightsContent.innerHTML = `
            <div class="lights-error">
                ❌ ${message}
                <br>
                <button onclick="retryLightsConnection()" style="margin-top: 10px; background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    🔄 Réessayer
                </button>
            </div>
        `;
    }
}

// === CONTRÔLES DES LUMIÈRES ===

async function toggleLight(deviceId) {
    if (!lightManager) return;
    
    try {
        const device = lightManager.getDeviceById(deviceId);
        const deviceElement = document.querySelector(`[data-device-id="${deviceId}"]`);
        const toggle = deviceElement?.querySelector('.light-toggle');
        const statusElement = deviceElement?.querySelector('.light-status');
        
        if (!device || !toggle) return;
        
        const isCurrentlyOn = toggle.classList.contains('active');
        
        // Désactiver le bouton temporairement
        toggle.style.opacity = '0.5';
        toggle.style.pointerEvents = 'none';
        
        if (isCurrentlyOn) {
            await lightManager.turnOff(deviceId);
            toggle.classList.remove('active');
            deviceElement.classList.remove('active');
            if (statusElement) statusElement.textContent = 'Éteinte';
            showToast(`${device.name} éteinte`, 'info');
        } else {
            await lightManager.turnOn(deviceId);
            toggle.classList.add('active');
            deviceElement.classList.add('active');
            if (statusElement) statusElement.textContent = 'Allumée';
            showToast(`${device.name} allumée`, 'success');
        }
        
    } catch (error) {
        console.error('❌ Erreur toggle light:', error);
        showToast('Erreur de contrôle de la lumière', 'error');
    } finally {
        // Réactiver le bouton
        const deviceElement = document.querySelector(`[data-device-id="${deviceId}"]`);
        const toggle = deviceElement?.querySelector('.light-toggle');
        if (toggle) {
            toggle.style.opacity = '1';
            toggle.style.pointerEvents = 'auto';
        }
    }
}

async function setBrightness(deviceId, brightness) {
    if (!lightManager) return;
    
    try {
        const tuyaBrightness = lightManager.percentToTuyaBrightness(parseInt(brightness));
        await lightManager.setBrightness(deviceId, tuyaBrightness);
        
        // Mettre à jour l'affichage
        const deviceElement = document.querySelector(`[data-device-id="${deviceId}"]`);
        const brightnesValue = deviceElement?.querySelector('.brightness-value');
        if (brightnesValue) {
            brightnesValue.textContent = `${brightness}%`;
        }
        
        const device = lightManager.getDeviceById(deviceId);
        console.log(`💡 ${device?.name} luminosité: ${brightness}%`);
        
    } catch (error) {
        console.error('❌ Erreur setBrightness:', error);
        showToast('Erreur de réglage de luminosité', 'error');
    }
}

async function setColor(deviceId, color) {
    if (!lightManager) return;
    
    try {
        // Convertir hex vers HSV pour Tuya
        const hsv = hexToHsv(color);
        await lightManager.setColor(deviceId, hsv.h, hsv.s * 10, hsv.v * 10); // Tuya utilise 0-1000 pour s et v
        
        const device = lightManager.getDeviceById(deviceId);
        console.log(`🎨 ${device?.name} couleur: ${color}`);
        
    } catch (error) {
        console.error('❌ Erreur setColor:', error);
        showToast('Erreur de changement de couleur', 'error');
    }
}

async function setColorTemp(deviceId, temp) {
    if (!lightManager) return;
    
    try {
        const tuyaTemp = lightManager.percentToTuyaColorTemp(parseInt(temp));
        await lightManager.setColorTemp(deviceId, tuyaTemp);
        
        const device = lightManager.getDeviceById(deviceId);
        console.log(`🌡️ ${device?.name} température: ${temp}%`);
        
    } catch (error) {
        console.error('❌ Erreur setColorTemp:', error);
        showToast('Erreur de réglage température', 'error');
    }
}

async function retryLightsConnection() {
    await initLightsModule();
}

// === UTILITAIRES ===

function hexToHsv(hex) {
    // Convertir hex vers RGB
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    // Convertir RGB vers HSV
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    if (diff !== 0) {
        if (max === r) h = ((g - b) / diff) % 6;
        else if (max === g) h = (b - r) / diff + 2;
        else h = (r - g) / diff + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    
    const s = max === 0 ? 0 : diff / max;
    const v = max;
    
    return { h, s, v };
}

// Exposer les fonctions globalement pour les événements onclick
window.toggleLight = toggleLight;
window.setBrightness = setBrightness;
window.setColor = setColor;
window.setColorTemp = setColorTemp;
window.retryLightsConnection = retryLightsConnection;

// Écouter les changements d'authentification pour mettre à jour le dashboard
window.addEventListener('userAuthenticated', () => {
    console.log('👤 Utilisateur authentifié - Mise à jour du dashboard');
    setupDashboard();
});