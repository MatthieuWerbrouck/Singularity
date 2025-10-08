// Proxy API Tuya Smart - Version signature corrigée selon doc officielle
const crypto = require('crypto');
const https = require('https');

const TUYA_CONFIG = {
    ACCESS_ID: 'gmxydg3hn4fgxkkxgkjw',
    SECRET: '2d58fdf6bf474081b168e9114435ab8d',
    BASE_URL: 'openapi.tuyaus.com'
};

/**
 * Générer signature selon documentation officielle Tuya
 * https://developer.tuya.com/en/docs/iot/singnature?id=Ka43a5mtx1gsc
 */
function generateTuyaSignature(method, url, headers, body) {
    // Étape 1: Construire HTTPMethod
    const httpMethod = method.toUpperCase();
    
    // Étape 2: Construire Content-SHA256
    const bodyContent = body || '';
    const contentHash = crypto.createHash('sha256').update(bodyContent, 'utf8').digest('hex');
    
    // Étape 3: Construire Headers (vide pour cette API)
    const headersStr = '';
    
    // Étape 4: Construire URL
    const urlPath = url;
    
    // Étape 5: Construire StringToSign
    const stringToSign = [httpMethod, contentHash, headersStr, urlPath].join('\n');
    
    // Étape 6: Construire Sign
    const signStr = headers.client_id + (headers.access_token || '') + headers.t + headers.nonce + stringToSign;
    
    console.log('📝 === SIGNATURE DEBUG ===');
    console.log('📝 HTTP Method:', httpMethod);
    console.log('📝 Content Hash:', contentHash);
    console.log('📝 Headers Str:', headersStr);
    console.log('📝 URL Path:', urlPath);
    console.log('📝 String to Sign:', stringToSign);
    console.log('📝 Final Sign String:', signStr);
    
    const signature = crypto.createHmac('sha256', TUYA_CONFIG.SECRET)
                           .update(signStr, 'utf8')
                           .digest('hex')
                           .toUpperCase();
    
    console.log('📝 Generated Signature:', signature);
    console.log('📝 === END DEBUG ===');
    
    return signature;
}

/**
 * Effectuer appel API Tuya avec signature correcte
 */
function callTuyaAPI(method, path, body = null, accessToken = '') {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now().toString();
        const nonce = Math.random().toString(36).substring(2, 15);
        const bodyStr = body ? JSON.stringify(body) : '';
        
        // Headers de base
        const headers = {
            'client_id': TUYA_CONFIG.ACCESS_ID,
            'sign_method': 'HMAC-SHA256',
            't': timestamp,
            'nonce': nonce,
            'Content-Type': 'application/json'
        };
        
        if (accessToken) {
            headers['access_token'] = accessToken;
        }
        
        // Générer la signature
        const signature = generateTuyaSignature(method, path, headers, bodyStr);
        headers['sign'] = signature;
        
        // Ajouter Content-Length si nécessaire
        if (bodyStr && method !== 'GET') {
            headers['Content-Length'] = Buffer.byteLength(bodyStr, 'utf8');
        }
        
        console.log('🌐 Final Headers:', headers);
        
        const options = {
            hostname: TUYA_CONFIG.BASE_URL,
            port: 443,
            path: path,
            method: method,
            headers: headers
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('📥 Response Status:', res.statusCode);
                console.log('📥 Response Headers:', res.headers);
                console.log('📥 Response Body:', data);
                
                try {
                    const jsonData = JSON.parse(data);
                    
                    if (!jsonData.success) {
                        reject(new Error(`Tuya API Error: ${jsonData.msg || 'Unknown error'} (Code: ${jsonData.code})`));
                    } else {
                        resolve(jsonData.result);
                    }
                } catch (parseError) {
                    console.error('❌ JSON Parse Error:', parseError);
                    reject(new Error('Invalid JSON response from Tuya API'));
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ HTTPS Request Error:', error);
            reject(error);
        });
        
        if (bodyStr && method !== 'GET') {
            req.write(bodyStr);
        }
        
        req.end();
    });
}

// Handler principal
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
    
    console.log('🔍 === NEW REQUEST ===');
    console.log('🔍 Method:', req.method);
    console.log('🔍 URL:', req.url);
    console.log('🔍 Query:', req.query);
    console.log('🔍 Timestamp:', new Date().toISOString());
    
    try {
        const { action, deviceId } = req.query;
        const { commands } = req.body || {};
        
        switch (action) {
            case 'auth':
                console.log('🔑 === AUTHENTICATION REQUEST ===');
                
                try {
                    const authData = await callTuyaAPI('GET', '/v1.0/token?grant_type=1');
                    console.log('🔑 Auth Success:', authData);
                    
                    res.json({ 
                        success: true, 
                        data: {
                            access_token: authData.access_token,
                            expire_time: authData.expire_time
                        }
                    });
                } catch (authError) {
                    console.error('🔑 Auth Error:', authError);
                    throw authError;
                }
                break;
                
            case 'devices':
                console.log('📱 === DEVICES REQUEST ===');
                const { access_token } = req.headers;
                if (!access_token) {
                    return res.status(401).json({ success: false, error: 'Access token required' });
                }
                
                const devices = await callTuyaAPI('GET', '/v1.0/users/me/devices', null, access_token);
                res.json({ success: true, data: devices });
                break;
                
            case 'device-status':
                console.log('📊 === DEVICE STATUS REQUEST ===');
                const { access_token: token1 } = req.headers;
                if (!token1 || !deviceId) {
                    return res.status(400).json({ success: false, error: 'Access token and device ID required' });
                }
                
                const status = await callTuyaAPI('GET', `/v1.0/devices/${deviceId}/status`, null, token1);
                res.json({ success: true, data: status });
                break;
                
            case 'device-control':
                console.log('🎮 === DEVICE CONTROL REQUEST ===');
                const { access_token: token2 } = req.headers;
                if (!token2 || !deviceId || !commands) {
                    return res.status(400).json({ success: false, error: 'Access token, device ID and commands required' });
                }
                
                const controlResult = await callTuyaAPI('POST', `/v1.0/devices/${deviceId}/commands`, { commands }, token2);
                res.json({ success: true, data: controlResult });
                break;
                
            default:
                console.log('❌ Invalid action:', action);
                res.status(400).json({ success: false, error: 'Invalid action' });
        }
        
    } catch (error) {
        console.error('❌ === HANDLER ERROR ===');
        console.error('❌ Error:', error);
        console.error('❌ Stack:', error.stack);
        
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: 'Check Vercel logs for details',
            timestamp: new Date().toISOString()
        });
    }
};