// js/core/router.js
// Système de routage adaptatif pour l'application Oweo

class OweoRouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.history = [];
        this.beforeHooks = [];
        this.afterHooks = [];
        this.errorHandler = null;
        this.container = null;
        
        // Détection automatique du chemin de base
        this.basePath = this.detectBasePath();
        
        // Détection du protocole file://
        this.isFileProtocol = window.location.protocol === 'file:';
        
        // Configuration du mode de routage
        this.useHashRouting = this.isFileProtocol || window.location.search.includes('hash=true');
    }
    
    /**
     * Détecter le chemin de base de l'application
     */
    detectBasePath() {
        const path = window.location.pathname;
        
        // Si on est sur index.html, prendre le répertoire parent
        if (path.endsWith('index.html')) {
            return path.substring(0, path.lastIndexOf('/'));
        }
        
        // Si on se termine par /, c'est le répertoire
        if (path.endsWith('/')) {
            return path.slice(0, -1);
        }
        
        // Sinon, on suppose que c'est le chemin complet
        return path;
    }
    
    /**
     * Initialiser le router avec un conteneur
     */
    init(container) {
        this.container = container || document.getElementById('app');
        
        console.log('🧭 Router initialization:', {
            basePath: this.basePath,
            useHashRouting: this.useHashRouting,
            isFileProtocol: this.isFileProtocol
        });
        
        // Écouter les changements de route
        if (this.useHashRouting) {
            window.addEventListener('hashchange', () => this.handleRoute());
            
            // Gérer les liens internes
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#/"], a[href^="/"], [data-page]');
                if (link) {
                    e.preventDefault();
                    
                    let path;
                    if (link.hasAttribute('data-page')) {
                        path = '/' + link.getAttribute('data-page');
                    } else {
                        path = link.getAttribute('href');
                        // Enlever le # si présent
                        if (path.startsWith('#')) {
                            path = path.substring(1);
                        }
                    }
                    
                    this.navigate(path);
                }
            });
        } else {
            window.addEventListener('popstate', () => this.handleRoute());
            
            // Intercepter les clics sur les liens
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="/"], [data-page]');
                if (link && !link.hasAttribute('target')) {
                    e.preventDefault();
                    
                    let path;
                    if (link.hasAttribute('data-page')) {
                        path = '/' + link.getAttribute('data-page');
                    } else {
                        path = link.getAttribute('href');
                    }
                    
                    this.navigate(path);
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
        // Normaliser le path
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        this.routes.set(path, handler);
        console.log(`Route registered: ${path}`);
    }
    
    /**
     * Naviguer vers une route
     */
    navigate(path, options = {}) {
        // Normaliser le path
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        console.log(`🧭 Navigating to: ${path}`);
        
        if (this.useHashRouting) {
            // Pour file:// ou mode hash, utiliser le hash
            window.location.hash = path;
        } else {
            // Pour HTTP(S), utiliser l'API History
            const url = this.basePath + path;
            
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
            // Pour mode hash, obtenir le path depuis le hash
            const hash = window.location.hash.slice(1); // Enlever le #
            return hash || '/';
        } else {
            // Pour HTTP(S), obtenir le path depuis l'URL
            let path = window.location.pathname;
            
            // Enlever le basePath si présent
            if (this.basePath && path.startsWith(this.basePath)) {
                path = path.substring(this.basePath.length);
            }
            
            return path || '/';
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
        
        // Si toujours pas trouvé, essayer la route home
        if (!route && path === '/') {
            route = this.routes.get('/home') || this.routes.get('/');
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
            
            // Scroll en haut de la page
            window.scrollTo(0, 0);
            
        } catch (error) {
            console.error('Error loading route:', error);
            this.container.classList.remove('loading');
            this.container.innerHTML = `
                <div class="error-container" style="padding: 2rem; text-align: center;">
                    <h2>Erreur de chargement</h2>
                    <p>La page n'a pas pu être chargée.</p>
                    <p style="color: var(--error, #dc2626);">${error.message}</p>
                    <button onclick="window.OweoRouter.instance.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                        Réessayer
                    </button>
                </div>
            `;
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
                <div class="error-page" style="text-align: center; padding: 4rem;">
                    <h1 style="font-size: 4rem; margin-bottom: 1rem;">404</h1>
                    <p style="font-size: 1.25rem; margin-bottom: 2rem;">Page non trouvée</p>
                    <a href="${this.useHashRouting ? '#/' : '/'}" class="btn btn-primary">
                        Retour à l'accueil
                    </a>
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
    
    /**
     * Obtenir l'URL complète pour un path
     */
    getFullUrl(path) {
        if (this.useHashRouting) {
            return window.location.origin + window.location.pathname + '#' + path;
        } else {
            return window.location.origin + this.basePath + path;
        }
    }
}

// Créer l'export de la classe
window.OweoRouter = OweoRouter;

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OweoRouter;
}