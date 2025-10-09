// tasks.js - Module de gestion des tâches
import { supabaseClient, getCurrentUser, isAuthenticated } from './tasks-config.js';
import { ToastManager } from './main.js';
import { showTaskModal, showThemeModal } from './modals.js';

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

// Fonction pour exposer toutes les variables et fonctions globalement
function exposeGlobally() {
    // Variables d'état
    window.currentTasks = currentTasks;
    window.currentThemes = currentThemes;
    window.supabaseClient = supabaseClient;
    window.getCurrentUser = getCurrentUser;
    
    // Fonctions principales
    window.loadTasks = loadTasks;
    window.loadThemes = loadThemes;
    window.updateThemeFilter = updateThemeFilter;
    window.renderCurrentView = renderCurrentView;
    window.getPriorityLabel = getPriorityLabel;
    window.getStatusLabel = getStatusLabel;
    
    // Module complet
    window.taskModule = {
        currentTasks,
        currentThemes,
        supabaseClient,
        getCurrentUser,
        isAuthenticated,
        loadTasks,
        loadThemes,
        updateThemeFilter,
        renderCurrentView,
        getPriorityLabel,
        getStatusLabel,
        initTasks
    };
    
    console.log('🌐 Variables et fonctions exposées globalement');
}

// Exposer immédiatement
exposeGlobally();

// Initialisation du module des tâches
export async function initTasks() {
    console.log('🚀 Initialisation du module des tâches');
    
    // Vérifier l'authentification (sauf en mode démo)
    if (!window.DEMO_TASKS_DATA?.isDemoMode()) {
        const user = await getCurrentUser();
        if (!user) {
            console.log('❌ Utilisateur non authentifié, redirection...');
            window.location.href = 'index.html';
            return;
        }
    }

    try {
        // Charger les données initiales
        await loadThemes();
        await loadTasks();
        
        // Initialiser l'interface
        setupEventListeners();
        updateThemeFilter();
        renderCurrentView();
        
        console.log('✅ Module des tâches initialisé');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des tâches:', error);
        ToastManager.show('Erreur lors du chargement des tâches', 'error');
    }
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
    document.getElementById('addTaskBtn')?.addEventListener('click', () => showTaskModal());
    document.getElementById('manageThemesBtn')?.addEventListener('click', () => showThemeModal());

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

// Chargement des thèmes
async function loadThemes() {
    try {
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
    }
}

// Chargement des tâches
async function loadTasks() {
    try {
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
    }
}

// Mise à jour du filtre de thèmes
function updateThemeFilter() {
    const select = document.getElementById('filterTheme');
    if (!select) return;
    
    // Garder l'option "Tous les thèmes"
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

// Rendu de la vue actuelle
function renderCurrentView() {
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
    
    // Attacher les événements
    attachTaskEvents();
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

// Rendu de la vue Planning
function renderPlanning() {
    const container = document.getElementById('planningCalendar');
    if (!container) return;
    
    // Pour l'instant, affichage simple
    // TODO: Implémenter un vrai calendrier
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📅</div>
            <h3>Vue Planning</h3>
            <p>Fonctionnalité en développement - Calendrier à venir</p>
        </div>
    `;
}

// Attacher les événements aux tâches
function attachTaskEvents() {
    // Les événements onclick sont définis dans le HTML
    // On pourrait aussi les attacher ici pour une meilleure séparation
}

// Changer le statut d'une tâche
window.toggleTaskStatus = async function(taskId) {
    try {
        const task = currentTasks.find(t => t.id === taskId);
        if (!task) return;
        
        const newStatus = task.status === 'completed' ? 'todo' : 'completed';
        
        const { error } = await supabaseClient
            .from('tasks')
            .update({ 
                status: newStatus,
                completed_at: newStatus === 'completed' ? new Date().toISOString() : null
            })
            .eq('id', taskId);

        if (error) throw error;
        
        // Mettre à jour localement
        task.status = newStatus;
        task.completed_at = newStatus === 'completed' ? new Date().toISOString() : null;
        
        ToastManager.show(`Tâche ${newStatus === 'completed' ? 'terminée' : 'rouverte'}`, 'success');
        renderCurrentView();
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du statut:', error);
        ToastManager.show('Erreur lors de la mise à jour', 'error');
        // Recharger pour remettre à jour l'interface
        loadTasks().then(() => renderCurrentView());
    }
};

// Éditer une tâche
window.editTask = function(taskId) {
    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;
    
    showTaskModal(task);
};

// Supprimer une tâche
window.deleteTask = async function(taskId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;
        
        // Retirer de la liste locale
        currentTasks = currentTasks.filter(t => t.id !== taskId);
        
        ToastManager.show('Tâche supprimée', 'success');
        renderCurrentView();
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        ToastManager.show('Erreur lors de la suppression', 'error');
    }
};

// Enregistrer le module dans le système global après exposition
setTimeout(() => {
    if (window.moduleInitialization) {
        window.moduleInitialization.register('tasks', window.taskModule);
    }
    
    // Re-exposer après initialisation pour s'assurer que tout est disponible
    exposeGlobally();
}, 100);

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Re-exposer avant l'initialisation
    exposeGlobally();
    
    // Initialiser les tâches
    initTasks();
    
    // Final exposure après initialisation
    setTimeout(exposeGlobally, 500);
});