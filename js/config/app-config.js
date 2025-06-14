// js/config/app.config.js
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
        baseUrl: process.env.API_URL || 'https://api.oweo-consulting.fr/v1',
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
        
        passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true
        },
        
        oauth: {
            providers: ['google', 'microsoft'],
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID || '',
                scope: 'email profile'
            },
            microsoft: {
                clientId: process.env.MICROSOFT_CLIENT_ID || '',
                scope: 'openid profile email'
            }
        }
    },
    
    // ========================================
    // Thèmes et UI
    // ========================================
    ui: {
        theme: {
            default: 'oweo',
            autoDetect: true,
            allowCustomization: true,
            transitionDuration: 300
        },
        
        layout: {
            default: 'horizontal',
            sidebarWidth: 260,
            navbarHeight: 70,
            navbarVerticalWidth: 80,
            navbarVerticalExpandedWidth: 260
        },
        
        animations: {
            enabled: true,
            duration: 300,
            easing: 'ease-in-out'
        },
        
        toasts: {
            position: 'top-right',
            duration: 5000,
            maxVisible: 3
        }
    },
    
    // ========================================
    // Cookies et RGPD
    // ========================================
    cookies: {
        consentKey: 'oweo_cookie_consent',
        consentDuration: 365, // jours
        
        categories: {
            necessary: {
                enabled: true,
                required: true
            },
            analytics: {
                enabled: false,
                required: false
            },
            marketing: {
                enabled: false,
                required: false
            },
            preferences: {
                enabled: false,
                required: false
            }
        },
        
        analytics: {
            ga4: {
                measurementId: process.env.GA_MEASUREMENT_ID || ''
            },
            matomo: {
                siteId: process.env.MATOMO_SITE_ID || '',
                url: process.env.MATOMO_URL || ''
            }
        }
    },
    
    // ========================================
    // Features et permissions
    // ========================================
    features: {
        auth: {
            registration: true,
            socialLogin: true,
            twoFactor: false,
            passwordReset: true
        },
        
        demos: {
            chiffrage: true,
            dstv: true,
            planning: false,
            stock: false
        },
        
        api: {
            caching: true,
            compression: true,
            rateLimit: true
        },
        
        ui: {
            darkMode: true,
            customThemes: true,
            animations: true,
            search: true,
            notifications: true
        }
    },
    
    // ========================================
    // Routes et navigation
    // ========================================
    routes: {
        default: '/home',
        afterLogin: '/dashboard',
        afterLogout: '/home',
        
        public: [
            '/home',
            '/services',
            '/contact',
            '/login',
            '/register',
            '/forgot-password',
            '/privacy',
            '/terms'
        ],
        
        private: [
            '/dashboard',
            '/profile',
            '/projects',
            '/chiffrage',
            '/dstv'
        ],
        
        admin: [
            '/admin',
            '/admin/users',
            '/admin/settings'
        ]
    },
    
    // ========================================
    // Storage
    // ========================================
    storage: {
        prefix: 'oweo_',
        
        keys: {
            theme: 'theme',
            layout: 'layout',
            language: 'language',
            recentProjects: 'recent_projects',
            userPreferences: 'user_preferences'
        },
        
        quotas: {
            localStorage: 5 * 1024 * 1024, // 5MB
            sessionStorage: 5 * 1024 * 1024 // 5MB
        }
    },
    
    // ========================================
    // Internationalisation
    // ========================================
    i18n: {
        defaultLanguage: 'fr',
        supportedLanguages: ['fr', 'en'],
        
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        currency: 'EUR',
        numberFormat: {
            decimal: ',',
            thousand: ' '
        }
    },
    
    // ========================================
    // Contact et support
    // ========================================
    contact: {
        email: 'contact@oweo-consulting.fr',
        phone: '+33 6 86 76 81 31',
        support: 'support@oweo-consulting.fr',
        
        businessHours: {
            days: 'Lundi - Vendredi',
            hours: '8h30 - 18h30',
            timezone: 'Europe/Paris'
        },
        
        social: {
            linkedin: 'https://linkedin.com/company/oweo-consulting',
            twitter: 'https://twitter.com/oweo_consulting'
        }
    },
    
    // ========================================
    // Développement et debug
    // ========================================
    development: {
        debug: process.env.NODE_ENV !== 'production',
        logLevel: process.env.LOG_LEVEL || 'warn',
        
        mockApi: false,
        mockDelay: 1000,
        
        devTools: {
            redux: true,
            vue: false,
            react: false
        }
    },
    
    // ========================================
    // Sécurité
    // ========================================
    security: {
        csp: {
            enabled: true,
            reportOnly: false,
            directives: {
                'default-src': ["'self'"],
                'script-src': ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
                'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                'img-src': ["'self'", 'data:', 'https:'],
                'font-src': ["'self'", 'https://fonts.gstatic.com'],
                'connect-src': ["'self'", 'https://api.oweo-consulting.fr']
            }
        },
        
        headers: {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
    },
    
    // ========================================
    // Performance
    // ========================================
    performance: {
        lazyLoad: {
            images: true,
            components: true,
            threshold: 0.1
        },
        
        cache: {
            enabled: true,
            ttl: 300000, // 5 minutes
            maxSize: 50 * 1024 * 1024 // 50MB
        },
        
        compression: {
            enabled: true,
            threshold: 1024 // 1KB
        }
    },
    
    // ========================================
    // Helpers et méthodes utilitaires
    // ========================================
    
    // Obtenir une valeur de configuration
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    },
    
    // Définir une valeur de configuration
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this;
        
        for (const key of keys) {
            if (!(key in target) || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[lastKey] = value;
    },
    
    // Vérifier si l'app est en développement
    isDevelopment() {
        return this.development.debug || window.location.hostname === 'localhost';
    },
    
    // Vérifier si une feature est activée
    isFeatureEnabled(feature) {
        return this.get(`features.${feature}`, false);
    },
    
    // Obtenir l'URL de l'API complète
    getApiUrl(endpoint) {
        const baseUrl = this.api.baseUrl.replace(/\/$/, '');
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${baseUrl}${cleanEndpoint}`;
    },
    
    // Logger en mode debug
    log(...args) {
        if (this.development.debug) {
            console.log('[APP_CONFIG]', ...args);
        }
    }
};

// ========================================
// Configuration de l'environnement
// ========================================

// Variables d'environnement simulées (en production, utiliser un vrai système)
window.process = window.process || {
    env: {
        NODE_ENV: window.location.hostname === 'localhost' ? 'development' : 'production',
        API_URL: window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/v1' 
            : 'https://api.oweo-consulting.fr/v1',
        LOG_LEVEL: 'info'
    }
};

// ========================================
// Validation de la configuration
// ========================================

(function validateConfig() {
    const required = [
        'app.name',
        'api.baseUrl',
        'auth.tokenKey',
        'routes.default'
    ];
    
    const missing = required.filter(path => !window.APP_CONFIG.get(path));
    
    if (missing.length > 0) {
        console.error('Configuration manquante:', missing);
    } else {
        console.log('✅ Configuration validée');
    }
})();

// Alias global
window.AppConfig = window.APP_CONFIG;