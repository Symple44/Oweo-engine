// ===== js/components/footer.js =====
// Composant pied de page minimaliste

class Footer extends BaseComponent {
    constructor(config = {}) {
        super(config);
        this.year = new Date().getFullYear();
        this.config = window.APP_CONFIG || {};
    }
    
    getTemplate() {
        return `
            <div class="footer-container">
                <!-- Contenu principal -->
                <div class="footer-content">
                    <!-- Section marque -->
                    <div class="footer-brand">
                        <div class="footer-logo">
                            <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="footerLogo" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style="stop-color:var(--theme-primary);stop-opacity:1" />
                                        <stop offset="100%" style="stop-color:var(--theme-accent);stop-opacity:1" />
                                    </linearGradient>
                                </defs>
                                <circle cx="50" cy="50" r="45" fill="url(#footerLogo)" opacity="0.1"/>
                                <path d="M50 20 L70 40 L70 70 L50 80 L30 70 L30 40 Z" fill="url(#footerLogo)"/>
                                <text x="50" y="55" text-anchor="middle" font-size="24" font-weight="bold" fill="white">O</text>
                            </svg>
                            <span class="footer-logo-text">Oweo</span>
                        </div>
                        <p class="footer-tagline">
                            Solutions ERP pour la charpente métallique
                        </p>
                    </div>
                    
                    <!-- Navigation -->
                    <nav class="footer-nav">
                        <div class="footer-nav-group">
                            <h4 class="footer-nav-title">Produit</h4>
                            <ul class="footer-nav-list">
                                <li><a href="/features" class="footer-nav-link">Fonctionnalités</a></li>
                                <li><a href="/pricing" class="footer-nav-link">Tarifs</a></li>
                                <li><a href="/demo" class="footer-nav-link">Démo</a></li>
                            </ul>
                        </div>
                        
                        <div class="footer-nav-group">
                            <h4 class="footer-nav-title">Support</h4>
                            <ul class="footer-nav-list">
                                <li><a href="/docs" class="footer-nav-link">Documentation</a></li>
                                <li><a href="/contact" class="footer-nav-link">Contact</a></li>
                                <li><a href="/faq" class="footer-nav-link">FAQ</a></li>
                            </ul>
                        </div>
                    </nav>
                </div>
                
                <!-- Bas de page -->
                <div class="footer-bottom">
                    <p class="footer-copyright">
                        &copy; ${this.year} ${this.config.app?.company || 'Oweo'}. Tous droits réservés.
                    </p>
                    
                    <div class="footer-social">
                        <a href="https://linkedin.com" class="footer-social-link" aria-label="LinkedIn">
                            <i class="fab fa-linkedin-in"></i>
                        </a>
                        <a href="https://twitter.com" class="footer-social-link" aria-label="Twitter">
                            <i class="fab fa-twitter"></i>
                        </a>
                        <a href="https://github.com" class="footer-social-link" aria-label="GitHub">
                            <i class="fab fa-github"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Animation subtile du logo au survol
        const logo = this.container.querySelector('.footer-logo svg');
        if (logo) {
            logo.addEventListener('mouseenter', () => {
                logo.style.transform = 'scale(1.05)';
                logo.style.transition = 'transform 200ms ease';
            });
            
            logo.addEventListener('mouseleave', () => {
                logo.style.transform = 'scale(1)';
            });
        }
    }
}

window.Footer = Footer;
window.ComponentManager.register('footer', Footer);