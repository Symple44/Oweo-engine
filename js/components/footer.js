// ===== js/components/footer.js =====
// Composant pied de page

class Footer extends BaseComponent {
    getTemplate() {
        const year = new Date().getFullYear();
        const config = window.APP_CONFIG || {};
        
        return `
            <div class="footer-container">
                <div class="footer-content">
                    <div class="footer-section">
                        <h3>À propos</h3>
                        <p>${config.app?.description || 'Expert ERP Charpente Métallique'}</p>
                    </div>
                    
                    <div class="footer-section">
                        <h3>Liens rapides</h3>
                        <ul class="footer-links">
                            <li><a href="/services">Services</a></li>
                            <li><a href="/contact">Contact</a></li>
                            <li><a href="/privacy">Confidentialité</a></li>
                            <li><a href="/terms">CGU</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-section">
                        <h3>Contact</h3>
                        <p>
                            ${config.contact?.email ? `<a href="mailto:${config.contact.email}">${config.contact.email}</a><br>` : ''}
                            ${config.contact?.phone || ''}
                        </p>
                    </div>
                    
                    <div class="footer-section">
                        <h3>Suivez-nous</h3>
                        <div class="footer-social">
                            <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>
                            <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                            <a href="#" aria-label="GitHub"><i class="fab fa-github"></i></a>
                        </div>
                    </div>
                </div>
                
                <div class="footer-bottom">
                    <p>&copy; ${year} ${config.app?.company || 'Oweo'}. Tous droits réservés.</p>
                </div>
            </div>
        `;
    }
}

window.Footer = Footer;
window.ComponentManager.register('footer', Footer);