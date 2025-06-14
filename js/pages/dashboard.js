// ===== js/pages/dashboard.js =====
// Page tableau de bord

class DashboardPage extends BasePage {
    constructor() {
        super({
            id: 'dashboard',
            title: 'Tableau de bord',
            description: 'Vue d\'ensemble de votre activité',
            requiresAuth: true
        });
        
        this.stats = [
            { label: 'Projets actifs', value: '12', icon: 'fas fa-project-diagram', color: 'primary' },
            { label: 'Devis en cours', value: '8', icon: 'fas fa-file-invoice', color: 'warning' },
            { label: 'Tâches à faire', value: '24', icon: 'fas fa-tasks', color: 'info' },
            { label: 'Chiffre d\'affaires', value: '124.5k€', icon: 'fas fa-euro-sign', color: 'success' }
        ];
    }
    
    getContent() {
        return `
            <!-- Stats Grid -->
            <div class="stats-grid">
                ${this.stats.map(stat => `
                    <div class="stat-card">
                        <div class="stat-icon text-${stat.color}">
                            <i class="${stat.icon}"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${stat.value}</div>
                            <div class="stat-label">${stat.label}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Recent Activity -->
            <div class="dashboard-section">
                <h2>Activité récente</h2>
                <div class="activity-list">
                    ${this.renderActivity('Nouveau devis créé', 'Devis #2024-001 pour Client ABC', 'il y a 2 heures')}
                    ${this.renderActivity('Projet mis à jour', 'Hangar industriel - Phase 2 terminée', 'il y a 5 heures')}
                    ${this.renderActivity('Fichier DSTV importé', 'Structure_principale.nc1 (2.4 MB)', 'hier')}
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="dashboard-section">
                <h2>Actions rapides</h2>
                <div class="quick-actions">
                    <button class="btn btn-primary">
                        <i class="fas fa-plus"></i> Nouveau projet
                    </button>
                    <button class="btn btn-secondary">
                        <i class="fas fa-file-plus"></i> Créer un devis
                    </button>
                    <button class="btn btn-secondary">
                        <i class="fas fa-upload"></i> Importer DSTV
                    </button>
                </div>
            </div>
        `;
    }
    
    renderActivity(title, description, time) {
        return `
            <div class="activity-item">
                <div class="activity-content">
                    <h4>${title}</h4>
                    <p>${description}</p>
                </div>
                <div class="activity-time">${time}</div>
            </div>
        `;
    }
}

window.DashboardPage = DashboardPage;
window.ComponentManager.register('dashboard-page', DashboardPage);