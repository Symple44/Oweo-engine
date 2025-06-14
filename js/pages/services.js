// ===== js/pages/services.js =====
// Page des services

class ServicesPage extends BasePage {
    constructor() {
        super({
            id: 'services',
            title: 'Nos Services',
            description: 'Découvrez nos solutions pour la charpente métallique'
        });
        
        this.services = [
            {
                icon: 'fas fa-calculator',
                title: 'Module de Chiffrage',
                description: 'Créez rapidement des devis détaillés et professionnels',
                features: [
                    'Bibliothèque de prix actualisée',
                    'Calcul automatique des marges',
                    'Export PDF personnalisé',
                    'Suivi des versions'
                ]
            },
            {
                icon: 'fas fa-cube',
                title: 'Import/Export DSTV',
                description: 'Intégration complète avec vos logiciels de CAO',
                features: [
                    'Import NC1, NC2',
                    'Visualisation 3D',
                    'Détection des collisions',
                    'Export vers machines CNC'
                ]
            },
            {
                icon: 'fas fa-project-diagram',
                title: 'Gestion de Projet',
                description: 'Pilotez vos chantiers de A à Z',
                features: [
                    'Planning Gantt interactif',
                    'Suivi des ressources',
                    'Gestion documentaire',
                    'Collaboration temps réel'
                ]
            }
        ];
    }
    
    getContent() {
        return `
            <div class="services-hero">
                <h1>Solutions complètes pour votre activité</h1>
                <p>Des outils pensés par et pour les professionnels de la charpente métallique</p>
            </div>
            
            <div class="services-grid">
                ${this.services.map(service => this.renderServiceCard(service)).join('')}
            </div>
            
            <div class="cta-section">
                <h2>Prêt à optimiser votre activité ?</h2>
                <p>Contactez-nous pour une démonstration personnalisée</p>
                <a href="/contact" class="btn btn-primary btn-lg">
                    Demander une démo
                </a>
            </div>
        `;
    }
    
    renderServiceCard(service) {
        return `
            <div class="service-card">
                <div class="service-icon">
                    <i class="${service.icon}"></i>
                </div>
                <h3>${service.title}</h3>
                <p>${service.description}</p>
                <ul class="service-features">
                    ${service.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
                <button class="btn btn-outline-primary">
                    En savoir plus
                </button>
            </div>
        `;
    }
}

window.ServicesPage = ServicesPage;
window.ComponentManager?.register('services-page', ServicesPage);