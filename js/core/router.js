// js/core/router.js
// Système de routage pour l'application Oweo

class OweoRouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.history = [];
        this.beforeHooks = [];
        this.afterHooks = [];
        this.errorHandler = null;
        this.baseURL = '';
        this.container = null;
        
        // Détection du protocole file://
        this.isFileProtocol = window.location.protocol === 'file:';
        
        // Configuration du baseURL selon le protocole
        if (this.isFileProtocol) {
            // Pour file://, on utilise le hash pour la navigation
            this.useHashRouting = true;
        } else {
            // Pour HTTP(S), on peut utiliser l'API History
            this.useHashRouting = false;
            this.baseURL = window.location.pathname.replace(/\/[^\/]*$/, '');
        }
    }
    
    /**
     * Initialiser le router avec un conteneur
     */
    init(container) {
        this.container = container || document.getElementById('app');
        
        // Écouter les changements de route
        if (this.useHashRouting) {
            window.addEventListener('hashchange', () => this.handleRoute());
            // Gérer les liens avec data-page
            document.addEventListener('click', (e) => {
                const link = e.target.closest('[data-page]');
                if (link) {
                    e.preventDefault();
                    const page = link.getAttribute('data-page');
                    this.navigate('/' + page);
                }
            });
        } else {
            window.addEventListener('popstate', () => this.handleRoute());
            // Intercepter les clics sur les liens
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="/"]');
                if (link) {
                    e.preventDefault();
                    this.navigate(link.getAttribute('href'));
                }
            });
        }
        
        // Gérer la route initiale
        this.handleRoute();
    }
    
    /**
     * Enregistrer une route avec un handler
     */
    register(path, handler) {
        this.routes.set(path, handler);
        console.log(`Route registered: ${path}`);
    }
    
    /**
     * Naviguer vers une route
     */
    navigate(path, options = {}) {
        if (this.useHashRouting) {
            // Pour file://, utiliser le hash
            window.location.hash = path;
        } else {
            // Pour HTTP(S), utiliser l'API History
            const url = this.baseURL + path;
            
            if (!options.replace) {
                window.history.pushState({ path }, '', url);
            } else {
                window.history.replaceState({ path }, '', url);
            }
            
            this.handleRoute();
        }
    }
    
    /**
     * Obtenir le path actuel
     */
    getCurrentPath() {
        if (this.useHashRouting) {
            // Pour file://, obtenir le path depuis le hash
            const hash = window.location.hash.slice(1); // Enlever le #
            return hash || '/';
        } else {
            // Pour HTTP(S), obtenir le path depuis l'URL
            const path = window.location.pathname.replace(this.baseURL, '') || '/';
            return path;
        }
    }
    
    /**
     * Gérer la route actuelle
     */
    async handleRoute() {
        const path = this.getCurrentPath();
        
        console.log(`Handling route: ${path}`);
        
        // Chercher la route correspondante
        let route = this.routes.get(path);
        
        // Si pas trouvé, essayer avec les routes dynamiques
        if (!route) {
            for (const [routePath, handler] of this.routes) {
                if (this.matchRoute(path, routePath)) {
                    route = handler;
                    break;
                }
            }
        }
        
        if (!route) {
            console.error(`Route not found: ${path}`);
            this.handle404();
            return;
        }
        
        try {
            // Exécuter les hooks before
            for (const hook of this.beforeHooks) {
                const result = await hook({ path, handler: route }, this.currentRoute);
                if (result === false) {
                    return; // Navigation annulée
                }
            }
            
            // Sauvegarder la route actuelle
            const previousRoute = this.currentRoute;
            this.currentRoute = { path, handler: route };
            
            // Ajouter à l'historique
            this.history.push(path);
            if (this.history.length > 50) {
                this.history.shift();
            }
            
            // Charger la route
            await this.loadRoute(route);
            
            // Exécuter les hooks after
            for (const hook of this.afterHooks) {
                await hook(this.currentRoute, previousRoute);
            }
            
            // Émettre l'événement de changement de route
            window.EventBus?.emit('route:changed', {
                current: this.currentRoute,
                previous: previousRoute
            });
            
        } catch (error) {
            console.error('Route handler error:', error);
            if (this.errorHandler) {
                this.errorHandler(error, route);
            }
        }
    }
    
    /**
     * Charger une route
     */
    async loadRoute(handler) {
        if (!this.container) {
            throw new Error('Router container not found');
        }
        
        // Éviter de recharger si c'est déjà la route actuelle
        if (this.container.dataset.currentRoute === this.currentRoute.path) {
            console.log('Route already loaded, skipping...');
            return;
        }
        
        // Marquer la route actuelle
        this.container.dataset.currentRoute = this.currentRoute.path;
        
        // Ajouter une classe de chargement
        this.container.classList.add('loading');
        
        try {
            // Nettoyer le conteneur
            this.container.innerHTML = '';
            
            // Exécuter le handler
            if (typeof handler === 'function') {
                await handler(this.container);
            } else if (handler && typeof handler.render === 'function') {
                await handler.render(this.container);
            } else {
                throw new Error('Invalid route handler');
            }
            
            // Retirer la classe de chargement
            this.container.classList.remove('loading');
            this.container.classList.add('loaded');
            
        } catch (error) {
            console.error('Error loading route:', error);
            this.container.classList.remove('loading');
            throw error;
        }
    }
    
    /**
     * Vérifier si un path correspond à une route
     */
    matchRoute(path, routePath) {
        // Simple matching avec paramètres (ex: /user/:id)
        const pathParts = path.split('/').filter(Boolean);
        const routeParts = routePath.split('/').filter(Boolean);
        
        if (pathParts.length !== routeParts.length) {
            return false;
        }
        
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                continue; // Paramètre dynamique
            }
            if (routeParts[i] !== pathParts[i]) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Extraire les paramètres d'une route
     */
    getRouteParams(path, routePath) {
        const params = {};
        const pathParts = path.split('/').filter(Boolean);
        const routeParts = routePath.split('/').filter(Boolean);
        
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                const paramName = routeParts[i].slice(1);
                params[paramName] = pathParts[i];
            }
        }
        
        return params;
    }
    
    /**
     * Gérer les 404
     */
    handle404() {
        const container = this.container || document.getElementById('app');
        if (container) {
            container.innerHTML = `
                <div class="error-page">
                    <h1>404</h1>
                    <p>Page non trouvée</p>
                    <a href="#/" class="btn btn-primary">Retour à l'accueil</a>
                </div>
            `;
        }
    }
    
    /**
     * Ajouter un hook before
     */
    beforeEach(hook) {
        this.beforeHooks.push(hook);
    }
    
    /**
     * Ajouter un hook after
     */
    afterEach(hook) {
        this.afterHooks.push(hook);
    }
    
    /**
     * Définir le gestionnaire d'erreurs
     */
    onError(handler) {
        this.errorHandler = handler;
    }
    
    /**
     * Retourner à la page précédente
     */
    back() {
        if (this.history.length > 1) {
            this.history.pop(); // Enlever la route actuelle
            const previousPath = this.history[this.history.length - 1];
            this.navigate(previousPath, { replace: true });
        } else {
            this.navigate('/');
        }
    }
    
    /**
     * Recharger la route actuelle
     */
    reload() {
        // Forcer le rechargement en supprimant le marqueur
        if (this.container) {
            delete this.container.dataset.currentRoute;
        }
        this.handleRoute();
    }
    
    /**
     * Obtenir toutes les routes
     */
    getRoutes() {
        return Array.from(this.routes.entries()).map(([path, handler]) => ({
            path,
            handler
        }));
    }
}

// Créer l'instance globale
window.OweoRouter = OweoRouter;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OweoRouter;
}