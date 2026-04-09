@echo off
REM 🏗️ Script de Vérification du Projet eMobilier (Windows)
REM Ce script vérifie que tous les fichiers essentiels sont en place

echo.
echo 🔍 Vérification de l'architecture du projet eMobilier...
echo.

setlocal enabledelayedexpansion
set count=0
set missing=0

REM Liste des fichiers critiques
set "files[0]=app\_(auth)\_layout.tsx"
set "files[1]=app\_(auth)\login.tsx"
set "files[2]=app\_(auth)\signup.tsx"
set "files[3]=app\_(auth)\onboarding.tsx"
set "files[4]=app\_(tabs)\_layout.tsx"
set "files[5]=app\_(tabs)\index.tsx"
set "files[6]=components\Button.tsx"
set "files[7]=components\SearchBar.tsx"
set "files[8]=constants\Colors.ts"
set "files[9]=hooks\useAuth.ts"
set "files[10]=types\index.ts"
set "files[11]=utils\authService.ts"
set "files[12]=README.md"
set "files[13]=QUICK_START.md"
set "files[14]=DEVELOPMENT.md"
set "files[15]=package.json"

REM Vérifier chaque fichier
for /L %%i in (0,1,15) do (
    if exist "!files[%%i]!" (
        echo ✅ !files[%%i]!
        set /a count+=1
    ) else (
        echo ❌ MISSING: !files[%%i]!
        set /a missing+=1
    )
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 📊 Résultats:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ Fichiers trouvés: %count%
echo ❌ Fichiers manquants: %missing%
echo.

if %missing% equ 0 (
    echo 🎉 Tous les fichiers essentiels sont en place!
    echo.
    echo 🚀 Prochaines étapes:
    echo    1. npm install
    echo    2. npm start
    echo.
) else (
    echo ⚠️  Attention: %missing% fichiers manquent!
)

pause
