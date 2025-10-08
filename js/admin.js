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
        document.getElementById('addRoleBtn')?.addEventListener('click', () => this.showAddRoleModal());

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
                // Re-setup event listeners pour les filtres
                document.getElementById('statusFilter')?.addEventListener('change', () => this.filterUsers());
                document.getElementById('roleFilter')?.addEventListener('change', () => this.filterUsers());
                document.getElementById('searchUsers')?.addEventListener('input', () => this.filterUsers());
                document.getElementById('clearFiltersBtn')?.addEventListener('click', () => this.clearFilters());
                break;
            case 'roles':
                content.innerHTML = this.renderRolesTab();
                // Re-setup event listener pour le bouton ajouter rôle
                document.getElementById('addRoleBtn')?.addEventListener('click', () => this.showAddRoleModal());
                break;
            case 'permissions':
                content.innerHTML = this.renderPermissionsTab();
                break;
        }
    }

    renderRolesTab() {
        return `
            <div id="rolesContent" class="admin-tab-content">
                <!-- Header avec actions -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; border-radius: 12px;">
                    <div>
                        <h3 style="margin: 0; font-size: 24px;">🏷️ Gestion des Rôles</h3>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Configurez les rôles et leurs niveaux de permissions</p>
                    </div>
                    <button id="addRoleBtn" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; backdrop-filter: blur(10px);">
                        ➕ Nouveau Rôle
                    </button>
                </div>

                <!-- Statistiques des rôles -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 30px;">
                    <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 700; color: #1e293b;">${this.roles.length}</div>
                        <div style="color: #64748b; font-size: 14px;">Rôles Définis</div>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 700; color: #1e293b;">${this.roles.filter(r => r.level >= 80).length}</div>
                        <div style="color: #64748b; font-size: 14px;">Rôles Admin</div>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 700; color: #1e293b;">${this.users.filter(u => u.roles).length}</div>
                        <div style="color: #64748b; font-size: 14px;">Utilisateurs avec Rôles</div>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 700; color: #1e293b;">${this.roles.filter(r => r.is_active).length}</div>
                        <div style="color: #64748b; font-size: 14px;">Rôles Actifs</div>
                    </div>
                </div>

                <!-- Hiérarchie des rôles -->
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                    <h4 style="margin: 0 0 20px 0; color: #1e293b; display: flex; align-items: center; gap: 10px;">
                        � Hiérarchie des Rôles
                        <span style="font-size: 12px; background: #f1f5f9; color: #64748b; padding: 4px 8px; border-radius: 12px; font-weight: 400;">Organisés par niveau</span>
                    </h4>
                    <div id="rolesHierarchy">
                        ${this.renderRolesHierarchy()}
                    </div>
                </div>

                <!-- Table détaillée des rôles -->
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: #f8fafc; padding: 20px; border-bottom: 1px solid #e2e8f0;">
                        <h4 style="margin: 0; color: #1e293b;">📋 Configuration Détaillée</h4>
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f8fafc;">
                                    <th style="padding: 15px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Rôle</th>
                                    <th style="padding: 15px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Niveau</th>
                                    <th style="padding: 15px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Utilisateurs</th>
                                    <th style="padding: 15px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Statut</th>
                                    <th style="padding: 15px; text-align: center; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="rolesTableBody">
                                ${this.roles.map(role => this.renderRoleRow(role)).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    renderRolesHierarchy() {
        // Trier les rôles par niveau décroissant
        const sortedRoles = [...this.roles].sort((a, b) => b.level - a.level);
        
        return sortedRoles.map(role => {
            const userCount = this.users.filter(u => u.roles?.id === role.id).length;
            const widthPercent = (role.level / 100) * 100;
            
            return `
                <div style="display: flex; align-items: center; gap: 15px; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                    <!-- Indicateur de niveau -->
                    <div style="width: 200px; background: #f1f5f9; border-radius: 20px; overflow: hidden; position: relative;">
                        <div style="background: ${role.color}; width: ${widthPercent}%; height: 8px; border-radius: 20px; transition: all 0.3s ease;"></div>
                        <div style="position: absolute; top: -2px; right: 5px; font-size: 10px; font-weight: 600; color: #64748b;">
                            ${role.level}/100
                        </div>
                    </div>
                    
                    <!-- Informations du rôle -->
                    <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 20px;">${role.icon}</span>
                        <div>
                            <div style="font-weight: 600; color: ${role.color};">${role.display_name}</div>
                            <div style="font-size: 12px; color: #64748b;">${role.name} • ${userCount} utilisateur${userCount !== 1 ? 's' : ''}</div>
                        </div>
                    </div>
                    
                    <!-- Badge de niveau -->
                    <div style="background: ${role.color}20; color: ${role.color}; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; white-space: nowrap;">
                        ${this.getRoleLevelLabel(role.level)}
                    </div>
                </div>
            `;
        }).join('');
    }

    getRoleLevelLabel(level) {
        if (level >= 90) return '👑 Super Admin';
        if (level >= 80) return '🔥 Administrateur';
        if (level >= 60) return '⚡ Modérateur';
        if (level >= 40) return '🎯 Manager';
        if (level >= 20) return '✨ Contributeur';
        return '👤 Utilisateur';
    }

    renderRoleRow(role) {
        const userCount = this.users.filter(u => u.roles?.id === role.id).length;
        const canDelete = userCount === 0 && !['super_admin', 'admin', 'user'].includes(role.name);
        
        return `
            <tr style="border-bottom: 1px solid #f1f5f9; transition: all 0.2s ease;" 
                onmouseover="this.style.background='#f8fafc'" 
                onmouseout="this.style.background='white'">
                
                <td style="padding: 15px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; background: ${role.color}20; border: 2px solid ${role.color}40; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                            ${role.icon}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #1e293b; margin-bottom: 2px;">${role.display_name}</div>
                            <div style="font-size: 12px; color: #64748b; font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; display: inline-block;">
                                ${role.name}
                            </div>
                        </div>
                    </div>
                </td>
                
                <td style="padding: 15px; text-align: center;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 5px;">
                        <span style="font-weight: 700; font-size: 18px; color: ${role.color};">${role.level}</span>
                        <div style="width: 60px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                            <div style="background: ${role.color}; width: ${role.level}%; height: 4px;"></div>
                        </div>
                    </div>
                </td>
                
                <td style="padding: 15px; text-align: center;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                        <span style="font-weight: 600; color: #1e293b;">${userCount}</span>
                        <span style="font-size: 11px; color: #64748b;">utilisateur${userCount !== 1 ? 's' : ''}</span>
                    </div>
                </td>
                
                <td style="padding: 15px; text-align: center;">
                    <span style="background: ${role.is_active ? '#10b981' : '#6b7280'}20; color: ${role.is_active ? '#10b981' : '#6b7280'}; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                        ${role.is_active ? '✅ Actif' : '⏸️ Inactif'}
                    </span>
                </td>
                
                <td style="padding: 15px; text-align: center;">
                    <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="window.adminManager.editRole('${role.id}')" 
                                style="background: #3b82f6; color: white; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                            ✏️ Éditer
                        </button>
                        
                        <button onclick="window.adminManager.toggleRoleStatus('${role.id}', ${role.is_active})" 
                                style="background: ${role.is_active ? '#f59e0b' : '#10b981'}; color: white; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                            ${role.is_active ? '⏸️ Désactiver' : '▶️ Activer'}
                        </button>
                        
                        ${canDelete ? `
                            <button onclick="window.adminManager.deleteRole('${role.id}')" 
                                    style="background: #ef4444; color: white; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                                🗑️ Supprimer
                            </button>
                        ` : `
                            <span style="color: #6b7280; font-size: 11px; font-style: italic; padding: 6px;">
                                ${userCount > 0 ? 'En cours d\'utilisation' : 'Rôle système'}
                            </span>
                        `}
                    </div>
                </td>
            </tr>
        `;
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

    // === GESTION DES RÔLES ===

    showAddRoleModal() {
        this.createModal('addRole', 'Créer un nouveau rôle', this.renderAddRoleForm(), {
            primaryButton: {
                text: 'Créer le rôle',
                action: () => this.createRole()
            },
            secondaryButton: {
                text: 'Annuler',
                action: () => this.hideModal()
            }
        });
    }

    renderAddRoleForm() {
        return `
            <form id="addRoleForm">
                <div class="form-group">
                    <label class="form-label" for="roleName">Nom technique du rôle *</label>
                    <input type="text" id="roleName" class="form-input" placeholder="ex: moderator" required pattern="[a-z_]+" title="Lettres minuscules et underscores uniquement">
                    <small style="color: #6b7280; font-size: 12px;">Utilisé en interne, doit être unique (lettres minuscules et _ uniquement)</small>
                </div>

                <div class="form-group">
                    <label class="form-label" for="roleDisplayName">Nom d'affichage *</label>
                    <input type="text" id="roleDisplayName" class="form-input" placeholder="ex: Modérateur" required>
                    <small style="color: #6b7280; font-size: 12px;">Nom affiché dans l'interface utilisateur</small>
                </div>

                <div class="form-group">
                    <label class="form-label" for="roleDescription">Description</label>
                    <textarea id="roleDescription" class="form-input" placeholder="Description des responsabilités de ce rôle..." rows="3"></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label" for="roleLevel">Niveau de permission *</label>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <input type="range" id="roleLevel" min="1" max="89" value="20" style="flex: 1;" oninput="updateLevelDisplay()">
                        <div style="min-width: 80px; text-align: center; font-weight: 600; color: #3b82f6;">
                            <span id="levelValue">20</span>/100
                        </div>
                    </div>
                    <div id="levelDescription" style="margin-top: 8px; padding: 8px 12px; background: #f1f5f9; border-radius: 6px; font-size: 12px; color: #64748b;">
                        👤 Utilisateur standard
                    </div>
                    <small style="color: #6b7280; font-size: 12px; margin-top: 5px; display: block;">
                        ⚠️ Niveau 90+ réservé aux super admins. Maximum recommandé : 89
                    </small>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="form-group">
                        <label class="form-label" for="roleColor">Couleur du rôle *</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <input type="color" id="roleColor" value="#3b82f6" style="width: 50px; height: 40px; border: none; border-radius: 6px; cursor: pointer;">
                            <input type="text" id="roleColorText" class="form-input" value="#3b82f6" placeholder="#3b82f6" pattern="^#[0-9A-Fa-f]{6}$" style="flex: 1;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="roleIcon">Icône du rôle *</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <div id="iconPreview" style="width: 40px; height: 40px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                👤
                            </div>
                            <input type="text" id="roleIcon" class="form-input" value="👤" placeholder="👤" maxlength="2" style="flex: 1;">
                        </div>
                        <small style="color: #6b7280; font-size: 12px;">Utilisez un emoji ou un caractère Unicode</small>
                    </div>
                </div>

                <div class="form-group">
                    <div class="form-checkbox">
                        <input type="checkbox" id="roleIsActive" checked>
                        <label for="roleIsActive">Rôle actif</label>
                    </div>
                    <small style="color: #6b7280; font-size: 12px;">Les rôles inactifs ne peuvent pas être assignés aux utilisateurs</small>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0;">
                    <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 14px;">🎯 Aperçu du rôle</h4>
                    <div id="rolePreview" style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; background: #3b82f620; border: 2px solid #3b82f640; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                            👤
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #3b82f6;">Nouvel utilisateur</div>
                            <div style="font-size: 12px; color: #64748b;">new_user • Niveau 20/100</div>
                        </div>
                        <div style="background: #3b82f620; color: #3b82f6; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                            👤 Utilisateur
                        </div>
                    </div>
                </div>
            </form>
        `;
    }

    async createRole() {
        const form = document.getElementById('addRoleForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = {
            name: document.getElementById('roleName').value,
            displayName: document.getElementById('roleDisplayName').value,
            description: document.getElementById('roleDescription').value,
            level: parseInt(document.getElementById('roleLevel').value),
            color: document.getElementById('roleColor').value,
            icon: document.getElementById('roleIcon').value,
            isActive: document.getElementById('roleIsActive').checked
        };

        console.log('Création rôle:', formData);

        try {
            // Désactiver le bouton pendant la création
            const btn = document.getElementById('modal-primary-btn');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Création en cours...';
            }

            // Vérifier si le nom du rôle existe déjà
            const { data: existingRole } = await this.supabase
                .from('roles')
                .select('name')
                .eq('name', formData.name)
                .single();

            if (existingRole) {
                throw new Error('Un rôle avec ce nom existe déjà');
            }

            // Créer le rôle
            const { data, error } = await this.supabase
                .from('roles')
                .insert({
                    name: formData.name,
                    display_name: formData.displayName,
                    description: formData.description,
                    level: formData.level,
                    color: formData.color,
                    icon: formData.icon,
                    is_active: formData.isActive,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Actualiser les données
            await this.refreshData();

            // Fermer modal et afficher succès
            this.hideModal();
            this.showSuccess(`Rôle "${formData.displayName}" créé avec succès !`);

        } catch (error) {
            console.error('Erreur création rôle:', error);
            this.showError(`Erreur lors de la création : ${error.message}`);

            // Réactiver le bouton
            const btn = document.getElementById('modal-primary-btn');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Créer le rôle';
            }
        }
    }

    async editRole(roleId) {
        const role = this.roles.find(r => r.id === roleId);
        if (!role) {
            this.showError('Rôle non trouvé');
            return;
        }

        console.log('Édition rôle:', role);
        this.showEditRoleModal(role);
    }

    async toggleRoleStatus(roleId, currentStatus) {
        const role = this.roles.find(r => r.id === roleId);
        if (!role) {
            this.showError('Rôle non trouvé');
            return;
        }

        // Vérifier si c'est un rôle système
        if (['super_admin', 'admin', 'user'].includes(role.name)) {
            this.showWarning('Les rôles système ne peuvent pas être désactivés');
            return;
        }

        const newStatus = !currentStatus;

        try {
            const { error } = await this.supabase
                .from('roles')
                .update({ is_active: newStatus })
                .eq('id', roleId);

            if (error) throw error;

            await this.refreshData();
            this.showSuccess(`Rôle ${newStatus ? 'activé' : 'désactivé'} avec succès`);
        } catch (error) {
            console.error('Erreur changement statut rôle:', error);
            this.showError('Erreur lors du changement de statut');
        }
    }

    async deleteRole(roleId) {
        const role = this.roles.find(r => r.id === roleId);
        if (!role) {
            this.showError('Rôle non trouvé');
            return;
        }

        // Vérifications de sécurité
        if (['super_admin', 'admin', 'user'].includes(role.name)) {
            this.showError('Les rôles système ne peuvent pas être supprimés');
            return;
        }

        const userCount = this.users.filter(u => u.roles?.id === roleId).length;
        if (userCount > 0) {
            this.showError(`Impossible de supprimer: ${userCount} utilisateur(s) ont ce rôle`);
            return;
        }

        // Confirmation de suppression
        this.createModal(
            'confirmDeleteRole',
            '⚠️ Supprimer le rôle',
            `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🗑️</div>
                    <h3 style="color: #ef4444; margin-bottom: 15px;">Supprimer définitivement ce rôle ?</h3>
                    
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 15px 0;">
                        <div style="display: flex; align-items: center; gap: 12px; justify-content: center;">
                            <span style="font-size: 20px;">${role.icon}</span>
                            <div>
                                <div style="font-weight: 600; color: ${role.color};">${role.display_name}</div>
                                <div style="font-size: 12px; color: #64748b;">${role.name} • Niveau ${role.level}/100</div>
                            </div>
                        </div>
                    </div>
                    
                    <p style="color: #ef4444; font-weight: 600; margin: 20px 0;">
                        ⚠️ Cette action est IRRÉVERSIBLE !
                    </p>
                    
                    <div style="margin: 20px 0;">
                        <input type="text" id="confirmDeleteRoleInput" placeholder="Tapez 'SUPPRIMER' pour confirmer" 
                               style="width: 100%; padding: 10px; border: 2px solid #ef4444; border-radius: 6px; text-align: center; font-weight: 600;">
                    </div>
                </div>
            `,
            {
                primaryButton: {
                    text: '🗑️ Supprimer définitivement',
                    action: () => this.executeDeleteRole(role)
                },
                secondaryButton: {
                    text: 'Annuler',
                    action: () => this.hideModal()
                }
            }
        );
    }

    async executeDeleteRole(role) {
        const confirmInput = document.getElementById('confirmDeleteRoleInput');
        if (!confirmInput || confirmInput.value !== 'SUPPRIMER') {
            this.showError('Veuillez taper "SUPPRIMER" pour confirmer');
            return;
        }

        try {
            const btn = document.getElementById('modal-primary-btn');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Suppression en cours...';
            }

            const { error } = await this.supabase
                .from('roles')
                .delete()
                .eq('id', role.id);

            if (error) throw error;

            await this.refreshData();
            this.hideModal();
            this.showSuccess(`Rôle "${role.display_name}" supprimé définitivement`);

        } catch (error) {
            console.error('Erreur suppression rôle:', error);
            this.showError(`Erreur lors de la suppression : ${error.message}`);

            const btn = document.getElementById('modal-primary-btn');
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🗑️ Supprimer définitivement';
            }
        }
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

    renderEditUserForm(user) {
        return `
            <form id="editUserForm">
                <!-- Information de base -->
                <div class="form-group">
                    <label class="form-label">Email actuel</label>
                    <div style="padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; color: #64748b; font-style: italic;">
                        ${user.email}
                    </div>
                    <small style="color: #6b7280; font-size: 12px;">L'email ne peut pas être modifié pour des raisons de sécurité</small>
                </div>

                <div class="form-group">
                    <label class="form-label" for="editUserFullName">Nom complet</label>
                    <input type="text" id="editUserFullName" class="form-input" placeholder="Prénom Nom" value="${user.full_name || ''}">
                </div>

                <!-- Gestion du rôle -->
                <div class="form-group">
                    <label class="form-label" for="editUserRole">Rôle</label>
                    <select id="editUserRole" class="form-select">
                        <option value="">Aucun rôle</option>
                        ${this.roles.map(role => `
                            <option value="${role.id}" ${user.roles?.id == role.id ? 'selected' : ''}>
                                ${role.icon} ${role.display_name} (Niveau ${role.level})
                            </option>
                        `).join('')}
                    </select>
                    ${user.roles ? `
                        <small style="color: #3b82f6; font-size: 12px;">
                            Rôle actuel: ${user.roles.icon} ${user.roles.display_name} (Niveau ${user.roles.level})
                        </small>
                    ` : ''}
                </div>

                <!-- Gestion du statut -->
                <div class="form-group">
                    <label class="form-label" for="editUserStatus">Statut du compte</label>
                    <select id="editUserStatus" class="form-select">
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>✅ Actif</option>
                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>⏸️ Inactif</option>
                        <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>❌ Suspendu</option>
                    </select>
                </div>

                <!-- Permissions spéciales -->
                ${user.id !== this.currentUser.id ? `
                    <div class="form-group">
                        <div class="form-checkbox">
                            <input type="checkbox" id="editUserSuperAdmin" ${user.is_super_admin ? 'checked' : ''}>
                            <label for="editUserSuperAdmin">Super Administrateur</label>
                        </div>
                        <small style="color: #ef4444; font-size: 12px;">⚠️ Attention : Les super admins ont tous les droits sur l'application</small>
                    </div>
                ` : `
                    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin: 15px 0;">
                        <div style="color: #92400e; font-weight: 600; margin-bottom: 5px;">🚨 Vous éditez votre propre compte</div>
                        <small style="color: #92400e; font-size: 12px;">Vous ne pouvez pas modifier vos propres permissions administrateur par sécurité.</small>
                    </div>
                `}

                <!-- Actions sur le mot de passe -->
                <div class="form-group">
                    <label class="form-label">Gestion du mot de passe</label>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button type="button" id="sendPasswordResetBtn" 
                                style="background: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            📧 Envoyer reset mot de passe
                        </button>
                        <button type="button" id="generateTempPasswordBtn"
                                style="background: #f59e0b; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            🔑 Générer mot de passe temporaire
                        </button>
                    </div>
                    <small style="color: #6b7280; font-size: 12px;">L'utilisateur recevra les instructions par email</small>
                </div>

                <!-- Informations de compte -->
                <div class="form-group">
                    <label class="form-label">Informations du compte</label>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
                            <div><strong>Créé le:</strong> ${new Date(user.created_at).toLocaleString('fr-FR')}</div>
                            <div><strong>ID utilisateur:</strong> ${user.id}</div>
                            ${user.roles ? `<div><strong>Niveau de rôle:</strong> ${user.roles.level}/100</div>` : ''}
                            <div><strong>Super Admin:</strong> ${user.is_super_admin ? '✅ Oui' : '❌ Non'}</div>
                        </div>
                    </div>
                </div>

                <!-- Actions dangereuses -->
                ${user.id !== this.currentUser.id ? `
                    <div style="border-top: 1px solid #e2e8f0; margin-top: 20px; padding-top: 20px;">
                        <label class="form-label" style="color: #ef4444;">Actions dangereuses</label>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button type="button" id="deleteUserBtn" 
                                    style="background: #ef4444; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                                🗑️ Supprimer le compte
                            </button>
                            <button type="button" id="forceLogoutBtn"
                                    style="background: #f97316; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                                🚪 Forcer la déconnexion
                            </button>
                        </div>
                        <small style="color: #ef4444; font-size: 12px;">⚠️ Ces actions sont irréversibles</small>
                    </div>
                ` : ''}
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

    async updateUser() {
        const form = document.getElementById('editUserForm');
        if (!form) return;

        const user = this.currentEditUser;
        if (!user) {
            this.showError('Erreur: utilisateur non défini');
            return;
        }

        const formData = {
            fullName: document.getElementById('editUserFullName')?.value || null,
            roleId: document.getElementById('editUserRole')?.value || null,
            status: document.getElementById('editUserStatus')?.value || 'active',
            isSuperAdmin: user.id !== this.currentUser.id ? 
                (document.getElementById('editUserSuperAdmin')?.checked || false) : 
                user.is_super_admin // Conserver la valeur actuelle pour soi-même
        };

        console.log('Modification utilisateur:', { userId: user.id, formData });

        try {
            // Désactiver le bouton pendant la mise à jour
            const btn = document.getElementById('modal-primary-btn');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Sauvegarde en cours...';
            }

            // Mise à jour du profil
            const { error } = await this.supabase
                .from('profiles')
                .update({
                    full_name: formData.fullName,
                    role_id: formData.roleId === '' ? null : formData.roleId,
                    status: formData.status,
                    is_super_admin: formData.isSuperAdmin,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            // Actualiser les données
            await this.refreshData();

            // Fermer modal et afficher succès
            this.hideModal();
            this.showSuccess(`Utilisateur ${user.email} modifié avec succès !`);

            // Notification spéciale si l'utilisateur se modifie lui-même
            if (user.id === this.currentUser.id) {
                this.showMessage('Vos modifications ont été sauvegardées', 'info');
            }

        } catch (error) {
            console.error('Erreur modification utilisateur:', error);
            this.showError(`Erreur lors de la modification : ${error.message}`);

            // Réactiver le bouton
            const btn = document.getElementById('modal-primary-btn');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Sauvegarder les modifications';
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

    showEditUserModal(user) {
        this.currentEditUser = user; // Stocker l'utilisateur en cours d'édition
        this.createModal('editUser', `Éditer: ${user.email}`, this.renderEditUserForm(user), {
            primaryButton: {
                text: 'Sauvegarder les modifications',
                action: () => this.updateUser()
            },
            secondaryButton: {
                text: 'Annuler',
                action: () => this.hideModal()
            }
        });

        // Ajouter les gestionnaires d'événements pour les actions spéciales
        this.setupEditModalEventListeners(user);
    }

    setupEditModalEventListeners(user) {
        // Bouton reset mot de passe
        document.getElementById('sendPasswordResetBtn')?.addEventListener('click', () => {
            this.sendPasswordReset(user);
        });

        // Bouton générer mot de passe temporaire
        document.getElementById('generateTempPasswordBtn')?.addEventListener('click', () => {
            this.generateTempPassword(user);
        });

        // Bouton supprimer utilisateur (seulement si pas soi-même)
        if (user.id !== this.currentUser.id) {
            document.getElementById('deleteUserBtn')?.addEventListener('click', () => {
                this.confirmDeleteUser(user);
            });

            document.getElementById('forceLogoutBtn')?.addEventListener('click', () => {
                this.forceUserLogout(user);
            });
        }
    }

    async editUser(userId) {
        try {
            // Récupérer les données complètes de l'utilisateur
            const user = this.users.find(u => u.id === userId);
            if (!user) {
                this.showError('Utilisateur non trouvé');
                return;
            }

            console.log('Édition utilisateur:', user);
            this.showEditUserModal(user);
        } catch (error) {
            console.error('Erreur édition utilisateur:', error);
            this.showError('Erreur lors de l\'ouverture de l\'édition');
        }
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

    // === ACTIONS SPÉCIALES SUR LES UTILISATEURS ===

    async sendPasswordReset(user) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: window.location.origin + '/reset-password'
            });

            if (error) throw error;

            this.showSuccess(`Email de réinitialisation envoyé à ${user.email}`);
        } catch (error) {
            console.error('Erreur reset password:', error);
            this.showError('Erreur lors de l\'envoi du reset mot de passe');
        }
    }

    async generateTempPassword(user) {
        // Générer un mot de passe temporaire sécurisé
        const tempPassword = this.generateSecurePassword();
        
        try {
            // Note: Supabase ne permet pas de changer directement le mot de passe d'un utilisateur
            // Cette fonctionnalité nécessiterait une fonction serveur ou une API admin
            this.showMessage(`Mot de passe temporaire généré: ${tempPassword}`, 'info');
            this.showMessage('⚠️ Fonctionnalité complète nécessite une API serveur', 'warning');
            
            // TODO: Implémenter via fonction serveur
            // await this.supabase.rpc('admin_update_user_password', { 
            //     user_id: user.id, 
            //     new_password: tempPassword 
            // });
            
        } catch (error) {
            console.error('Erreur génération mot de passe:', error);
            this.showError('Erreur lors de la génération du mot de passe temporaire');
        }
    }

    generateSecurePassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    async forceUserLogout(user) {
        try {
            // Note: Supabase ne fournit pas directement de méthode pour forcer la déconnexion d'un utilisateur
            // Cette fonctionnalité nécessiterait une approche via la base de données ou une API admin
            
            this.showMessage(`Déconnexion forcée pour ${user.email}`, 'info');
            this.showMessage('⚠️ Fonctionnalité complète nécessite une API serveur', 'warning');
            
            // TODO: Implémenter via fonction serveur pour invalider les sessions
            // await this.supabase.rpc('admin_force_user_logout', { user_id: user.id });
            
        } catch (error) {
            console.error('Erreur déconnexion forcée:', error);
            this.showError('Erreur lors de la déconnexion forcée');
        }
    }

    confirmDeleteUser(user) {
        const confirmModal = this.createModal(
            'confirmDelete',
            '⚠️ Confirmation de suppression',
            `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🗑️</div>
                    <h3 style="color: #ef4444; margin-bottom: 15px;">Supprimer définitivement cet utilisateur ?</h3>
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 15px 0;">
                        <strong>Utilisateur:</strong> ${user.full_name || 'Sans nom'}<br>
                        <strong>Email:</strong> ${user.email}<br>
                        <strong>Rôle:</strong> ${user.roles?.display_name || 'Aucun rôle'}
                    </div>
                    <p style="color: #ef4444; font-weight: 600; margin: 20px 0;">
                        ⚠️ Cette action est IRRÉVERSIBLE !
                    </p>
                    <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
                        Toutes les données de l'utilisateur seront définitivement supprimées.
                    </p>
                    <div style="margin: 20px 0;">
                        <input type="text" id="confirmDeleteInput" placeholder="Tapez 'SUPPRIMER' pour confirmer" 
                               style="width: 100%; padding: 10px; border: 2px solid #ef4444; border-radius: 6px; text-align: center; font-weight: 600;">
                    </div>
                </div>
            `,
            {
                primaryButton: {
                    text: '🗑️ Supprimer définitivement',
                    action: () => this.executeDeleteUser(user)
                },
                secondaryButton: {
                    text: 'Annuler',
                    action: () => this.hideModal()
                }
            }
        );

        // Focus sur l'input de confirmation
        setTimeout(() => {
            document.getElementById('confirmDeleteInput')?.focus();
        }, 100);
    }

    async executeDeleteUser(user) {
        const confirmInput = document.getElementById('confirmDeleteInput');
        if (!confirmInput || confirmInput.value !== 'SUPPRIMER') {
            this.showError('Veuillez taper "SUPPRIMER" pour confirmer');
            return;
        }

        try {
            // Désactiver le bouton
            const btn = document.getElementById('modal-primary-btn');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Suppression en cours...';
            }

            // Supprimer le profil (cela déclenchera la suppression en cascade si configurée)
            const { error } = await this.supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);

            if (error) throw error;

            // Actualiser les données
            await this.refreshData();

            // Fermer modal et afficher succès
            this.hideModal();
            this.showSuccess(`Utilisateur ${user.email} supprimé définitivement`);

        } catch (error) {
            console.error('Erreur suppression utilisateur:', error);
            this.showError(`Erreur lors de la suppression : ${error.message}`);

            // Réactiver le bouton
            const btn = document.getElementById('modal-primary-btn');
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🗑️ Supprimer définitivement';
            }
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