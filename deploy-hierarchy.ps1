# Script de déploiement - Système de Hiérarchie des Privilèges
# Usage: .\deploy-hierarchy.ps1

Write-Host "🏗️ Déploiement du Système de Hiérarchie des Privilèges" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

# Vérifier si les fichiers existent
$hierarchyFile = "database/role-hierarchy.sql"
$adminFunctionsFile = "database/admin-functions.sql"

if (-not (Test-Path $hierarchyFile)) {
    Write-Host "❌ Fichier $hierarchyFile non trouvé !" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $adminFunctionsFile)) {
    Write-Host "❌ Fichier $adminFunctionsFile non trouvé !" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Fonctionnalités à installer :" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Système de Hiérarchie :" -ForegroundColor Yellow
Write-Host "  ✅ can_manage_role() - Vérification privilèges sur rôles" -ForegroundColor White
Write-Host "  ✅ can_manage_user() - Vérification privilèges sur utilisateurs" -ForegroundColor White
Write-Host "  ✅ get_assignable_roles() - Rôles assignables par niveau" -ForegroundColor White
Write-Host "  ✅ admin_update_user_role() - Mise à jour sécurisée des rôles" -ForegroundColor White
Write-Host "  ✅ admin_delete_user_secure() - Suppression sécurisée" -ForegroundColor White
Write-Host ""

Write-Host "🛡️ Fonctions Admin Sécurisées :" -ForegroundColor Yellow
Write-Host "  ✅ admin_create_user() - Création avec contrôles hiérarchie" -ForegroundColor White
Write-Host "  ✅ admin_update_user() - Modification avec contrôles" -ForegroundColor White
Write-Host "  ✅ admin_delete_user() - Suppression avec contrôles" -ForegroundColor White
Write-Host ""

Write-Host "📊 Règles de Hiérarchie :" -ForegroundColor Yellow
Write-Host "  👑 Super Admin (100) : Peut gérer tous les niveaux" -ForegroundColor White
Write-Host "  🛠️  Admin (80)        : Peut gérer niveaux 0-79" -ForegroundColor White
Write-Host "  👨‍💼 Manager (60)      : Peut gérer niveaux 0-59" -ForegroundColor White
Write-Host "  👤 User (40)         : Peut gérer niveaux 0-39" -ForegroundColor White
Write-Host "  👁️  Guest (20)        : Ne peut rien gérer" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  Instructions de déploiement :" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 📁 Ouvrez votre Dashboard Supabase" -ForegroundColor Cyan
Write-Host "   https://supabase.com/dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 🎯 Allez dans 'SQL Editor'" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. 📤 Exécutez DANS L'ORDRE :" -ForegroundColor Cyan
Write-Host ""
Write-Host "   ÉTAPE 1 - Hiérarchie des rôles :" -ForegroundColor Magenta
Write-Host "   • Copiez le contenu de 'database/role-hierarchy.sql'" -ForegroundColor White
Write-Host "   • Exécutez la requête" -ForegroundColor White
Write-Host ""
Write-Host "   ÉTAPE 2 - Fonctions admin mises à jour :" -ForegroundColor Magenta
Write-Host "   • Copiez le contenu de 'database/admin-functions.sql'" -ForegroundColor White
Write-Host "   • Exécutez la requête" -ForegroundColor White
Write-Host ""

Write-Host "4. ✅ Vérification :" -ForegroundColor Cyan
Write-Host "   • Testez avec un compte admin différent niveaux" -ForegroundColor White
Write-Host "   • Vérifiez que les privilèges fonctionnent" -ForegroundColor White
Write-Host ""

Write-Host "🎯 Exemples de tests à faire :" -ForegroundColor Green
Write-Host ""
Write-Host "👑 Avec admin/admin (Super Admin) :" -ForegroundColor Yellow
Write-Host "  • Peut créer des Admin (80), Manager (60), User (40)" -ForegroundColor White
Write-Host "  • Peut modifier tous les utilisateurs" -ForegroundColor White
Write-Host "  • Peut supprimer tous les utilisateurs (sauf lui-même)" -ForegroundColor White
Write-Host ""

Write-Host "🛠️  Avec un Admin normal (80) :" -ForegroundColor Yellow
Write-Host "  • Peut créer Manager (60), User (40), Guest (20)" -ForegroundColor White
Write-Host "  • NE PEUT PAS créer d'autres Admin (80) ou Super Admin (100)" -ForegroundColor Red
Write-Host "  • NE PEUT PAS modifier les Super Admin" -ForegroundColor Red
Write-Host ""

Write-Host "👨‍💼 Avec un Manager (60) :" -ForegroundColor Yellow
Write-Host "  • Peut créer User (40), Guest (20)" -ForegroundColor White
Write-Host "  • NE PEUT PAS créer Manager (60), Admin (80), Super Admin (100)" -ForegroundColor Red
Write-Host ""

Write-Host "🚀 Après déploiement, les privilèges seront appliqués :" -ForegroundColor Green
Write-Host "  ✅ Interface admin adapte les boutons selon privilèges" -ForegroundColor White
Write-Host "  ✅ Listes déroulantes de rôles filtrées par niveau" -ForegroundColor White
Write-Host "  ✅ Sécurité renforcée côté serveur (PostgreSQL)" -ForegroundColor White
Write-Host "  ✅ Messages d'erreur clairs en cas de privilèges insuffisants" -ForegroundColor White
Write-Host ""

# Proposer d'ouvrir les fichiers pour faciliter le déploiement
$response = Read-Host "Voulez-vous ouvrir les fichiers SQL dans le bloc-notes ? (O/N)"
if ($response -eq "O" -or $response -eq "o") {
    Write-Host ""
    Write-Host "📝 Ouverture des fichiers..." -ForegroundColor Green
    Start-Process notepad.exe -ArgumentList $hierarchyFile
    Start-Sleep -Seconds 1
    Start-Process notepad.exe -ArgumentList $adminFunctionsFile
    Write-Host "✅ Fichiers ouverts dans le bloc-notes !" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎊 Le système de hiérarchie est prêt à être déployé !" -ForegroundColor Green
Write-Host "Une fois les scripts SQL exécutés, votre système aura :" -ForegroundColor Cyan
Write-Host "🔐 Contrôle des privilèges par niveau de rôle" -ForegroundColor White
Write-Host "🛡️ Sécurité renforcée côté serveur" -ForegroundColor White  
Write-Host "🎯 Interface adaptative selon les permissions" -ForegroundColor White
Write-Host "⚡ Gestion hiérarchique complète des utilisateurs" -ForegroundColor White