# Script PowerShell pour mettre à jour les fonctions admin dans Supabase
# Usage: .\update-admin-functions.ps1

Write-Host "🚀 Mise à jour des fonctions d'administration Supabase" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""

# Vérifier si le fichier existe
$scriptPath = "database/admin-functions.sql"
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Fichier $scriptPath non trouvé !" -ForegroundColor Red
    exit 1
}

# Lire le contenu du fichier
$scriptContent = Get-Content -Path $scriptPath -Raw

Write-Host "📋 Fonctions à installer/mettre à jour :" -ForegroundColor Cyan
Write-Host "  - admin_create_user" -ForegroundColor White
Write-Host "  - admin_update_user" -ForegroundColor White
Write-Host "  - admin_delete_user" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  Vous devez exécuter ce script SQL dans votre Dashboard Supabase :" -ForegroundColor Yellow
Write-Host "   1. Allez sur https://supabase.com/dashboard" -ForegroundColor White
Write-Host "   2. Sélectionnez votre projet" -ForegroundColor White
Write-Host "   3. Naviguez vers 'SQL Editor'" -ForegroundColor White
Write-Host "   4. Créez une nouvelle requête" -ForegroundColor White
Write-Host "   5. Copiez-collez le contenu du fichier admin-functions.sql" -ForegroundColor White
Write-Host "   6. Exécutez la requête" -ForegroundColor White
Write-Host ""

# Afficher le début du script pour vérification
Write-Host "📄 Début du script SQL :" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
$scriptLines = $scriptContent -split "`n"
$scriptLines[0..14] | ForEach-Object { Write-Host $_ -ForegroundColor Gray }
Write-Host "..." -ForegroundColor Gray
Write-Host ""

# Compter les fonctions
$functionCount = ($scriptContent | Select-String "CREATE OR REPLACE FUNCTION" -AllMatches).Matches.Count
Write-Host "✅ $functionCount fonction(s) trouvée(s) dans le script" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 Une fois exécuté, votre panel d'administration aura :" -ForegroundColor Magenta
Write-Host "   ✅ Création d'utilisateurs sécurisée" -ForegroundColor Green
Write-Host "   ✅ Modification d'utilisateurs sécurisée" -ForegroundColor Green
Write-Host "   ✅ Suppression d'utilisateurs sécurisée" -ForegroundColor Green
Write-Host "   ✅ Vérification des permissions admin automatique" -ForegroundColor Green
Write-Host ""

Write-Host "🔥 Toutes les opérations contournent maintenant les restrictions RLS !" -ForegroundColor Red

# Proposer d'ouvrir le fichier dans le bloc-notes pour faciliter la copie
Write-Host ""
$response = Read-Host "Voulez-vous ouvrir le fichier SQL dans le bloc-notes pour faciliter la copie ? (O/N)"
if ($response -eq "O" -or $response -eq "o") {
    notepad.exe $scriptPath
    Write-Host "📝 Fichier ouvert dans le bloc-notes !" -ForegroundColor Green
}