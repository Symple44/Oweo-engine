// js/config/app-config.js
// Configuration centralisée de l'application Oweo

window.APP_CONFIG = {
    // ========================================
    // Informations générales
    // ========================================
    app: {
        name: 'Oweo',
        version: '2.0.0',
        description: 'Solutions ERP pour la charpente métallique',
        author: 'Oweo Consulting',
        copyright: '© 2025 Oweo. Tous droits réservés.'
    },
    
    // ========================================
    // API Configuration
    // ========================================
    api: {
        // Utiliser une URL par défaut si non définie
        baseUrl: window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/v1' 
            : 'https://api.oweo-consulting.fr/v1',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        
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
        aiAssistant: false
    },
    
    // ========================================
    // Développement
    // ========================================
    dev: {
        debug: window.location.hostname === 'localhost' || window.location.protocol === 'file:',
        logLevel: 'info', // 'error' | 'warn' | 'info' | 'debug'
        mockAPI: false,
        showDevTools: true
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