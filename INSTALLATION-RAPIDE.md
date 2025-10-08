# 📋 Installation Rapide - Singularity

## ⚡ Configuration en 3 étapes

### Étape 1: Copier-coller dans SQL Editor

1. **Ouvrir** [Supabase Dashboard](https://supabase.com/dashboard) 
2. **Aller dans** SQL Editor 
3. **Copier tout le contenu ci-dessous** et coller dans l'éditeur :

```sql
-- 🚀 INSTALLATION COMPLÈTE SINGULARITY - COPIER TOUT CE BLOC

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table profiles de base
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'Europe/Paris',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajout colonnes pour système de rôles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS role_id UUID,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));

-- Mise à jour display_name
UPDATE public.profiles 
SET display_name = COALESCE(full_name, split_part(email, '@', 1))
WHERE display_name IS NULL;

-- Rendre display_name obligatoire
ALTER TABLE public.profiles 
ALTER COLUMN display_name SET NOT NULL;

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

-- Liaison rôles-permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Contrainte clé étrangère profiles -> roles
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

-- Données: Rôles
INSERT INTO public.roles (name, display_name, description, level, color, icon) VALUES
('super_admin', 'Super Administrateur', 'Accès complet système', 100, '#dc2626', '👑'),
('admin', 'Administrateur', 'Gestion utilisateurs et modules', 80, '#ea580c', '🛠️'),
('moderator', 'Modérateur', 'Modération et assistance', 60, '#d97706', '🛡️'),
('user', 'Utilisateur', 'Accès standard', 40, '#059669', '👤'),
('guest', 'Invité', 'Accès limité lecture', 20, '#6b7280', '👥')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    level = EXCLUDED.level,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon;

-- Données: Permissions
INSERT INTO public.permissions (name, display_name, description, module, action) VALUES
('admin.users.read', 'Voir utilisateurs', 'Consulter la liste des utilisateurs', 'admin', 'read'),
('admin.users.write', 'Modifier utilisateurs', 'Modifier les profils utilisateurs', 'admin', 'write'),
('admin.users.delete', 'Supprimer utilisateurs', 'Supprimer des comptes utilisateurs', 'admin', 'delete'),
('admin.roles.manage', 'Gérer rôles', 'Gérer les rôles et permissions', 'admin', 'manage'),
('finances.own.read', 'Ses finances', 'Voir ses données financières', 'finances', 'read'),
('finances.own.write', 'Modifier finances', 'Modifier ses données financières', 'finances', 'write'),
('tasks.own.read', 'Ses tâches', 'Voir ses tâches', 'tasks', 'read'),
('tasks.own.write', 'Modifier tâches', 'Créer/modifier ses tâches', 'tasks', 'write')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description;

-- Attribution permissions aux rôles
WITH role_perms AS (
  SELECT 
    r.id as role_id,
    p.id as permission_id
  FROM roles r
  CROSS JOIN permissions p
  WHERE 
    (r.name = 'super_admin') OR
    (r.name = 'admin' AND p.name LIKE 'admin.%' AND p.name != 'admin.system.manage') OR
    (r.name = 'admin' AND p.name LIKE '%.own.%') OR
    (r.name = 'user' AND p.name LIKE '%.own.%') OR
    (r.name = 'guest' AND p.name LIKE '%.own.read')
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id FROM role_perms
ON CONFLICT DO NOTHING;

-- RLS: Activation
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS: Politiques profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

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

-- RLS: Politiques pour lecture des rôles/permissions
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Authenticated users can view role_permissions" ON public.role_permissions;

CREATE POLICY "Authenticated users can view roles" ON public.roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view permissions" ON public.permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view role_permissions" ON public.role_permissions
    FOR SELECT TO authenticated USING (true);

-- Fonction updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS roles_updated_at ON public.roles;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Fonction pour nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
BEGIN
    SELECT id INTO default_role_id 
    FROM public.roles 
    WHERE name = 'user' 
    LIMIT 1;
    
    IF default_role_id IS NULL THEN
        SELECT id INTO default_role_id 
        FROM public.roles 
        WHERE name = 'guest' 
        LIMIT 1;
    END IF;
    
    INSERT INTO public.profiles (
        id, 
        email, 
        display_name, 
        role_id,
        status
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        default_role_id,
        'active'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger nouveaux utilisateurs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index performance
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Vérification finale
SELECT 'Installation terminée!' as status, 
       (SELECT count(*) FROM roles) as roles_count,
       (SELECT count(*) FROM permissions) as permissions_count;
```

4. **Cliquer sur** "RUN" pour exécuter tout le script

### Étape 2: Créer l'utilisateur de démonstration

1. **Aller dans** Authentication > Users
2. **Cliquer sur** "Add user"
3. **Remplir :**
   - Email: `demo@singularity.app`
   - Mot de passe: `demo123456`
   - ✅ Cocher "Auto Confirm User"
4. **Cliquer sur** "Create user"

### Étape 3: Tester l'application

1. **Aller sur** https://matthieu-singularity.vercel.app
2. **Se connecter avec :**
   - Email: `demo@singularity.app`
   - Mot de passe: `demo123456`

## ✅ C'est terminé !

Votre application est maintenant fonctionnelle avec :
- ✅ Système de rôles complet
- ✅ Interface d'administration
- ✅ Utilisateur de démonstration
- ✅ Sécurité RLS configurée

## 🆘 En cas de problème

- Consultez le fichier `TROUBLESHOOTING.md`
- Vérifiez les logs dans la console de votre navigateur
- Assurez-vous que toutes les étapes ont été suivies