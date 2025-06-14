// js/core/component-manager.js
// Gestionnaire centralisé des composants

class ComponentManager {
    constructor() {
        this.components = new Map();
        this.initOrder = [];
        this.loadingPromises = new Map();
        this.debugMode = false;
        this.eventBus = window.EventBus;
    }
    
    /**
     * Enregistrer un composant
     * @param {string} name - Nom unique du composant
     * @param {object|function} component - Instance ou classe du composant
     * @param {object} options - Options de configuration
     * @returns {Promise} Promise de l'enregistrement
     */
    async register(name, component, options = {}) {
        if (this.components.has(name)) {
            console.warn(`⚠️ Component '${name}' already registered, replacing...`);
        }
        
        const componentWrapper = {
            instance: component,
            name,
            initialized: false,
            dependencies: options.dependencies || [],
            autoInit: options.autoInit !== false,
            priority: options.priority || 0,
            retryCount: 0,
            maxRetries: options.maxRetries || 3,
            ...options
        };
        
        this.components.set(name, componentWrapper);
        
        if (this.debugMode) {
            console.log(`🧩 ComponentManager: Registered '${name}'`);
        }
        
        // Auto-initialisation si activée
        if (componentWrapper.autoInit) {
            return this.initialize(name);
        }
        
        return Promise.resolve(componentWrapper);
    }
    
    /**
     * Initialiser un composant
     * @param {string} name - Nom du composant
     * @returns {Promise} Promise de l'initialisation
     */
    async initialize(name) {
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }
        
        const component = this.components.get(name);
        if (!component) {
            throw new Error(`Component '${name}' not found`);
        }
        
        if (component.initialized) {
            return component;
        }
        
        // Créer la promise d'initialisation
        const initPromise = this._initializeComponent(component);
        this.loadingPromises.set(name, initPromise);
        
        try {
            const result = await initPromise;
            this.loadingPromises.delete(name);
            return result;
        } catch (error) {
            this.loadingPromises.delete(name);
            throw error;
        }
    }
    
    /**
     * Initialiser un composant avec ses dépendances
     * @private
     */
    async _initializeComponent(component) {
        try {
            // Vérifier et initialiser les dépendances
            await this._initializeDependencies(component);
            
            if (this.debugMode) {
                console.log(`🧩 ComponentManager: Initializing '${component.name}'...`);
            }
            
            // Initialiser le composant
            if (component.instance.init && typeof component.instance.init === 'function') {
                await component.instance.init();
            }
            
            component.initialized = true;
            this.initOrder.push(component.name);
            
            // Émettre l'événement d'initialisation
            this.eventBus?.emit('component:initialized', {
                name: component.name,
                component: component.instance
            });
            
            if (this.debugMode) {
                console.log(`✅ ComponentManager: '${component.name}' initialized successfully`);
            }
            
            return component;
            
        } catch (error) {
            component.retryCount++;
            
            console.error(`❌ ComponentManager: Failed to initialize '${component.name}':`, error);
            
            // Retry si possible
            if (component.retryCount < component.maxRetries) {
                console.log(`🔄 ComponentManager: Retrying '${component.name}' (${component.retryCount}/${component.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * component.retryCount));
                return this._initializeComponent(component);
            }
            
            // Émettre l'événement d'erreur
            this.eventBus?.emit('component:error', {
                name: component.name,
                error: error.message
            });
            
            throw error;
        }
    }
    
    /**
     * Initialiser les dépendances d'un composant
     * @private
     */
    async _initializeDependencies(component) {
        if (!component.dependencies || component.dependencies.length === 0) {
            return;
        }
        
        const dependencyPromises = component.dependencies.map(dep => {
            if (!this.components.has(dep)) {
                throw new Error(`Dependency '${dep}' not found for component '${component.name}'`);
            }
            return this.initialize(dep);
        });
        
        await Promise.all(dependencyPromises);
    }
    
    /**
     * Obtenir un composant
     * @param {string} name - Nom du composant
     * @returns {object|null} Instance du composant ou null
     */
    get(name) {
        const component = this.components.get(name);
        return component?.initialized ? component.instance : null;
    }
    
    /**
     * Vérifier si un composant est initialisé
     * @param {string} name - Nom du composant
     * @returns {boolean} True si initialisé
     */
    isInitialized(name) {
        const component = this.components.get(name);
        return component ? component.initialized : false;
    }
    
    /**
     * Détruire un composant
     * @param {string} name - Nom du composant
     * @returns {Promise} Promise de la destruction
     */
    async destroy(name) {
        const component = this.components.get(name);
        if (!component) {
            console.warn(`⚠️ Component '${name}' not found for destruction`);
            return;
        }
        
        try {
            // Appeler la méthode destroy si elle existe
            if (component.instance.destroy && typeof component.instance.destroy === 'function') {
                await component.instance.destroy();
            }
            
            component.initialized = false;
            
            // Émettre l'événement de destruction
            this.eventBus?.emit('component:destroyed', {
                name: component.name
            });
            
            if (this.debugMode) {
                console.log(`🗑️ ComponentManager: '${name}' destroyed`);
            }
            
        } catch (error) {
            console.error(`❌ ComponentManager: Error destroying '${name}':`, error);
        }
    }
    
    /**
     * Détruire tous les composants
     * @returns {Promise} Promise de la destruction
     */
    async destroyAll() {
        const destroyPromises = [];
        
        // Détruire dans l'ordre inverse d'initialisation
        for (let i = this.initOrder.length - 1; i >= 0; i--) {
            const name = this.initOrder[i];
            if (this.components.has(name)) {
                destroyPromises.push(this.destroy(name));
            }
        }
        
        await Promise.all(destroyPromises);
        
        this.components.clear();
        this.initOrder = [];
        this.loadingPromises.clear();
        
        if (this.debugMode) {
            console.log('🗑️ ComponentManager: All components destroyed');
        }
    }
    
    /**
     * Initialiser tous les composants auto-init
     * @returns {Promise} Promise de l'initialisation
     */
    async initializeAll() {
        const autoInitComponents = Array.from(this.components.values())
            .filter(comp => comp.autoInit && !comp.initialized)
            .sort((a, b) => b.priority - a.priority); // Priorité plus élevée en premier
        
        const initPromises = autoInitComponents.map(comp => this.initialize(comp.name));
        
        try {
            await Promise.all(initPromises);
            
            if (this.debugMode) {
                console.log(`✅ ComponentManager: All auto-init components initialized (${autoInitComponents.length})`);
            }
            
        } catch (error) {
            console.error('❌ ComponentManager: Error during batch initialization:', error);
            throw error;
        }
    }
    
    /**
     * Obtenir la liste des composants
     * @returns {string[]} Liste des noms de composants
     */
    getComponentNames() {
        return Array.from(this.components.keys());
    }
    
    /**
     * Obtenir les statistiques des composants
     * @returns {object} Statistiques
     */
    getStats() {
        const stats = {
            total: this.components.size,
            initialized: 0,
            pending: 0,
            failed: 0,
            components: {}
        };
        
        for (const [name, component] of this.components) {
            if (component.initialized) {
                stats.initialized++;
            } else if (this.loadingPromises.has(name)) {
                stats.pending++;
            } else if (component.retryCount >= component.maxRetries) {
                stats.failed++;
            }
            
            stats.components[name] = {
                initialized: component.initialized,
                retryCount: component.retryCount,
                dependencies: component.dependencies
            };
        }
        
        return stats;
    }
    
    /**
     * Activer/désactiver le mode debug
     * @param {boolean} enabled - Activer le debug
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🧩 ComponentManager: Debug mode ${enabled ? 'enabled' : 'disabled'}`);
    }
}

// Créer l'instance globale
window.ComponentManager = new ComponentManager();

// Activer le mode debug en développement
if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
    window.ComponentManager.setDebugMode(true);
}