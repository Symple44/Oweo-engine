// js/core/app.js
// Application principale Oweo - version corrigée

class OweoApp {
    constructor() {
        this.config = window.APP_CONFIG || {};
        this.router = null;
        this.isInitialized = false;
        this.components = {};
    }
    
    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }
        
        console.log('🚀 Initializing Oweo App...');
        
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
                }
            } else if (service.required !== false) {
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
        
        // Page d'accueil
        this.router.register('/', async (container) => {
            if (window.HomePage) {
                const page = new window.HomePage();
                await page.render(container);
            } else {
                container.innerHTML = '<h1>Bienvenue sur Oweo</h1>';
            }
        });
        
        // Autres pages
        const pages = [
            { path: '/home', class: 'HomePage' },
            { path: '/dashboard', class: 'DashboardPage' },
            { path: '/services', class: 'ServicesPage' },
            { path: '/contact', class: 'ContactPage' },
            { path: '/login', class: 'AuthPage' },
            { path: '/register', class: 'AuthPage' }
        ];
        
        pages.forEach(({ path, class: pageClass }) => {
            this.router.register(path, async (container) => {
                if (window[pageClass]) {
                    const page = new window[pageClass]();
                    await page.render(container);
                    console.log(`  ✅ Route registered: ${path} -> ${pageClass}`);
                } else {
                    console.warn(`  ⚠️ Page class not found: ${pageClass}`);
                    container.innerHTML = `<h1>Page "${pageClass}" non trouvée</h1>`;
                }
            });
        });
    }
    
    showStaticHomePage() {
        const container = document.getElementById('app');
        if (container && window.HomePage) {
            const homePage = new window.HomePage();
            homePage.render(container);
        }
    }
    
    showErrorPage(error) {
        const container = document.getElementById('app');
        if (container) {
            container.innerHTML = `
                <div class="error-page" style="text-align: center; padding: 4rem;">
                    <h1 style="color: #dc2626;">Erreur</h1>
                    <p>Une erreur s'est produite lors du chargement de l'application.</p>
                    <details style="margin-top: 2rem;">
                        <summary>Détails techniques</summary>
                        <pre style="text-align: left; background: #f3f4f6; padding: 1rem; margin-top: 1rem;">${error.stack || error.message}</pre>
                    </details>
                    <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 2rem;">
                        Recharger
                    </button>
                </div>
            `;
        }
    }
}

// Exposer la CLASSE globalement, pas l'instance
window.OweoApp = OweoApp;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OweoApp;
}