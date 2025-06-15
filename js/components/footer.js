// ===== js/components/footer.js =====
// Composant pied de page harmonieux et moderne

class Footer extends BaseComponent {
    constructor(config = {}) {
        super(config);
        this.year = new Date().getFullYear();
        this.config = window.APP_CONFIG || {};
        
        // Configuration des liens
        this.productLinks = [
            { label: 'Fonctionnalités', href: '/features' },
            { label: 'Tarifs', href: '/pricing' },
            { label: 'Démo', href: '/demo' },
            { label: 'API', href: '/api' }
        ];
        
        this.supportLinks = [
            { label: 'Documentation', href: '/docs' },
            { label: 'Contact', href: '/contact' },
            { label: 'FAQ', href: '/faq' },
            { label: 'Status', href: '/status' }
        ];
        
        this.socialLinks = [
            { icon: 'fab fa-linkedin-in', href: 'https://linkedin.com', label: 'LinkedIn' },
            { icon: 'fab fa-twitter', href: 'https://twitter.com', label: 'Twitter' },
            { icon: 'fab fa-github', href: 'https://github.com', label: 'GitHub' },
            { icon: 'fab fa-youtube', href: 'https://youtube.com', label: 'YouTube' }
        ];
    }
    
    getTemplate() {
        return `
            <div class="footer-container">
                <!-- Newsletter optionnelle -->
                ${this.getNewsletterSection()}
                
                <!-- Contenu principal -->
                <div class="footer-main">
                    <!-- Colonne Brand -->
                    <div class="footer-brand">
                        <div class="footer-logo-wrapper">
                            <div class="footer-logo">
                                ${this.getLogoSVG()}
                            </div>
                            <div class="footer-brand-text">
                                <h3 class="footer-company">Oweo</h3>
                                <p class="footer-tagline">L'ERP métier de la charpente métallique</p>
                            </div>
                        </div>
                        
                        <p class="footer-tagline">
                            Optimisez votre production et votre rentabilité avec notre solution complète 
                            de gestion pour les entreprises de charpente métallique.
                        </p>
                        
                        <!-- Social links -->
                        <div class="footer-social">
                            ${this.socialLinks.map(link => `
                                <a href="${link.href}" 
                                   class="footer-social-link" 
                                   aria-label="${link.label}"
                                   target="_blank"
                                   rel="noopener noreferrer">
                                    <i class="${link.icon}"></i>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Colonne Produit -->
                    <div class="footer-column">
                        <h4 class="footer-column-title">Produit</h4>
                        <nav class="footer-links">
                            ${this.productLinks.map(link => `
                                <a href="${link.href}" class="footer-link">
                                    ${link.label}
                                    <i class="fas fa-arrow-right"></i>
                                </a>
                            `).join('')}
                        </nav>
                    </div>
                    
                    <!-- Colonne Support -->
                    <div class="footer-column">
                        <h4 class="footer-column-title">Support</h4>
                        <nav class="footer-links">
                            ${this.supportLinks.map(link => `
                                <a href="${link.href}" class="footer-link">
                                    ${link.label}
                                    <i class="fas fa-arrow-right"></i>
                                </a>
                            `).join('')}
                        </nav>
                    </div>
                </div>
                
                <!-- Bas de page -->
                <div class="footer-bottom">
                    <p class="footer-copyright">
                        &copy; ${this.year} <a href="/">${this.config.app?.company || 'Oweo'}</a>. 
                        Tous droits réservés. 
                        <a href="/privacy">Confidentialité</a> · 
                        <a href="/terms">Conditions</a>
                    </p>
                </div>
            </div>
        `;
    }
    
    getNewsletterSection() {
        // Optionnel - peut être activé/désactivé
        if (!this.config.features?.newsletter) {
            return '';
        }
        
        return `
            <div class="footer-newsletter">
                <div class="footer-newsletter-content">
                    <h3 class="footer-newsletter-title">Restez informé</h3>
                    <p class="footer-newsletter-text">
                        Recevez nos dernières actualités et mises à jour produit
                    </p>
                    <form class="footer-newsletter-form" id="newsletter-form">
                        <input 
                            type="email" 
                            class="footer-newsletter-input" 
                            placeholder="Votre email"
                            required
                        >
                        <button type="submit" class="footer-newsletter-btn">
                            S'inscrire
                        </button>
                    </form>
                </div>
            </div>
        `;
    }
    
    getLogoSVG() {
        return `
            <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="footerLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:var(--theme-primary);stop-opacity:1" />
                        <stop offset="100%" style="stop-color:var(--theme-accent);stop-opacity:1" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="url(#footerLogoGradient)" opacity="0.1"/>
                <path d="M50 20 L70 40 L70 70 L50 80 L30 70 L30 40 Z" fill="url(#footerLogoGradient)"/>
                <text x="50" y="55" text-anchor="middle" font-size="24" font-weight="bold" fill="white">O</text>
            </svg>
        `;
    }
    
    setupEventListeners() {
        // Animation du logo au survol
        const logo = this.container.querySelector('.footer-logo');
        if (logo) {
            logo.addEventListener('mouseenter', () => {
                const svg = logo.querySelector('svg');
                if (svg) {
                    svg.style.animation = 'footer-logo-pulse 600ms ease';
                }
            });
            
            logo.addEventListener('animationend', (e) => {
                e.target.style.animation = '';
            });
        }
        
        // Gestion du formulaire newsletter
        const form = this.container.querySelector('#newsletter-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSubmit(e.target);
            });
        }
        
        // Effet de parallaxe subtil sur les cercles de fond
        if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
            this.initParallax();
        }
    }
    
    handleNewsletterSubmit(form) {
        const email = form.querySelector('input[type="email"]').value;
        const button = form.querySelector('button');
        
        // Animation du bouton
        button.textContent = 'Inscription...';
        button.disabled = true;
        
        // Simuler l'envoi (remplacer par un vrai appel API)
        setTimeout(() => {
            button.textContent = '✓ Inscrit !';
            button.style.background = 'var(--color-success)';
            
            setTimeout(() => {
                form.reset();
                button.textContent = "S'inscrire";
                button.style.background = '';
                button.disabled = false;
            }, 2000);
        }, 1000);
        
        console.log('Newsletter subscription:', email);
    }
    
    initParallax() {
        let ticking = false;
        
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const footer = this.container;
            const rect = footer.getBoundingClientRect();
            
            // Ne faire l'effet que si le footer est visible
            if (rect.top < window.innerHeight) {
                const speed = 0.5;
                const yPos = -(scrolled * speed);
                
                // Déplacer les pseudo-éléments via CSS custom properties
                footer.style.setProperty('--parallax-y', `${yPos}px`);
            }
            
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        });
    }
    
    async onMount() {
        // Ajouter l'animation CSS pour le logo
        const style = document.createElement('style');
        style.textContent = `
            @keyframes footer-logo-pulse {
                0% { transform: scale(1) rotate(0deg); }
                50% { transform: scale(1.1) rotate(5deg); }
                100% { transform: scale(1) rotate(0deg); }
            }
            
            .footer::before,
            .footer::after {
                transform: translateY(var(--parallax-y, 0));
                transition: transform 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
    }
}

window.Footer = Footer;
window.ComponentManager.register('footer', Footer);