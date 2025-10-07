-- Schema de base de données Singularity
-- Gestion de vie personnelle avec modules Finance, Tâches, et Objectifs

-- ============================================================================
-- TABLES UTILISATEURS ET PROFILS
-- ============================================================================

-- Extension pour UUID (si pas déjà activée)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateur (complète auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'Europe/Paris',
    currency TEXT DEFAULT 'EUR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MODULE FINANCES
-- ============================================================================

-- Catégories de transactions
CREATE TABLE public.finance_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT '💰',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comptes bancaires/portefeuilles
CREATE TABLE public.finance_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'cash', 'investment')),
    balance DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions financières
CREATE TABLE public.finance_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES public.finance_accounts(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MODULE TÂCHES
-- ============================================================================

-- Projets
CREATE TABLE public.task_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tâches
CREATE TABLE public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.task_projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MODULE OBJECTIFS
-- ============================================================================

-- Objectifs principaux
CREATE TABLE public.goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'personal' CHECK (category IN ('personal', 'professional', 'health', 'financial', 'learning')),
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2) DEFAULT 0,
    unit TEXT, -- 'kg', '€', 'hours', 'pages', etc.
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habitudes quotidiennes
CREATE TABLE public.habits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    target_count INTEGER DEFAULT 1,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT '✅',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suivi des habitudes
CREATE TABLE public.habit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(habit_id, date)
);

-- ============================================================================
-- POLITIQUES DE SÉCURITÉ (RLS - Row Level Security)
-- ============================================================================

-- Activation RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Politiques pour finance_categories
CREATE POLICY "Users can manage own finance categories" ON public.finance_categories
    FOR ALL USING (auth.uid() = user_id);

-- Politiques pour finance_accounts
CREATE POLICY "Users can manage own finance accounts" ON public.finance_accounts
    FOR ALL USING (auth.uid() = user_id);

-- Politiques pour finance_transactions
CREATE POLICY "Users can manage own finance transactions" ON public.finance_transactions
    FOR ALL USING (auth.uid() = user_id);

-- Politiques pour task_projects
CREATE POLICY "Users can manage own task projects" ON public.task_projects
    FOR ALL USING (auth.uid() = user_id);

-- Politiques pour tasks
CREATE POLICY "Users can manage own tasks" ON public.tasks
    FOR ALL USING (auth.uid() = user_id);

-- Politiques pour goals
CREATE POLICY "Users can manage own goals" ON public.goals
    FOR ALL USING (auth.uid() = user_id);

-- Politiques pour habits
CREATE POLICY "Users can manage own habits" ON public.habits
    FOR ALL USING (auth.uid() = user_id);

-- Politiques pour habit_logs
CREATE POLICY "Users can manage own habit logs" ON public.habit_logs
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- FONCTIONS ET TRIGGERS
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
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER finance_accounts_updated_at
    BEFORE UPDATE ON public.finance_accounts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER finance_transactions_updated_at
    BEFORE UPDATE ON public.finance_transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER task_projects_updated_at
    BEFORE UPDATE ON public.task_projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- INDEX POUR PERFORMANCES
-- ============================================================================

-- Index pour les requêtes fréquentes
CREATE INDEX idx_finance_transactions_user_date ON public.finance_transactions(user_id, date DESC);
CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX idx_habit_logs_habit_date ON public.habit_logs(habit_id, date DESC);
CREATE INDEX idx_goals_user_status ON public.goals(user_id, status);