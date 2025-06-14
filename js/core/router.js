// ===== js/core/router.js =====
// Système de routage SPA

class OweoRouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.beforeHooks = [];
        this.afterHooks = [];
        this.container = null;
    }
    
    init(container) {
        this.container = container || document.getElementById('app');
        
        // Écouter les changements d'URL
        window.addEventListener('popstate', () => this.handleRoute());
        
        // Intercepter les clics sur les liens
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && link.href.startsWith(window.location.origin)) {
                e.preventDefault();
                const path = link.getAttribute('href');
                this.navigate(path);
            }
        });
        
        // Route initiale
        this.handleRoute();
    }
    
    register(path, handler) {
        this.routes.set(path, handler);
        console.log(`Route registered: ${path}`);
    }
    
    navigate(path, options = {}) {
        if (!options.replace) {
            window.history.pushState({}, '', path);
        } else {
            window.history.replaceState({}, '', path);
        }
        
        this.handleRoute();
    }
    
    async handleRoute() {
        const path = window.location.pathname;
        const route = this.findRoute(path);
        
        if (!route) {
            console.error(`Route not found: ${path}`);
            this.handleNotFound();
            return;
        }
        
        // Before hooks
        for (const hook of this.beforeHooks) {
            const proceed = await hook(route, this.currentRoute);
            if (!proceed) return;
        }
        
        // Charger la route
        try {
            await this.loadRoute(route);
            this.currentRoute = route;
            
            // After hooks
            for (const hook of this.afterHooks) {
                await hook(route);
            }
        } catch (error) {
            console.error('Error loading route:', error);
            this.handleError(error);
        }
    }
    
    findRoute(path) {
        // Exact match
        if (this.routes.has(path)) {
            return { path, handler: this.routes.get(path) };
        }
        
        // Pattern matching (simple)
        for (const [pattern, handler] of this.routes) {
            if (pattern.includes(':')) {
                const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$');
                const match = path.match(regex);
                if (match) {
                    return { path, pattern, handler, params: match.slice(1) };
                }
            }
        }
        
        return null;
    }
    
    async loadRoute(route) {
        if (!this.container) {
            throw new Error('Router container not found');
        }
        
        // Ajouter une classe de chargement
        this.container.classList.add('loading');
        
        try {
            // Exécuter le handler
            if (typeof route.handler === 'function') {
                await route.handler(this.container, route.params);
            } else if (typeof route.handler === 'object' && route.handler.render) {
                await route.handler.render(this.container);
            }
        } finally {
            this.container.classList.remove('loading');
        }
    }
    
    beforeEach(hook) {
        this.beforeHooks.push(hook);
    }
    
    afterEach(hook) {
        this.afterHooks.push(hook);
    }
    
    handleNotFound() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="error-page">
                    <h1>404</h1>
                    <p>Page non trouvée</p>
                    <a href="/" class="btn btn-primary">Retour à l'accueil</a>
                </div>
            `;
        }
    }
    
    handleError(error) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="error-page">
                    <h1>Erreur</h1>
                    <p>Une erreur est survenue</p>
                    <p class="error-message">${error.message}</p>
                    <a href="/" class="btn btn-primary">Retour à l'accueil</a>
                </div>
            `;
        }
    }
}

window.OweoRouter = OweoRouter;