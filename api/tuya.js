// Test simple pour vérifier les credentials Tuya
const crypto = require('crypto');
const https = require('https');

// Test avec différentes méthodes de signature
const TUYA_CONFIG = {
    ACCESS_ID: 'gmxydg3hn4fgxkkxgkjw',
    SECRET: '2d58fdf6bf474081b168e9114435ab8d',
    BASE_URL: 'openapi.tuyaus.com'
};

function testSignatureMethod1(clientId, secret, timestamp, nonce, method, path) {
    // Méthode 1: Simple concatenation
    const stringToSign = clientId + timestamp + nonce + method + path;
    const signature = crypto.createHmac('sha256', secret).update(stringToSign, 'utf8').digest('hex').toUpperCase();
    
    console.log('🧪 Method 1:');
    console.log('  String:', stringToSign);
    console.log('  Signature:', signature);
    
    return signature;
}

function testSignatureMethod2(clientId, secret, timestamp, nonce, method, path) {
    // Méthode 2: Avec hash du body vide
    const bodyHash = crypto.createHash('sha256').update('', 'utf8').digest('hex');
    const stringToSign = method + '\n' + bodyHash + '\n' + '\n' + path;
    const signStr = clientId + timestamp + nonce + stringToSign;
    const signature = crypto.createHmac('sha256', secret).update(signStr, 'utf8').digest('hex').toUpperCase();
    
    console.log('🧪 Method 2:');
    console.log('  Body Hash:', bodyHash);
    console.log('  String to Sign:', stringToSign);
    console.log('  Sign String:', signStr);
    console.log('  Signature:', signature);
    
    return signature;
}

function testSignatureMethod3(clientId, secret, timestamp, nonce, method, path) {
    // Méthode 3: Selon nouvelle doc Tuya
    const bodyHash = crypto.createHash('sha256').update('', 'utf8').digest('hex');
    const stringToSign = method.toUpperCase() + '\n' + bodyHash + '\n' + '\n' + path;
    const signStr = clientId + '' + timestamp + nonce + stringToSign; // access_token vide pour auth
    const signature = crypto.createHmac('sha256', secret).update(signStr, 'utf8').digest('hex').toUpperCase();
    
    console.log('🧪 Method 3:');
    console.log('  Body Hash:', bodyHash);
    console.log('  String to Sign:', stringToSign);
    console.log('  Sign String:', signStr);
    console.log('  Signature:', signature);
    
    return signature;
}

function callTuyaWithMethod(method, signature, timestamp, nonce) {
    return new Promise((resolve, reject) => {
        const headers = {
            'client_id': TUYA_CONFIG.ACCESS_ID,
            'sign': signature,
            'sign_method': 'HMAC-SHA256',
            't': timestamp,
            'nonce': nonce,
            'Content-Type': 'application/json'
        };
        
        const options = {
            hostname: TUYA_CONFIG.BASE_URL,
            port: 443,
            path: '/v1.0/token?grant_type=1',
            method: 'GET',
            headers: headers
        };
        
        console.log('🌐 Testing with headers:', headers);
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('📥 Response:', res.statusCode, data);
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', reject);
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
    
    console.log('🔍 === SIGNATURE TESTING ===');
    
    try {
        const timestamp = Date.now().toString();
        const nonce = Math.random().toString(36).substring(2, 15);
        const method = 'GET';
        const path = '/v1.0/token?grant_type=1';
        
        console.log('🔍 Testing params:', { timestamp, nonce, method, path });
        
        // Test les 3 méthodes
        const sig1 = testSignatureMethod1(TUYA_CONFIG.ACCESS_ID, TUYA_CONFIG.SECRET, timestamp, nonce, method, path);
        const sig2 = testSignatureMethod2(TUYA_CONFIG.ACCESS_ID, TUYA_CONFIG.SECRET, timestamp, nonce, method, path);
        const sig3 = testSignatureMethod3(TUYA_CONFIG.ACCESS_ID, TUYA_CONFIG.SECRET, timestamp, nonce, method, path);
        
        // Test avec méthode 3 (la plus probable)
        console.log('🧪 Testing Method 3...');
        const result = await callTuyaWithMethod(method, sig3, timestamp, nonce);
        
        console.log('🧪 Final Result:', result);
        
        if (result.data && result.data.success) {
            res.json({
                success: true,
                data: result.data.result,
                method: 'Method 3 worked!',
                signatures: { sig1, sig2, sig3 }
            });
        } else {
            res.json({
                success: false,
                error: result.data?.msg || 'Test failed',
                code: result.data?.code,
                status: result.status,
                signatures: { sig1, sig2, sig3 },
                method: 'All methods tested'
            });
        }
        
    } catch (error) {
        console.error('❌ Test Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Signature test failed'
        });
    }
};