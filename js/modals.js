// modals.js - Gestion des modals pour les tâches et thèmes
import { supabaseClient } from './config.js';
import { getCurrentUser } from './auth.js';
import { ToastManager } from './main.js';

// Variables globales pour les modals
let taskModalElement = null;
let themeModalElement = null;
let currentEditingTask = null;
let currentEditingTheme = null;

// Initialisation des modals
export function initModals() {
    createTaskModal();
    createThemeModal();
    setupModalEvents();
}

// Création du modal de tâche
function createTaskModal() {
    const modalHTML = `
        <div id="taskModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="taskModalTitle">Nouvelle Tâche</h2>
                    <button class="close-btn" onclick="closeTaskModal()">&times;</button>
                </div>
                
                <form id="taskForm" class="modal-form">
                    <div class="form-group">
                        <label for="taskTitle">Titre *</label>
                        <input type="text" id="taskTitle" required maxlength="200" 
                               placeholder="Entrez le titre de la tâche">
                    </div>
                    
                    <div class="form-group">
                        <label for="taskDescription">Description</label>
                        <textarea id="taskDescription" rows="3" 
                                  placeholder="Description détaillée (optionnel)"></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="taskPriority">Priorité</label>
                            <select id="taskPriority">
                                <option value="low">🔵 Basse</option>
                                <option value="normal" selected>⚪ Normale</option>
                                <option value="high">🟡 Haute</option>
                                <option value="urgent">🔴 Urgente</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="taskStatus">Statut</label>
                            <select id="taskStatus">
                                <option value="todo" selected>📝 À faire</option>
                                <option value="in_progress">⏳ En cours</option>
                                <option value="completed">✅ Terminé</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="taskTheme">Thème</label>
                            <select id="taskTheme">
                                <option value="">Aucun thème</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="taskDueDate">Échéance</label>
                            <input type="datetime-local" id="taskDueDate">
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeTaskModal()">
                            Annuler
                        </button>
                        <button type="submit" class="btn btn-primary" id="taskSubmitBtn">
                            Créer la tâche
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    taskModalElement = document.getElementById('taskModal');
}

// Création du modal de thème
function createThemeModal() {
    const modalHTML = `
        <div id="themeModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Gestion des Thèmes</h2>
                    <button class="close-btn" onclick="closeThemeModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <!-- Formulaire de création/édition -->
                    <div class="theme-form-section">
                        <h3 id="themeFormTitle">Nouveau Thème</h3>
                        <form id="themeForm" class="modal-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="themeName">Nom *</label>
                                    <input type="text" id="themeName" required maxlength="50" 
                                           placeholder="Ex: Travail, Personnel, Projets">
                                </div>
                                
                                <div class="form-group">
                                    <label for="themeIcon">Icône</label>
                                    <select id="themeIcon">
                                        <option value="📝">📝 Note</option>
                                        <option value="💼">💼 Travail</option>
                                        <option value="🏠">🏠 Maison</option>
                                        <option value="🎯">🎯 Objectif</option>
                                        <option value="💡">💡 Idée</option>
                                        <option value="📚">📚 Étude</option>
                                        <option value="🛍️">🛍️ Shopping</option>
                                        <option value="🏃">🏃 Sport</option>
                                        <option value="🎵">🎵 Loisir</option>
                                        <option value="⚡">⚡ Urgent</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="themeColor">Couleur</label>
                                    <select id="themeColor">
                                        <option value="#3b82f6">🔵 Bleu</option>
                                        <option value="#10b981">🟢 Vert</option>
                                        <option value="#f59e0b">🟡 Jaune</option>
                                        <option value="#ef4444">🔴 Rouge</option>
                                        <option value="#8b5cf6">🟣 Violet</option>
                                        <option value="#06b6d4">🔷 Cyan</option>
                                        <option value="#f97316">🟠 Orange</option>
                                        <option value="#84cc16">🟢 Lime</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" onclick="resetThemeForm()">
                                    Annuler
                                </button>
                                <button type="submit" class="btn btn-primary" id="themeSubmitBtn">
                                    Créer le thème
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <hr>
                    
                    <!-- Liste des thèmes existants -->
                    <div class="theme-list-section">
                        <h3>Thèmes Existants</h3>
                        <div id="themesList" class="themes-list">
                            <!-- Les thèmes seront ajoutés ici -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    themeModalElement = document.getElementById('themeModal');
}

// Configuration des événements des modals
function setupModalEvents() {
    // Fermeture des modals en cliquant à l'extérieur
    window.addEventListener('click', (e) => {
        if (e.target === taskModalElement) closeTaskModal();
        if (e.target === themeModalElement) closeThemeModal();
    });
    
    // Fermeture avec la touche Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTaskModal();
            closeThemeModal();
        }
    });
    
    // Soumission du formulaire de tâche
    document.getElementById('taskForm')?.addEventListener('submit', handleTaskSubmit);
    
    // Soumission du formulaire de thème
    document.getElementById('themeForm')?.addEventListener('submit', handleThemeSubmit);
}

// Affichage du modal de tâche
export async function showTaskModal(task = null) {
    currentEditingTask = task;
    
    const titleElement = document.getElementById('taskModalTitle');
    const submitBtn = document.getElementById('taskSubmitBtn');
    
    if (task) {
        titleElement.textContent = 'Modifier la Tâche';
        submitBtn.textContent = 'Sauvegarder';
        await populateTaskForm(task);
    } else {
        titleElement.textContent = 'Nouvelle Tâche';
        submitBtn.textContent = 'Créer la tâche';
        resetTaskForm();
    }
    
    await updateTaskThemeOptions();
    taskModalElement.style.display = 'flex';
    document.getElementById('taskTitle')?.focus();
}

// Fermeture du modal de tâche
window.closeTaskModal = function() {
    taskModalElement.style.display = 'none';
    currentEditingTask = null;
    resetTaskForm();
};

// Remplissage du formulaire de tâche
async function populateTaskForm(task) {
    document.getElementById('taskTitle').value = task.title || '';
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskPriority').value = task.priority || 'normal';
    document.getElementById('taskStatus').value = task.status || 'todo';
    document.getElementById('taskTheme').value = task.theme_id || '';
    
    if (task.due_date) {
        // Convertir la date UTC en format datetime-local
        const date = new Date(task.due_date);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        document.getElementById('taskDueDate').value = localDate.toISOString().slice(0, 16);
    }
}

// Remise à zéro du formulaire de tâche
function resetTaskForm() {
    document.getElementById('taskForm')?.reset();
    document.getElementById('taskPriority').value = 'normal';
    document.getElementById('taskStatus').value = 'todo';
}

// Mise à jour des options de thèmes dans le formulaire de tâche
async function updateTaskThemeOptions() {
    try {
        const user = await getCurrentUser();
        const { data: themes, error } = await supabaseClient
            .from('task_themes')
            .select('*')
            .eq('user_id', user.id)
            .order('name');

        if (error) throw error;
        
        const select = document.getElementById('taskTheme');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">Aucun thème</option>';
        
        themes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.id;
            option.textContent = `${theme.icon} ${theme.name}`;
            select.appendChild(option);
        });
        
        select.value = currentValue;
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des thèmes:', error);
    }
}

// Gestion de la soumission du formulaire de tâche
async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('taskTitle').value.trim(),
        description: document.getElementById('taskDescription').value.trim() || null,
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        theme_id: document.getElementById('taskTheme').value || null,
        due_date: document.getElementById('taskDueDate').value || null
    };
    
    if (!formData.title) {
        ToastManager.show('Le titre est obligatoire', 'error');
        return;
    }
    
    try {
        const user = await getCurrentUser();
        
        if (currentEditingTask) {
            // Modification
            const { error } = await supabaseClient
                .from('tasks')
                .update(formData)
                .eq('id', currentEditingTask.id);
                
            if (error) throw error;
            ToastManager.show('Tâche modifiée avec succès', 'success');
        } else {
            // Création
            formData.user_id = user.id;
            const { error } = await supabaseClient
                .from('tasks')
                .insert([formData]);
                
            if (error) throw error;
            ToastManager.show('Tâche créée avec succès', 'success');
        }
        
        closeTaskModal();
        
        // Recharger les tâches (on peut aussi émettre un événement)
        if (window.loadTasks) {
            await window.loadTasks();
            window.renderCurrentView();
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        ToastManager.show('Erreur lors de la sauvegarde', 'error');
    }
}

// Affichage du modal de thèmes
export async function showThemeModal() {
    await loadThemesList();
    themeModalElement.style.display = 'flex';
    document.getElementById('themeName')?.focus();
}

// Fermeture du modal de thèmes
window.closeThemeModal = function() {
    themeModalElement.style.display = 'none';
    currentEditingTheme = null;
    resetThemeForm();
};

// Chargement de la liste des thèmes
async function loadThemesList() {
    try {
        const user = await getCurrentUser();
        const { data: themes, error } = await supabaseClient
            .from('task_themes')
            .select('*')
            .eq('user_id', user.id)
            .order('name');

        if (error) throw error;
        
        const container = document.getElementById('themesList');
        
        if (themes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Aucun thème créé. Créez votre premier thème ci-dessus !</p>
                </div>
            `;
            return;
        }
        
        const themesHTML = themes.map(theme => `
            <div class="theme-item" data-theme-id="${theme.id}">
                <div class="theme-info">
                    <span class="theme-preview" style="color: ${theme.color}">
                        ${theme.icon} ${theme.name}
                    </span>
                    <span class="theme-color-badge" style="background: ${theme.color}"></span>
                </div>
                <div class="theme-actions">
                    <button class="btn btn-sm" onclick="editTheme('${theme.id}')">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTheme('${theme.id}')">🗑️</button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = themesHTML;
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des thèmes:', error);
        ToastManager.show('Erreur lors du chargement des thèmes', 'error');
    }
}

// Gestion de la soumission du formulaire de thème
async function handleThemeSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('themeName').value.trim(),
        icon: document.getElementById('themeIcon').value,
        color: document.getElementById('themeColor').value
    };
    
    if (!formData.name) {
        ToastManager.show('Le nom est obligatoire', 'error');
        return;
    }
    
    try {
        const user = await getCurrentUser();
        
        if (currentEditingTheme) {
            // Modification
            const { error } = await supabaseClient
                .from('task_themes')
                .update(formData)
                .eq('id', currentEditingTheme.id);
                
            if (error) throw error;
            ToastManager.show('Thème modifié avec succès', 'success');
        } else {
            // Création
            formData.user_id = user.id;
            const { error } = await supabaseClient
                .from('task_themes')
                .insert([formData]);
                
            if (error) throw error;
            ToastManager.show('Thème créé avec succès', 'success');
        }
        
        resetThemeForm();
        await loadThemesList();
        
        // Recharger les thèmes dans la page principale
        if (window.loadThemes) {
            await window.loadThemes();
            window.updateThemeFilter();
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du thème:', error);
        ToastManager.show('Erreur lors de la sauvegarde', 'error');
    }
}

// Remise à zéro du formulaire de thème
window.resetThemeForm = function() {
    document.getElementById('themeForm')?.reset();
    document.getElementById('themeFormTitle').textContent = 'Nouveau Thème';
    document.getElementById('themeSubmitBtn').textContent = 'Créer le thème';
    currentEditingTheme = null;
};

// Édition d'un thème
window.editTheme = async function(themeId) {
    try {
        const { data: theme, error } = await supabaseClient
            .from('task_themes')
            .select('*')
            .eq('id', themeId)
            .single();

        if (error) throw error;
        
        currentEditingTheme = theme;
        
        document.getElementById('themeName').value = theme.name;
        document.getElementById('themeIcon').value = theme.icon;
        document.getElementById('themeColor').value = theme.color;
        
        document.getElementById('themeFormTitle').textContent = 'Modifier le Thème';
        document.getElementById('themeSubmitBtn').textContent = 'Sauvegarder';
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement du thème:', error);
        ToastManager.show('Erreur lors du chargement', 'error');
    }
};

// Suppression d'un thème
window.deleteTheme = async function(themeId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce thème ?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('task_themes')
            .delete()
            .eq('id', themeId);

        if (error) throw error;
        
        ToastManager.show('Thème supprimé avec succès', 'success');
        await loadThemesList();
        
        // Recharger les thèmes dans la page principale
        if (window.loadThemes) {
            await window.loadThemes();
            window.updateThemeFilter();
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        ToastManager.show('Erreur lors de la suppression', 'error');
    }
};

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que les autres modules soient chargés
    setTimeout(initModals, 100);
});

// Styles CSS pour les modals
const modalStyles = `
    <style>
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        align-items: center;
        justify-content: center;
    }
    
    .modal-content {
        background: white;
        border-radius: 8px;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .modal-header h2 {
        margin: 0;
        color: #1f2937;
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .close-btn:hover {
        background: #f3f4f6;
        color: #374151;
    }
    
    .modal-form {
        padding: 24px;
    }
    
    .form-group {
        margin-bottom: 16px;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #374151;
    }
    
    .form-group input,
    .form-group textarea,
    .form-group select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
    }
    
    .form-group textarea {
        resize: vertical;
        font-family: inherit;
    }
    
    .modal-actions,
    .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
    }
    
    .theme-form-section,
    .theme-list-section {
        padding: 20px 24px;
    }
    
    .theme-form-section h3,
    .theme-list-section h3 {
        margin-top: 0;
        margin-bottom: 16px;
        color: #1f2937;
    }
    
    .themes-list {
        max-height: 300px;
        overflow-y: auto;
    }
    
    .theme-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        margin-bottom: 8px;
    }
    
    .theme-info {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .theme-preview {
        font-weight: 500;
    }
    
    .theme-color-badge {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    }
    
    .theme-actions {
        display: flex;
        gap: 8px;
    }
    
    .btn-sm {
        padding: 4px 8px;
        font-size: 12px;
    }
    
    .btn-danger {
        background: #ef4444;
        color: white;
    }
    
    .btn-danger:hover {
        background: #dc2626;
    }
    
    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            margin: 10px;
        }
        
        .form-row {
            grid-template-columns: 1fr;
        }
        
        .modal-actions,
        .form-actions {
            flex-direction: column;
        }
    }
    </style>
`;

// Injecter les styles
document.head.insertAdjacentHTML('beforeend', modalStyles);