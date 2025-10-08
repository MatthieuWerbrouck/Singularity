// Test final Tuya avec validation complète
const crypto = require('crypto');
const https = require('https');

// Vos credentials actuels
const TUYA_MAIN_CONFIG = {
    ACCESS_ID: 'gmxydg3hn4fgxkkxgkjw',
    SECRET: '2d58fdf6bf474081b168e9114435ab8d',
    BASE_URL: 'openapi.tuyeus.com' // Test EU aussi
};

// Test avec différents data centers
const DATA_CENTERS = {
    US: 'openapi.tuyaus.com',
    EU: 'openapi.tuyaeu.com',
    CN: 'openapi.tuya.com',
    IN: 'openapi.tuyain.com'
};

function generateCorrectSignature(clientId, secret, timestamp, nonce, method, path, body = '', accessToken = '') {
    // Version finale basée sur la documentation officielle Tuya
    const bodyHash = crypto.createHash('sha256').update(body, 'utf8').digest('hex');
    
    // String to Sign: Method + "\n" + Content-SHA256 + "\n" + Headers + "\n" + URL
    const stringToSign = method.toUpperCase() + '\n' + bodyHash + '\n' + '\n' + path;
    
    // Sign String: clientId + accessToken + timestamp + nonce + stringToSign
    const signString = clientId + (accessToken || '') + timestamp + nonce + stringToSign;
    
    console.log('🔐 SIGNATURE GENERATION:');
    console.log('  Method:', method.toUpperCase());
    console.log('  Body Hash:', bodyHash);
    console.log('  Path:', path);
    console.log('  String to Sign:', JSON.stringify(stringToSign));
    console.log('  Sign String:', JSON.stringify(signString));
    console.log('  Client ID:', clientId);
    console.log('  Access Token:', accessToken || '(empty)');
    console.log('  Timestamp:', timestamp);
    console.log('  Nonce:', nonce);
    
    const signature = crypto.createHmac('sha256', secret)
                           .update(signString, 'utf8')
                           .digest('hex')
                           .toUpperCase();
    
    console.log('  Final Signature:', signature);
    console.log('  Secret Used:', secret.substring(0, 8) + '...');
    
    return signature;
}

function testTuyaAPI(config, dataCenter) {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now().toString();
        const nonce = Math.random().toString(36).substring(2, 15);
        const method = 'GET';
        const path = '/v1.0/token?grant_type=1';
        
        console.log(`\n🌐 TESTING ${dataCenter.toUpperCase()} DATA CENTER:`);
        console.log('  URL:', `https://${DATA_CENTERS[dataCenter]}${path}`);
        console.log('  Timestamp:', timestamp);
        console.log('  Nonce:', nonce);
        
        const signature = generateCorrectSignature(
            config.ACCESS_ID, 
            config.SECRET, 
            timestamp, 
            nonce, 
            method, 
            path
        );
        
        const headers = {
            'client_id': config.ACCESS_ID,
            'sign': signature,
            'sign_method': 'HMAC-SHA256',
            't': timestamp,
            'nonce': nonce,
            'Content-Type': 'application/json'
        };
        
        console.log('📤 REQUEST HEADERS:', headers);
        
        const options = {
            hostname: DATA_CENTERS[dataCenter],
            port: 443,
            path: path,
            method: method,
            headers: headers,
            timeout: 10000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            console.log('📥 RESPONSE STATUS:', res.statusCode);
            console.log('📥 RESPONSE HEADERS:', res.headers);
            
            res.on('data', (chunk) => data += chunk);
            
            res.on('end', () => {
                console.log('📥 RESPONSE BODY:', data);
                
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        dataCenter,
                        status: res.statusCode,
                        headers: res.headers,
                        data: jsonData,
                        success: jsonData.success || false,
                        signature: signature,
                        requestHeaders: headers
                    });
                } catch (e) {
                    resolve({
                        dataCenter,
                        status: res.statusCode,
                        headers: res.headers,
                        data: data,
                        success: false,
                        error: 'JSON parse error',
                        signature: signature,
                        requestHeaders: headers
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            console.error(`❌ ${dataCenter} REQUEST ERROR:`, error);
            resolve({
                dataCenter,
                success: false,
                error: error.message,
                signature: signature
            });
        });
        
        req.on('timeout', () => {
            req.abort();
            resolve({
                dataCenter,
                success: false,
                error: 'Request timeout',
                signature: signature
            });
        });
        
        req.end();
    });
}

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, access_token');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    console.log('🔍 === COMPREHENSIVE TUYA TEST ===');
    
    try {
        // Test tous les data centers
        const results = {};
        
        for (const dc of ['US', 'EU', 'CN']) {
            console.log(`\n🧪 Testing ${dc} data center...`);
            const result = await testTuyaAPI(TUYA_MAIN_CONFIG, dc);
            results[dc] = result;
            
            // Si on trouve un succès, on s'arrête
            if (result.success) {
                console.log(`✅ SUCCESS with ${dc} data center!`);
                return res.json({
                    success: true,
                    workingDataCenter: dc,
                    data: result.data,
                    allResults: results
                });
            }
        }
        
        console.log('❌ All data centers failed');
        
        // Analyse des erreurs
        const analysis = {
            commonErrors: [],
            suggestions: []
        };
        
        // Vérifier les erreurs communes
        for (const [dc, result] of Object.entries(results)) {
            if (result.data && result.data.msg) {
                analysis.commonErrors.push(`${dc}: ${result.data.msg} (${result.data.code})`);
            }
        }
        
        // Suggestions basées sur les erreurs
        if (analysis.commonErrors.some(err => err.includes('sign invalid'))) {
            analysis.suggestions.push('Credentials may be expired or project not activated');
            analysis.suggestions.push('Check Tuya Developer Console project status');
            analysis.suggestions.push('Verify Access ID and Secret are correct');
        }
        
        if (analysis.commonErrors.some(err => err.includes('permission'))) {
            analysis.suggestions.push('API permissions not granted in Tuya Console');
        }
        
        res.json({
            success: false,
            error: 'All data centers failed authentication',
            results: results,
            analysis: analysis,
            credentials: {
                access_id: TUYA_MAIN_CONFIG.ACCESS_ID,
                secret_preview: TUYA_MAIN_CONFIG.SECRET.substring(0, 8) + '...',
                data_centers_tested: Object.keys(results)
            }
        });
        
    } catch (error) {
        console.error('❌ HANDLER ERROR:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
};