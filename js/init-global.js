// init-global.js - Initialisation globale pour exposer les modules
// Ce script s'assure que tous les modules sont correctement exposés

window.moduleInitialization = {
    initialized: false,
    modules: {},
    
    // Enregistrer un module
    register(name, moduleExports) {
        this.modules[name] = moduleExports;
        console.log(`📦 Module ${name} enregistré`);
        
        // Exposer les propriétés importantes au niveau global
        if (name === 'tasks') {
            Object.assign(window, moduleExports);
        }
    },
    
    // Vérifier que tous les modules sont chargés
    checkModules() {
        const requiredModules = ['tasks-config', 'auth', 'main'];
        const loadedModules = Object.keys(this.modules);
        
        console.log('📋 Modules chargés:', loadedModules);
        console.log('📋 Modules requis:', requiredModules);
        
        const allLoaded = requiredModules.every(module => 
            loadedModules.includes(module) || this.isModuleAvailable(module)
        );
        
        if (allLoaded && !this.initialized) {
            this.initialized = true;
            this.finalizeInitialization();
        }
        
        return allLoaded;
    },
    
    // Vérifier si un module est disponible
    isModuleAvailable(moduleName) {
        switch(moduleName) {
            case 'auth':
                return typeof window.authManager !== 'undefined';
            case 'main':
                return typeof window.ToastManager !== 'undefined';
            case 'tasks-config':
                return typeof window.supabaseClient !== 'undefined';
            default:
                return false;
        }
    },
    
    // Finaliser l'initialisation
    finalizeInitialization() {
        console.log('🚀 Finalisation de l\'initialisation...');
        
        // S'assurer que ToastManager est disponible
        if (typeof window.ToastManager === 'undefined' && this.modules.main?.ToastManager) {
            window.ToastManager = this.modules.main.ToastManager;
        }
        
        // S'assurer que les fonctions tasks sont disponibles
        if (this.modules.tasks) {
            const taskModule = this.modules.tasks;
            window.currentTasks = taskModule.currentTasks || [];
            window.currentThemes = taskModule.currentThemes || [];
            window.loadTasks = taskModule.loadTasks;
            window.loadThemes = taskModule.loadThemes;
            window.renderCurrentView = taskModule.renderCurrentView;
            window.updateThemeFilter = taskModule.updateThemeFilter;
            window.getPriorityLabel = taskModule.getPriorityLabel;
            window.getStatusLabel = taskModule.getStatusLabel;
        }
        
        console.log('✅ Initialisation terminée !');
        
        // Déclencher l'événement d'initialisation
        window.dispatchEvent(new CustomEvent('modulesInitialized'));
    }
};

// Fonction utilitaire pour attendre l'initialisation
window.waitForModules = function(callback, maxWait = 5000) {
    const startTime = Date.now();
    
    function checkAndCall() {
        if (window.moduleInitialization.initialized) {
            callback();
        } else if (Date.now() - startTime < maxWait) {
            setTimeout(checkAndCall, 100);
        } else {
            console.warn('⚠️ Timeout: Modules non initialisés après', maxWait, 'ms');
            callback(); // Essayer quand même
        }
    }
    
    checkAndCall();
};