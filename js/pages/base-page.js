// ===== js/pages/base-page.js =====
// Classe de base pour toutes les pages

class BasePage extends BaseComponent {
    constructor(config = {}) {
        super(config);
        this.title = config.title || 'Page';
        this.description = config.description || '';
        this.requiresAuth = config.requiresAuth || false;
    }
    
    async beforeRender() {
        // Mettre à jour le titre de la page
        document.title = `${this.title} - ${window.APP_CONFIG?.app?.name || 'Oweo'}`;
        
        // Vérifier l'authentification si nécessaire
        if (this.requiresAuth && !this.isAuthenticated()) {
            window.location.href = '/login';
            return false;
        }
    }
    
    isAuthenticated() {
        // Simple check - à améliorer avec AuthManager
        return window.StorageManager?.get('auth_token') !== null;
    }
    
    getTemplate() {
        return `
            <div class="page-content">
                <div class="page-header">
                    <h1>${this.title}</h1>
                    ${this.description ? `<p>${this.description}</p>` : ''}
                </div>
                <div class="page-body">
                    ${this.getContent()}
                </div>
            </div>
        `;
    }
    
    getContent() {
        return '<p>Page content goes here</p>';
    }
}

window.BasePage = BasePage;
