# Configuration Base de Données

Cette application utilise Supabase comme base de données.

## Configuration requise

1. **Créer un projet Supabase**
2. **Configurer les clés dans `js/config.js`**
3. **Exécuter le script de configuration** (voir documentation de développement)

## Structure

- **Authentification** : Supabase Auth intégré
- **Profils utilisateurs** : Table `profiles` 
- **Système de rôles** : Tables `roles`, `permissions`, `role_permissions`
- **Sécurité** : Row Level Security (RLS) activé

## Utilisateur de démonstration

Pour tester l'application, créez un utilisateur avec :
- Email: `demo@singularity.app`
- Mot de passe: `demo123456`

Puis assignez-lui le rôle 'admin' dans la base de données.