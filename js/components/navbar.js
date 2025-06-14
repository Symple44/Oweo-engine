// ===== js/components/navbar.js =====
// Composant de navigation

class Navbar extends BaseComponent {
    constructor(config = {}) {
        super(config);
        this.menuItems = [
            { label: 'Accueil', href: '/', icon: 'fas fa-home' },
            { label: 'Services', href: '/services', icon: 'fas fa-cogs' },
            { label: 'Contact', href: '/contact', icon: 'fas fa-envelope' },
            { label: 'Connexion', href: '/login', icon: 'fas fa-user', class: 'navbar-login' }
        ];
        this.mobileMenuOpen = false;
    }
    
    getTemplate() {
        return `
            <div class="navbar-container">
                <div class="navbar-brand">
                    <a href="/" class="navbar-logo">
                        <img src="/logo.svg" alt="Oweo" onerror="this.style.display='none'">
                        <span class="navbar-title">Oweo</span>
                    </a>
                </div>
                
                <nav class="navbar-menu">
                    ${this.menuItems.map(item => `
                        <a href="${item.href}" class="navbar-link ${item.class || ''}">
                            ${item.icon ? `<i class="${item.icon}"></i>` : ''}
                            <span>${item.label}</span>
                        </a>
                    `).join('')}
                </nav>
                
                <div class="navbar-actions">
                    <button class="navbar-mobile-toggle" aria-label="Menu">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>
            
            <div class="navbar-mobile-menu">
                ${this.menuItems.map(item => `
                    <a href="${item.href}" class="navbar-mobile-link ${item.class || ''}">
                        ${item.icon ? `<i class="${item.icon}"></i>` : ''}
                        <span>${item.label}</span>
                    </a>
                `).join('')}
            </div>
        `;
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
