-- Script de nettoyage complet pour repartir de zéro
-- ⚠️ ATTENTION : Supprime TOUTES les données personnalisées mais garde l'authentification Supabase

-- ============================================================================
-- SUPPRESSION COMPLÈTE DES TABLES PERSONNALISÉES
-- ============================================================================

-- Supprimer toutes les tables en cascade (ordre important pour éviter les erreurs de clés étrangères)
DROP TABLE IF EXISTS public.habit_logs CASCADE;
DROP TABLE IF EXISTS public.habits CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.task_projects CASCADE;
DROP TABLE IF EXISTS public.finance_transactions CASCADE;
DROP TABLE IF EXISTS public.finance_accounts CASCADE;
DROP TABLE IF EXISTS public.finance_categories CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Supprimer la table profiles (sera recréée)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- SUPPRESSION DES FONCTIONS PERSONNALISÉES
-- ============================================================================

DROP FUNCTION IF EXISTS public.user_has_permission(UUID, TEXT);
DROP FUNCTION IF EXISTS public.user_level(UUID);
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- ============================================================================
-- SUPPRESSION DES TRIGGERS
-- ============================================================================

-- Les triggers sont automatiquement supprimés avec les tables

-- ============================================================================
-- SUPPRESSION DES INDEX PERSONNALISÉS
-- ============================================================================

DROP INDEX IF EXISTS idx_finance_transactions_user_date;
DROP INDEX IF EXISTS idx_tasks_user_status;
DROP INDEX IF EXISTS idx_habit_logs_habit_date;
DROP INDEX IF EXISTS idx_goals_user_status;

-- ============================================================================
-- VÉRIFICATION DE CE QUI RESTE
-- ============================================================================

-- Voir les tables restantes (devrait montrer uniquement les tables auth.* et system)
SELECT table_schema, table_name, table_type
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth', 'storage')
AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================

-- Après ce script, vous aurez :
-- ✅ Authentification Supabase intacte (auth.users, auth.sessions, etc.)
-- ✅ Toutes les fonctionnalités de login/logout fonctionnelles  
-- ✅ Base propre prête pour schema.sql
-- ✅ Extension uuid-ossp conservée

-- Vous pouvez maintenant exécuter schema.sql sans erreurs !