// js/core/storage-manager.js
// Gestionnaire unifié pour localStorage, sessionStorage et IndexedDB

class StorageManager {
    constructor() {
        this.prefix = 'oweo_';
        this.storage = {
            local: window.localStorage,
            session: window.sessionStorage
        };
        this.db = null;
        this.dbName = 'OweoDatabase';
        this.dbVersion = 1;
        this.cache = new Map();
        this.quotaWarningThreshold = 0.9; // 90% d'utilisation
    }
    
    // ========================================
    // Initialisation
    // ========================================
    
    async init() {
        console.log('💾 Initialisation StorageManager');
        
        // Vérifier le support
        this.checkSupport();
        
        // Initialiser IndexedDB
        await this.initIndexedDB();
        
        // Nettoyer les données expirées
        this.cleanupExpired();
        
        // Vérifier l'espace disponible
        await this.checkQuota();
        
        return this;
    }
    
    checkSupport() {
        this.support = {
            localStorage: this.isStorageAvailable('localStorage'),
            sessionStorage: this.isStorageAvailable('sessionStorage'),
            indexedDB: 'indexedDB' in window
        };
        
        console.log('Storage support:', this.support);
        
        if (!this.support.localStorage) {
            console.warn('LocalStorage non disponible');
        }
    }
    
    isStorageAvailable(type) {
        try {
            const storage = window[type];
            const x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    async initIndexedDB() {
        if (!this.support.indexedDB) return;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Erreur IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialisé');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store pour les données volumineuses
                if (!db.objectStoreNames.contains('largeData')) {
                    const store = db.createObjectStore('largeData', { keyPath: 'key' });
                    store.createIndex('expires', 'expires', { unique: false });
                }
                
                // Store pour les fichiers
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files', { keyPath: 'id' });
                }
                
                // Store pour le cache API
                if (!db.objectStoreNames.contains('apiCache')) {
                    const cache = db.createObjectStore('apiCache', { keyPath: 'url' });
                    cache.createIndex('expires', 'expires', { unique: false });
                }
            };
        });
    }
    
    // ========================================
    // API LocalStorage/SessionStorage
    // ========================================
    
    set(key, value, storage = 'local', options = {}) {
        if (!this.support[storage + 'Storage']) {
            console.warn(`${storage}Storage non disponible`);
            return false;
        }
        
        const prefixedKey = this.prefix + key;
        
        try {
            const data = {
                value,
                timestamp: Date.now(),
                expires: options.expires || null
            };
            
            const serialized = JSON.stringify(data);
            this.storage[storage].setItem(prefixedKey, serialized);
            
            // Mettre à jour le cache
            this.cache.set(prefixedKey, data);
            
            // Émettre un événement
            this.emit('set', { key, value, storage });
            
            return true;
            
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.error('Quota de stockage dépassé');
                this.handleQuotaExceeded(storage);
            } else {
                console.error('Erreur de stockage:', e);
            }
            return false;
        }
    }
    
    get(key, storage = 'local', defaultValue = null) {
        if (!this.support[storage + 'Storage']) {
            return defaultValue;
        }
        
        const prefixedKey = this.prefix + key;
        
        // Vérifier le cache d'abord
        if (this.cache.has(prefixedKey)) {
            const cached = this.cache.get(prefixedKey);
            if (!this.isExpired(cached)) {
                return cached.value;
            } else {
                this.remove(key, storage);
                return defaultValue;
            }
        }
        
        try {
            const item = this.storage[storage].getItem(prefixedKey);
            if (!item) return defaultValue;
            
            const data = JSON.parse(item);
            
            // Vérifier l'expiration
            if (this.isExpired(data)) {
                this.remove(key, storage);
                return defaultValue;
            }
            
            // Mettre en cache
            this.cache.set(prefixedKey, data);
            
            return data.value;
            
        } catch (e) {
            console.error('Erreur de lecture:', e);
            return defaultValue;
        }
    }
    
    remove(key, storage = 'local') {
        if (!this.support[storage + 'Storage']) return;
        
        const prefixedKey = this.prefix + key;
        
        this.storage[storage].removeItem(prefixedKey);
        this.cache.delete(prefixedKey);
        
        this.emit('remove', { key, storage });
    }
    
    clear(storage = 'local') {
        if (!this.support[storage + 'Storage']) return;
        
        // Supprimer uniquement les clés avec notre préfixe
        const keys = this.keys(storage);
        keys.forEach(key => {
            this.remove(key, storage);
        });
        
        this.emit('clear', { storage });
    }
    
    keys(storage = 'local') {
        if (!this.support[storage + 'Storage']) return [];
        
        const keys = [];
        const storageObj = this.storage[storage];
        
        for (let i = 0; i < storageObj.length; i++) {
            const key = storageObj.key(i);
            if (key.startsWith(this.prefix)) {
                keys.push(key.substring(this.prefix.length));
            }
        }
        
        return keys;
    }
    
    // ========================================
    // API IndexedDB pour données volumineuses
    // ========================================
    
    async setLarge(key, value, options = {}) {
        if (!this.db) {
            // Fallback sur localStorage
            return this.set(key, value, 'local', options);
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['largeData'], 'readwrite');
            const store = transaction.objectStore('largeData');
            
            const data = {
                key: this.prefix + key,
                value,
                timestamp: Date.now(),
                expires: options.expires || null
            };
            
            const request = store.put(data);
            
            request.onsuccess = () => {
                this.emit('setLarge', { key, size: this.getSize(value) });
                resolve(true);
            };
            
            request.onerror = () => {
                console.error('Erreur IndexedDB:', request.error);
                reject(request.error);
            };
        });
    }
    
    async getLarge(key, defaultValue = null) {
        if (!this.db) {
            return this.get(key, 'local', defaultValue);
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['largeData'], 'readonly');
            const store = transaction.objectStore('largeData');
            const request = store.get(this.prefix + key);
            
            request.onsuccess = () => {
                const data = request.result;
                
                if (!data) {
                    resolve(defaultValue);
                    return;
                }
                
                if (this.isExpired(data)) {
                    this.removeLarge(key);
                    resolve(defaultValue);
                    return;
                }
                
                resolve(data.value);
            };
            
            request.onerror = () => {
                console.error('Erreur de lecture IndexedDB:', request.error);
                resolve(defaultValue);
            };
        });
    }
    
    async removeLarge(key) {
        if (!this.db) {
            return this.remove(key);
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['largeData'], 'readwrite');
            const store = transaction.objectStore('largeData');
            const request = store.delete(this.prefix + key);
            
            request.onsuccess = () => {
                this.emit('removeLarge', { key });
                resolve(true);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    // ========================================
    // Gestion des fichiers
    // ========================================
    
    async saveFile(id, file, metadata = {}) {
        if (!this.db) {
            throw new Error('IndexedDB non disponible pour les fichiers');
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                const transaction = this.db.transaction(['files'], 'readwrite');
                const store = transaction.objectStore('files');
                
                const data = {
                    id,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: event.target.result,
                    metadata,
                    timestamp: Date.now()
                };
                
                const request = store.put(data);
                
                request.onsuccess = () => {
                    this.emit('fileSaved', { id, name: file.name, size: file.size });
                    resolve(id);
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            };
            
            reader.onerror = () => {
                reject(reader.error);
            };
            
            reader.readAsArrayBuffer(file);
        });
    }
    
    async getFile(id) {
        if (!this.db) {
            throw new Error('IndexedDB non disponible');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(id);
            
            request.onsuccess = () => {
                const data = request.result;
                
                if (!data) {
                    resolve(null);
                    return;
                }
                
                // Recréer le fichier
                const blob = new Blob([data.data], { type: data.type });
                const file = new File([blob], data.name, { type: data.type });
                
                resolve({
                    file,
                    metadata: data.metadata,
                    timestamp: data.timestamp
                });
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
    
    // ========================================
    // Cache API
    // ========================================
    
    async cacheApiResponse(url, response, ttl = 300000) {
        if (!this.db) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['apiCache'], 'readwrite');
            const store = transaction.objectStore('apiCache');
            
            const data = {
                url,
                response,
                timestamp: Date.now(),
                expires: Date.now() + ttl
            };
            
            const request = store.put(data);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getCachedApiResponse(url) {
        if (!this.db) return null;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['apiCache'], 'readonly');
            const store = transaction.objectStore('apiCache');
            const request = store.get(url);
            
            request.onsuccess = () => {
                const data = request.result;
                
                if (!data || this.isExpired(data)) {
                    resolve(null);
                    return;
                }
                
                resolve(data.response);
            };
            
            request.onerror = () => resolve(null);
        });
    }
    
    // ========================================
    // Utilitaires
    // ========================================
    
    isExpired(data) {
        if (!data.expires) return false;
        return Date.now() > data.expires;
    }
    
    cleanupExpired() {
        // Nettoyer localStorage/sessionStorage
        ['local', 'session'].forEach(storage => {
            const keys = this.keys(storage);
            keys.forEach(key => {
                const data = this.get(key, storage);
                // Le get supprime automatiquement si expiré
            });
        });
        
        // Nettoyer IndexedDB
        if (this.db) {
            this.cleanupIndexedDB();
        }
    }
    
    async cleanupIndexedDB() {
        const stores = ['largeData', 'apiCache'];
        
        for (const storeName of stores) {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const index = store.index('expires');
            const range = IDBKeyRange.upperBound(Date.now());
            
            index.openCursor(range).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                }
            };
        }
    }
    
    async checkQuota() {
        if (!navigator.storage || !navigator.storage.estimate) return;
        
        try {
            const estimate = await navigator.storage.estimate();
            const usage = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const percentUsed = (usage / quota);
            
            console.log(`📊 Stockage: ${this.formatBytes(usage)} / ${this.formatBytes(quota)} (${Math.round(percentUsed * 100)}%)`);
            
            if (percentUsed > this.quotaWarningThreshold) {
                console.warn('⚠️ Espace de stockage presque plein');
                this.emit('quotaWarning', { usage, quota, percentUsed });
            }
            
            return { usage, quota, percentUsed };
            
        } catch (e) {
            console.error('Erreur estimation quota:', e);
        }
    }
    
    handleQuotaExceeded(storage) {
        // Stratégie: supprimer les données les plus anciennes
        const items = [];
        const keys = this.keys(storage);
        
        keys.forEach(key => {
            const data = this.get(key, storage);
            if (data) {
                items.push({ key, timestamp: data.timestamp || 0 });
            }
        });
        
        // Trier par ancienneté
        items.sort((a, b) => a.timestamp - b.timestamp);
        
        // Supprimer les 10% les plus anciens
        const toDelete = Math.ceil(items.length * 0.1);
        for (let i = 0; i < toDelete; i++) {
            this.remove(items[i].key, storage);
        }
        
        console.log(`🗑️ ${toDelete} éléments supprimés pour libérer de l'espace`);
    }
    
    getSize(value) {
        const str = JSON.stringify(value);
        return new Blob([str]).size;
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // ========================================
    // Événements
    // ========================================
    
    emit(event, data) {
        // Émettre via l'EventBus global si disponible
        if (window.EventBus) {
            window.EventBus.emit(`storage:${event}`, data);
        }
        
        // Émettre un événement DOM
        window.dispatchEvent(new CustomEvent(`storage:${event}`, { detail: data }));
    }
    
    // ========================================
    // Import/Export
    // ========================================
    
    async exportAll() {
        const data = {
            localStorage: {},
            sessionStorage: {},
            timestamp: Date.now(),
            version: this.dbVersion
        };
        
        // Export localStorage
        this.keys('local').forEach(key => {
            data.localStorage[key] = this.get(key, 'local');
        });
        
        // Export sessionStorage
        this.keys('session').forEach(key => {
            data.sessionStorage[key] = this.get(key, 'session');
        });
        
        return data;
    }
    
    async importAll(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Données invalides');
        }
        
        // Import localStorage
        if (data.localStorage) {
            Object.entries(data.localStorage).forEach(([key, value]) => {
                this.set(key, value, 'local');
            });
        }
        
        // Import sessionStorage
        if (data.sessionStorage) {
            Object.entries(data.sessionStorage).forEach(([key, value]) => {
                this.set(key, value, 'session');
            });
        }
        
        this.emit('imported', { timestamp: data.timestamp });
    }
}

// ========================================
// Instance globale
// ========================================

window.StorageManager = new StorageManager();