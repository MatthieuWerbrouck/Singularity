# Base de Données Singularity

Configuration de la base de données avec approche modulaire.

## 📁 Fichiers

- `schema.sql` : Schéma de base (authentification + profiles)
- `cleanup.sql` : Script de nettoyage sécurisé

## 🚀 Installation Initiale

### 1. Créer la base propre
```sql
-- Dans Supabase SQL Editor
-- Copiez-collez le contenu de schema.sql
```

### 2. Nettoyer une base existante  
```sql
-- Dans Supabase SQL Editor
-- Copiez-collez le contenu de cleanup.sql
-- Puis exécutez schema.sql pour recréer la base propre
```

## ✅ Résultat

Après installation, vous aurez :
- ✅ Authentification Supabase fonctionnelle
- ✅ Table `profiles` avec RLS
- ✅ Fonctions utilitaires (handle_updated_at)
- ✅ Base prête pour modules

## 🔒 Sécurité

- **RLS activé** sur toutes les tables utilisateur
- **Politiques strictes** : chaque utilisateur ne voit que ses données
- **Clés étrangères** vers auth.users pour l'intégrité

## 🛠 Développement Modulaire

Les futurs modules (finances, tâches, etc.) seront ajoutés un par un avec leur propre script de migration.