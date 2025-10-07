-- Données de test pour Singularity
-- À exécuter APRÈS le schema.sql

-- ============================================================================
-- CATÉGORIES FINANCIÈRES PAR DÉFAUT
-- ============================================================================

-- Note : Ces INSERT doivent être adaptés avec le vrai user_id après inscription

-- Exemple d'insertion de catégories (à adapter avec votre user_id)
/*
INSERT INTO public.finance_categories (user_id, name, type, color, icon) VALUES
    -- Revenus
    ('USER_ID_HERE', 'Salaire', 'income', '#10b981', '💼'),
    ('USER_ID_HERE', 'Freelance', 'income', '#059669', '💻'),
    ('USER_ID_HERE', 'Investissements', 'income', '#047857', '📈'),
    
    -- Dépenses
    ('USER_ID_HERE', 'Logement', 'expense', '#ef4444', '🏠'),
    ('USER_ID_HERE', 'Alimentation', 'expense', '#f97316', '🍽️'),
    ('USER_ID_HERE', 'Transport', 'expense', '#eab308', '🚗'),
    ('USER_ID_HERE', 'Santé', 'expense', '#06b6d4', '🏥'),
    ('USER_ID_HERE', 'Loisirs', 'expense', '#8b5cf6', '🎉'),
    ('USER_ID_HERE', 'Shopping', 'expense', '#ec4899', '🛍️'),
    ('USER_ID_HERE', 'Éducation', 'expense', '#3b82f6', '📚');

-- Comptes par défaut
INSERT INTO public.finance_accounts (user_id, name, type, balance, currency) VALUES
    ('USER_ID_HERE', 'Compte Courant', 'checking', 1500.00, 'EUR'),
    ('USER_ID_HERE', 'Livret A', 'savings', 5000.00, 'EUR'),
    ('USER_ID_HERE', 'Espèces', 'cash', 150.00, 'EUR');

-- Projets par défaut
INSERT INTO public.task_projects (user_id, name, description, color) VALUES
    ('USER_ID_HERE', 'Personnel', 'Tâches personnelles et domestiques', '#6366f1'),
    ('USER_ID_HERE', 'Travail', 'Projets professionnels', '#059669'),
    ('USER_ID_HERE', 'Apprentissage', 'Formation et développement personnel', '#8b5cf6');

-- Habitudes suggérées
INSERT INTO public.habits (user_id, name, description, frequency, color, icon) VALUES
    ('USER_ID_HERE', 'Lecture', 'Lire au moins 30 minutes par jour', 'daily', '#3b82f6', '📚'),
    ('USER_ID_HERE', 'Exercice', 'Faire de l''exercice physique', 'daily', '#ef4444', '💪'),
    ('USER_ID_HERE', 'Méditation', 'Méditer 10 minutes', 'daily', '#8b5cf6', '🧘'),
    ('USER_ID_HERE', 'Planification hebdomadaire', 'Organiser la semaine suivante', 'weekly', '#059669', '📋');
*/