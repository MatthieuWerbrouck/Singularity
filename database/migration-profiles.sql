-- Migration: Ajout des colonnes manquantes à la table profiles
-- À exécuter AVANT le script roles-system.sql

-- ============================================================================
-- MIGRATION DE LA TABLE PROFILES
-- ============================================================================

-- Ajouter la colonne display_name si elle n'existe pas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Ajouter la colonne role_id si elle n'existe pas  
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role_id UUID;

-- Ajouter la colonne status si elle n'existe pas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending'));

-- Mettre à jour display_name avec full_name pour les enregistrements existants
UPDATE public.profiles 
SET display_name = COALESCE(full_name, split_part(email, '@', 1))
WHERE display_name IS NULL;

-- Définir display_name comme NOT NULL après avoir rempli les valeurs
ALTER TABLE public.profiles 
ALTER COLUMN display_name SET NOT NULL;

-- ============================================================================
-- FONCTION DE MISE À JOUR AUTOMATIQUE DES PROFILS
-- ============================================================================

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

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger pour les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- INDEX POUR LES PERFORMANCES
-- ============================================================================

-- Index sur role_id pour les jointures
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);

-- Index sur status pour les filtres
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Index sur email pour les recherches
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs étendus avec système de rôles';
COMMENT ON COLUMN public.profiles.display_name IS 'Nom d''affichage de l''utilisateur';
COMMENT ON COLUMN public.profiles.role_id IS 'Référence vers le rôle de l''utilisateur';
COMMENT ON COLUMN public.profiles.status IS 'Statut du compte utilisateur';