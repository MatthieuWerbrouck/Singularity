// setup-tasks-database.js - Configuration spécifique pour les tâches
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration de Supabase (à modifier avec vos vraies clés)
const supabaseUrl = 'https://votre-project.supabase.co';
const serviceRoleKey = 'VOTRE_SERVICE_ROLE_KEY_ICI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupTasksDatabase() {
    console.log('🚀 Configuration de la base de données pour les tâches...');
    
    try {
        // Lire le script SQL
        const sqlScript = fs.readFileSync('./database/create-tasks-structure.sql', 'utf8');
        
        // Diviser le script en commandes individuelles
        const commands = sqlScript
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0);
        
        console.log(`📝 Exécution de ${commands.length} commandes SQL...`);
        
        // Exécuter chaque commande
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            console.log(`⏳ Exécution de la commande ${i + 1}/${commands.length}...`);
            
            const { data, error } = await supabase.rpc('exec_sql', {
                sql_query: command
            });
            
            if (error) {
                console.error(`❌ Erreur sur la commande ${i + 1}:`, error);
                // Continuer avec les autres commandes
            } else {
                console.log(`✅ Commande ${i + 1} exécutée avec succès`);
            }
        }
        
        console.log('✅ Configuration terminée !');
        console.log('🎯 Vous pouvez maintenant utiliser le module des tâches');
        
    } catch (error) {
        console.error('❌ Erreur lors de la configuration:', error);
        
        if (error.code === 'ENOENT') {
            console.log('💡 Le fichier create-tasks-structure.sql est introuvable');
            console.log('   Assurez-vous qu\'il existe dans le dossier database/');
        }
    }
}

// Vérification des prérequis
if (serviceRoleKey === 'VOTRE_SERVICE_ROLE_KEY_ICI') {
    console.log('❌ Configuration manquante:');
    console.log('   1. Allez dans Settings > API de votre projet Supabase');
    console.log('   2. Copiez la "service_role" key (pas l\'anon key!)');
    console.log('   3. Remplacez VOTRE_SERVICE_ROLE_KEY_ICI dans ce script');
    process.exit(1);
}

if (supabaseUrl === 'https://votre-project.supabase.co') {
    console.log('❌ Configuration manquante:');
    console.log('   1. Allez dans Settings > API de votre projet Supabase');
    console.log('   2. Copiez l\'URL de votre projet');
    console.log('   3. Remplacez votre-project dans ce script');
    process.exit(1);
}

// Exécuter la configuration
setupTasksDatabase();