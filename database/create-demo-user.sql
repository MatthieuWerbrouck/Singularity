-- Script pour créer un utilisateur de démonstration
-- ⚠️ À exécuter uniquement en développement/test

-- ÉTAPE 1: Créer l'utilisateur dans Supabase Auth
-- Aller dans le dashboard Supabase > Authentication > Users > "Add user"
-- Email: demo@singularity.app
-- Mot de passe: demo123456
-- Confirmer l'email automatiquement

-- ÉTAPE 2: Récupérer l'UUID de l'utilisateur créé
-- SELECT id, email FROM auth.users WHERE email = 'demo@singularity.app';

-- ÉTAPE 3: Insérer le profil correspondant
-- Remplacez 'USER_UUID_FROM_AUTH_USERS' par l'UUID réel obtenu à l'étape 2

INSERT INTO profiles (
    id,
    email,
    role_id,
    display_name,
    status,
    created_at,
    updated_at
) VALUES (
    'USER_UUID_FROM_AUTH_USERS'::uuid,  -- Remplacer par l'UUID réel de auth.users
    'demo@singularity.app',
    (SELECT id FROM roles WHERE name = 'admin' LIMIT 1),
    'Utilisateur Démo',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    display_name = EXCLUDED.display_name,
    status = EXCLUDED.status,
    updated_at = NOW();

-- ÉTAPE 4: Vérifier que tout fonctionne
SELECT 
    p.id,
    p.email,
    p.display_name,
    r.name as role_name,
    p.status
FROM profiles p
JOIN roles r ON p.role_id = r.id
WHERE p.email = 'demo@singularity.app';

-- ALTERNATIVE: Si vous avez accès à la fonction create_user
-- (uniquement si vous avez configuré une fonction côté serveur)
/*
SELECT extensions.create_user(
    'demo@singularity.app',
    'demo123456',
    json_build_object(
        'display_name', 'Utilisateur Démo',
        'role', 'admin'
    )
);
*/