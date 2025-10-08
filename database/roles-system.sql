-- Module Administration & Rôles - Singularity
-- À ajouter après le schéma de base

-- ============================================================================
-- SYSTÈME DE RÔLES ET PERMISSIONS
-- ============================================================================

-- Table des rôles
CREATE TABLE public.roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0, -- Niveau hiérarchique (0 = guest, 100 = super_admin)
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT '👤',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des permissions
CREATE TABLE public.permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    module TEXT NOT NULL, -- 'admin', 'finances', 'tasks', etc.
    action TEXT NOT NULL, -- 'read', 'write', 'delete', 'manage'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison rôles-permissions
CREATE TABLE public.role_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Ajout du rôle dans la table profiles (après migration-profiles.sql)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role_id UUID,
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Ajouter la contrainte de clé étrangère si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_role_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_role_id_fkey 
        FOREIGN KEY (role_id) REFERENCES public.roles(id);
    END IF;
END $$;

-- ============================================================================
-- DONNÉES INITIALES DES RÔLES
-- ============================================================================

-- Insertion des rôles par défaut
INSERT INTO public.roles (name, display_name, description, level, color, icon) VALUES
('super_admin', 'Super Administrateur', 'Accès complet à tout le système', 100, '#dc2626', '👑'),
('admin', 'Administrateur', 'Gestion des utilisateurs et modules', 80, '#ea580c', '🛠️'),
('manager', 'Manager', 'Accès étendu aux modules, analytics', 60, '#3b82f6', '👨‍💼'),
('user', 'Utilisateur', 'Accès standard aux modules personnels', 40, '#10b981', '👤'),
('guest', 'Invité', 'Accès limité en lecture seule', 20, '#6b7280', '👁️');

-- ============================================================================
-- PERMISSIONS PAR MODULE
-- ============================================================================

-- Permissions Administration
INSERT INTO public.permissions (name, display_name, description, module, action) VALUES
('admin.users.read', 'Voir les utilisateurs', 'Consulter la liste des utilisateurs', 'admin', 'read'),
('admin.users.write', 'Gérer les utilisateurs', 'Créer/modifier les utilisateurs', 'admin', 'write'),
('admin.users.delete', 'Supprimer les utilisateurs', 'Supprimer des comptes utilisateurs', 'admin', 'delete'),
('admin.roles.manage', 'Gérer les rôles', 'Créer/modifier/supprimer des rôles', 'admin', 'manage'),
('admin.system.config', 'Configuration système', 'Accès aux paramètres système', 'admin', 'manage');

-- Permissions Finances
INSERT INTO public.permissions (name, display_name, description, module, action) VALUES
('finances.own.read', 'Voir ses finances', 'Consulter ses propres données financières', 'finances', 'read'),
('finances.own.write', 'Gérer ses finances', 'Créer/modifier ses données financières', 'finances', 'write'),
('finances.all.read', 'Voir toutes les finances', 'Consulter les finances de tous les utilisateurs', 'finances', 'read'),
('finances.reports', 'Rapports financiers', 'Accès aux rapports et analytics financiers', 'finances', 'read');

-- Permissions Tâches
INSERT INTO public.permissions (name, display_name, description, module, action) VALUES
('tasks.own.read', 'Voir ses tâches', 'Consulter ses propres tâches', 'tasks', 'read'),
('tasks.own.write', 'Gérer ses tâches', 'Créer/modifier ses tâches', 'tasks', 'write'),
('tasks.team.read', 'Voir tâches équipe', 'Consulter les tâches partagées', 'tasks', 'read'),
('tasks.team.write', 'Gérer tâches équipe', 'Gérer les tâches partagées', 'tasks', 'write');

-- Permissions Analytics
INSERT INTO public.permissions (name, display_name, description, module, action) VALUES
('analytics.own.read', 'Ses statistiques', 'Voir ses propres statistiques', 'analytics', 'read'),
('analytics.global.read', 'Statistiques globales', 'Voir les statistiques de tous les utilisateurs', 'analytics', 'read');

-- ============================================================================
-- ATTRIBUTION DES PERMISSIONS AUX RÔLES
-- ============================================================================

-- Super Admin : Toutes les permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.name = 'super_admin';

-- Admin : Gestion utilisateurs + accès complet modules
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.name = 'admin' 
AND (p.module IN ('admin', 'finances', 'tasks', 'analytics') OR p.action != 'delete');

-- Manager : Accès étendu sans gestion utilisateurs
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.name = 'manager' 
AND p.module != 'admin' 
AND p.name NOT LIKE '%.all.%';

-- User : Accès personnel uniquement
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.name = 'user' 
AND p.name LIKE '%.own.%';

-- Guest : Lecture seule de ses propres données
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.name = 'guest' 
AND p.name LIKE '%.own.read';

-- ============================================================================
-- RLS ET SÉCURITÉ
-- ============================================================================

-- Activation RLS sur les nouvelles tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Politiques pour roles (visible par tous, modifiable par admins seulement)
CREATE POLICY "Roles are visible to all authenticated users" ON public.roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage roles" ON public.roles
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND (r.level >= 80 OR p.is_super_admin = true)
        )
    );

-- Politiques similaires pour permissions et role_permissions
CREATE POLICY "Permissions are visible to all authenticated users" ON public.permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Role permissions are visible to all authenticated users" ON public.role_permissions
    FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour vérifier si un utilisateur a une permission
CREATE OR REPLACE FUNCTION public.user_has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles p
        LEFT JOIN public.roles r ON p.role_id = r.id
        LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
        LEFT JOIN public.permissions perm ON rp.permission_id = perm.id
        WHERE p.id = user_id 
        AND (perm.name = permission_name OR p.is_super_admin = true)
        AND p.status = 'active'
        AND r.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le niveau d'un utilisateur
CREATE OR REPLACE FUNCTION public.user_level(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_level INTEGER;
BEGIN
    SELECT COALESCE(r.level, 0) INTO user_level
    FROM public.profiles p
    LEFT JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = user_id;
    
    RETURN COALESCE(user_level, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour updated_at sur roles
CREATE TRIGGER roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- CRÉATION DU PREMIER SUPER ADMIN
-- ============================================================================

-- ⚠️ IMPORTANT: Après avoir créé votre premier compte utilisateur,
-- exécutez cette requête en remplaçant 'votre@email.com' :

/*
UPDATE public.profiles 
SET 
    role_id = (SELECT id FROM public.roles WHERE name = 'super_admin'),
    is_super_admin = true 
WHERE email = 'votre@email.com';
*/