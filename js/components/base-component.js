// ===== js/components/base-component.js =====
// Classe de base pour tous les composants

class BaseComponent {
    constructor(config = {}) {
        this.config = config;
        this.id = config.id || `component_${Date.now()}`;
        this.container = config.container || null;
        this.state = {};
        this.listeners = [];
        this.children = new Map();
        this.mounted = false;
    }
    
    // Cycle de vie
    async render(container) {
        if (container) {
            this.container = container;
        }
        
        if (!this.container) {
            throw new Error('Container not found');
        }
        
        // Before render hook
        await this.beforeRender();
        
        // Render template
        const template = await this.getTemplate();
        this.container.innerHTML = template;
        
        // Setup event listeners
        this.setupEventListeners();
        
        // After render hook
        await this.afterRender();
        
        // Mount
        if (!this.mounted) {
            await this.onMount();
            this.mounted = true;
        }
        
        return this;
    }
    
    async beforeRender() {
        // Override in subclass
    }
    
    async afterRender() {
        // Override in subclass
    }
    
    async onMount() {
        // Override in subclass
    }
    
    async onUnmount() {
        // Override in subclass
    }
    
    getTemplate() {
        return '<div>Base Component</div>';
    }
    
    // State management
    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        this.onStateChange(oldState, this.state);
    }
    
    onStateChange(oldState, newState) {
        // Re-render par défaut
        this.render();
    }
    
    // Event handling
    setupEventListeners() {
        // Override in subclass
    }
    
    on(element, event, handler, options) {
        if (typeof element === 'string') {
            element = this.container.querySelector(element);
        }
        
        if (element) {
            element.addEventListener(event, handler, options);
            this.listeners.push({ element, event, handler, options });
        }
    }
    
    emit(event, data) {
        window.EventBus.emit(`${this.id}:${event}`, data);
    }
    
    // Child components
    addChild(name, component) {
        this.children.set(name, component);
    }
    
    getChild(name) {
        return this.children.get(name);
    }
    
    removeChild(name) {
        const child = this.children.get(name);
        if (child) {
            child.destroy();
            this.children.delete(name);
        }
    }
    
    // Cleanup
    destroy() {
        // Remove event listeners
        this.listeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.listeners = [];
        
        // Destroy children
        this.children.forEach(child => child.destroy());
        this.children.clear();
        
        // Unmount
        if (this.mounted) {
            this.onUnmount();
            this.mounted = false;
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

window.BaseComponent = BaseComponent;