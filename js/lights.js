// Module Tuya Smart Lights - Gestion des lumières connectées
import { TUYA_CONFIG } from './config.js';

class TuyaLightManager {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
        this.devices = [];
        this.config = TUYA_CONFIG;
        this.isConnected = false;
        this.apiBase = window.location.origin; // Utiliser notre proxy API
    }

    // === AUTHENTIFICATION TUYA VIA PROXY ===
    
    async authenticate() {
        try {
            console.log('🔐 Authentification via proxy API HTTPS natif...');
            
            const response = await fetch(`${this.apiBase}/api/tuya?action=auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('📡 Response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('� Response error body:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            console.log('📡 Response data:', data);
            
            if (!data.success) {
                throw new Error(`Tuya Auth Error: ${data.error || 'Authentication failed'}`);
            }

            this.accessToken = data.data.access_token;
            this.tokenExpiry = Date.now() + (data.data.expire_time * 1000);
            this.isConnected = true;
            
            console.log('✅ Authentification Tuya réussie via proxy HTTPS');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur connexion Tuya:', error);
            this.isConnected = false;
            throw error;
        }
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
            
            const response = await fetch(`${this.apiBase}/api/tuya?action=devices`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': this.accessToken
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(`Tuya Devices Error: ${data.error || 'Failed to get devices'}`);
            }
            
            // Filtrer uniquement les lumières
            this.devices = (data.data || []).filter(device => 
                device.category === 'dj' || // Lumière
                device.category === 'xdd' || // Bande LED
                device.category === 'fwd' || // Lumière intelligente
                device.name?.toLowerCase().includes('light') ||
                device.name?.toLowerCase().includes('lumière') ||
                device.name?.toLowerCase().includes('lamp')
            );
            
            console.log(`💡 ${this.devices.length} lumière(s) trouvée(s):`, this.devices);
            return this.devices;
            
        } catch (error) {
            console.error('❌ Erreur getDevices:', error);
            throw error;
        }
    }

    async getDeviceStatus(deviceId) {
        try {
            await this.ensureAuthenticated();
            
            const response = await fetch(`${this.apiBase}/api/tuya?action=device-status&deviceId=${deviceId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': this.accessToken
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                console.error('❌ Erreur statut appareil:', data.error);
                return [];
            }
            
            return data.data || [];
            
        } catch (error) {
            console.error('❌ Erreur getDeviceStatus:', error);
            return [];
        }
    }

    // === CONTRÔLE DES LUMIÈRES ===

    async controlDevice(deviceId, commands) {
        try {
            await this.ensureAuthenticated();
            
            const response = await fetch(`${this.apiBase}/api/tuya?action=device-control&deviceId=${deviceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': this.accessToken
                },
                body: JSON.stringify({ commands })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(`Tuya Control Error: ${data.error || 'Command failed'}`);
            }

            console.log('✅ Commande envoyée:', commands);
            return data.data;
            
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