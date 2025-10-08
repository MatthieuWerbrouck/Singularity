# Instructions de Dépannage - Erreur de Connexion

## Problème : "Invalid login credentials"

Cette erreur indique que l'utilisateur que vous essayez de connecter n'existe pas ou que le mot de passe est incorrect.

## Solution 1: Créer l'utilisateur de démonstration

### Dans le Dashboard Supabase :

1. **Aller dans Authentication > Users**
2. **Cliquer sur "Add user"**
3. **Remplir les informations :**
   - Email: `demo@singularity.app`
   - Mot de passe: `demo123456`
   - ✅ Cocher "Auto Confirm User"
4. **Cliquer sur "Create user"**

### Configuration de la base de données :

1. **Exécuter d'abord le script complet de déploiement** :
   - Aller dans **SQL Editor** de Supabase
   - Copier tout le contenu de `database/deploy-complete.sql`
   - Exécuter le script (cela configure tous les rôles et permissions)

2. **Copier l'UUID de l'utilisateur créé** (visible dans la liste des utilisateurs)

3. **Exécuter ce script** (remplacer `USER_UUID_ICI` par l'UUID réel) :

```sql
INSERT INTO profiles (
    id,
    email,
    role_id,
    display_name,
    status,
    created_at,
    updated_at
) VALUES (
    'USER_UUID_ICI'::uuid,
    'demo@singularity.app',
    (SELECT id FROM roles WHERE name = 'admin' LIMIT 1),
    'Utilisateur Démo',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();
```

## Solution 2: Créer votre propre compte

1. **Sur la page de connexion, cliquer sur "S'inscrire"**
2. **Entrer votre email et mot de passe**
3. **Vérifier votre email** (cliquer sur le lien de confirmation)
4. **Retourner sur l'application et se connecter**

## Solution 3: Vérifier la configuration

### Vérifier que les rôles sont bien créés :

```sql
SELECT * FROM roles ORDER BY hierarchy_level;
```

### Vérifier les profils existants :

```sql
SELECT p.email, r.name as role, p.status 
FROM profiles p 
JOIN roles r ON p.role_id = r.id;
```

## Messages d'erreur améliorés

L'application affiche maintenant des messages plus clairs :

- ❌ **"Email ou mot de passe incorrect"** → L'utilisateur n'existe pas ou mot de passe erroné
- ❌ **"Email non confirmé"** → Vérifier la boîte mail et cliquer sur le lien
- ❌ **"Trop de tentatives"** → Attendre quelques minutes

## Contact

Si le problème persiste, vérifiez :
1. La configuration Supabase dans `js/config.js`
2. Que la base de données est bien configurée avec le script `database/roles-system.sql`
3. Que les politiques RLS sont actives