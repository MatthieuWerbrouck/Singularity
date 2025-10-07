# Configuration Vercel - Guide Détaillé

## 📋 Étape 1 : Installation Node.js
1. Téléchargez Node.js : https://nodejs.org/
2. Installez la version LTS (Long Term Support)
3. Redémarrez PowerShell après installation

## 🚀 Étape 2 : Installation et Configuration Vercel

### Installation des dépendances
```powershell
cd "c:\Users\matth\Desktop\Singularity"
npm install
npm install -g vercel
```

### Connexion à Vercel
```powershell
vercel login
```
Choisissez votre méthode de connexion (GitHub recommandé)

### Premier déploiement
```powershell
vercel
```

Répondez aux questions :
- **Set up and deploy?** → Y (Yes)
- **Which scope?** → Votre compte personnel
- **Link to existing project?** → N (No)
- **Project name** → singularity (ou gardez le défaut)
- **Directory** → ./ (racine actuelle)
- **Override settings?** → N (No)

### Déploiement en production
```powershell
vercel --prod
```

## 🔧 Étape 3 : Configuration des Variables d'Environnement

### Option A : Via CLI
```powershell
vercel env add SUPABASE_URL production
# Entrez : https://fgnpwzlwwldneuvzsvjr.supabase.co

vercel env add SUPABASE_ANON_KEY production  
# Entrez votre clé Supabase
```

### Option B : Via Dashboard Web
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet "singularity"
3. Settings → Environment Variables
4. Add New :
   - Name: `SUPABASE_URL`
   - Value: `https://fgnpwzlwwldneuvzsvjr.supabase.co`
   - Environments: Production, Preview, Development
5. Add New :
   - Name: `SUPABASE_ANON_KEY` 
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Environments: Production, Preview, Development

## ⚡ Étape 4 : Commandes Utiles

```powershell
# Développement local avec Vercel
vercel dev

# Voir les déploiements
vercel ls

# Voir les logs
vercel logs

# Redéployer
vercel --prod

# Ouvrir le projet dans le navigateur
vercel open
```

## 🌐 Étape 5 : Domaine Personnalisé (Optionnel)

1. Dans Project Settings → Domains
2. Ajoutez votre domaine personnalisé
3. Configurez les DNS selon les instructions

## 🔄 Étape 6 : Déploiement Automatique

Une fois configuré, chaque push sur la branche `main` de GitHub déclenchera automatiquement un déploiement sur Vercel.

## ✅ Vérification du Déploiement

1. Vercel vous donnera une URL comme : `https://singularity-xyz.vercel.app`
2. Testez votre application en ligne
3. Vérifiez que l'authentification Supabase fonctionne

## 🐛 Résolution de Problèmes Courants

### Erreur de modules ES
Si vous avez des erreurs avec les imports ES6, modifiez `vercel.json` :
```json
{
  "functions": {
    "js/*.js": {
      "runtime": "@vercel/node@18.x"
    }
  }
}
```

### Erreurs CORS Supabase
Dans votre projet Supabase :
1. Authentication → Settings → Site URL
2. Ajoutez votre domaine Vercel : `https://votre-projet.vercel.app`

---

💡 **Conseil** : Commencez par la méthode web (plus simple) puis passez à la CLI une fois Node.js installé.