# 🚨 Résolution Rapide - Erreur de Connexion

## Problème
`AuthApiError: Invalid login credentials` - L'utilisateur de démonstration n'existe pas.

## 🔧 Solution Express (5 minutes)

### Étape 1: Créer l'utilisateur dans Supabase

1. **Aller sur** [Supabase Dashboard](https://supabase.com/dashboard)
2. **Sélectionner votre projet** 
3. **Authentication > Users > "Add user"**
4. **Remplir :**
   - Email: `demo@singularity.app`
   - Password: `demo123456` 
   - ✅ **Cocher "Auto Confirm User"**
5. **Create user**

### Étape 2: Configuration base de données

Copier-coller ce script dans **SQL Editor** de Supabase :

```sql
-- Configuration rapide Singularity
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    display_name TEXT,
    role_id UUID,
    status TEXT DEFAULT 'active',
    avatar_url TEXT,
    timezone TEXT DEFAULT 'Europe/Paris',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Système de rôles minimal
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    level INTEGER DEFAULT 0
);

-- Créer les rôles de base
INSERT INTO public.roles (name, display_name, level) VALUES
('admin', 'Administrateur', 80),
('user', 'Utilisateur', 40)
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Politiques de base
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated can view roles" ON public.roles;
CREATE POLICY "Authenticated can view roles" ON public.roles
    FOR SELECT TO authenticated USING (true);
```

### Étape 3: Lier le profil utilisateur

1. **Copier l'UUID** de l'utilisateur créé (dans Authentication > Users)
2. **Exécuter** (remplacer `UUID_UTILISATEUR_ICI`) :

```sql
INSERT INTO public.profiles (
    id,
    email,
    display_name,
    role_id,
    status
) VALUES (
    'UUID_UTILISATEUR_ICI'::uuid,
    'demo@singularity.app',
    'Utilisateur Démo',
    (SELECT id FROM roles WHERE name = 'admin' LIMIT 1),
    'active'
);
```

## ✅ Test

Retourner sur https://matthieu-singularity.vercel.app et se connecter avec :
- **Email:** `demo@singularity.app`
- **Mot de passe:** `demo123456`

---

### 🔍 Vérification en cas de problème

```sql
-- Vérifier l'utilisateur existe
SELECT id, email FROM auth.users WHERE email = 'demo@singularity.app';

-- Vérifier le profil
SELECT * FROM profiles WHERE email = 'demo@singularity.app';

-- Vérifier les rôles
SELECT * FROM roles;
```