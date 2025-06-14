// ===== js/pages/home.js =====
// Page d'accueil (déjà créée mais mise à jour)

class HomePage extends BasePage {
    constructor() {
        super({
            id: 'home',
            title: 'Accueil',
            description: 'Solutions ERP pour la charpente métallique'
        });
    }
    
    getContent() {
        return `
            <!-- Hero Section -->
            <section class="hero-section">
                <div class="hero-content">
                    <h1 class="hero-title">
                        Transformez votre <span class="text-primary">industrie métallique</span>
                    </h1>
                    <p class="hero-description">
                        Expert en digitalisation pour la charpente métallique, 
                        nous vous accompagnons dans votre transformation digitale.
                    </p>
                    <div class="hero-actions">
                        <button class="btn btn-primary btn-lg">
                            Découvrir nos solutions
                        </button>
                        <button class="btn btn-outline-primary btn-lg">
                            Demander une démo
                        </button>
                    </div>
                </div>
            </section>
            
            <!-- Features Section -->
            <section class="features-section">
                <h2>Nos fonctionnalités phares</h2>
                <div class="features-grid">
                    ${this.renderFeatureCard('fas fa-calculator', 'Module de Chiffrage', 'Créez des devis précis et professionnels en quelques minutes')}
                    ${this.renderFeatureCard('fas fa-cube', 'Import DSTV', 'Importez et visualisez vos fichiers DSTV en 3D')}
                    ${this.renderFeatureCard('fas fa-chart-line', 'Tableaux de bord', 'Suivez vos KPIs en temps réel avec des visualisations modernes')}
                </div>
            </section>
        `;
    }
    
    renderFeatureCard(icon, title, description) {
        return `
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="${icon}"></i>
                </div>
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Boutons d'action
        this.on('.btn-primary', 'click', () => {
            window.location.href = '/services';
        });
        
        this.on('.btn-outline-primary', 'click', () => {
            window.location.href = '/contact';
        });
    }
}

window.HomePage = HomePage;
window.ComponentManager.register('home-page', HomePage);
