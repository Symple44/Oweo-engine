// ===== js/core/storage-manager.js =====
// Gestionnaire de stockage unifié

class StorageManager {
    constructor() {
        this.prefix = 'oweo_';
    }
    
    get(key, storage = 'local') {
        try {
            const store = storage === 'session' ? sessionStorage : localStorage;
            const value = store.getItem(this.prefix + key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.error('StorageManager get error:', e);
            return null;
        }
    }
    
    set(key, value, storage = 'local') {
        try {
            const store = storage === 'session' ? sessionStorage : localStorage;
            store.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('StorageManager set error:', e);
            return false;
        }
    }
    
    remove(key, storage = 'local') {
        try {
            const store = storage === 'session' ? sessionStorage : localStorage;
            store.removeItem(this.prefix + key);
            return true;
        } catch (e) {
            console.error('StorageManager remove error:', e);
            return false;
        }
    }
    
    clear(storage = 'local') {
        try {
            const store = storage === 'session' ? sessionStorage : localStorage;
            const keys = Object.keys(store);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    store.removeItem(key);
                }
            });
            return true;
        } catch (e) {
            console.error('StorageManager clear error:', e);
            return false;
        }
    }
}

window.StorageManager = new StorageManager();