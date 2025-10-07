# Test et Déploiement - Singularity

## 🎯 Test Immédiat de l'Application

### Méthode 1 : Test Local (Sans serveur)
1. **Ouvrez votre navigateur**
2. **Allez sur :** `file:///c:/Users/matth/Desktop/Singularity/index.html`
3. **Testez :**
   - Connexion/Inscription (mode démo)
   - Navigation du dashboard
   - Interface responsive

### Méthode 2 : Serveur HTTP Simple
```powershell
# Installer un serveur HTTP simple
& "C:\Program Files\nodejs\npm.cmd" install -g http-server

# Lancer le serveur
& "C:\Program Files\nodejs\npx.cmd" http-server . -p 3000
```

Puis ouvrir : http://localhost:3000

## 🚀 Configuration Vercel

### Étape 1 : Connexion à Vercel
```powershell
# Ajouter Node.js au PATH pour cette session
$env:PATH += ";C:\Program Files\nodejs"

# Se connecter à Vercel
npx vercel login
```

### Étape 2 : Premier Déploiement
```powershell
# Déploiement initial
npx vercel

# Suivre les instructions :
# - Set up and deploy? → Y
# - Which scope? → Votre compte
# - Link to existing project? → N  
# - Project name → singularity
# - Directory → ./
# - Override settings? → N
```

### Étape 3 : Déploiement Production
```powershell
npx vercel --prod
```

## 🔧 Variables d'Environnement

Vos clés Supabase sont déjà configurées dans `js/config.js` :
- URL: `https://fgnpwzlwwldneuvzsvjr.supabase.co`
- Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Pour la production, ajoutez-les dans Vercel :
```powershell
npx vercel env add SUPABASE_URL production
npx vercel env add SUPABASE_ANON_KEY production
```

## ⚡ Solution Alternative : GitHub + Vercel Web

Si les commandes posent problème :

1. **Créez un repository GitHub** avec vos fichiers
2. **Allez sur** https://vercel.com/new
3. **Connectez votre repo GitHub**
4. **Déployez automatiquement**

## 🎯 Résultat Attendu

Une fois déployé, vous aurez :
- ✅ URL publique : `https://singularity-xyz.vercel.app`
- ✅ HTTPS automatique
- ✅ Déploiement automatique à chaque commit
- ✅ Application fonctionnelle avec Supabase

---

💡 **Conseil :** Testez d'abord l'application en local pour vous assurer qu'elle fonctionne, puis procédez au déploiement.