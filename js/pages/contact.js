// ===== js/pages/contact.js =====
// Page de contact

class ContactPage extends BasePage {
    constructor() {
        super({
            id: 'contact',
            title: 'Contact',
            description: 'Prenez contact avec notre équipe'
        });
    }
    
    getContent() {
        const config = window.APP_CONFIG || {};
        
        return `
            <div class="contact-container">
                <div class="contact-info">
                    <h2>Parlons de votre projet</h2>
                    <p>Notre équipe est à votre écoute pour répondre à toutes vos questions</p>
                    
                    <div class="contact-details">
                        <div class="contact-item">
                            <i class="fas fa-envelope"></i>
                            <div>
                                <h4>Email</h4>
                                <a href="mailto:${config.contact?.email || 'contact@oweo.fr'}">
                                    ${config.contact?.email || 'contact@oweo.fr'}
                                </a>
                            </div>
                        </div>
                        
                        <div class="contact-item">
                            <i class="fas fa-phone"></i>
                            <div>
                                <h4>Téléphone</h4>
                                <a href="tel:${config.contact?.phone || '+33123456789'}">
                                    ${config.contact?.phone || '+33 1 23 45 67 89'}
                                </a>
                            </div>
                        </div>
                        
                        <div class="contact-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <div>
                                <h4>Adresse</h4>
                                <p>
                                    ${config.contact?.address?.street || '123 Rue de l\'Innovation'}<br>
                                    ${config.contact?.address?.postalCode || '75001'} 
                                    ${config.contact?.address?.city || 'Paris'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="contact-form-container">
                    <form class="contact-form" id="contactForm">
                        <div class="form-group">
                            <label for="contactName">Nom complet</label>
                            <input type="text" id="contactName" name="name" required 
                                   class="form-control" placeholder="Votre nom">
                        </div>
                        
                        <div class="form-group">
                            <label for="contactEmail">Email</label>
                            <input type="email" id="contactEmail" name="email" required 
                                   class="form-control" placeholder="votre@email.com">
                        </div>
                        
                        <div class="form-group">
                            <label for="contactCompany">Entreprise</label>
                            <input type="text" id="contactCompany" name="company" 
                                   class="form-control" placeholder="Nom de votre entreprise">
                        </div>
                        
                        <div class="form-group">
                            <label for="contactSubject">Sujet</label>
                            <select id="contactSubject" name="subject" class="form-control">
                                <option value="">Sélectionnez un sujet</option>
                                <option value="demo">Demande de démonstration</option>
                                <option value="info">Demande d'information</option>
                                <option value="support">Support technique</option>
                                <option value="other">Autre</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="contactMessage">Message</label>
                            <textarea id="contactMessage" name="message" required 
                                      class="form-control" rows="5" 
                                      placeholder="Décrivez votre projet ou votre demande"></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-block">
                            Envoyer le message
                        </button>
                    </form>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        this.on('#contactForm', 'submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            // Simulation d'envoi
            console.log('Contact form data:', data);
            
            // Afficher un message de succès
            if (window.NotificationService) {
                window.NotificationService.success('Message envoyé avec succès !');
            }
            
            // Réinitialiser le formulaire
            e.target.reset();
        });
    }
}

window.ContactPage = ContactPage;
window.ComponentManager?.register('contact-page', ContactPage);
