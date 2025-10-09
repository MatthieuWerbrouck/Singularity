// debug-modules.js - Script de débogage des modules
console.log('🔍 === DÉBOGAGE DES MODULES ===');

function debugModules() {
    console.log('\n📦 État des modules globaux :');
    
    const checks = [
        { name: 'window.supabaseClient', value: typeof window.supabaseClient },
        { name: 'window.authManager', value: typeof window.authManager },
        { name: 'window.ToastManager', value: typeof window.ToastManager },
        { name: 'window.getCurrentUser', value: typeof window.getCurrentUser },
        { name: 'window.loadTasks', value: typeof window.loadTasks },
        { name: 'window.loadThemes', value: typeof window.loadThemes },
        { name: 'window.getPriorityLabel', value: typeof window.getPriorityLabel },
        { name: 'window.getStatusLabel', value: typeof window.getStatusLabel },
        { name: 'window.currentTasks', value: Array.isArray(window.currentTasks) ? `array[${window.currentTasks.length}]` : typeof window.currentTasks },
        { name: 'window.currentThemes', value: Array.isArray(window.currentThemes) ? `array[${window.currentThemes.length}]` : typeof window.currentThemes }
    ];
    
    checks.forEach(check => {
        const status = check.value !== 'undefined' ? '✅' : '❌';
        console.log(`${status} ${check.name}: ${check.value}`);
    });
    
    console.log('\n🏗️ Système d\'initialisation :');
    if (window.moduleInitialization) {
        console.log('✅ moduleInitialization disponible');
        console.log('📋 Modules enregistrés:', Object.keys(window.moduleInitialization.modules));
        console.log('🎯 Initialisé:', window.moduleInitialization.initialized);
    } else {
        console.log('❌ moduleInitialization non disponible');
    }
    
    console.log('\n🎭 Mode démonstration :');
    if (window.DEMO_TASKS_DATA) {
        console.log('✅ DEMO_TASKS_DATA disponible');
        console.log('🎭 isDemoMode:', window.DEMO_TASKS_DATA.isDemoMode());
        console.log('📝 Tâches:', window.DEMO_TASKS_DATA.tasks.length);
        console.log('🎨 Thèmes:', window.DEMO_TASKS_DATA.themes.length);
    } else {
        console.log('❌ DEMO_TASKS_DATA non disponible');
    }
    
    console.log('\n🎨 Éléments DOM :');
    const elements = ['tasksList', 'addTaskBtn', 'manageThemesBtn'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${element ? '✅' : '❌'} #${id}`);
    });
}

// Exécuter le débogage après chargement
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM chargé, début du débogage...');
    
    // Premier check immédiat
    setTimeout(() => {
        console.log('\n⏰ Check après 1 seconde :');
        debugModules();
    }, 1000);
    
    // Deuxième check après plus de temps
    setTimeout(() => {
        console.log('\n⏰ Check après 3 secondes :');
        debugModules();
    }, 3000);
    
    // Check final
    setTimeout(() => {
        console.log('\n⏰ Check final après 5 secondes :');
        debugModules();
        
        // Tentative de forcer l'exposition si nécessaire
        if (window.taskModule && typeof window.getPriorityLabel === 'undefined') {
            console.log('🔧 Tentative de correction manuelle...');
            
            Object.assign(window, window.taskModule);
            
            setTimeout(() => {
                console.log('\n✨ Check après correction :');
                debugModules();
            }, 500);
        }
    }, 5000);
});

// Écouter l'événement d'initialisation
window.addEventListener('modulesInitialized', () => {
    console.log('\n🎉 Event modulesInitialized reçu !');
    setTimeout(debugModules, 100);
});

// Exposer la fonction de débogage
window.debugModules = debugModules;