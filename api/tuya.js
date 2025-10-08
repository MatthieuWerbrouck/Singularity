// Test avancé credentials et endpoints Tuya
const crypto = require('crypto');
const https = require('https');

const TUYA_CONFIG = {
    ACCESS_ID: 'gmxydg3hn4fgxkkxgkjw',
    SECRET: '2d58fdf6bf474081b168e9114435ab8d',
    BASE_URL: 'openapi.tuyaus.com'
};

// Test de validation des credentials avec différents formats
function generateSignatureV1(clientId, secret, timestamp, nonce, method, path) {
    // Version basique selon certains exemples
    const str = clientId + timestamp + nonce + method + path;
    return crypto.createHmac('sha256', secret).update(str, 'utf8').digest('hex').toUpperCase();
}

function generateSignatureV2(clientId, secret, timestamp, nonce, method, path, body = '') {
    // Version avec body hash (plus commune)
    const bodyHash = crypto.createHash('sha256').update(body, 'utf8').digest('hex');
    const stringToSign = method + '\n' + bodyHash + '\n' + '\n' + path;
    const str = clientId + timestamp + nonce + stringToSign;
    return crypto.createHmac('sha256', secret).update(str, 'utf8').digest('hex').toUpperCase();
}

function generateSignatureV3(clientId, secret, timestamp, nonce, method, path, body = '', accessToken = '') {
    // Version complète selon doc récente
    const bodyHash = crypto.createHash('sha256').update(body, 'utf8').digest('hex');
    const stringToSign = method + '\n' + bodyHash + '\n' + '\n' + path;
    const str = clientId + accessToken + timestamp + nonce + stringToSign;
    return crypto.createHmac('sha256', secret).update(str, 'utf8').digest('hex').toUpperCase();
}

function testCredentials() {
    // Test simple de validation des credentials
    const timestamp = '1641899085587'; // Timestamp fixe pour test
    const nonce = 'test123';
    const method = 'GET';
    const path = '/v1.0/token?grant_type=1';
    
    console.log('🔍 === CREDENTIALS TEST ===');
    console.log('🔍 ACCESS_ID:', TUYA_CONFIG.ACCESS_ID);
    console.log('🔍 SECRET (first 8):', TUYA_CONFIG.SECRET.substring(0, 8) + '...');
    console.log('🔍 BASE_URL:', TUYA_CONFIG.BASE_URL);
    console.log('🔍 Timestamp:', timestamp);
    console.log('🔍 Nonce:', nonce);
    
    const sig1 = generateSignatureV1(TUYA_CONFIG.ACCESS_ID, TUYA_CONFIG.SECRET, timestamp, nonce, method, path);
    const sig2 = generateSignatureV2(TUYA_CONFIG.ACCESS_ID, TUYA_CONFIG.SECRET, timestamp, nonce, method, path, '');
    const sig3 = generateSignatureV3(TUYA_CONFIG.ACCESS_ID, TUYA_CONFIG.SECRET, timestamp, nonce, method, path, '', '');
    
    console.log('🔍 Signature V1:', sig1);
    console.log('🔍 Signature V2:', sig2);
    console.log('🔍 Signature V3:', sig3);
    
    return { sig1, sig2, sig3, timestamp, nonce };
}

function callTuyaTest(signature, timestamp, nonce) {
    return new Promise((resolve, reject) => {
        const headers = {
            'client_id': TUYA_CONFIG.ACCESS_ID,
            'sign': signature,
            'sign_method': 'HMAC-SHA256',
            't': timestamp,
            'nonce': nonce,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; TuyaAPI/1.0)'
        };
        
        console.log('🌐 Request Headers:', headers);
        
        const options = {
            hostname: TUYA_CONFIG.BASE_URL,
            port: 443,
            path: '/v1.0/token?grant_type=1',
            method: 'GET',
            headers: headers,
            timeout: 10000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('📥 Status:', res.statusCode);
                console.log('📥 Headers:', res.headers);
                console.log('📥 Body:', data);
                
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: jsonData,
                        success: jsonData.success || false,
                        error: jsonData.msg || jsonData.error_description
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: data,
                        success: false,
                        error: 'Invalid JSON response'
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Request Error:', error);
            reject(error);
        });
        
        req.on('timeout', () => {
            console.error('❌ Request Timeout');
            req.abort();
            reject(new Error('Request timeout'));
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
    
    console.log('🔍 === ADVANCED TUYA DIAGNOSTIC ===');
    
    try {
        // Test 1: Credentials validation
        const credTest = testCredentials();
        
        // Test 2: Essayer avec différentes signatures
        console.log('🧪 Testing V2 signature...');
        const result2 = await callTuyaTest(credTest.sig2, credTest.timestamp, credTest.nonce);
        
        if (result2.success) {
            console.log('✅ V2 Signature worked!');
            res.json({
                success: true,
                data: result2.data,
                method: 'V2 signature worked',
                credentials_valid: true
            });
            return;
        }
        
        console.log('🧪 Testing V3 signature...');
        const result3 = await callTuyaTest(credTest.sig3, credTest.timestamp, credTest.nonce);
        
        if (result3.success) {
            console.log('✅ V3 Signature worked!');
            res.json({
                success: true,
                data: result3.data,
                method: 'V3 signature worked',
                credentials_valid: true
            });
            return;
        }
        
        // Test 3: Avec timestamp actuel
        const currentTime = Date.now().toString();
        const currentNonce = Math.random().toString(36).substring(2, 15);
        
        const currentSig = generateSignatureV2(TUYA_CONFIG.ACCESS_ID, TUYA_CONFIG.SECRET, currentTime, currentNonce, 'GET', '/v1.0/token?grant_type=1', '');
        
        console.log('🧪 Testing with current timestamp...');
        const currentResult = await callTuyaTest(currentSig, currentTime, currentNonce);
        
        // Retourner tous les résultats pour analyse
        res.json({
            success: false,
            error: 'All signature methods failed',
            results: {
                fixed_timestamp: {
                    v2: result2,
                    v3: result3
                },
                current_timestamp: currentResult
            },
            credentials: {
                access_id: TUYA_CONFIG.ACCESS_ID,
                secret_preview: TUYA_CONFIG.SECRET.substring(0, 8) + '...',
                base_url: TUYA_CONFIG.BASE_URL
            },
            signatures: credTest,
            analysis: 'Check credentials, endpoint, or signature format'
        });
        
    } catch (error) {
        console.error('❌ Handler Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
};