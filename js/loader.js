// js/loader.js
// Chargeur centralisé adaptatif pour tous les modules JavaScript

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
            return './js';
        }
        
        // Pour HTTP(S), obtenir le répertoire actuel
        const currentPath = window.location.pathname;
        
        // Extraire le répertoire (enlever le fichier s'il y en a un)
        let directory = '';
        
        if (currentPath.endsWith('.html') || currentPath.includes('.html')) {
            // Si c'est un fichier HTML, prendre le répertoire parent
            directory = currentPath.substring(0, currentPath.lastIndexOf('/'));
        } else if (currentPath.endsWith('/')) {
            // Si ça se termine par /, enlever le slash final
            directory = currentPath.slice(0, -1);
        } else {
            // Sinon, c'est probablement déjà un répertoire
            directory = currentPath;
        }
        
        // Construire le chemin vers le dossier js
        const jsPath = directory + '/js';
        
        console.log('📁 Detected paths:', {
            currentPath,
            directory,
            jsPath,
            protocol: window.location.protocol,
            host: window.location.host
        });
        
        return jsPath;
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
    
    // Méthode alternative pour charger avec un chemin relatif
    async loadRelativeScript(relativePath) {
        try {
            await this.loadScript(relativePath);
        } catch (error) {
            console.error(`Error loading relative script ${relativePath}:`, error);
            throw error;
        }
    }
    
    // Obtenir le chemin de base de l'application
    getAppBasePath() {
        const currentPath = window.location.pathname;
        
        if (currentPath.endsWith('index.html')) {
            return currentPath.substring(0, currentPath.lastIndexOf('/'));
        } else if (currentPath.endsWith('/')) {
            return currentPath.slice(0, -1);
        }
        
        return currentPath;
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

// Scripts essentiels uniquement (fallback si certains manquent)
const ESSENTIAL_SCRIPTS = [
    'core/event-bus.js',
    'core/component-manager.js',
    'core/router.js',
    'core/app.js',
    'config/app-config.js',
    'utils/dom-utils.js',
    'components/base-component.js',
    'pages/base-page.js',
    'components/navbar.js',
    'components/footer.js',
    'pages/home.js',
    'pages/services.js',
    'pages/contact.js'
];

// Fonction principale de chargement
async function loadApplication() {
    const loader = new ScriptLoader();
    
    console.log('🚀 Loading Oweo Application Scripts...');
    console.log('📁 Base URL:', loader.baseUrl);
    console.log('🌐 Full URL:', window.location.href);
    
    // Détecter si on doit utiliser le mode essentiel
    const useEssentialMode = window.location.search.includes('essential=true');
    const scriptsToLoad = useEssentialMode ? ESSENTIAL_SCRIPTS : APP_SCRIPTS;
    
    try {
        // Charger tous les scripts
        await loader.loadScripts(scriptsToLoad);
        
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
        
        // Si échec avec tous les scripts, essayer avec les essentiels seulement
        if (!useEssentialMode && scriptsToLoad === APP_SCRIPTS) {
            console.warn('⚠️ Retrying with essential scripts only...');
            
            // Recharger la page avec le mode essentiel
            const url = new URL(window.location);
            url.searchParams.set('essential', 'true');
            window.location.href = url.toString();
        } else {
            // Afficher un message d'erreur à l'utilisateur
            showErrorMessage(error);
        }
    }
}

// Fonction pour afficher les erreurs
function showErrorMessage(error) {
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        const baseUrl = new ScriptLoader().baseUrl;
        loadingText.innerHTML = `
            <div style="text-align: center; max-width: 600px; margin: 0 auto;">
                <h3 style="color: var(--error, #ef4444); margin-bottom: 1rem;">
                    Erreur de chargement
                </h3>
                <p style="margin-bottom: 1rem;">
                    L'application n'a pas pu se charger correctement.
                </p>
                <details style="text-align: left; margin: 1rem 0;">
                    <summary style="cursor: pointer; color: var(--primary, #00d4ff);">
                        Détails techniques
                    </summary>
                    <div style="margin-top: 0.5rem; padding: 1rem; background: rgba(0,0,0,0.05); border-radius: 0.5rem;">
                        <p><strong>Erreur:</strong> ${error.message}</p>
                        <p><strong>Base URL détecté:</strong> ${baseUrl}</p>
                        <p><strong>URL actuelle:</strong> ${window.location.href}</p>
                        <p style="margin-top: 0.5rem;">
                            <small>Vérifiez que les fichiers JS sont bien présents dans: <code>${baseUrl}/</code></small>
                        </p>
                    </div>
                </details>
                <div style="margin-top: 1rem;">
                    <button onclick="location.reload()" 
                            style="padding: 0.5rem 1rem; background: var(--primary, #00d4ff); 
                                   color: white; border: none; border-radius: 0.375rem; 
                                   cursor: pointer; margin-right: 0.5rem;">
                        Réessayer
                    </button>
                    <button onclick="loadApplication.essential()" 
                            style="padding: 0.5rem 1rem; background: var(--secondary, #6b7280); 
                                   color: white; border: none; border-radius: 0.375rem; 
                                   cursor: pointer;">
                        Mode minimal
                    </button>
                </div>
            </div>
        `;
    }
}

// Fonction pour charger en mode minimal
loadApplication.essential = function() {
    const url = new URL(window.location);
    url.searchParams.set('essential', 'true');
    window.location.href = url.toString();
};

// Exporter pour utilisation externe si nécessaire
window.ScriptLoader = ScriptLoader;
window.loadApplication = loadApplication;