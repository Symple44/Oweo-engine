// ===== js/components/navbar.js =====
// Composant de navigation raffiné et minimaliste

class Navbar extends BaseComponent {
    constructor(config = {}) {
        super(config);
        this.menuItems = [
            { label: 'Accueil', href: '/', icon: 'fas fa-home' },
            { label: 'Services', href: '/services', icon: 'fas fa-cogs' },
            { label: 'À propos', href: '/about', icon: 'fas fa-info-circle' },
            { label: 'Contact', href: '/contact', icon: 'fas fa-envelope' }
        ];
        this.mobileMenuOpen = false;
        this.scrolled = false;
    }
    
    getTemplate() {
        return `
            <div class="navbar-container">
                <div class="navbar-brand">
                    <a href="/" class="navbar-logo">
                        <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="navLogo" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:var(--theme-primary);stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:var(--theme-accent);stop-opacity:1" />
                                </linearGradient>
                            </defs>
                            <circle cx="50" cy="50" r="45" fill="url(#navLogo)" opacity="0.1"/>
                            <path d="M50 20 L70 40 L70 70 L50 80 L30 70 L30 40 Z" fill="url(#navLogo)"/>
                            <text x="50" y="55" text-anchor="middle" font-size="24" font-weight="bold" fill="white">O</text>
                        </svg>
                        <span class="navbar-title">Oweo</span>
                    </a>
                </div>
                
                <nav class="navbar-menu">
                    ${this.menuItems.map(item => `
                        <a href="${item.href}" 
                           class="navbar-link ${this.isActive(item.href) ? 'active' : ''}">
                            <i class="${item.icon}"></i>
                            <span>${item.label}</span>
                        </a>
                    `).join('')}
                    <a href="/login" class="navbar-link navbar-login">
                        <i class="fas fa-sign-in-alt"></i>
                        <span>Connexion</span>
                    </a>
                </nav>
                
                <div class="navbar-actions">
                    <button class="navbar-search-btn" aria-label="Rechercher">
                        <i class="fas fa-search"></i>
                    </button>
                    
                    <button class="navbar-mobile-toggle" aria-label="Menu">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>
            
            <div class="navbar-mobile-menu">
                ${this.menuItems.map(item => `
                    <a href="${item.href}" class="navbar-mobile-link ${this.isActive(item.href) ? 'active' : ''}">
                        <i class="${item.icon}"></i>
                        <span>${item.label}</span>
                    </a>
                `).join('')}
                <a href="/login" class="navbar-mobile-link">
                    <i class="fas fa-sign-in-alt"></i>
                    <span>Connexion</span>
                </a>
            </div>
        `;
    }
    
    async afterRender() {
        // Initialiser l'effet de scroll
        this.initScrollEffect();
    }
    
    setupEventListeners() {
        // Toggle mobile menu
        this.on('.navbar-mobile-toggle', 'click', () => {
            this.toggleMobileMenu();
        });
        
        // Close mobile menu on link click
        this.on('.navbar-mobile-menu', 'click', (e) => {
            if (e.target.matches('a')) {
                this.closeMobileMenu();
            }
        });
        
        // Close mobile menu on outside click
        document.addEventListener('click', (e) => {
            if (this.mobileMenuOpen && !this.container.contains(e.target)) {
                this.closeMobileMenu();
            }
        });
        
        // Search button
        this.on('.navbar-search-btn', 'click', () => {
            console.log('Recherche...');
            // Implémenter la logique de recherche
        });
    }
    
    isActive(href) {
        const currentPath = window.location.pathname;
        return href === currentPath || (href !== '/' && currentPath.startsWith(href));
    }
    
    initScrollEffect() {
        let lastScroll = 0;
        let ticking = false;
        
        const updateNavbar = () => {
            const scrollY = window.scrollY;
            
            // Ajouter/retirer la classe scrolled
            if (scrollY > 20) {
                if (!this.scrolled) {
                    this.container.classList.add('scrolled');
                    this.scrolled = true;
                }
            } else {
                if (this.scrolled) {
                    this.container.classList.remove('scrolled');
                    this.scrolled = false;
                }
            }
            
            lastScroll = scrollY;
            ticking = false;
        };
        
        // Throttle scroll events
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        });
    }
    
    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
        this.container.classList.toggle('mobile-menu-open', this.mobileMenuOpen);
        document.body.classList.toggle('navbar-mobile-open', this.mobileMenuOpen);
    }
    
    closeMobileMenu() {
        this.mobileMenuOpen = false;
        this.container.classList.remove('mobile-menu-open');
        document.body.classList.remove('navbar-mobile-open');
    }
}

window.Navbar = Navbar;
window.ComponentManager.register('navbar', Navbar);