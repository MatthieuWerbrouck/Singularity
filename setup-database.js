#!/usr/bin/env node

/**
 * Script d'installation automatisée pour Singularity
 * Utilise l'API Supabase pour configurer la base de données
 */

const fs = require('fs');
const path = require('path');

// Configuration (à remplir avec vos vraies valeurs)
const SUPABASE_CONFIG = {
    url: 'https://fgnpwzlwwldneuvzsvjr.supabase.co',
    serviceKey: 'VOTRE_SERVICE_ROLE_KEY_ICI', // Clé service role (attention: gardez-la secrète!)
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnbnB3emx3d2xkbmV1dnpzdmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzE3ODMsImV4cCI6MjA3NTQwNzc4M30.ha_zLj8jPD5MSuYb3ncdjvOeOdmjmx0uSuzYvMLYByg'
};

// Couleurs pour les logs
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

async function executeSQL(query, description) {
    log(`\n🔄 ${description}...`, colors.blue);
    
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceKey}`,
                'apikey': SUPABASE_CONFIG.serviceKey
            },
            body: JSON.stringify({ query })
        });

        if (response.ok) {
            log(`✅ ${description} - Terminé`, colors.green);
            return true;
        } else {
            const error = await response.text();
            log(`❌ ${description} - Erreur: ${error}`, colors.red);
            return false;
        }
    } catch (error) {
        log(`❌ ${description} - Erreur: ${error.message}`, colors.red);
        return false;
    }
}

async function createDemoUser() {
    log('\n👤 Création de l\'utilisateur de démonstration...', colors.magenta);
    
    // Note: Ceci nécessite la clé service role avec des permissions d'admin
    const createUserQuery = `
        SELECT auth.create_user(
            'demo@singularity.app',
            'demo123456',
            '{"display_name": "Utilisateur Démo"}',
            true -- email confirmé
        ) as user_id;
    `;
    
    // Alternative avec insertion directe si la fonction auth.create_user n'existe pas
    const alternativeQuery = `
        -- Cette approche nécessite des permissions spéciales
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data
        ) VALUES (
            gen_random_uuid(),
            'demo@singularity.app',
            crypt('demo123456', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"display_name": "Utilisateur Démo"}'::jsonb
        )
        ON CONFLICT (email) DO NOTHING
        RETURNING id;
    `;
    
    log('⚠️  Création d\'utilisateur nécessite des permissions spéciales', colors.yellow);
    log('   Vous devrez peut-être créer l\'utilisateur manuellement dans le dashboard', colors.yellow);
    
    return false; // Retourne false car cette opération nécessite des permissions spéciales
}

async function setupDatabase() {
    log('🚀 Début de l\'installation de Singularity\n', colors.magenta);
    
    // Lire le script de déploiement complet
    const deployScript = fs.readFileSync(
        path.join(__dirname, 'database', 'deploy-complete.sql'), 
        'utf8'
    );
    
    // Diviser le script en sections pour un meilleur contrôle
    const sections = [
        {
            name: 'Extension UUID et table profiles de base',
            query: deployScript.split('-- ============================================================================\n-- ÉTAPE 2:')[0]
        },
        {
            name: 'Migration de la table profiles',
            query: deployScript.split('-- ÉTAPE 2: MIGRATION PROFILES')[1]?.split('-- ÉTAPE 3:')[0]
        },
        {
            name: 'Système de rôles et permissions',
            query: deployScript.split('-- ÉTAPE 3: SYSTÈME DE RÔLES')[1]?.split('-- ÉTAPE 4:')[0]
        },
        {
            name: 'Données initiales',
            query: deployScript.split('-- ÉTAPE 4: DONNÉES INITIALES')[1]?.split('-- ÉTAPE 5:')[0]
        },
        {
            name: 'Politiques de sécurité RLS',
            query: deployScript.split('-- ÉTAPE 5: SÉCURITÉ RLS')[1]?.split('-- ÉTAPE 6:')[0]
        },
        {
            name: 'Fonctions et triggers',
            query: deployScript.split('-- ÉTAPE 6: FONCTIONS ET TRIGGERS')[1]?.split('-- ÉTAPE 7:')[0]
        },
        {
            name: 'Index pour performances',
            query: deployScript.split('-- ÉTAPE 7: INDEX POUR PERFORMANCES')[1]?.split('-- VÉRIFICATIONS FINALES')[0]
        }
    ];
    
    let success = true;
    
    for (const section of sections) {
        if (section.query) {
            const result = await executeSQL(section.query.trim(), section.name);
            if (!result) {
                success = false;
                log(`\n⚠️  Échec dans la section: ${section.name}`, colors.yellow);
                log('   Vous pouvez continuer ou exécuter manuellement cette partie', colors.yellow);
                
                // Demander si on continue
                const readline = require('readline').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                const answer = await new Promise(resolve => {
                    readline.question('Continuer malgré l\'erreur ? (o/n): ', resolve);
                });
                
                readline.close();
                
                if (answer.toLowerCase() !== 'o' && answer.toLowerCase() !== 'oui') {
                    break;
                }
            }
        }
    }
    
    if (success) {
        log('\n🎉 Installation terminée avec succès!', colors.green);
        log('📝 N\'oubliez pas de créer l\'utilisateur de démonstration:', colors.blue);
        log('   Email: demo@singularity.app', colors.blue);
        log('   Mot de passe: demo123456', colors.blue);
    } else {
        log('\n⚠️  Installation partiellement réussie', colors.yellow);
        log('📋 Consultez le fichier TROUBLESHOOTING.md pour les étapes manuelles', colors.blue);
    }
}

// Vérification des dépendances
if (!SUPABASE_CONFIG.serviceKey || SUPABASE_CONFIG.serviceKey === 'VOTRE_SERVICE_ROLE_KEY_ICI') {
    log('❌ Configuration manquante:', colors.red);
    log('   1. Allez dans Settings > API de votre projet Supabase', colors.yellow);
    log('   2. Copiez la "service_role" key (pas l\'anon key!)', colors.yellow);
    log('   3. Remplacez VOTRE_SERVICE_ROLE_KEY_ICI dans ce script', colors.yellow);
    log('   ⚠️  ATTENTION: La service key est très sensible, ne la commitez jamais!', colors.red);
    process.exit(1);
}

// Lancement de l'installation
setupDatabase().catch(error => {
    log(`\n💥 Erreur fatale: ${error.message}`, colors.red);
    process.exit(1);
});