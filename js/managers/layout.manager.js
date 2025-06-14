// ===== js/managers/layout.manager.js =====
// Gestionnaire de mise en page

class LayoutManager {
    constructor() {
        this.currentLayout = 'horizontal';
        this.sidebarOpen = false;
    }
    
    async init() {
        console.log('📐 Initialisation LayoutManager');
        
        // Charger les préférences
        const saved = window.StorageManager?.get('layout_preferences');
        if (saved) {
            this.currentLayout = saved.layout || this.currentLayout;
            this.sidebarOpen = saved.sidebarOpen || false;
        }
        
        // Appliquer le layout
        this.applyLayout(this.currentLayout);
        
        return this;
    }
    
    setLayout(layout) {
        if (layout === this.currentLayout) return;
        
        this.currentLayout = layout;
        this.applyLayout(layout);
        
        // Sauvegarder
        window.StorageManager?.set('layout_preferences', {
            layout: this.currentLayout,
            sidebarOpen: this.sidebarOpen
        });
        
        window.EventBus?.emit('layout:changed', { layout });
    }
    
    applyLayout(layout) {
        const body = document.body;
        
        // Supprimer les classes existantes
        body.classList.remove('layout-horizontal', 'layout-vertical');
        body.classList.add(`layout-${layout}`);
    }
    
    toggleSidebar() {
        this.sidebarOpen = !this.sidebarOpen;
        document.body.classList.toggle('sidebar-open', this.sidebarOpen);
        
        window.EventBus?.emit('sidebar:toggle', { open: this.sidebarOpen });
    }
}

window.LayoutManager = new LayoutManager();