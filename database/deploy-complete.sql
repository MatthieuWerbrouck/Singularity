-- Script de déploiement complet pour Singularity
-- À exécuter dans l'ordre dans le SQL Editor de Supabase

-- ============================================================================
-- ÉTAPE 1: SCHÉMA DE BASE
-- ============================================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateur (complète auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'Europe/Paris',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÉTAPE 2: MIGRATION PROFILES
-- ============================================================================

-- Ajouter les colonnes nécessaires au système de rôles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS role_id UUID,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));

-- Mettre à jour display_name avec full_name pour les enregistrements existants
UPDATE public.profiles 
SET display_name = COALESCE(full_name, split_part(email, '@', 1))
WHERE display_name IS NULL;

-- Définir display_name comme NOT NULL après avoir rempli les valeurs
ALTER TABLE public.profiles 
ALTER COLUMN display_name SET NOT NULL;

-- ============================================================================
-- ÉTAPE 3: SYSTÈME DE RÔLES
-- ============================================================================

-- Table des rôles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT '👤',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de liaison rôles-permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Ajouter la contrainte de clé étrangère pour role_id
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
-- ÉTAPE 4: DONNÉES INITIALES
-- ============================================================================

-- Insérer les rôles (avec ON CONFLICT pour éviter les doublons)
INSERT INTO public.roles (name, display_name, description, level, color, icon) VALUES
('super_admin', 'Super Administrateur', 'Accès complet à tout le système', 100, '#dc2626', '👑'),
('admin', 'Administrateur', 'Gestion des utilisateurs et modules', 80, '#ea580c', '🛠️'),
('moderator', 'Modérateur', 'Modération de contenu et assistance utilisateurs', 60, '#d97706', '🛡️'),
('user', 'Utilisateur', 'Accès standard aux fonctionnalités', 40, '#059669', '👤'),
('guest', 'Invité', 'Accès limité en lecture seule', 20, '#6b7280', '👥')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    level = EXCLUDED.level,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    updated_at = NOW();

-- Insérer les permissions
INSERT INTO public.permissions (name, display_name, description, module, action) VALUES
-- Admin
('admin.users.read', 'Voir utilisateurs', 'Consulter la liste des utilisateurs', 'admin', 'read'),
('admin.users.write', 'Modifier utilisateurs', 'Modifier les profils utilisateurs', 'admin', 'write'),
('admin.users.delete', 'Supprimer utilisateurs', 'Supprimer des comptes utilisateurs', 'admin', 'delete'),
('admin.roles.manage', 'Gérer rôles', 'Gérer les rôles et permissions', 'admin', 'manage'),
('admin.system.manage', 'Système', 'Configuration système avancée', 'admin', 'manage'),

-- Finances
('finances.own.read', 'Ses finances', 'Voir ses données financières', 'finances', 'read'),
('finances.own.write', 'Modifier finances', 'Modifier ses données financières', 'finances', 'write'),
('finances.all.read', 'Finances globales', 'Voir toutes les données financières', 'finances', 'read'),

-- Tâches
('tasks.own.read', 'Ses tâches', 'Voir ses tâches', 'tasks', 'read'),
('tasks.own.write', 'Modifier tâches', 'Créer/modifier ses tâches', 'tasks', 'write'),
('tasks.all.read', 'Toutes tâches', 'Voir toutes les tâches', 'tasks', 'read'),

-- Objectifs
('goals.own.read', 'Ses objectifs', 'Voir ses objectifs', 'goals', 'read'),
('goals.own.write', 'Modifier objectifs', 'Créer/modifier ses objectifs', 'goals', 'write'),

-- Analytics
('analytics.own.read', 'Ses statistiques', 'Voir ses propres statistiques', 'analytics', 'read'),
('analytics.global.read', 'Statistiques globales', 'Voir les statistiques de tous les utilisateurs', 'analytics', 'read')

ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description;

-- Attribution des permissions aux rôles
-- Super Admin : Toutes les permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Admin : Gestion utilisateurs + accès complet modules (sauf system.manage)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.name = 'admin' 
AND p.name IN (
    'admin.users.read', 'admin.users.write', 'admin.users.delete', 'admin.roles.manage',
    'finances.all.read', 'tasks.all.read', 'analytics.global.read',
    'finances.own.read', 'finances.own.write', 'tasks.own.read', 'tasks.own.write',
    'goals.own.read', 'goals.own.write', 'analytics.own.read'
)
ON CONFLICT DO NOTHING;

-- Modérateur : Lecture globale + gestion propre
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.name = 'moderator' 
AND p.name IN (
    'admin.users.read', 'finances.all.read', 'tasks.all.read',
    'finances.own.read', 'finances.own.write', 'tasks.own.read', 'tasks.own.write',
    'goals.own.read', 'goals.own.write', 'analytics.own.read'
)
ON CONFLICT DO NOTHING;

-- Utilisateur : Accès à ses propres données
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.name = 'user' 
AND p.name IN (
    'finances.own.read', 'finances.own.write', 'tasks.own.read', 'tasks.own.write',
    'goals.own.read', 'goals.own.write', 'analytics.own.read'
)
ON CONFLICT DO NOTHING;

-- Invité : Lecture seule de ses données
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM public.roles r, public.permissions p 
WHERE r.name = 'guest' 
AND p.name IN ('finances.own.read', 'tasks.own.read', 'goals.own.read', 'analytics.own.read')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ÉTAPE 5: SÉCURITÉ RLS
-- ============================================================================

-- Activation RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.name IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.name IN ('admin', 'super_admin')
        )
    );

-- Politiques pour roles (lecture pour tous les utilisateurs connectés)
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;
CREATE POLICY "Authenticated users can view roles" ON public.roles
    FOR SELECT TO authenticated USING (true);

-- Politiques pour permissions (lecture pour tous les utilisateurs connectés)
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;
CREATE POLICY "Authenticated users can view permissions" ON public.permissions
    FOR SELECT TO authenticated USING (true);

-- Politiques pour role_permissions (lecture pour tous les utilisateurs connectés)
DROP POLICY IF EXISTS "Authenticated users can view role_permissions" ON public.role_permissions;
CREATE POLICY "Authenticated users can view role_permissions" ON public.role_permissions
    FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- ÉTAPE 6: FONCTIONS ET TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS roles_updated_at ON public.roles;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    -- Récupérer l'ID du rôle 'user' par défaut
    SELECT id INTO default_role_id 
    FROM public.roles 
    WHERE name = 'user' 
    LIMIT 1;
    
    -- Si aucun rôle 'user', utiliser 'guest'
    IF default_role_id IS NULL THEN
        SELECT id INTO default_role_id 
        FROM public.roles 
        WHERE name = 'guest' 
        LIMIT 1;
    END IF;
    
    -- Insérer le profil
    INSERT INTO public.profiles (
        id, 
        email, 
        display_name, 
        role_id,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        default_role_id,
        'active',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour les nouveaux utilisateurs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ÉTAPE 7: INDEX POUR PERFORMANCES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_level ON public.roles(level);

-- ============================================================================
-- VÉRIFICATIONS FINALES
-- ============================================================================

-- Vérifier que tout est bien configuré
SELECT 'Rôles créés' as status, count(*) as count FROM public.roles;
SELECT 'Permissions créées' as status, count(*) as count FROM public.permissions;
SELECT 'Attribution rôles-permissions' as status, count(*) as count FROM public.role_permissions;

-- Afficher les rôles et leurs permissions
SELECT 
    r.name as role,
    r.display_name,
    count(rp.permission_id) as permissions_count
FROM public.roles r
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.display_name, r.level
ORDER BY r.level DESC;