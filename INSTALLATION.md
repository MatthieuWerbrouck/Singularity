# Guide d'Installation - Singularity

## 📋 Prérequis

### 1. Node.js et npm
**Téléchargez et installez Node.js depuis :** https://nodejs.org/

Choisissez la version **LTS** (Long Term Support) recommandée.

Après installation, vérifiez dans PowerShell :
```powershell
node --version
npm --version
```

### 2. Git (optionnel mais recommandé)
**Téléchargez Git depuis :** https://git-scm.com/

## 🚀 Installation du Projet

### 1. Installation des dépendances
```powershell
cd "c:\Users\matth\Desktop\Singularity"
npm install
```

### 2. Configuration Supabase

1. **Créez un compte Supabase :** https://supabase.com/
2. **Créez un nouveau projet**
3. **Récupérez vos clés** dans Settings > API
4. **Copiez `.env.example` vers `.env`** et ajoutez vos clés :

```env
SUPABASE_URL=https://votre-project-id.supabase.co
SUPABASE_ANON_KEY=votre-cle-anonyme-supabase
```

5. **Modifiez `js/config.js`** avec vos vraies valeurs

### 3. Test en local

**Option A : Avec Vercel CLI (recommandé)**
```powershell
npm run dev
```

**Option B : Serveur HTTP simple**
```powershell
# Avec Python (si installé)
python -m http.server 8000

# Ou avec Node.js (après installation)
npx serve .
```

Puis ouvrez : http://localhost:8000

## 🌐 Déploiement sur Vercel

### 1. Installation Vercel CLI
```powershell
npm install -g vercel
```

### 2. Connexion et déploiement
```powershell
vercel login
vercel --prod
```

### 3. Configuration des variables d'environnement
Dans le dashboard Vercel, ajoutez :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 🔧 Mode Développement Sans Supabase

L'application fonctionne en **mode démo** si Supabase n'est pas configuré :
- Authentification simulée
- Interface complète disponible
- Parfait pour tester le design et les interactions

## 📱 Test de l'Application

1. **Ouvrez** `index.html` dans votre navigateur
2. **Testez** la connexion/inscription (mode démo)
3. **Explorez** le dashboard
4. **Vérifiez** le responsive design

## ⚡ Commandes Utiles

```powershell
# Développement local
npm run dev

# Déploiement
npm run deploy

# Test local simple
npx serve .
```

## 🎯 Prochaines Étapes

1. **Installer Node.js** (si pas encore fait)
2. **Configurer Supabase** pour la persistence des données
3. **Tester l'application** en local
4. **Déployer sur Vercel**
5. **Développer les fonctionnalités** métier

---

✨ **L'application est prête à être utilisée dès maintenant en mode démo !**