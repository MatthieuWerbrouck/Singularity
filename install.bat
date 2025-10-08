@echo off
echo ================================
echo   Installation Singularity 
echo ================================
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé
    echo    Téléchargez-le depuis: https://nodejs.org
    echo    Puis relancez ce script
    pause
    exit /b 1
)

echo ✅ Node.js détecté
echo.

REM Vérifier si le script existe
if not exist "setup-database.js" (
    echo ❌ Le fichier setup-database.js est introuvable
    echo    Assurez-vous d'être dans le bon dossier
    pause
    exit /b 1
)

echo 🔍 Configuration requise:
echo.
echo    1. Allez dans votre dashboard Supabase
echo    2. Settings ^> API
echo    3. Copiez la "service_role" key (PAS l'anon key!)
echo    4. Éditez setup-database.js et remplacez VOTRE_SERVICE_ROLE_KEY_ICI
echo.
echo ⚠️  IMPORTANT: Ne partagez jamais votre service_role key!
echo.

set /p confirmation="Avez-vous configuré la service_role key ? (o/n): "
if /i "%confirmation%" neq "o" if /i "%confirmation%" neq "oui" (
    echo Configuration annulée
    pause
    exit /b 0
)

echo.
echo 🚀 Lancement de l'installation...
echo.

node setup-database.js

echo.
echo ✅ Script terminé
pause