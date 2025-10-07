# Configuration Base de Données Supabase - Singularity

## 📋 Étapes d'Installation

### 1. Accès au SQL Editor Supabase

1. **Connectez-vous à** : https://supabase.com/dashboard
2. **Sélectionnez votre projet** `Singularity`
3. **Allez dans** SQL Editor (icône </> dans le menu)

### 2. Installation du Schéma

1. **Ouvrez** le fichier `database/schema.sql`
2. **Copiez tout le contenu**
3. **Collez dans le SQL Editor** de Supabase
4. **Cliquez "Run"** pour exécuter

✅ **Résultat attendu :** Création de toutes les tables et politiques de sécurité

### 3. Vérification des Tables

Dans l'onglet **Table Editor**, vous devriez voir :

**Tables principales :**
- `profiles` - Profils utilisateur
- `finance_categories` - Catégories de transactions
- `finance_accounts` - Comptes bancaires
- `finance_transactions` - Transactions
- `task_projects` - Projets de tâches  
- `tasks` - Tâches individuelles
- `goals` - Objectifs personnels
- `habits` - Habitudes à suivre
- `habit_logs` - Logs des habitudes

### 4. Configuration de l'Authentification

Dans **Authentication → Settings** :

1. **Site URL** : `https://votre-app.vercel.app`
2. **Redirect URLs** : 
   - `https://votre-app.vercel.app`
   - `http://localhost:3000` (pour dev local)
3. **Email Templates** : Personnalisez si souhaité

### 5. Test de Connexion

1. **Retournez dans votre application**
2. **Testez l'inscription** avec un vrai email
3. **Vérifiez dans** Authentication → Users qu'un utilisateur est créé

### 6. Données de Test (Optionnel)

Après votre première inscription :

1. **Récupérez votre user_id** depuis Authentication → Users
2. **Modifiez** `database/seed-data.sql` en remplaçant `USER_ID_HERE`
3. **Exécutez le script** dans SQL Editor

## 🔧 Commandes SQL Utiles

### Vérifier les tables créées
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Voir les politiques RLS
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Compter les enregistrements
```sql
SELECT 
    'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL SELECT 
    'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 
    'finance_transactions', COUNT(*) FROM finance_transactions;
```

## 🛡️ Sécurité Configurée

- ✅ **RLS activé** sur toutes les tables
- ✅ **Politiques utilisateur** : chaque user ne voit que ses données
- ✅ **Contraintes** sur les types de données
- ✅ **Index** pour les performances

## 🔍 Dépannage

### Erreur "relation does not exist"
- Vérifiez que le schéma a été exécuté complètement
- Rechargez la page du dashboard

### Erreur de permissions
- Vérifiez que RLS est activé
- Contrôlez les politiques avec la requête ci-dessus

### Tables vides après insertion
- Vérifiez que vous utilisez le bon `user_id`
- Testez avec `auth.uid()` dans une requête

---

📝 **Note :** Une fois cette configuration terminée, votre application aura une base de données complète et sécurisée prête pour le développement.