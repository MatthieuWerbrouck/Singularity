// test-tasks-module.js - Tests pour le module des tâches
console.log('🧪 Tests du module des tâches');

// Test 1: Vérifier que les modules sont chargés
function testModulesLoaded() {
    console.log('\n📦 Test 1: Chargement des modules');
    
    const checks = [
        { name: 'Supabase Client', condition: typeof window.supabase !== 'undefined' },
        { name: 'Module Auth', condition: typeof getCurrentUser === 'function' },
        { name: 'ToastManager', condition: typeof ToastManager !== 'undefined' },
        { name: 'Elements DOM', condition: document.getElementById('tasksList') !== null }
    ];
    
    checks.forEach(check => {
        console.log(`${check.condition ? '✅' : '❌'} ${check.name}`);
    });
}

// Test 2: Vérifier l'interface utilisateur
function testUI() {
    console.log('\n🎨 Test 2: Interface utilisateur');
    
    const elements = [
        'addTaskBtn',
        'manageThemesBtn', 
        'searchTasks',
        'filterStatus',
        'filterPriority',
        'filterTheme',
        'tasksList',
        'planningCalendar'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${element ? '✅' : '❌'} Element #${id}`);
    });
}

// Test 3: Vérifier les événements
function testEvents() {
    console.log('\n🖱️ Test 3: Événements');
    
    // Test du changement de vue
    const viewBtns = document.querySelectorAll('.view-btn');
    console.log(`${viewBtns.length === 2 ? '✅' : '❌'} Boutons de vue (${viewBtns.length}/2)`);
    
    // Test des formulaires
    const forms = ['taskModal', 'themeModal'];
    forms.forEach(formId => {
        // Les modals sont créés dynamiquement, donc ils peuvent ne pas exister au chargement
        console.log(`🔄 Modal #${formId} (création dynamique)`);
    });
}

// Test 4: Test de la structure des données
function testDataStructure() {
    console.log('\n📊 Test 4: Structure des données');
    
    const testTask = {
        id: 'test-id',
        title: 'Tâche de test',
        description: 'Description de test',
        status: 'todo',
        priority: 'normal',
        theme_id: null,
        due_date: null,
        created_at: new Date().toISOString()
    };
    
    const requiredFields = ['id', 'title', 'status', 'priority'];
    const hasRequiredFields = requiredFields.every(field => testTask.hasOwnProperty(field));
    console.log(`${hasRequiredFields ? '✅' : '❌'} Structure de tâche valide`);
    
    const testTheme = {
        id: 'test-theme-id',
        name: 'Thème de test',
        icon: '📝',
        color: '#3b82f6',
        user_id: 'test-user'
    };
    
    const themeFields = ['id', 'name', 'icon', 'color'];
    const hasThemeFields = themeFields.every(field => testTheme.hasOwnProperty(field));
    console.log(`${hasThemeFields ? '✅' : '❌'} Structure de thème valide`);
}

// Test 5: Vérifier les fonctions utilitaires
function testUtilities() {
    console.log('\n🔧 Test 5: Fonctions utilitaires');
    
    // Test des labels de priorité
    if (typeof getPriorityLabel === 'function') {
        const priorities = ['low', 'normal', 'high', 'urgent'];
        const labels = priorities.map(p => getPriorityLabel(p));
        console.log(`✅ Labels de priorité: ${labels.join(', ')}`);
    } else {
        console.log(`❌ Fonction getPriorityLabel non accessible`);
    }
    
    // Test des labels de statut
    if (typeof getStatusLabel === 'function') {
        const statuses = ['todo', 'in_progress', 'completed'];
        const labels = statuses.map(s => getStatusLabel(s));
        console.log(`✅ Labels de statut: ${labels.join(', ')}`);
    } else {
        console.log(`❌ Fonction getStatusLabel non accessible`);
    }
}

// Test 6: Vérifier les styles CSS
function testCSS() {
    console.log('\n🎨 Test 6: Styles CSS');
    
    const criticalClasses = [
        'tasks-container',
        'task-item',
        'modal',
        'view-section',
        'priority-high',
        'priority-urgent'
    ];
    
    criticalClasses.forEach(className => {
        const elements = document.getElementsByClassName(className);
        console.log(`${elements.length > 0 ? '✅' : '⚠️'} Classe .${className} ${elements.length > 0 ? '(trouvée)' : '(non utilisée)'}`);
    });
}

// Exécution des tests
function runAllTests() {
    console.log('🚀 Démarrage des tests du module des tâches\n');
    
    testModulesLoaded();
    testUI();
    testEvents();
    testDataStructure();
    testUtilities();
    testCSS();
    
    console.log('\n✨ Tests terminés !');
    console.log('💡 Consultez la console pour les détails');
}

// Exécuter les tests après le chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// Export pour utilisation manuelle
window.testTasksModule = {
    runAllTests,
    testModulesLoaded,
    testUI,
    testEvents,
    testDataStructure,
    testUtilities,
    testCSS
};