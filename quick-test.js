// quick-test.js - Test rapide des corrections
console.log('🧪 Test rapide des corrections...');

// Test 1: Vérifier les modules
setTimeout(() => {
    console.log('\n📦 Modules disponibles :');
    console.log('✅ supabaseClient:', typeof window.supabaseClient !== 'undefined');
    console.log('✅ authManager:', typeof window.authManager !== 'undefined');  
    console.log('✅ ToastManager:', typeof window.ToastManager !== 'undefined');
    console.log('✅ getCurrentUser:', typeof window.getCurrentUser !== 'undefined');
    
    // Test 2: Vérifier les données de démo
    console.log('\n🎭 Mode démonstration :');
    console.log('✅ DEMO_TASKS_DATA:', typeof window.DEMO_TASKS_DATA !== 'undefined');
    if (window.DEMO_TASKS_DATA) {
        console.log('✅ isDemoMode:', window.DEMO_TASKS_DATA.isDemoMode());
        console.log('✅ Tâches demo:', window.DEMO_TASKS_DATA.tasks.length);
        console.log('✅ Thèmes demo:', window.DEMO_TASKS_DATA.themes.length);
    }
    
    // Test 3: Vérifier les fonctions utilitaires
    console.log('\n🔧 Fonctions utilitaires :');
    console.log('✅ getPriorityLabel:', typeof window.getPriorityLabel !== 'undefined');
    console.log('✅ getStatusLabel:', typeof window.getStatusLabel !== 'undefined');
    
    if (typeof window.getPriorityLabel === 'function') {
        console.log('✅ Test priorités:', ['low', 'normal', 'high', 'urgent'].map(p => window.getPriorityLabel(p)));
    }
    
    // Test 4: Vérifier l'état des tâches
    console.log('\n📝 État des tâches :');
    console.log('✅ currentTasks:', Array.isArray(window.currentTasks), `(${window.currentTasks?.length || 0} tâches)`);
    console.log('✅ currentThemes:', Array.isArray(window.currentThemes), `(${window.currentThemes?.length || 0} thèmes)`);
    
    // Test 5: Tester les fonctions de rendu
    console.log('\n🎨 Fonctions de rendu :');
    console.log('✅ renderCurrentView:', typeof window.renderCurrentView !== 'undefined');
    console.log('✅ updateThemeFilter:', typeof window.updateThemeFilter !== 'undefined');
    
    console.log('\n✨ Tests terminés !');
    
    // Si tout est OK, essayer de rendre les tâches
    if (window.currentTasks && window.renderCurrentView) {
        console.log('🚀 Tentative de rendu des tâches...');
        try {
            window.renderCurrentView();
            console.log('✅ Rendu réussi !');
        } catch (error) {
            console.error('❌ Erreur rendu:', error);
        }
    }
    
}, 2000); // Attendre 2 secondes pour que tout soit chargé