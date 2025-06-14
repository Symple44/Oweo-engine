// js/managers/layout.manager.js
// Gestionnaire de layouts adaptatifs (horizontal/vertical)

class LayoutManager {
    constructor() {
        this.currentLayout = 'horizontal';
        this.sidebarState = false;
        this.navbarExpanded = false;
        this.breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1280
        };
        
        this.elements = {
            wrapper: null,
            navbar: null,
            sidebar: null,
            mainContent: null,
            backdrop: null
        };
        
        this.listeners = new Map();
    }
    
    // ========================================
    // Initialisation
    // ========================================
    
    async init() {
        console.log('📐 Initialisation LayoutManager');
        
        // Récupérer les éléments DOM
        this.getElements();
        
        // Charger la configuration sauvegardée
        this.loadSavedLayout();
        
        // Appliquer le layout initial
        this.applyLayout(this.currentLayout);
        
        // Configurer les événements
        this.setupEventListeners();
        
        // Gérer le responsive
        this.handleResponsive();
        
        // Initialiser les composants
        this.initNavbar();
        this.initSidebar();
        
        return this;
    }
    
    getElements() {
        this.elements.wrapper = document.getElementById('app-wrapper');
        this.elements.navbar = document.getElementById('navbar');
        this.elements.sidebar = document.getElementById('sidebar');
        this.elements.mainContent = document.querySelector('.main-content');
        
        // Créer le backdrop si nécessaire
        this.createBackdrop();
    }
    
    createBackdrop() {
        if (!this.elements.backdrop) {
            this.elements.backdrop = document.createElement('div');
            this.elements.backdrop.className = 'sidebar-backdrop';
            this.elements.backdrop.addEventListener('click', () => this.closeSidebar());
            document.body.appendChild(this.elements.backdrop);
        }
    }
    
    loadSavedLayout() {
        const saved = StorageManager.get('layout_preferences');
        if (saved) {
            this.currentLayout = saved.layout || this.currentLayout;
            this.sidebarState = saved.sidebarOpen || false;
        }
    }
    
    saveLayoutPreferences() {
        StorageManager.set('layout_preferences', {
            layout: this.currentLayout,
            sidebarOpen: this.sidebarState
        });
    }
    
    // ========================================
    // Gestion des layouts
    // ========================================
    
    setLayout(layout) {
        if (layout === this.currentLayout) return;
        
        const validLayouts = ['horizontal', 'vertical'];
        if (!validLayouts.includes(layout)) {
            console.error(`Layout invalide: ${layout}`);
            return;
        }
        
        this.currentLayout = layout;
        this.applyLayout(layout);
        this.saveLayoutPreferences();
        
        this.emit('layoutChanged', { layout });
    }
    
    applyLayout(layout) {
        const body = document.body;
        
        // Supprimer les classes existantes
        body.classList.remove('layout-horizontal', 'layout-vertical');
        body.classList.add(`layout-${layout}`);
        
        // Ajuster selon le layout
        if (layout === 'vertical') {
            this.setupVerticalLayout();
        } else {
            this.setupHorizontalLayout();
        }
        
        // Réinitialiser l'état de la sidebar
        this.updateSidebarState();
    }
    
    setupHorizontalLayout() {
        // Dans le layout horizontal, la navbar est en haut
        if (this.elements.navbar) {
            this.elements.navbar.style.removeProperty('width');
            this.elements.navbar.style.removeProperty('height');
        }
        
        // Ajuster le conteneur principal
        if (this.elements.mainContent) {
            this.elements.mainContent.style.removeProperty('margin-left');
        }
    }
    
    setupVerticalLayout() {
        // Dans le layout vertical, la navbar est sur le côté
        if (this.elements.navbar) {
            this.elements.navbar.style.height = '100vh';
        }
        
        // Gérer l'expansion de la navbar verticale
        this.updateVerticalNavbar();
    }
    
    // ========================================
    // Gestion de la Navbar
    // ========================================
    
    initNavbar() {
        // Toggle mobile
        const toggle = document.getElementById('navbar-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Toggle expansion (mode vertical)
        const navbar = this.elements.navbar;
        if (navbar) {
            navbar.addEventListener('mouseenter', () => {
                if (this.currentLayout === 'vertical' && !this.isMobile()) {
                    this.expandNavbar();
                }
            });
            
            navbar.addEventListener('mouseleave', () => {
                if (this.currentLayout === 'vertical' && !this.isMobile()) {
                    this.collapseNavbar();
                }
            });
        }
    }
    
    toggleMobileMenu() {
        const toggle = document.getElementById('navbar-toggle');
        const navbar = this.elements.navbar;
        
        if (toggle && navbar) {
            toggle.classList.toggle('active');
            
            if (this.currentLayout === 'vertical' && this.isMobile()) {
                // En mobile, la navbar verticale devient un menu mobile
                navbar.classList.toggle('mobile-open');
            } else {
                // Toggle sidebar en mode horizontal mobile
                this.toggleSidebar();
            }
        }
    }
    
    expandNavbar() {
        if (!this.navbarExpanded) {
            this.navbarExpanded = true;
            document.body.classList.add('navbar-expanded');
            this.elements.navbar.classList.add('expanded');
            this.emit('navbarExpanded');
        }
    }
    
    collapseNavbar() {
        if (this.navbarExpanded) {
            this.navbarExpanded = false;
            document.body.classList.remove('navbar-expanded');
            this.elements.navbar.classList.remove('expanded');
            this.emit('navbarCollapsed');
        }
    }
    
    updateVerticalNavbar() {
        if (this.currentLayout !== 'vertical') return;
        
        const container = document.querySelector('.layout-container');
        if (container) {
            const width = this.navbarExpanded 
                ? 'var(--navbar-vertical-expanded)' 
                : 'var(--navbar-vertical-width)';
            container.style.marginLeft = width;
        }
    }
    
    // ========================================
    // Gestion de la Sidebar
    // ========================================
    
    initSidebar() {
        // Bouton fermer
        const closeBtn = document.querySelector('.sidebar-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeSidebar());
        }
        
        // Liens de navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', () => {
                if (this.isMobile()) {
                    this.closeSidebar();
                }
            });
        });
    }
    
    toggleSidebar() {
        if (this.sidebarState) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }
    
    openSidebar() {
        if (!this.elements.sidebar) return;
        
        this.sidebarState = true;
        this.elements.sidebar.classList.add('active');
        document.body.classList.add('sidebar-open');
        
        // Afficher le backdrop en mobile
        if (this.isMobile()) {
            this.showBackdrop();
        }
        
        // Ajuster le contenu principal
        this.updateMainContent();
        
        this.emit('sidebarOpened');
        this.saveLayoutPreferences();
    }
    
    closeSidebar() {
        if (!this.elements.sidebar) return;
        
        this.sidebarState = false;
        this.elements.sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        
        // Masquer le backdrop
        this.hideBackdrop();
        
        // Ajuster le contenu principal
        this.updateMainContent();
        
        this.emit('sidebarClosed');
        this.saveLayoutPreferences();
    }
    
    updateSidebarState() {
        if (this.sidebarState && !this.isMobile()) {
            this.openSidebar();
        } else {
            this.closeSidebar();
        }
    }
    
    showBackdrop() {
        if (this.elements.backdrop) {
            this.elements.backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideBackdrop() {
        if (this.elements.backdrop) {
            this.elements.backdrop.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    updateMainContent() {
        if (!this.elements.mainContent) return;
        
        const hasSidebar = this.sidebarState && !this.isMobile();
        
        if (hasSidebar) {
            document.body.classList.add('has-sidebar');
        } else {
            document.body.classList.remove('has-sidebar');
        }
    }
    
    // ========================================
    // Responsive
    // ========================================
    
    setupEventListeners() {
        // Redimensionnement de la fenêtre
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResponsive();
            }, 250);
        });
        
        // Changement d'orientation
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResponsive();
            }, 100);
        });
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'b':
                    case 'B':
                        e.preventDefault();
                        this.toggleSidebar();
                        break;
                    case '\\':
                        e.preventDefault();
                        this.toggleLayout();
                        break;
                }
            }
        });
    }
    
    handleResponsive() {
        const width = window.innerWidth;
        const wasMobile = this._isMobile;
        this._isMobile = width < this.breakpoints.mobile;
        
        // Si on passe de desktop à mobile ou vice versa
        if (wasMobile !== this._isMobile) {
            if (this._isMobile) {
                // Passage en mobile
                this.handleMobileLayout();
            } else {
                // Passage en desktop
                this.handleDesktopLayout();
            }
        }
        
        this.emit('breakpointChanged', {
            isMobile: this._isMobile,
            isTablet: width < this.breakpoints.tablet,
            isDesktop: width >= this.breakpoints.desktop
        });
    }
    
    handleMobileLayout() {
        // Forcer le layout horizontal en mobile
        if (this.currentLayout === 'vertical') {
            document.body.classList.add('layout-vertical-mobile');
        }
        
        // Fermer la sidebar
        this.closeSidebar();
        
        // Réinitialiser la navbar
        this.collapseNavbar();
    }
    
    handleDesktopLayout() {
        // Restaurer le layout
        document.body.classList.remove('layout-vertical-mobile');
        
        // Restaurer l'état de la sidebar
        this.updateSidebarState();
    }
    
    isMobile() {
        return window.innerWidth < this.breakpoints.mobile;
    }
    
    isTablet() {
        return window.innerWidth < this.breakpoints.tablet;
    }
    
    isDesktop() {
        return window.innerWidth >= this.breakpoints.desktop;
    }
    
    // ========================================
    // API Publique
    // ========================================
    
    toggleLayout() {
        const newLayout = this.currentLayout === 'horizontal' ? 'vertical' : 'horizontal';
        this.setLayout(newLayout);
    }
    
    getCurrentLayout() {
        return this.currentLayout;
    }
    
    isSidebarOpen() {
        return this.sidebarState;
    }
    
    isNavbarExpanded() {
        return this.navbarExpanded;
    }
    
    getBreakpoint() {
        const width = window.innerWidth;
        
        if (width < this.breakpoints.mobile) return 'mobile';
        if (width < this.breakpoints.tablet) return 'tablet';
        if (width < this.breakpoints.desktop) return 'desktop';
        
        return 'wide';
    }
    
    // ========================================
    // Événements
    // ========================================
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push(callback);
        
        return () => this.off(event, callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index >= 0) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in layout event listener:`, error);
                }
            });
        }
        
        // Émettre aussi via l'EventBus global
        if (window.EventBus) {
            window.EventBus.emit(`layout:${event}`, data);
        }
    }
    
    // ========================================
    // Utilitaires
    // ========================================
    
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    lockScroll() {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${this.getScrollbarWidth()}px`;
    }
    
    unlockScroll() {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }
    
    getScrollbarWidth() {
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll';
        outer.style.msOverflowStyle = 'scrollbar';
        document.body.appendChild(outer);
        
        const inner = document.createElement('div');
        outer.appendChild(inner);
        
        const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
        
        outer.parentNode.removeChild(outer);
        
        return scrollbarWidth;
    }
}

// ========================================
// Instance globale
// ========================================

window.LayoutManager = new LayoutManager();