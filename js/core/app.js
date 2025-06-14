// js/core/app.js
// Application principale Oweo - version adaptative

class OweoApp {
    constructor() {
        this.config = window.APP_CONFIG || {};
        this.router = null;
        this.isInitialized = false;
        this.components = {};
        
        // Détecter le mode de déploiement
        this.isProduction = !window.location.hostname.includes('localhost') && window.location.protocol !== 'file:';
        this.basePath = this.detectBasePath();
    }
    
    detectBasePath() {
        const path = window.location.pathname;
        
        if (path.endsWith('index.html')) {
            return path.substring(0, path.lastIndexOf('/'));
        }
        
        if (path.endsWith('/')) {
            return path.slice(0, -1);
        }
        
        return path;
    }
    
    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }
        
        console.log('🚀 Initializing Oweo App...');
        console.log('📍 Base path:', this.basePath);
        console.log('🌐 Production mode:', this.isProduction);
        
        try {
            // 1. Initialiser les services globaux
            await this.initializeServices();
            
            // 2. Initialiser les composants UI
            await this.initializeComponents();
            
            // 3. Initialiser le routeur
            await this.initializeRouter();
            
            // 4. Marquer comme initialisé
            this.isInitialized = true;
            
            // 5. Émettre l'événement
            if (window.EventBus) {
                window.EventBus.emit('app:initialized');
            }
            
            console.log('✅ App initialized successfully');
            
            // 6. Retirer le loading
            const appContainer = document.getElementById('app');
            if (appContainer) {
                appContainer.classList.remove('loading');
                appContainer.classList.add('loaded');
            }
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showErrorPage(error);
        }
    }
    
    async initializeServices() {
        console.log('🔧 Initializing services...');
        
        const services = [
            { name: 'StorageManager', instance: window.StorageManager, required: true },
            { name: 'CookieManager', instance: window.CookieManager, required: false },
            { name: 'ThemeManager', instance: window.ThemeManager, required: true },
            { name: 'NotificationService', instance: window.NotificationService, required: false },
            { name: 'AuthManager', instance: window.AuthManager, required: false },
            { name: 'LayoutManager', instance: window.LayoutManager, required: false }
        ];
        
        for (const service of services) {
            if (service.instance && typeof service.instance.init === 'function') {
                try {
                    console.log(`  Initializing ${service.name}...`);
                    await service.instance.init();
                } catch (error) {
                    console.warn(`  ⚠️ Failed to initialize ${service.name}:`, error);
                    if (service.required) {
                        throw error;
                    }
                }
            } else if (service.required) {
                console.warn(`  ⚠️ ${service.name} not found or has no init method`);
            }
        }
    }
    
    async initializeComponents() {
        console.log('🧩 Initializing components...');
        
        // Navbar
        const navbarContainer = document.getElementById('navbar');
        if (navbarContainer && window.Navbar) {
            try {
                const navbar = new window.Navbar({ container: navbarContainer });
                await navbar.render();
                this.components.navbar = navbar;
                console.log('  ✅ Navbar initialized');
            } catch (error) {
                console.error('  ❌ Failed to initialize Navbar:', error);
            }
        }
        
        // Footer
        const footerContainer = document.getElementById('footer');
        if (footerContainer && window.Footer) {
            try {
                const footer = new window.Footer({ container: footerContainer });
                await footer.render();
                this.components.footer = footer;
                console.log('  ✅ Footer initialized');
            } catch (error) {
                console.error('  ❌ Failed to initialize Footer:', error);
            }
        }
    }
    
    async initializeRouter() {
        console.log('🛣️ Initializing router...');
        
        if (!window.OweoRouter) {
            console.error('  ❌ OweoRouter not found, navigation will not work');
            this.showStaticHomePage();
            return;
        }
        
        // Créer l'instance du router
        this.router = new window.OweoRouter();
        
        // Enregistrer les routes
        this.registerRoutes();
        
        // Initialiser le router
        const appContainer = document.getElementById('app');
        this.router.init(appContainer);
        
        console.log('  ✅ Router initialized');
    }
    
    registerRoutes() {
        if (!this.router) return;
        
        // Page d'accueil - gérer plusieurs variantes
        const homeHandler = async (container) => {
            if (window.HomePage) {
                const page = new window.HomePage();
                await page.render(container);
            } else {
                container.innerHTML = `
                    <div class="home-page" style="text-align: center; padding: 4rem;">
                        <h1>Bienvenue sur Oweo</h1>
                        <p>Solutions ERP pour la charpente métallique</p>
                        <div style="margin-top: 2rem;">
                            <a href="${this.router.useHashRouting ? '#/services' : '/services'}" class="btn btn-primary">
                                Découvrir nos services
                            </a>
                        </div>
                    </div>
                `;
            }
        };
        
        // Enregistrer plusieurs chemins pour la page d'accueil
        this.router.register('/', homeHandler);
        this.router.register('/home', homeHandler);
        this.router.register('/index', homeHandler);
        
        // Autres pages
        const pages = [
            { path: '/dashboard', class: 'DashboardPage', requiresAuth: true },
            { path: '/services', class: 'ServicesPage' },
            { path: '/contact', class: 'ContactPage' },
            { path: '/login', class: 'AuthPage' },
            { path: '/register', class: 'AuthPage' }
        ];
        
        pages.forEach(({ path, class: pageClass, requiresAuth }) => {
            this.router.register(path, async (container) => {
                // Vérifier l'authentification si nécessaire
                if (requiresAuth && window.AuthManager && !window.AuthManager.isLoggedIn()) {
                    console.warn(`  ⚠️ Authentication required for ${path}`);
                    this.router.navigate('/login');
                    return;
                }
                
                if (window[pageClass]) {
                    try {
                        const page = new window[pageClass]();
                        await page.render(container);
                        console.log(`  ✅ Page rendered: ${path} -> ${pageClass}`);
                    } catch (error) {
                        console.error(`  ❌ Error rendering ${pageClass}:`, error);
                        container.innerHTML = `
                            <div class="error-container" style="padding: 2rem;">
                                <h2>Erreur de chargement</h2>
                                <p>La page "${pageClass}" n'a pas pu être chargée.</p>
                                <p style="color: var(--error, #dc2626);">${error.message}</p>
                            </div>
                        `;
                    }
                } else {
                    console.warn(`  ⚠️ Page class not found: ${pageClass}`);
                    container.innerHTML = `
                        <div class="page-not-found" style="text-align: center; padding: 4rem;">
                            <h1>Page en construction</h1>
                            <p>La page "${pageClass}" n'est pas encore disponible.</p>
                            <a href="${this.router.useHashRouting ? '#/' : '/'}" class="btn btn-primary" style="margin-top: 1rem;">
                                Retour à l'accueil
                            </a>
                        </div>
                    `;
                }
            });
        });
        
        console.log(`  📍 Registered ${pages.length + 3} routes`);
    }
    
    showStaticHomePage() {
        const container = document.getElementById('app');
        if (container) {
            if (window.HomePage) {
                const homePage = new window.HomePage();
                homePage.render(container);
            } else {
                container.innerHTML = `
                    <div class="static-home" style="padding: 4rem;">
                        <h1>Oweo - Solutions ERP</h1>
                        <p>Navigation non disponible. Veuillez recharger la page.</p>
                        <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                            Recharger
                        </button>
                    </div>
                `;
            }
        }
    }
    
    showErrorPage(error) {
        const container = document.getElementById('app');
        if (container) {
            container.innerHTML = `
                <div class="error-page" style="text-align: center; padding: 4rem;">
                    <h1 style="color: #dc2626;">Erreur</h1>
                    <p>Une erreur s'est produite lors du chargement de l'application.</p>
                    <details style="margin-top: 2rem; max-width: 600px; margin-left: auto; margin-right: auto;">
                        <summary style="cursor: pointer;">Détails techniques</summary>
                        <pre style="text-align: left; background: #f3f4f6; padding: 1rem; margin-top: 1rem; overflow: auto;">
${error.stack || error.message}

Base Path: ${this.basePath}
Production: ${this.isProduction}
URL: ${window.location.href}
                        </pre>
                    </details>
                    <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 2rem;">
                        Recharger
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Obtenir l'URL complète pour une ressource
     */
    getResourceUrl(path) {
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
            return path;
        }
        
        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        
        return this.basePath + '/' + path;
    }
}

// Exposer la CLASSE globalement
window.OweoApp = OweoApp;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OweoApp;
}