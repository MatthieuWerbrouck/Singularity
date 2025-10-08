// Test API simple pour diagnostiquer
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
    
    console.log('🔍 Test API Request:', {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: req.headers
    });
    
    try {
        // Test simple qui ne nécessite pas node-fetch
        res.json({ 
            success: true, 
            message: 'Test API works!',
            method: req.method,
            query: req.query,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Test API Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack
        });
    }
};