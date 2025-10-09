#!/bin/bash
# Script pour mettre à jour les fonctions admin dans Supabase
# Usage: ./update-admin-functions.sh

echo "🚀 Mise à jour des fonctions d'administration Supabase"
echo "======================================================"

# Lire le fichier SQL
SCRIPT_CONTENT=$(cat database/admin-functions.sql)

echo "📋 Fonctions à installer/mettre à jour :"
echo "  - admin_create_user"
echo "  - admin_update_user" 
echo "  - admin_delete_user"
echo ""

echo "⚠️  Vous devez exécuter ce script SQL dans votre Dashboard Supabase :"
echo "   1. Allez sur https://supabase.com/dashboard"
echo "   2. Sélectionnez votre projet"
echo "   3. Naviguez vers 'SQL Editor'"
echo "   4. Créez une nouvelle requête"
echo "   5. Copiez-collez le contenu du fichier admin-functions.sql"
echo "   6. Exécutez la requête"
echo ""

# Afficher le début du script pour vérification
echo "📄 Début du script SQL :"
echo "========================"
echo "$SCRIPT_CONTENT" | head -15
echo "..."
echo ""

# Compter les fonctions
FUNCTION_COUNT=$(echo "$SCRIPT_CONTENT" | grep -c "CREATE OR REPLACE FUNCTION")
echo "✅ $FUNCTION_COUNT fonction(s) trouvée(s) dans le script"

echo ""
echo "🎯 Une fois exécuté, votre panel d'administration aura :"
echo "   ✅ Création d'utilisateurs sécurisée"
echo "   ✅ Modification d'utilisateurs sécurisée"  
echo "   ✅ Suppression d'utilisateurs sécurisée"
echo "   ✅ Vérification des permissions admin automatique"
echo ""

echo "🔥 Toutes les opérations contournent maintenant les restrictions RLS !"