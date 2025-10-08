// Proxy API Vercel pour Tuya Smart - Version HTTP native
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

const TUYA_CONFIG = {
    ACCESS_ID: 'gmxydg3hn4fgxkkxgkjw',
    SECRET: '2d58fdf6bf474081b168e9114435ab8d', 
    BASE_URL: 'openapi.tuyaus.com',
    DATA_CENTER: 'us'
};

/**
 * Générer la signature HMAC-SHA256 pour l'authentification Tuya
 * Format exact: client_id + access_token (si présent) + timestamp + nonce + stringToSign
 */
function generateTuyaSignature(clientId, accessToken, timestamp, nonce, stringToSign, secret) {
    // Construction correcte selon documentation Tuya
    const signatureString = clientId + (accessToken || '') + timestamp + nonce + stringToSign;
    console.log('🔐 Signature String:', signatureString);
    console.log('🔐 Secret (partial):', secret.substring(0, 8) + '...');
    
    const signature = crypto.createHmac('sha256', secret).update(signatureString, 'utf8').digest('hex').toUpperCase();
    console.log('🔐 Generated Signature:', signature);
    
    return signature;
}

/**
 * Effectuer un appel HTTPS vers Tuya avec le module natif
 */
function callTuyaAPI(method, path, body = null, accessToken = '') {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now().toString();
        const nonce = Math.random().toString(36).substring(2, 15);
        
        // Construction du string à signer selon documentation Tuya
        const bodyStr = body ? JSON.stringify(body) : '';
        const bodyHash = crypto.createHash('sha256').update(bodyStr, 'utf8').digest('hex');
        const stringToSign = method + '\n' + bodyHash + '\n' + '\n' + path;
        
        console.log('📝 Method:', method);
        console.log('📝 Path:', path);
        console.log('📝 Body Hash:', bodyHash);
        console.log('📝 String to Sign:', stringToSign);
        
        // Génération signature avec le bon format
        const sign = generateTuyaSignature(
            TUYA_CONFIG.ACCESS_ID,
            accessToken,
            timestamp,
            nonce,
            stringToSign,
            TUYA_CONFIG.SECRET
        );
        
        const headers = {
            'client_id': TUYA_CONFIG.ACCESS_ID,
            'sign': sign,
            'sign_method': 'HMAC-SHA256',
            't': timestamp,
            'nonce': nonce,
            'Content-Type': 'application/json'
        };
        
        // Ajouter Content-Length seulement pour les requêtes avec body
        if (bodyStr && method !== 'GET') {
            headers['Content-Length'] = Buffer.byteLength(bodyStr, 'utf8');
        }
        
        if (accessToken) {
            headers['access_token'] = accessToken;
        }
        
        console.log('🌐 Tuya HTTPS Call:', method, path, accessToken ? 'with token' : 'no token');
        console.log('🔑 Headers:', headers);
        
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
                try {
                    console.log('📥 Tuya Response Status:', res.statusCode);
                    console.log('📥 Tuya Response Data:', data);
                    
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

// Handler principal de l'API
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
    
    console.log('🔍 API Request:', {
        method: req.method,
        url: req.url,
        query: req.query,
        timestamp: new Date().toISOString()
    });
    
    try {
        const { action, deviceId } = req.query;
        const { commands } = req.body || {};
        
        switch (action) {
            case 'auth':
                console.log('🔑 Authentication request starting...');
                console.log('🔑 Tuya Config:', { 
                    ACCESS_ID: TUYA_CONFIG.ACCESS_ID, 
                    BASE_URL: TUYA_CONFIG.BASE_URL 
                });
                
                try {
                    const authData = await callTuyaAPI('GET', '/v1.0/token?grant_type=1');
                    console.log('🔑 Auth successful:', authData);
                    
                    res.json({ 
                        success: true, 
                        data: {
                            access_token: authData.access_token,
                            expire_time: authData.expire_time
                        }
                    });
                } catch (authError) {
                    console.error('🔑 Auth failed:', authError);
                    throw authError;
                }
                break;
                
            case 'devices':
                console.log('📱 Devices list request');
                const { access_token } = req.headers;
                if (!access_token) {
                    return res.status(401).json({ success: false, error: 'Access token required' });
                }
                
                const devices = await callTuyaAPI('GET', '/v1.0/users/me/devices', null, access_token);
                res.json({ success: true, data: devices });
                break;
                
            case 'device-status':
                console.log('📊 Device status request for:', deviceId);
                const { access_token: token1 } = req.headers;
                if (!token1 || !deviceId) {
                    return res.status(400).json({ success: false, error: 'Access token and device ID required' });
                }
                
                const status = await callTuyaAPI('GET', `/v1.0/devices/${deviceId}/status`, null, token1);
                res.json({ success: true, data: status });
                break;
                
            case 'device-control':
                console.log('🎮 Device control request for:', deviceId, commands);
                const { access_token: token2 } = req.headers;
                if (!token2 || !deviceId || !commands) {
                    return res.status(400).json({ success: false, error: 'Access token, device ID and commands required' });
                }
                
                const controlResult = await callTuyaAPI('POST', `/v1.0/devices/${deviceId}/commands`, { commands }, token2);
                res.json({ success: true, data: controlResult });
                break;
                
            default:
                console.log('❌ Invalid action:', action);
                res.status(400).json({ success: false, error: 'Invalid action. Supported: auth, devices, device-status, device-control' });
        }
        
    } catch (error) {
        console.error('❌ Tuya Proxy Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
};