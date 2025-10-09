// test-standalone.js - Test de la version standalone
console.log('🧪 Test de la version standalone...');

function testStandalone() {
    console.log('\n=== TEST MODULE STANDALONE ===');
    
    const tests = [
        { name: 'supabaseClient', check: () => typeof window.supabaseClient !== 'undefined' },
        { name: 'ToastManager', check: () => typeof window.ToastManager !== 'undefined' },
        { name: 'getCurrentUser', check: () => typeof window.getCurrentUser === 'function' },
        { name: 'loadTasks', check: () => typeof window.loadTasks === 'function' },
        { name: 'loadThemes', check: () => typeof window.loadThemes === 'function' },
        { name: 'getPriorityLabel', check: () => typeof window.getPriorityLabel === 'function' },
        { name: 'getStatusLabel', check: () => typeof window.getStatusLabel === 'function' },
        { name: 'renderCurrentView', check: () => typeof window.renderCurrentView === 'function' },
        { name: 'currentTasks', check: () => Array.isArray(window.currentTasks) },
        { name: 'currentThemes', check: () => Array.isArray(window.currentThemes) }
    ];
    
    let passed = 0;
    tests.forEach(test => {
        const result = test.check();
        console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'OK' : 'FAIL'}`);
        if (result) passed++;
    });
    
    console.log(`\n📊 Résultat: ${passed}/${tests.length} tests passés`);
    
    // Test des fonctions utilitaires
    if (typeof window.getPriorityLabel === 'function') {
        console.log('\n🔧 Test fonctions utilitaires:');
        const priorities = ['low', 'normal', 'high', 'urgent'];
        priorities.forEach(p => {
            console.log(`  ${p}: ${window.getPriorityLabel(p)}`);
        });
    }
    
    // Test des données
    console.log('\n📝 Données chargées:');
    console.log(`  Tâches: ${window.currentTasks?.length || 0}`);
    console.log(`  Thèmes: ${window.currentThemes?.length || 0}`);
    
    // Test du rendu
    if (typeof window.renderCurrentView === 'function') {
        console.log('\n🎨 Test du rendu...');
        try {
            window.renderCurrentView();
            console.log('✅ Rendu réussi');
        } catch (error) {
            console.error('❌ Erreur rendu:', error);
        }
    }
    
    return passed === tests.length;
}

// Écouter l'événement de fin d'initialisation du module
window.addEventListener('tasksModuleReady', () => {
    console.log('🎉 Module tâches prêt ! Lancement des tests...');
    setTimeout(testStandalone, 100);
});

// Test de fallback si l'événement ne se déclenche pas
setTimeout(() => {
    if (typeof window.loadTasks === 'function') {
        console.log('⏰ Test de fallback...');
        testStandalone();
    }
}, 3000);

// Exposer la fonction de test
window.testStandalone = testStandalone;