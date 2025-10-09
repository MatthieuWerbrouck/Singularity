// tasks-standalone.js - Version standalone du module des tâches (non ES6)
console.log('🚀 Chargement du module tâches standalone...');

// Configuration Supabase (fallback)
const SUPABASE_CONFIG = {
    url: 'https://fgnpwzlwwldneuvzsvjr.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnbnB3emx3d2xkbmV1dnpzdmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzE3ODMsImV4cCI6MjA3NTQwNzc4M30.ha_zLj8jPD5MSuYb3ncdjvOeOdmjmx0uSuzYvMLYByg'
};

// État global des tâches
let currentTasks = [];
let currentThemes = [];
let currentFilters = {
    search: '',
    status: '',
    priority: '',
    theme: ''
};
let currentView = 'todolist';
let supabaseClient = null;

// Client Supabase basique (sera remplacé par le vrai si disponible)
if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase;
} else if (typeof createClient !== 'undefined') {
    supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}

// ToastManager basique
const ToastManager = window.ToastManager || {
    show: function(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Créer une notification visuelle basique
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            border-radius: 6px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }
};

// Fonction pour obtenir l'utilisateur actuel
async function getCurrentUser() {
    if (window.authManager) {
        return window.authManager.getUser();
    }
    return { id: 'demo-user', email: 'demo@example.com' }; // Mode démo
}

// Labels des priorités
function getPriorityLabel(priority) {
    const labels = {
        low: 'Basse',
        normal: 'Normale',
        high: 'Haute',
        urgent: 'Urgente'
    };
    return labels[priority] || 'Normale';
}

// Labels des statuts
function getStatusLabel(status) {
    const labels = {
        todo: 'À faire',
        in_progress: 'En cours',
        completed: 'Terminé'
    };
    return labels[status] || 'À faire';
}

// Chargement des thèmes
async function loadThemes() {
    console.log('📦 Chargement des thèmes...');
    
    if (window.DEMO_TASKS_DATA && window.DEMO_TASKS_DATA.isDemoMode()) {
        currentThemes = [...window.DEMO_TASKS_DATA.themes];
        window.currentThemes = currentThemes;
        console.log('✅ Thèmes de démo chargés:', currentThemes.length);
        return;
    }
    
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Pas de client Supabase, utilisation des données par défaut');
            currentThemes = [];
            return;
        }
        
        const user = await getCurrentUser();
        const { data, error } = await supabaseClient
            .from('task_themes')
            .select('*')
            .eq('user_id', user.id)
            .order('name');

        if (error) throw error;
        
        currentThemes = data || [];
        window.currentThemes = currentThemes;
        console.log('✅ Thèmes chargés:', currentThemes.length);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des thèmes:', error);
        ToastManager.show('Erreur lors du chargement des thèmes', 'error');
        currentThemes = [];
    }
}

// Chargement des tâches
async function loadTasks() {
    console.log('📦 Chargement des tâches...');
    
    if (window.DEMO_TASKS_DATA && window.DEMO_TASKS_DATA.isDemoMode()) {
        currentTasks = [...window.DEMO_TASKS_DATA.tasks];
        window.currentTasks = currentTasks;
        console.log('✅ Tâches de démo chargées:', currentTasks.length);
        return;
    }
    
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Pas de client Supabase, utilisation des données par défaut');
            currentTasks = [];
            return;
        }
        
        const user = await getCurrentUser();
        const { data, error } = await supabaseClient
            .from('tasks')
            .select(`
                *,
                theme:task_themes(name, color, icon)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        currentTasks = data || [];
        window.currentTasks = currentTasks;
        console.log('✅ Tâches chargées:', currentTasks.length);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des tâches:', error);
        ToastManager.show('Erreur lors du chargement des tâches', 'error');
        currentTasks = [];
    }
}

// Mise à jour du filtre de thèmes
function updateThemeFilter() {
    const select = document.getElementById('filterTheme');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">Tous les thèmes</option>';
    
    currentThemes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.id;
        option.textContent = `${theme.icon} ${theme.name}`;
        select.appendChild(option);
    });
    
    select.value = currentValue;
}

// Filtrage des tâches
function filterTasks() {
    return currentTasks.filter(task => {
        // Recherche textuelle
        if (currentFilters.search) {
            const searchText = task.title.toLowerCase() + ' ' + (task.description || '').toLowerCase();
            if (!searchText.includes(currentFilters.search)) return false;
        }
        
        // Filtre par statut
        if (currentFilters.status && task.status !== currentFilters.status) return false;
        
        // Filtre par priorité
        if (currentFilters.priority && task.priority !== currentFilters.priority) return false;
        
        // Filtre par thème
        if (currentFilters.theme && task.theme_id !== currentFilters.theme) return false;
        
        return true;
    });
}

// Création du HTML pour une tâche
function createTaskItemHTML(task) {
    const theme = task.theme || { name: 'Sans thème', color: '#6b7280', icon: '📝' };
    const isCompleted = task.status === 'completed';
    
    const dueDateText = task.due_date ? 
        new Date(task.due_date).toLocaleDateString('fr-FR') : 
        'Pas d\'échéance';
    
    return `
        <div class="task-item" data-task-id="${task.id}">
            <input type="checkbox" class="task-checkbox" 
                   ${isCompleted ? 'checked' : ''} 
                   onchange="toggleTaskStatus('${task.id}')">
            
            <div class="task-content">
                <div class="task-title ${isCompleted ? 'line-through opacity-60' : ''}">${task.title}</div>
                <div class="task-meta">
                    <span class="task-theme" style="background: ${theme.color}20; color: ${theme.color}">
                        ${theme.icon} ${theme.name}
                    </span>
                    <span class="priority-badge priority-${task.priority}">${getPriorityLabel(task.priority)}</span>
                    <span>📅 ${dueDateText}</span>
                    <span>🕐 ${getStatusLabel(task.status)}</span>
                </div>
            </div>
            
            <div class="task-actions">
                <button class="task-btn" onclick="editTask('${task.id}')">✏️</button>
                <button class="task-btn" onclick="deleteTask('${task.id}')">🗑️</button>
            </div>
        </div>
    `;
}

// Rendu de la vue Todo List
function renderTodoList() {
    const container = document.getElementById('tasksList');
    if (!container) return;
    
    const filteredTasks = filterTasks();
    
    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h3>${currentTasks.length === 0 ? 'Aucune tâche' : 'Aucun résultat'}</h3>
                <p>${currentTasks.length === 0 ? 'Commencez par créer votre première tâche !' : 'Essayez d\'ajuster vos filtres'}</p>
            </div>
        `;
        return;
    }
    
    const tasksHTML = filteredTasks.map(task => createTaskItemHTML(task)).join('');
    container.innerHTML = tasksHTML;
}

// Rendu de la vue Planning
function renderPlanning() {
    const container = document.getElementById('planningCalendar');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📅</div>
            <h3>Vue Planning</h3>
            <p>Fonctionnalité en développement - Calendrier à venir</p>
        </div>
    `;
}

// Rendu de la vue actuelle
function renderCurrentView() {
    console.log('🎨 Rendu de la vue:', currentView);
    
    switch (currentView) {
        case 'todolist':
            renderTodoList();
            break;
        case 'planning':
            renderPlanning();
            break;
        default:
            console.warn('Vue inconnue:', currentView);
    }
}

// Changement de vue
function switchView(viewName) {
    if (currentView === viewName) return;
    
    currentView = viewName;
    
    // Mettre à jour les boutons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    
    // Mettre à jour les sections
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.toggle('active', section.id === `${viewName}View`);
    });
    
    renderCurrentView();
}

// Gestion de la recherche
function handleSearch(e) {
    currentFilters.search = e.target.value.toLowerCase();
    renderCurrentView();
}

// Gestion des filtres
function handleFilterChange() {
    currentFilters.status = document.getElementById('filterStatus')?.value || '';
    currentFilters.priority = document.getElementById('filterPriority')?.value || '';
    currentFilters.theme = document.getElementById('filterTheme')?.value || '';
    renderCurrentView();
}

// Effacer tous les filtres
function clearFilters() {
    currentFilters = { search: '', status: '', priority: '', theme: '' };
    
    document.getElementById('searchTasks').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterPriority').value = '';
    document.getElementById('filterTheme').value = '';
    
    renderCurrentView();
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Sélecteur de vue
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchView(e.target.dataset.view);
        });
    });

    // Actions principales
    document.getElementById('addTaskBtn')?.addEventListener('click', () => {
        ToastManager.show('Modal de création de tâche à implémenter', 'info');
    });
    
    document.getElementById('manageThemesBtn')?.addEventListener('click', () => {
        ToastManager.show('Modal de gestion des thèmes à implémenter', 'info');
    });

    // Filtres et recherche
    document.getElementById('searchTasks')?.addEventListener('input', handleSearch);
    document.getElementById('filterStatus')?.addEventListener('change', handleFilterChange);
    document.getElementById('filterPriority')?.addEventListener('change', handleFilterChange);
    document.getElementById('filterTheme')?.addEventListener('change', handleFilterChange);
    document.getElementById('clearFiltersBtn')?.addEventListener('click', clearFilters);

    // Déconnexion
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('supabase.auth.token');
        window.location.href = 'index.html';
    });
}

// Fonctions globales pour les actions sur les tâches
window.toggleTaskStatus = function(taskId) {
    ToastManager.show('Fonction toggleTaskStatus à implémenter', 'info');
};

window.editTask = function(taskId) {
    ToastManager.show('Fonction editTask à implémenter', 'info');
};

window.deleteTask = function(taskId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
        ToastManager.show('Fonction deleteTask à implémenter', 'info');
    }
};

// Initialisation du module des tâches
async function initTasks() {
    console.log('🚀 Initialisation du module des tâches standalone');
    
    try {
        // Charger les données initiales
        await loadThemes();
        await loadTasks();
        
        // Initialiser l'interface
        setupEventListeners();
        updateThemeFilter();
        renderCurrentView();
        
        console.log('✅ Module des tâches initialisé');
        
        // Déclencher l'événement de fin d'initialisation
        window.dispatchEvent(new CustomEvent('tasksModuleReady'));
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des tâches:', error);
        ToastManager.show('Erreur lors du chargement des tâches', 'error');
    }
}

// Exposer toutes les fonctions globalement
function exposeGlobally() {
    // Variables d'état
    window.currentTasks = currentTasks;
    window.currentThemes = currentThemes;
    window.supabaseClient = supabaseClient;
    window.getCurrentUser = getCurrentUser;
    window.ToastManager = ToastManager;
    
    // Fonctions principales
    window.loadTasks = loadTasks;
    window.loadThemes = loadThemes;
    window.updateThemeFilter = updateThemeFilter;
    window.renderCurrentView = renderCurrentView;
    window.getPriorityLabel = getPriorityLabel;
    window.getStatusLabel = getStatusLabel;
    window.switchView = switchView;
    window.filterTasks = filterTasks;
    window.clearFilters = clearFilters;
    
    console.log('🌐 Toutes les fonctions exposées globalement');
}

// Enregistrer dans le système d'initialisation
if (window.moduleInitialization) {
    window.moduleInitialization.register('tasks-standalone', {
        currentTasks,
        currentThemes,
        supabaseClient,
        getCurrentUser,
        loadTasks,
        loadThemes,
        updateThemeFilter,
        renderCurrentView,
        getPriorityLabel,
        getStatusLabel,
        initTasks,
        ToastManager
    });
}

// Exposer immédiatement
exposeGlobally();

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM chargé, initialisation du module standalone...');
    
    // Attendre un peu pour que les autres scripts se chargent
    setTimeout(() => {
        exposeGlobally();
        initTasks();
    }, 100);
});

console.log('✅ Module tâches standalone chargé');