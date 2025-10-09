# Configuration du Module des Tâches

## 📋 Étapes d'installation

### 1. Prérequis
- Projet Supabase configuré et fonctionnel
- Tables utilisateurs existantes (auth.users + profiles)

### 2. Configuration de la base de données

#### Option A : Via l'éditeur SQL de Supabase (Recommandé)
1. Allez dans votre projet Supabase
2. Naviguez vers "SQL Editor"
3. Copiez le contenu du fichier `database/create-tasks-structure.sql`
4. Collez et exécutez le script dans l'éditeur SQL
5. Vérifiez que les tables `task_themes` et `tasks` ont été créées

#### Option B : Via le script Node.js
1. Modifiez `setup-tasks-database.js` avec vos vraies clés :
   ```javascript
   const supabaseUrl = 'https://VOTRE-PROJECT.supabase.co';
   const serviceRoleKey = 'VOTRE_SERVICE_ROLE_KEY_REELLE';
   ```
2. Exécutez le script :
   ```bash
   node setup-tasks-database.js
   ```

### 3. Configuration des Row Level Security (RLS)

Le script crée automatiquement les politiques RLS pour :
- ✅ Isolation des données par utilisateur
- ✅ Lecture/écriture sécurisée des tâches
- ✅ Gestion des thèmes personnalisés

### 4. Fonctionnalités incluses

#### 🎨 Gestion des Thèmes
- Création de thèmes personnalisés (nom, couleur, icône)
- Thèmes par défaut automatiques
- Modification et suppression
- Association aux tâches

#### 📝 Gestion des Tâches
- CRUD complet (Create, Read, Update, Delete)
- Statuts : À faire, En cours, Terminé
- Priorités : Basse, Normale, Haute, Urgente
- Dates d'échéance
- Association à un thème
- Description optionnelle

#### 🔍 Recherche et Filtres
- Recherche textuelle dans le titre et description
- Filtres par statut, priorité, thème
- Tri par date de création

#### 👥 Interface Utilisateur
- Vue Todo List : Liste simple et efficace
- Vue Planning : Calendrier (en développement)
- Modals pour création/édition
- Interface responsive
- Toast notifications

### 5. Structure des fichiers

```
js/
  ├── tasks.js      # Module principal des tâches
  ├── modals.js     # Gestion des modals
  └── config.js     # Configuration Supabase

database/
  └── create-tasks-structure.sql  # Structure de la base

tasks.html          # Page principale des tâches
```

### 6. Utilisation

1. Connectez-vous à l'application
2. Cliquez sur "📝 Tâches" dans le dashboard
3. Créez vos premiers thèmes avec "🎨 Gérer les Thèmes"
4. Ajoutez des tâches avec "➕ Nouvelle Tâche"
5. Utilisez les filtres pour organiser vos tâches

### 7. Dépendances

- Supabase JavaScript Client
- Modules auth.js et main.js existants
- CSS responsive intégré

### 8. Sécurité

- 🔒 Row Level Security activé
- 🔐 Isolation complète entre utilisateurs  
- 🛡️ Validation côté serveur via RLS
- ⚡ Pas d'accès direct aux données d'autres utilisateurs

## 🚀 Prêt à utiliser !

Une fois la base de données configurée, le module est entièrement fonctionnel et sécurisé.