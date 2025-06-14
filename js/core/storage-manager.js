// js/core/storage-manager.js
// Gestionnaire de stockage centralisé - Version corrigée

class StorageManager {
    constructor() {
        this.prefix = 'oweo_';
        this.storage = window.localStorage;
        this.sessionStorage = window.sessionStorage;
        this.cache = new Map();
        this.initialized = false;
    }
    
    /**
     * Initialiser le StorageManager
     */
    init() {
        // Nettoyer les anciennes données si nécessaire
        this.cleanupOldData();
        
        // Charger les données en cache
        this.loadCache();
        
        this.initialized = true;
        console.log('📦 StorageManager initialized');
        
        return Promise.resolve();
    }
    
    /**
     * Sauvegarder une donnée
     */
    set(key, value, options = {}) {
        const fullKey = this.prefix + key;
        const data = {
            value,
            timestamp: Date.now(),
            ttl: options.ttl || null
        };
        
        try {
            const serialized = JSON.stringify(data);
            
            if (options.session) {
                this.sessionStorage.setItem(fullKey, serialized);
            } else {
                this.storage.setItem(fullKey, serialized);
            }
            
            // Mettre en cache
            this.cache.set(key, data);
            
            return true;
        } catch (error) {
            console.error('StorageManager: Error saving data:', error);
            
            // Si quota dépassé, essayer de nettoyer
            if (error.name === 'QuotaExceededError') {
                this.cleanup();
                // Réessayer une fois
                try {
                    const serialized = JSON.stringify(data);
                    this.storage.setItem(fullKey, serialized);
                    this.cache.set(key, data);
                    return true;
                } catch (retryError) {
                    console.error('StorageManager: Retry failed:', retryError);
                }
            }
            
            return false;
        }
    }
    
    /**
     * Récupérer une donnée
     */
    get(key, defaultValue = null) {
        // Vérifier le cache d'abord
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            if (this.isValid(cached)) {
                return cached.value;
            } else {
                this.remove(key);
            }
        }
        
        const fullKey = this.prefix + key;
        
        try {
            // Essayer le storage normal puis la session
            let serialized = this.storage.getItem(fullKey);
            if (!serialized) {
                serialized = this.sessionStorage.getItem(fullKey);
            }
            
            if (!serialized) {
                return defaultValue;
            }
            
            // Gérer les anciennes valeurs non-JSON (compatibilité)
            let data;
            try {
                data = JSON.parse(serialized);
            } catch (jsonError) {
                // Si ce n'est pas du JSON valide, c'est probablement une ancienne valeur
                console.warn(`StorageManager: Migrating old value for key '${key}'`);
                
                // Migrer vers le nouveau format
                data = {
                    value: serialized,
                    timestamp: Date.now(),
                    ttl: null
                };
                
                // Sauvegarder au nouveau format
                this.set(key, serialized);
            }
            
            // Vérifier si c'est le nouveau format avec value/timestamp
            if (data && typeof data === 'object' && 'value' in data) {
                // Nouveau format
                if (this.isValid(data)) {
                    // Mettre en cache
                    this.cache.set(key, data);
                    return data.value;
                } else {
                    // Supprimer si expiré
                    this.remove(key);
                    return defaultValue;
                }
            } else {
                // Ancien format ou format invalide
                console.warn(`StorageManager: Invalid data format for key '${key}', returning as-is`);
                return data || defaultValue;
            }
            
        } catch (error) {
            console.error('StorageManager: Error getting data:', error);
            return defaultValue;
        }
    }
    
    /**
     * Supprimer une donnée
     */
    remove(key) {
        const fullKey = this.prefix + key;
        this.storage.removeItem(fullKey);
        this.sessionStorage.removeItem(fullKey);
        this.cache.delete(key);
    }
    
    /**
     * Vider tout le stockage
     */
    clear() {
        // Supprimer seulement les clés avec notre préfixe
        const keys = this.getAllKeys();
        keys.forEach(key => {
            this.storage.removeItem(this.prefix + key);
            this.sessionStorage.removeItem(this.prefix + key);
        });
        
        this.cache.clear();
    }
    
    /**
     * Obtenir toutes les clés
     */
    getAllKeys() {
        const keys = new Set();
        
        // Storage normal
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.add(key.substring(this.prefix.length));
            }
        }
        
        // Session storage
        for (let i = 0; i < this.sessionStorage.length; i++) {
            const key = this.sessionStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.add(key.substring(this.prefix.length));
            }
        }
        
        return Array.from(keys);
    }
    
    /**
     * Vérifier si une donnée est valide (non expirée)
     */
    isValid(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // Si pas de timestamp, considérer comme invalide (ancien format)
        if (!('timestamp' in data)) {
            return false;
        }
        
        if (data.ttl) {
            const age = Date.now() - data.timestamp;
            return age < data.ttl;
        }
        
        return true;
    }
    
    /**
     * Nettoyer les données expirées
     */
    cleanup() {
        console.log('🧹 StorageManager: Cleaning up expired data...');
        
        const keys = this.getAllKeys();
        let removed = 0;
        
        keys.forEach(key => {
            const data = this.get(key);
            if (data === null) {
                removed++;
            }
        });
        
        console.log(`🧹 StorageManager: Removed ${removed} expired items`);
    }
    
    /**
     * Nettoyer les anciennes données (migration)
     */
    cleanupOldData() {
        // Supprimer les anciennes clés sans préfixe si nécessaire
        const oldKeys = ['theme', 'user', 'settings'];
        oldKeys.forEach(key => {
            if (this.storage.getItem(key)) {
                console.log(`🧹 Migrating old key: ${key}`);
                const value = this.storage.getItem(key);
                this.set(key, value); // Sauvegarder avec le nouveau format
                this.storage.removeItem(key); // Supprimer l'ancienne clé
            }
        });
        
        // Nettoyer spécifiquement l'ancien format du thème
        const oldThemeKey = 'oweo_theme';
        const oldThemeValue = this.storage.getItem(oldThemeKey);
        if (oldThemeValue && !oldThemeValue.startsWith('{')) {
            console.log('🧹 Migrating old theme format');
            this.storage.removeItem(oldThemeKey);
            // Le ThemeManager définira la nouvelle valeur
        }
    }
    
    /**
     * Charger le cache initial
     */
    loadCache() {
        // Précharger certaines clés importantes
        const importantKeys = ['theme', 'user_preferences', 'auth_token'];
        importantKeys.forEach(key => {
            try {
                this.get(key); // Cela va mettre en cache et migrer si nécessaire
            } catch (error) {
                console.warn(`Failed to load cache for key: ${key}`, error);
            }
        });
    }
    
    /**
     * Obtenir la taille utilisée
     */
    getSize() {
        let size = 0;
        
        const keys = this.getAllKeys();
        keys.forEach(key => {
            const fullKey = this.prefix + key;
            const value = this.storage.getItem(fullKey) || this.sessionStorage.getItem(fullKey);
            if (value) {
                size += value.length + fullKey.length;
            }
        });
        
        return {
            bytes: size,
            kb: (size / 1024).toFixed(2),
            mb: (size / 1024 / 1024).toFixed(2)
        };
    }
    
    /**
     * Obtenir les statistiques
     */
    getStats() {
        const keys = this.getAllKeys();
        const size = this.getSize();
        
        return {
            totalKeys: keys.length,
            cacheSize: this.cache.size,
            storageSize: size,
            initialized: this.initialized
        };
    }
}

// Créer l'instance globale
window.StorageManager = new StorageManager();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}