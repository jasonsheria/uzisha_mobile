#!/bin/bash

# 🏗️ Script de Vérification du Projet eMobilier
# Ce script vérifie que tous les fichiers essentiels sont en place

echo "🔍 Vérification de l'architecture du projet eMobilier..."
echo ""

# Array des fichiers critiques
files_to_check=(
    "app/_layout.tsx"
    "app/(auth)/_layout.tsx"
    "app/(auth)/onboarding.tsx"
    "app/(auth)/login.tsx"
    "app/(auth)/signup.tsx"
    "app/(tabs)/_layout.tsx"
    "app/(tabs)/index.tsx"
    "app/(tabs)/search.tsx"
    "app/(tabs)/favorites.tsx"
    "app/(tabs)/bookings.tsx"
    "app/(tabs)/profile.tsx"
    "app/property/[id].tsx"
    "components/Button.tsx"
    "components/SearchBar.tsx"
    "components/PropertyCard.tsx"
    "components/CategoryButton.tsx"
    "components/Header.tsx"
    "components/OnboardingCarousel.tsx"
    "constants/Colors.ts"
    "constants/PropertyCategories.ts"
    "hooks/useAuth.ts"
    "types/index.ts"
    "utils/authService.ts"
    "utils/propertyService.ts"
    "utils/reservationService.ts"
    "utils/helpers.ts"
    "README.md"
    "DEVELOPMENT.md"
    "QUICK_START.md"
    "PROJECT_STATUS.md"
    "VISUAL_STRUCTURE.md"
    "FILES_CREATED.md"
    "SUMMARY.md"
    ".env.example"
    "package.json"
    "tsconfig.json"
    "app.json"
)

# Vérifier chaque fichier
count=0
missing=0

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
        ((count++))
    else
        echo "❌ MISSING: $file"
        ((missing++))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Résultats:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Fichiers trouvés: $count"
echo "❌ Fichiers manquants: $missing"
echo "📁 Total attendu: ${#files_to_check[@]}"
echo ""

if [ $missing -eq 0 ]; then
    echo "🎉 Tous les fichiers essentiels sont en place!"
    echo ""
    echo "🚀 Prochaines étapes:"
    echo "   1. npm install"
    echo "   2. npm start"
    echo ""
else
    echo "⚠️  Attention: $missing fichiers manquent!"
    echo "   Veuillez vérifier la structure du projet."
fi
