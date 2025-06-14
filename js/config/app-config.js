// js/config/app-config.js
// Configuration centralisée adaptative de l'application Oweo

// Fonction pour détecter l'environnement et les chemins
function detectEnvironment() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const pathname = window.location.pathname;
    
    // Détecter le chemin de base
    let basePath = '';
    if (pathname.endsWith('index.html')) {
        basePath = pathname.substring(0, pathname.lastIndexOf('/'));
    } else if (pathname.endsWith('/')) {
        basePath = pathname.slice(0, -1);
    } else {
        basePath = pathname;
    }
    
    // Détecter l'environnement
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || protocol === 'file:';
    const isDev = isLocal || hostname.includes('dev') || hostname.includes('staging');
    const isProd = !isDev;
    
    return {
        isLocal,
        isDev,
        isProd,
        protocol,
        hostname,
        basePath,
        baseUrl: window.location.origin + basePath
    };
}

const ENV = detectEnvironment();

window.APP_CONFIG = {
    // ========================================
    // Informations générales
    // ========================================
    app: {
        name: 'Oweo',
        version: '2.0.0',
        description: 'Solutions ERP pour la charpente métallique',
        author: 'Oweo Consulting',
        copyright: '© 2025 Oweo. Tous droits réservés.',
        company: 'Oweo',
        environment: ENV
    },
    
    // ========================================
    // API Configuration
    // ========================================
    api: {
        // URL de l'API adaptative selon l'environnement
        baseUrl: ENV.isLocal 
            ? 'http://localhost:3000/api/v1' 
            : `${window.location.origin}/api/v1`,
        
        // Alternative si l'API est sur un autre domaine
        // baseUrl: 'https://api.oweo-consulting.fr/v1',
        
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        
        // Headers par défaut
        headers: {
            'X-App-Version': '2.0.0',
            'X-Client-Type': 'web'
        },
        
        endpoints: {
            // Auth
            login: '/auth/login',
            logout: '/auth/logout',
            register: '/auth/register',
            refresh: '/auth/refresh',
            profile: '/auth/profile',
            forgotPassword: '/auth/forgot-password',
            resetPassword: '/auth/reset-password',
            
            // Users
            users: '/users',
            user: '/users/:id',
            updateProfile: '/users/profile',
            changePassword: '/users/change-password',
            
            // Projects
            projects: '/projects',
            project: '/projects/:id',
            projectDocuments: '/projects/:id/documents',
            
            // Chiffrage
            quotes: '/quotes',
            quote: '/quotes/:id',
            quoteTemplates: '/quotes/templates',
            
            // DSTV
            dstvImport: '/dstv/import',
            dstvExport: '/dstv/export',
            dstvValidate: '/dstv/validate',
            
            // Documents
            upload: '/documents/upload',
            download: '/documents/:id/download',
            
            // Analytics
            analytics: '/analytics',
            dashboardStats: '/analytics/dashboard'
        }
    },
    
    // ========================================
    // Chemins et URLs
    // ========================================
    paths: {
        base: ENV.basePath,
        assets: ENV.basePath + '/assets',
        images: ENV.basePath + '/assets/images',
        css: ENV.basePath + '/css',
        js: ENV.basePath + '/js',
        
        // Méthode helper pour obtenir une URL complète
        getUrl: function(path) {
            if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
                return path;
            }
            if (!path.startsWith('/')) {
                path = '/' + path;
            }
            return ENV.basePath + path;
        }
    },
    
    // ========================================
    // Contact (exemple)
    // ========================================
    contact: {
        email: 'contact@oweo-consulting.fr',
        phone: '+33 1 23 45 67 89',
        address: {
            street: '123 Rue de l\'Innovation',
            postalCode: '75001',
            city: 'Paris',
            country: 'France'
        }
    },
    
    // ========================================
    // Authentification
    // ========================================
    auth: {
        tokenKey: 'oweo_auth_token',
        refreshTokenKey: 'oweo_refresh_token',
        userKey: 'oweo_user',
        
        tokenRefreshInterval: 15 * 60 * 1000, // 15 minutes
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 jours
        
        // Routes protégées
        protectedRoutes: [
            '/dashboard',
            '/projects',
            '/quotes',
            '/settings',
            '/profile'
        ],
        
        // Route de redirection après login
        loginRedirect: '/dashboard',
        logoutRedirect: '/'
    },
    
    // ========================================
    // Stockage
    // ========================================
    storage: {
        prefix: 'oweo_',
        enableCompression: true,
        enableEncryption: false,
        
        // Taille max en bytes
        maxSize: {
            localStorage: 5 * 1024 * 1024, // 5MB
            sessionStorage: 10 * 1024 * 1024 // 10MB
        },
        
        // TTL par défaut en ms
        defaultTTL: {
            cache: 5 * 60 * 1000, // 5 minutes
            user: 24 * 60 * 60 * 1000, // 24 heures
            settings: null // Permanent
        }
    },
    
    // ========================================
    // UI/UX Configuration
    // ========================================
    ui: {
        theme: {
            default: 'light',
            available: ['light', 'dark', 'oweo'],
            storageKey: 'oweo_theme'
        },
        
        animations: {
            enabled: true,
            duration: {
                fast: 200,
                normal: 300,
                slow: 600
            }
        },
        
        notifications: {
            position: 'top-right',
            duration: 5000,
            maxStack: 3
        },
        
        layout: {
            default: 'horizontal',
            available: ['horizontal', 'vertical'],
            sidebarCollapsed: false
        },
        
        pagination: {
            defaultPageSize: 20,
            pageSizeOptions: [10, 20, 50, 100]
        }
    },
    
    // ========================================
    // Features Flags
    // ========================================
    features: {
        demos: true,
        analytics: true,
        notifications: true,
        darkMode: true,
        multiLanguage: false,
        advancedSearch: true,
        exportPDF: true,
        exportExcel: true,
        collaboration: false,
        aiAssistant: false,
        
        // Mode hash pour le routeur (utile pour les déploiements statiques)
        hashRouting: ENV.protocol === 'file:' || window.location.search.includes('hash=true')
    },
    
    // ========================================
    // Développement
    // ========================================
    dev: {
        debug: ENV.isDev,
        logLevel: ENV.isProd ? 'error' : 'info',
        mockAPI: false,
        showDevTools: ENV.isDev
    }
};

// Helper pour obtenir une configuration
window.getConfig = function(path, defaultValue = null) {
    const keys = path.split('.');
    let value = window.APP_CONFIG;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return defaultValue;
        }
    }
    
    return value;
};

// Helper pour définir une configuration
window.setConfig = function(path, value) {
    const keys = path.split('.');
    let config = window.APP_CONFIG;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!config[key] || typeof config[key] !== 'object') {
            config[key] = {};
        }
        config = config[key];
    }
    
    config[keys[keys.length - 1]] = value;
};

// Logger conditionnel
window.log = {
    error: (...args) => {
        console.error(...args);
    },
    warn: (...args) => {
        if (['warn', 'info', 'debug'].includes(window.APP_CONFIG.dev.logLevel)) {
            console.warn(...args);
        }
    },
    info: (...args) => {
        if (['info', 'debug'].includes(window.APP_CONFIG.dev.logLevel)) {
            console.info(...args);
        }
    },
    debug: (...args) => {
        if (window.APP_CONFIG.dev.logLevel === 'debug') {
            console.log(...args);
        }
    }
};

// Afficher les informations de configuration au chargement
console.log('🚀 Oweo Config loaded:', {
    version: window.APP_CONFIG.app.version,
    environment: ENV,
    apiUrl: window.APP_CONFIG.api.baseUrl,
    debug: window.APP_CONFIG.dev.debug
});