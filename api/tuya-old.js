// Proxy API Vercel pour contourner CORS avec Tuya Smart
const crypto = require('crypto');
// Utiliser fetch natif de Node.js 18+ (pas de require nécessaire)

const TUYA_CONFIG = {
    ACCESS_ID: 'gmxydg3hn4fgxkkxgkjw',
    SECRET: '2d58fdf6bf474081b168e9114435ab8d', 
    BASE_URL: 'https://openapi.tuyaus.com',
    DATA_CENTER: 'us'
};

/**
 * Générer la signature HMAC-SHA256 pour l'authentification Tuya
 */
function generateSignature(clientId, timestamp, nonce, signStr, secret) {
    const str = clientId + timestamp + nonce + signStr;
    return crypto.createHmac('sha256', secret).update(str, 'utf8').digest('hex').toUpperCase();
}

/**
 * Générer les headers d'authentification Tuya
 */
function generateHeaders(method, url, body = '', accessToken = '') {
    const timestamp = Date.now().toString();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    // Construction du string à signer
    let signUrl = url.replace(TUYA_CONFIG.BASE_URL, '');
    const bodyHash = crypto.createHash('sha256').update(body || '', 'utf8').digest('hex');
    const stringToSign = method + '\n' + bodyHash + '\n' + '\n' + signUrl;
    
    // Génération signature
    const sign = generateSignature(
        TUYA_CONFIG.ACCESS_ID,
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
    
    if (accessToken) {
        headers['access_token'] = accessToken;
    }
    
    return headers;
}

/**
 * Effectuer un appel API vers Tuya
 */
async function callTuyaAPI(method, endpoint, body = null, accessToken = '') {
    const url = `${TUYA_CONFIG.BASE_URL}${endpoint}`;
    const bodyStr = body ? JSON.stringify(body) : '';
    
    console.log('🌐 Tuya API Call:', method, endpoint, accessToken ? 'with token' : 'no token');
    
    const headers = generateHeaders(method, url, bodyStr, accessToken);
    
    const response = await fetch(url, {
        method,
        headers,
        body: method === 'GET' ? undefined : bodyStr
    });
    
    const data = await response.json();
    console.log('📥 Tuya Response:', data);
    
    if (!data.success) {
        throw new Error(`Tuya API Error: ${data.msg || 'Unknown error'} (Code: ${data.code})`);
    }
    
    return data.result;
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
    
    console.log('🔍 API Request:', req.method, req.url, req.query);
    
    try {
        const { action, deviceId } = req.query;
        const { commands } = req.body || {};
        
        switch (action) {
            case 'auth':
                // Authentification - obtenir le token
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
                // Lister les appareils
                console.log('📱 Devices list request');
                const { access_token } = req.headers;
                if (!access_token) {
                    return res.status(401).json({ success: false, error: 'Access token required' });
                }
                
                const devices = await callTuyaAPI('GET', '/v1.0/users/me/devices', null, access_token);
                res.json({ success: true, data: devices });
                break;
                
            case 'device-status':
                // Obtenir le statut d'un appareil
                console.log('📊 Device status request for:', deviceId);
                const { access_token: token1 } = req.headers;
                if (!token1 || !deviceId) {
                    return res.status(400).json({ success: false, error: 'Access token and device ID required' });
                }
                
                const status = await callTuyaAPI('GET', `/v1.0/devices/${deviceId}/status`, null, token1);
                res.json({ success: true, data: status });
                break;
                
            case 'device-control':
                // Contrôler un appareil
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
                res.status(400).json({ success: false, error: 'Invalid action' });
        }
        
    } catch (error) {
        console.error('❌ Tuya Proxy Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};