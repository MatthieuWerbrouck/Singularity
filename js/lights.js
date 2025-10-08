// Module Tuya Smart Lights - Gestion des lumières connectées
import { TUYA_CONFIG } from './config.js';

class TuyaLightManager {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
        this.devices = [];
        this.config = TUYA_CONFIG;
        this.isConnected = false;
    }

    // === AUTHENTIFICATION TUYA ===
    
    async authenticate() {
        try {
            const timestamp = Date.now().toString();
            const signString = this.config.accessId + timestamp;
            
            // Générer la signature HMAC-SHA256
            const signature = await this.generateSignature(signString, this.config.accessSecret);
            
            const response = await fetch(`${this.config.baseUrl}/${this.config.version}/token?grant_type=1`, {
                method: 'GET',
                headers: {
                    'client_id': this.config.accessId,
                    't': timestamp,
                    'sign_method': 'HMAC-SHA256',
                    'sign': signature,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success && data.result) {
                this.accessToken = data.result.access_token;
                this.tokenExpiry = Date.now() + (data.result.expire_time * 1000);
                this.isConnected = true;
                console.log('✅ Authentification Tuya réussie');
                return true;
            } else {
                console.error('❌ Erreur authentification Tuya:', data);
                throw new Error(data.msg || 'Authentification échouée');
            }
        } catch (error) {
            console.error('❌ Erreur connexion Tuya:', error);
            this.isConnected = false;
            throw error;
        }
    }

    async generateSignature(stringToSign, secret) {
        // Utiliser Web Crypto API pour générer la signature HMAC-SHA256
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(stringToSign);
        
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
        const hashArray = Array.from(new Uint8Array(signature));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    async ensureAuthenticated() {
        if (!this.accessToken || Date.now() >= this.tokenExpiry - 60000) {
            await this.authenticate();
        }
    }

    // === GESTION DES APPAREILS ===

    async getDevices() {
        try {
            await this.ensureAuthenticated();
            
            const timestamp = Date.now().toString();
            const signString = this.config.accessId + this.accessToken + timestamp;
            const signature = await this.generateSignature(signString, this.config.accessSecret);

            const response = await fetch(`${this.config.baseUrl}/${this.config.version}/devices`, {
                method: 'GET',
                headers: {
                    'client_id': this.config.accessId,
                    'access_token': this.accessToken,
                    't': timestamp,
                    'sign_method': 'HMAC-SHA256',
                    'sign': signature,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success && data.result) {
                // Filtrer uniquement les lumières
                this.devices = data.result.filter(device => 
                    device.category === 'dj' || // Lumière
                    device.category === 'xdd' || // Bande LED
                    device.category === 'fwd' || // Lumière intelligente
                    device.name.toLowerCase().includes('light') ||
                    device.name.toLowerCase().includes('lumière') ||
                    device.name.toLowerCase().includes('lamp')
                );
                
                console.log(`💡 ${this.devices.length} lumière(s) trouvée(s):`, this.devices);
                return this.devices;
            } else {
                console.error('❌ Erreur récupération appareils:', data);
                throw new Error(data.msg || 'Impossible de récupérer les appareils');
            }
        } catch (error) {
            console.error('❌ Erreur getDevices:', error);
            throw error;
        }
    }

    async getDeviceStatus(deviceId) {
        try {
            await this.ensureAuthenticated();
            
            const timestamp = Date.now().toString();
            const url = `/devices/${deviceId}/status`;
            const signString = this.config.accessId + this.accessToken + timestamp + 'GET' + 
                             crypto.createHash ? '' : url; // Simplified for browser
            const signature = await this.generateSignature(signString, this.config.accessSecret);

            const response = await fetch(`${this.config.baseUrl}/${this.config.version}${url}`, {
                method: 'GET',
                headers: {
                    'client_id': this.config.accessId,
                    'access_token': this.accessToken,
                    't': timestamp,
                    'sign_method': 'HMAC-SHA256',
                    'sign': signature,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                return data.result || [];
            } else {
                console.error('❌ Erreur statut appareil:', data);
                return [];
            }
        } catch (error) {
            console.error('❌ Erreur getDeviceStatus:', error);
            return [];
        }
    }

    // === CONTRÔLE DES LUMIÈRES ===

    async controlDevice(deviceId, commands) {
        try {
            await this.ensureAuthenticated();
            
            const timestamp = Date.now().toString();
            const body = JSON.stringify({ commands });
            const url = `/devices/${deviceId}/commands`;
            const signString = this.config.accessId + this.accessToken + timestamp + 'POST' + url + body;
            const signature = await this.generateSignature(signString, this.config.accessSecret);

            const response = await fetch(`${this.config.baseUrl}/${this.config.version}${url}`, {
                method: 'POST',
                headers: {
                    'client_id': this.config.accessId,
                    'access_token': this.accessToken,
                    't': timestamp,
                    'sign_method': 'HMAC-SHA256',
                    'sign': signature,
                    'Content-Type': 'application/json'
                },
                body: body
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Commande envoyée:', commands);
                return data.result;
            } else {
                console.error('❌ Erreur contrôle appareil:', data);
                throw new Error(data.msg || 'Commande échouée');
            }
        } catch (error) {
            console.error('❌ Erreur controlDevice:', error);
            throw error;
        }
    }

    // === COMMANDES SIMPLIFIÉES ===

    async turnOn(deviceId) {
        return this.controlDevice(deviceId, [{ code: 'switch_led', value: true }]);
    }

    async turnOff(deviceId) {
        return this.controlDevice(deviceId, [{ code: 'switch_led', value: false }]);
    }

    async setBrightness(deviceId, brightness) {
        // brightness: 10-1000 (Tuya format)
        const value = Math.max(10, Math.min(1000, brightness));
        return this.controlDevice(deviceId, [{ code: 'bright_value_v2', value }]);
    }

    async setColor(deviceId, hue, saturation, brightness) {
        // Format HSV pour Tuya: { h: 0-360, s: 0-1000, v: 0-1000 }
        const hsv = {
            h: Math.max(0, Math.min(360, hue)),
            s: Math.max(0, Math.min(1000, saturation)),
            v: Math.max(0, Math.min(1000, brightness))
        };
        return this.controlDevice(deviceId, [{ code: 'colour_data_v2', value: hsv }]);
    }

    async setColorTemp(deviceId, temp) {
        // temp: 0-1000 (0=chaud, 1000=froid)
        const value = Math.max(0, Math.min(1000, temp));
        return this.controlDevice(deviceId, [{ code: 'temp_value_v2', value }]);
    }

    // === UTILITAIRES ===

    getDeviceById(deviceId) {
        return this.devices.find(device => device.id === deviceId);
    }

    async refreshDeviceStatus(deviceId) {
        const status = await this.getDeviceStatus(deviceId);
        const device = this.getDeviceById(deviceId);
        if (device) {
            device.status = status;
        }
        return status;
    }

    // Conversion des valeurs Tuya vers des formats plus standard
    tuyaBrightnessToPercent(tuyaValue) {
        // Tuya: 10-1000 -> Pourcentage: 1-100
        return Math.round(((tuyaValue - 10) / 990) * 100);
    }

    percentToTuyaBrightness(percent) {
        // Pourcentage: 1-100 -> Tuya: 10-1000
        return Math.round((percent / 100) * 990 + 10);
    }

    tuyaColorTempToPercent(tuyaValue) {
        // Tuya: 0-1000 -> Pourcentage: 0-100 (0=chaud, 100=froid)
        return Math.round((tuyaValue / 1000) * 100);
    }

    percentToTuyaColorTemp(percent) {
        // Pourcentage: 0-100 -> Tuya: 0-1000
        return Math.round((percent / 100) * 1000);
    }

    // === INFORMATIONS SYSTÈME ===

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            tokenValid: this.accessToken && Date.now() < this.tokenExpiry,
            deviceCount: this.devices.length,
            lastUpdate: new Date().toISOString()
        };
    }
}

// Export pour utilisation
export { TuyaLightManager };