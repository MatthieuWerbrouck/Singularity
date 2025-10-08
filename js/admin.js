// Module Administration - Gestion des utilisateurs et rôles
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';
import { SUPABASE_CONFIG } from './config.js';

class AdminManager {
    constructor() {
        this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        this.currentUser = null;
        this.users = [];
        this.roles = [];
    }

    async init() {
        try {
            // Vérifier si l'utilisateur est admin
            const user = await this.supabase.auth.getUser();
            if (!user.data.user) {
                throw new Error('Non authentifié');
            }

            this.currentUser = user.data.user;
            
            // Vérifier les permissions admin
            const hasAdminAccess = await this.checkAdminAccess();
            if (!hasAdminAccess) {
                throw new Error('Accès non autorisé - Permissions administrateur requises');
            }

            await this.loadRoles();
            await this.loadUsers();
            this.createAdminInterface();

        } catch (error) {
            console.error('Erreur initialisation admin:', error);
            this.showError(error.message);
        }
    }

    async checkAdminAccess() {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select(`
                    is_super_admin,
                    roles(name, level)
                `)
                .eq('id', this.currentUser.id)
                .single();

            if (error) throw error;

            return data.is_super_admin || (data.roles && data.roles.level >= 80);
        } catch (error) {
            console.error('Erreur vérification admin:', error);
            return false;
        }
    }

    async loadRoles() {
        try {
            const { data, error } = await this.supabase
                .from('roles')
                .select('*')
                .eq('is_active', true)
                .order('level', { ascending: false });

            if (error) throw error;
            this.roles = data || [];
        } catch (error) {
            console.error('Erreur chargement rôles:', error);
        }
    }

    async loadUsers() {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select(`
                    id,
                    email,
                    full_name,
                    status,
                    is_super_admin,
                    created_at,
                    roles(id, name, display_name, color, icon, level)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.users = data || [];
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
        }
    }

    createAdminInterface() {
        // Déterminer où injecter le contenu admin
        let container = document.getElementById('adminContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'adminContainer';
            
            // Essayer d'abord la page dashboard (index.html)
            const dashboardPage = document.getElementById('dashboardPage');
            if (dashboardPage) {
                dashboardPage.appendChild(container);
            } else {
                // Sinon, utiliser adminContent (admin.html)
                const adminContent = document.getElementById('adminContent');
                if (adminContent) {
                    adminContent.appendChild(container);
                } else {
                    // Fallback vers body
                    document.body.appendChild(container);
                }
            }
        }

        container.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <!-- Header Admin -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9;">
                    <h2 style="color: #1e293b; margin: 0; display: flex; align-items: center; gap: 10px;">
                        👑 Panel d'Administration
                    </h2>
                    <div style="display: flex; gap: 10px;">
                        <button id="refreshUsersBtn" style="background: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer;">
                            🔄 Actualiser
                        </button>
                        <button id="addUserBtn" style="background: #10b981; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer;">
                            ➕ Nouvel Utilisateur
                        </button>
                    </div>
                </div>

                <!-- Statistiques Rapides -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700;">${this.users.length}</div>
                        <div style="opacity: 0.9; font-size: 14px;">Utilisateurs Total</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700;">${this.users.filter(u => u.status === 'active').length}</div>
                        <div style="opacity: 0.9; font-size: 14px;">Utilisateurs Actifs</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700;">${this.users.filter(u => u.roles && u.roles.level >= 80).length}</div>
                        <div style="opacity: 0.9; font-size: 14px;">Administrateurs</div>
                    </div>
                    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700;">${this.roles.length}</div>
                        <div style="opacity: 0.9; font-size: 14px;">Rôles Définis</div>
                    </div>
                </div>

                <!-- Tabs Navigation -->
                <div style="border-bottom: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <nav style="display: flex; gap: 20px;">
                        <button id="usersTab" class="admin-tab active" data-tab="users" 
                                style="padding: 12px 0; border: none; background: none; color: #3b82f6; border-bottom: 2px solid #3b82f6; cursor: pointer; font-weight: 600;">
                            👥 Utilisateurs
                        </button>
                        <button id="rolesTab" class="admin-tab" data-tab="roles" 
                                style="padding: 12px 0; border: none; background: none; color: #64748b; border-bottom: 2px solid transparent; cursor: pointer; font-weight: 600;">
                            🏷️ Rôles
                        </button>
                        <button id="permissionsTab" class="admin-tab" data-tab="permissions" 
                                style="padding: 12px 0; border: none; background: none; color: #64748b; border-bottom: 2px solid transparent; cursor: pointer; font-weight: 600;">
                            🔐 Permissions
                        </button>
                    </nav>
                </div>

                <!-- Contenu des Tabs -->
                <div id="adminTabContent">
                    ${this.renderUsersTab()}
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderUsersTab() {
        return `
            <div id="usersContent" class="admin-tab-content">
                <!-- Filtres -->
                <div style="display: flex; gap: 15px; margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; align-items: center;">
                    <select id="statusFilter" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; min-width: 120px;">
                        <option value="">Tous les statuts</option>
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                        <option value="suspended">Suspendu</option>
                    </select>
                    <select id="roleFilter" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; min-width: 140px;">
                        <option value="">Tous les rôles</option>
                        ${this.roles.map(role => `<option value="${role.id}">${role.display_name}</option>`).join('')}
                    </select>
                    <input type="text" id="searchUsers" placeholder="Rechercher par email ou nom..." 
                           style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                    <button id="clearFiltersBtn" style="background: #6b7280; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">
                        🗑️ Effacer
                    </button>
                    <div id="filterResults" style="color: #6b7280; font-size: 12px; white-space: nowrap;">
                        ${this.users.length} utilisateur(s)
                    </div>
                </div>

                <!-- Table des Utilisateurs -->
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; background: white;">
                        <thead>
                            <tr style="background: #f8fafc;">
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Utilisateur</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Rôle</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Statut</th>
                                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Inscription</th>
                                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            ${this.users.map(user => this.renderUserRow(user)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderUserRow(user) {
        const role = user.roles;
        const statusColors = {
            active: '#10b981',
            inactive: '#6b7280',
            suspended: '#ef4444'
        };

        return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                            ${(user.full_name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #1e293b;">${user.full_name || 'Sans nom'}</div>
                            <div style="font-size: 12px; color: #64748b;">${user.email}</div>
                            ${user.is_super_admin ? '<span style="font-size: 10px; background: #dc2626; color: white; padding: 2px 6px; border-radius: 10px;">SUPER ADMIN</span>' : ''}
                        </div>
                    </div>
                </td>
                <td style="padding: 12px;">
                    ${role ? `
                        <span style="display: inline-flex; align-items: center; gap: 6px; background: ${role.color}20; color: ${role.color}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            ${role.icon} ${role.display_name}
                        </span>
                    ` : '<span style="color: #6b7280; font-style: italic;">Aucun rôle</span>'}
                </td>
                <td style="padding: 12px;">
                    <span style="background: ${statusColors[user.status]}20; color: ${statusColors[user.status]}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                        ${user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                </td>
                <td style="padding: 12px; color: #64748b; font-size: 12px;">
                    ${new Date(user.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td style="padding: 12px; text-align: center;">
                    <div style="display: flex; gap: 8px; justify-content: center;">
                        <button onclick="window.adminManager.editUser('${user.id}')" 
                                style="background: #3b82f6; color: white; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            ✏️ Éditer
                        </button>
                        ${user.id !== this.currentUser.id ? `
                            <button onclick="window.adminManager.toggleUserStatus('${user.id}', '${user.status}')" 
                                    style="background: ${user.status === 'active' ? '#ef4444' : '#10b981'}; color: white; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                                ${user.status === 'active' ? '⏸️ Suspendre' : '▶️ Activer'}
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    setupEventListeners() {
        // Event listeners pour les tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });

        // Event listeners pour les boutons
        document.getElementById('refreshUsersBtn')?.addEventListener('click', () => this.refreshData());
        document.getElementById('addUserBtn')?.addEventListener('click', () => this.showAddUserModal());

        // Filtres
        document.getElementById('statusFilter')?.addEventListener('change', () => this.filterUsers());
        document.getElementById('roleFilter')?.addEventListener('change', () => this.filterUsers());
        document.getElementById('searchUsers')?.addEventListener('input', () => this.filterUsers());
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => this.clearFilters());

        // Rendre adminManager accessible globalement pour les boutons onclick
        window.adminManager = this;
    }

    switchTab(tabName) {
        // Mise à jour des styles des tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.style.color = '#3b82f6';
                tab.style.borderBottomColor = '#3b82f6';
                tab.classList.add('active');
            } else {
                tab.style.color = '#64748b';
                tab.style.borderBottomColor = 'transparent';
                tab.classList.remove('active');
            }
        });

        // Mise à jour du contenu
        const content = document.getElementById('adminTabContent');
        switch (tabName) {
            case 'users':
                content.innerHTML = this.renderUsersTab();
                break;
            case 'roles':
                content.innerHTML = this.renderRolesTab();
                break;
            case 'permissions':
                content.innerHTML = this.renderPermissionsTab();
                break;
        }
    }

    renderRolesTab() {
        return `<div style="padding: 20px; text-align: center; color: #64748b;">
            🚧 Gestion des rôles - En développement
        </div>`;
    }

    renderPermissionsTab() {
        return `<div style="padding: 20px; text-align: center; color: #64748b;">
            🚧 Gestion des permissions - En développement
        </div>`;
    }

    async refreshData() {
        await this.loadUsers();
        await this.loadRoles();
        this.switchTab('users'); // Refresh l'affichage
    }

    filterUsers() {
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const roleFilter = document.getElementById('roleFilter')?.value || '';
        const searchText = document.getElementById('searchUsers')?.value.toLowerCase() || '';
        
        console.log('Filtrage:', { statusFilter, roleFilter, searchText });
        
        // Filtrer les utilisateurs
        let filteredUsers = this.users;
        
        // Filtre par statut
        if (statusFilter) {
            filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
        }
        
        // Filtre par rôle
        if (roleFilter) {
            filteredUsers = filteredUsers.filter(user => user.roles?.id == roleFilter);
        }
        
        // Filtre par recherche texte (email ou nom)
        if (searchText) {
            filteredUsers = filteredUsers.filter(user => 
                user.email.toLowerCase().includes(searchText) ||
                (user.full_name && user.full_name.toLowerCase().includes(searchText))
            );
        }
        
        console.log(`Filtrage: ${filteredUsers.length}/${this.users.length} utilisateurs`);
        
        // Mettre à jour l'affichage
        this.updateUsersTable(filteredUsers);
        
        // Mettre à jour le compteur de résultats
        const resultsDiv = document.getElementById('filterResults');
        if (resultsDiv) {
            resultsDiv.textContent = `${filteredUsers.length} sur ${this.users.length} utilisateur(s)`;
        }
        
        // Notification du résultat du filtrage
        if (filteredUsers.length === 0 && this.users.length > 0) {
            this.showMessage('Aucun utilisateur ne correspond aux critères de filtrage', 'warning');
        }
    }
    
    clearFilters() {
        // Réinitialiser tous les filtres
        const statusFilter = document.getElementById('statusFilter');
        const roleFilter = document.getElementById('roleFilter');
        const searchInput = document.getElementById('searchUsers');
        
        if (statusFilter) statusFilter.value = '';
        if (roleFilter) roleFilter.value = '';
        if (searchInput) searchInput.value = '';
        
        // Réafficher tous les utilisateurs
        this.updateUsersTable(this.users);
        
        // Mettre à jour le compteur
        const resultsDiv = document.getElementById('filterResults');
        if (resultsDiv) {
            resultsDiv.textContent = `${this.users.length} utilisateur(s)`;
        }
        
        this.showMessage('Filtres effacés', 'info');
    }

    // === MODAL SYSTEM ===
    createModal(id, title, content, buttons = {}) {
        // Supprimer un modal existant s'il y en a un
        this.hideModal();

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.id = `modal-${id}`;

        modalOverlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="window.adminManager.hideModal()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${buttons.primaryButton || buttons.secondaryButton ? `
                    <div class="modal-footer">
                        ${buttons.secondaryButton ? `
                            <button class="btn btn-secondary" onclick="window.adminManager.hideModal()">
                                ${buttons.secondaryButton.text}
                            </button>
                        ` : ''}
                        ${buttons.primaryButton ? `
                            <button class="btn btn-primary" id="modal-primary-btn">
                                ${buttons.primaryButton.text}
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modalOverlay);

        // Ajouter les event listeners
        if (buttons.primaryButton) {
            document.getElementById('modal-primary-btn')?.addEventListener('click', buttons.primaryButton.action);
        }

        // Fermer modal en cliquant sur l'overlay
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.hideModal();
            }
        });

        // Gestion de la touche Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Afficher modal avec animation
        setTimeout(() => modalOverlay.classList.add('show'), 10);

        return modalOverlay;
    }

    hideModal() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        });
    }

    renderAddUserForm() {
        return `
            <form id="addUserForm">
                <div class="form-group">
                    <label class="form-label" for="userEmail">Email *</label>
                    <input type="email" id="userEmail" class="form-input" placeholder="exemple@domaine.com" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="userPassword">Mot de passe temporaire *</label>
                    <input type="password" id="userPassword" class="form-input" placeholder="Minimum 8 caractères" required>
                    <small style="color: #6b7280; font-size: 12px;">L'utilisateur devra changer son mot de passe à la première connexion</small>
                </div>

                <div class="form-group">
                    <label class="form-label" for="userFullName">Nom complet</label>
                    <input type="text" id="userFullName" class="form-input" placeholder="Prénom Nom">
                </div>

                <div class="form-group">
                    <label class="form-label" for="userRole">Rôle</label>
                    <select id="userRole" class="form-select">
                        <option value="">Sélectionner un rôle (optionnel)</option>
                        ${this.roles.map(role => `
                            <option value="${role.id}" ${role.name === 'user' ? 'selected' : ''}>
                                ${role.icon} ${role.display_name} (Niveau ${role.level})
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="userStatus">Statut initial</label>
                    <select id="userStatus" class="form-select">
                        <option value="active" selected>Actif</option>
                        <option value="inactive">Inactif</option>
                    </select>
                </div>

                <div class="form-group">
                    <div class="form-checkbox">
                        <input type="checkbox" id="userSuperAdmin">
                        <label for="userSuperAdmin">Super Administrateur</label>
                    </div>
                    <small style="color: #ef4444; font-size: 12px;">⚠️ Attention : Les super admins ont tous les droits</small>
                </div>

                <div class="form-group">
                    <div class="form-checkbox">
                        <input type="checkbox" id="sendWelcomeEmail" checked>
                        <label for="sendWelcomeEmail">Envoyer un email de bienvenue</label>
                    </div>
                </div>
            </form>
        `;
    }

    async createUser() {
        const form = document.getElementById('addUserForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = {
            email: document.getElementById('userEmail').value,
            password: document.getElementById('userPassword').value,
            fullName: document.getElementById('userFullName').value,
            roleId: document.getElementById('userRole').value || null,
            status: document.getElementById('userStatus').value,
            isSuperAdmin: document.getElementById('userSuperAdmin').checked,
            sendWelcomeEmail: document.getElementById('sendWelcomeEmail').checked
        };

        console.log('Création utilisateur:', formData);

        try {
            // Désactiver le bouton pendant la création
            const btn = document.getElementById('modal-primary-btn');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Création en cours...';
            }

            // 1. Créer l'utilisateur avec signUp (l'utilisateur recevra un email de confirmation)
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName
                    }
                }
            });

            if (authError) throw authError;

            // 2. Créer le profil utilisateur avec les données admin
            const { error: profileError } = await this.supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    email: formData.email,
                    full_name: formData.fullName,
                    role_id: formData.roleId,
                    status: formData.status,
                    is_super_admin: formData.isSuperAdmin,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, { 
                    onConflict: 'id' 
                });

            if (profileError) throw profileError;

            // 3. Actualiser la liste des utilisateurs
            await this.refreshData();

            // 4. Fermer modal et afficher succès
            this.hideModal();
            this.showSuccess(`Utilisateur ${formData.email} créé avec succès !`);

            // 5. TODO: Envoyer email de bienvenue si demandé
            if (formData.sendWelcomeEmail) {
                this.showMessage('Email de bienvenue à implémenter', 'warning');
            }

        } catch (error) {
            console.error('Erreur création utilisateur:', error);
            this.showError(`Erreur lors de la création : ${error.message}`);

            // Réactiver le bouton
            const btn = document.getElementById('modal-primary-btn');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Créer l\'utilisateur';
            }
        }
    }
    
    updateUsersTable(users) {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;
        
        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #6b7280; font-style: italic;">
                        🔍 Aucun utilisateur trouvé
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = users.map(user => this.renderUserRow(user)).join('');
        }
    }

    showAddUserModal() {
        this.createModal('addUser', 'Ajouter un utilisateur', this.renderAddUserForm(), {
            primaryButton: {
                text: 'Créer l\'utilisateur',
                action: () => this.createUser()
            },
            secondaryButton: {
                text: 'Annuler',
                action: () => this.hideModal()
            }
        });
    }

    async editUser(userId) {
        // TODO: Implémenter l'édition d'utilisateur
        console.log('Édition utilisateur:', userId);
        this.showMessage('Édition utilisateur - En développement', 'info');
    }

    async toggleUserStatus(userId, currentStatus) {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        
        try {
            const { error } = await this.supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', userId);

            if (error) throw error;

            await this.refreshData();
            this.showSuccess(`Statut utilisateur mis à jour vers: ${newStatus}`);
        } catch (error) {
            console.error('Erreur changement statut:', error);
            this.showError('Erreur lors du changement de statut');
        }
    }

    showMessage(message, type = 'info') {
        // Utiliser le système de toast moderne
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            // Fallback vers alert si les toasts ne sont pas disponibles
            alert(message);
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showWarning(message) {
        this.showMessage(message, 'warning');
    }
}

// Export pour utilisation
export { AdminManager };