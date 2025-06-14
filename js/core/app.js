// js/core/app.js
// Classe principale de l'application (version simplifiée)

class OweoApp {
    constructor() {
        this.config = window.OWEO_CONFIG || {};
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
            // Initialiser les services globaux
            await this.initializeServices();
            
            // Initialiser les composants UI
            await this.initializeComponents();
            
            // Initialiser le routeur
            await this.initializeRouter();
            
            // Marquer comme initialisé
            this.isInitialized = true;
            
            // Émettre l'événement si EventBus existe
            if (window.EventBus) {
                window.EventBus.emit('app:initialized');
            }
            
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            
            // Essayer au moins d'afficher quelque chose
            this.fallbackInit();
        }
    }
    
    async fallbackInit() {
        console.log('🔧 Tentative d\'initialisation de secours...');
        
        const appContainer = document.querySelector('.app-container, #app');
        if (!appContainer) {
            console.error('❌ Aucun conteneur trouvé');
            return;
        }
        
        // Si HomePage existe, l'afficher
        if (window.HomePage) {
            try {
                const homePage = new window.HomePage();
                await homePage.render(appContainer);
                appContainer.classList.add('loaded');
                console.log('✅ Page d\'accueil affichée en mode secours');
            } catch (error) {
                console.error('❌ Impossible d\'afficher HomePage:', error);
                this.showFallbackContent(appContainer);
            }
        } else {
            this.showFallbackContent(appContainer);
        }
    }
    
    showFallbackContent(container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem 1rem;">
                <h1 style="color: var(--text-primary, #111827); margin-bottom: 1rem;">
                    Bienvenue sur Oweo
                </h1>
                <p style="color: var(--text-secondary, #4b5563); margin-bottom: 2rem;">
                    L'application est en cours de chargement...
                </p>
                <button onclick="location.reload()" 
                        style="padding: 0.75rem 2rem; 
                               background: var(--primary, #00d4ff); 
                               color: white; 
                               border: none; 
                               border-radius: 0.375rem; 
                               cursor: pointer;">
                    Recharger la page
                </button>
                <div style="margin-top: 2rem; padding: 1rem; 
                            background: var(--bg-secondary, #f9fafb); 
                            border-radius: 0.5rem; 
                            max-width: 600px; 
                            margin-left: auto; 
                            margin-right: auto;">
                    <h3 style="color: var(--text-primary, #111827); margin-bottom: 0.5rem;">
                        Diagnostic
                    </h3>
                    <p style="color: var(--text-secondary, #4b5563); font-size: 0.875rem;">
                        Ouvrez la console (F12) pour voir les détails du chargement.
                    </p>
                </div>
            </div>
        `;
        container.classList.add('loaded');
    }
    
    async initializeServices() {
        console.log('🔧 Initializing services...');
        
        // Initialiser les services dans l'ordre
        const services = [
            { name: 'StorageManager', obj: window.StorageManager },
            { name: 'ThemeManager', obj: window.ThemeManager },
            { name: 'NotificationService', obj: window.NotificationService },
            { name: 'AuthManager', obj: window.AuthManager },
            { name: 'LayoutManager', obj: window.LayoutManager }
        ];
        
        for (const service of services) {
            if (service.obj && typeof service.obj.init === 'function') {
                try {
                    console.log(`  Initializing ${service.name}...`);
                    await service.obj.init();
                } catch (error) {
                    console.error(`  ❌ Failed to initialize ${service.name}:`, error);
                }
            } else {
                console.warn(`  ⚠️ ${service.name} not found or has no init method`);
            }
        }
    }
    
    async initializeComponents() {
        console.log('🧩 Initializing components...');
        
        // Créer les composants globaux si ComponentManager existe
        if (!window.ComponentManager) {
            console.warn('  ⚠️ ComponentManager not found, skipping component initialization');
            return;
        }
        
        // Navbar
        const navbarContainer = document.getElementById('navbar');
        if (navbarContainer) {
            if (window.Navbar) {
                try {
                    const navbar = new window.Navbar({ container: navbarContainer });
                    await navbar.render();
                    this.components.navbar = navbar;
                    console.log('  ✅ Navbar initialized');
                } catch (error) {
                    console.error('  ❌ Failed to initialize Navbar:', error);
                }
            } else {
                console.warn('  ⚠️ Navbar component not found');
            }
        }
        
        // Footer
        const footerContainer = document.getElementById('footer');
        if (footerContainer) {
            if (window.Footer) {
                try {
                    const footer = new window.Footer({ container: footerContainer });
                    await footer.render();
                    this.components.footer = footer;
                    console.log('  ✅ Footer initialized');
                } catch (error) {
                    console.error('  ❌ Failed to initialize Footer:', error);
                }
            } else {
                console.warn('  ⚠️ Footer component not found');
            }
        }
    }
    
    async initializeRouter() {
        console.log('🛣️ Initializing router...');
        
        if (!window.OweoRouter) {
            console.warn('  ⚠️ OweoRouter not found, navigation will not work');
            return;
        }
        
        // Créer une instance du routeur
        this.router = new window.OweoRouter();
        
        // Enregistrer les routes
        this.registerRoutes();
        
        // Initialiser le routeur
        const appContainer = document.querySelector('.app-container') || document.getElementById('app');
        this.router.init(appContainer);
        
        console.log('  ✅ Router initialized');
    }
    
    registerRoutes() {
        if (!this.router) return;
        
        // Routes de l'application
        const routes = [
            { path: '/', page: 'HomePage' },
            { path: '/home', page: 'HomePage' },
            { path: '/dashboard', page: 'DashboardPage' },
            { path: '/login', page: 'AuthPage' },
            { path: '/register', page: 'AuthPage' },
            { path: '/services', page: 'ServicesPage' },
            { path: '/contact', page: 'ContactPage' }
        ];
        
        routes.forEach(({ path, page }) => {
            if (window[page]) {
                this.router.register(path, async (container) => {
                    const pageInstance = new window[page]();
                    await pageInstance.render(container);
                });
                console.log(`  ✅ Route registered: ${path} -> ${page}`);
            } else {
                console.warn(`  ⚠️ Page not found for route ${path}: ${page}`);
            }
        });
        
        // Route par défaut
        if (window.HomePage) {
            this.router.register('/', async (container) => {
                const homePage = new window.HomePage();
                await homePage.render(container);
            });
        }
    }
}

// Exposer globalement
window.OweoApp = OweoApp;