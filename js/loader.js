// js/loader.js
// Chargeur centralisé pour tous les modules JavaScript

class ScriptLoader {
    constructor() {
        // Détection automatique du chemin de base
        this.baseUrl = this.detectBaseUrl();
        this.loaded = new Set();
        this.loading = new Map();
    }
    
    detectBaseUrl() {
        // Si on est en local (file://), utiliser des chemins relatifs
        if (window.location.protocol === 'file:') {
            // Pour file://, on doit utiliser le chemin relatif depuis le HTML
            return 'js';
        }
        
        // Si on est sur un serveur local (localhost, 127.0.0.1)
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '') {
            // Trouver le chemin de base du projet
            const pathParts = window.location.pathname.split('/');
            pathParts.pop(); // Enlever le fichier HTML
            const basePath = pathParts.join('/');
            return `${basePath}/js`.replace(/\/+/g, '/');
        }
        
        // Sinon, utiliser le chemin absolu
        return '/js';
    }
    
    async loadScript(src) {
        // Si déjà chargé, on ne recharge pas
        if (this.loaded.has(src)) {
            return Promise.resolve();
        }
        
        // Si en cours de chargement, on retourne la promesse existante
        if (this.loading.has(src)) {
            return this.loading.get(src);
        }
        
        // Créer une nouvelle promesse de chargement
        const loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.type = 'text/javascript';
            
            script.onload = () => {
                this.loaded.add(src);
                this.loading.delete(src);
                console.log(`✅ Loaded: ${src}`);
                resolve();
            };
            
            script.onerror = () => {
                this.loading.delete(src);
                console.error(`❌ Failed to load: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            document.head.appendChild(script);
        });
        
        this.loading.set(src, loadPromise);
        return loadPromise;
    }
    
    async loadScripts(scripts) {
        for (const script of scripts) {
            try {
                // Construire l'URL complète
                const fullPath = `${this.baseUrl}/${script}`;
                await this.loadScript(fullPath);
            } catch (error) {
                console.error(`Error loading ${script}:`, error);
                // Continue avec les autres scripts même si un échoue
            }
        }
    }
}

// Configuration des scripts à charger dans l'ordre
const APP_SCRIPTS = [
    // Core (ordre important)
    'core/event-bus.js',
    'core/storage-manager.js',
    'core/component-manager.js',
    'core/router.js',
    'core/app.js',
    
    // Config
    'config/app-config.js',
    
    // Utils
    'utils/dom-utils.js',
    'utils/animation-utils.js',
    
    // Services
    'services/api.service.js',
    'services/notification.service.js',
    
    // Managers (déjà chargé : theme.manager.js)
    'managers/auth.manager.js',
    'managers/layout.manager.js',
    
    // Components de base
    'components/base-component.js',
    'pages/base-page.js',
    
    // Components UI
    'components/navbar.js',
    'components/footer.js',
    'components/modal.js',
    'components/sidebar.js',
    
    // Pages
    'pages/home.js',
    'pages/dashboard.js',
    'pages/auth.js',
    'pages/services.js',
    'pages/contact.js'
];

// Fonction principale de chargement
async function loadApplication() {
    const loader = new ScriptLoader();
    
    console.log('🚀 Loading Oweo Application Scripts...');
    console.log('📁 Base URL:', loader.baseUrl);
    console.log('🌐 Protocol:', window.location.protocol);
    
    try {
        // Charger tous les scripts
        await loader.loadScripts(APP_SCRIPTS);
        
        console.log('✅ All scripts loaded successfully');
        
        // Initialiser l'application
        if (window.OweoApp) {
            window.app = new window.OweoApp();
            await window.app.init();
            
            // Retirer la classe de chargement
            const appContainer = document.querySelector('.app-container');
            if (appContainer) {
                appContainer.classList.add('loaded');
            }
            
            console.log('✅ Oweo App initialized successfully');
        } else {
            throw new Error('OweoApp not found after loading scripts');
        }
    } catch (error) {
        console.error('❌ Failed to load application:', error);
        
        // Afficher un message d'erreur à l'utilisateur
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.innerHTML = `
                Erreur de chargement de l'application<br>
                <small style="font-size: 0.875rem; opacity: 0.8;">
                    Vérifiez que tous les fichiers JS sont présents dans le dossier js/
                </small>
            `;
            loadingText.style.color = 'var(--error, #ef4444)';
        }
    }
}

// Exporter pour utilisation externe si nécessaire
window.ScriptLoader = ScriptLoader;
window.loadApplication = loadApplication;