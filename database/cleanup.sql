-- Script de nettoyage de la base de données Singularity
-- ⚠️ ATTENTION : Supprime toutes les données métier mais GARDE l'authentification

-- ============================================================================
-- SUPPRESSION DES MODULES (ORDRE IMPORTANT POUR LES CLÉS ÉTRANGÈRES)
-- ============================================================================

-- Module Habitudes
DROP TABLE IF EXISTS public.habit_logs CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;

-- Module Objectifs  
DROP TABLE IF EXISTS public.goals CASCADE;

-- Module Tâches
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.task_projects CASCADE;

-- Module Finances
DROP TABLE IF EXISTS public.finance_transactions CASCADE;
DROP TABLE IF EXISTS public.finance_accounts CASCADE;
DROP TABLE IF EXISTS public.finance_categories CASCADE;

-- ============================================================================
-- SUPPRESSION DES INDEX SPÉCIFIQUES AUX MODULES
-- ============================================================================

DROP INDEX IF EXISTS idx_finance_transactions_user_date;
DROP INDEX IF EXISTS idx_tasks_user_status;
DROP INDEX IF EXISTS idx_habit_logs_habit_date;
DROP INDEX IF EXISTS idx_goals_user_status;

-- ============================================================================
-- NETTOYAGE DES POLITIQUES RLS DES MODULES
-- ============================================================================

-- Les politiques sont automatiquement supprimées avec les tables

-- ============================================================================
-- VÉRIFICATION DE CE QUI RESTE
-- ============================================================================

-- Vérifier les tables restantes (devrait afficher seulement profiles et auth.*)
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth') 
AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;

-- ============================================================================
-- IMPORTANT : CE QUI EST PRÉSERVÉ
-- ============================================================================

-- ✅ auth.users (comptes utilisateurs Supabase)
-- ✅ public.profiles (profils personnalisés)
-- ✅ Extension uuid-ossp
-- ✅ Fonction handle_updated_at()
-- ✅ Toutes les tables système de Supabase

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================

-- Après exécution, vous aurez une base propre avec :
-- - Authentification fonctionnelle
-- - Table profiles prête
-- - Aucun module métier
-- - Prêt pour développement modulaire