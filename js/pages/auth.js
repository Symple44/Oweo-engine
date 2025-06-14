// ===== js/pages/auth.js =====
// Page d'authentification (login/register)

class AuthPage extends BasePage {
    constructor() {
        super({
            id: 'auth',
            title: 'Connexion',
            description: ''
        });
        
        this.mode = window.location.pathname === '/register' ? 'register' : 'login';
    }
    
    getContent() {
        return `
            <div class="auth-container">
                <div class="auth-box">
                    <div class="auth-header">
                        <h1>${this.mode === 'login' ? 'Connexion' : 'Inscription'}</h1>
                        <p>${this.mode === 'login' 
                            ? 'Connectez-vous à votre compte' 
                            : 'Créez votre compte gratuit'}</p>
                    </div>
                    
                    <form class="auth-form" id="authForm">
                        ${this.mode === 'register' ? `
                            <div class="form-group">
                                <label for="name">Nom complet</label>
                                <input type="text" id="name" name="name" required 
                                       class="form-control" placeholder="Jean Dupont">
                            </div>
                        ` : ''}
                        
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" required 
                                   class="form-control" placeholder="email@exemple.com">
                        </div>
                        
                        <div class="form-group">
                            <label for="password">Mot de passe</label>
                            <input type="password" id="password" name="password" required 
                                   class="form-control" placeholder="••••••••">
                        </div>
                        
                        ${this.mode === 'login' ? `
                            <div class="form-group form-check">
                                <label class="form-check-label">
                                    <input type="checkbox" name="remember" class="form-check-input">
                                    Se souvenir de moi
                                </label>
                                <a href="/forgot-password" class="forgot-link">Mot de passe oublié ?</a>
                            </div>
                        ` : ''}
                        
                        <button type="submit" class="btn btn-primary btn-block">
                            ${this.mode === 'login' ? 'Se connecter' : 'S\'inscrire'}
                        </button>
                    </form>
                    
                    <div class="auth-footer">
                        <p>
                            ${this.mode === 'login' 
                                ? 'Pas encore de compte ?' 
                                : 'Déjà inscrit ?'}
                            <a href="${this.mode === 'login' ? '/register' : '/login'}">
                                ${this.mode === 'login' ? 'S\'inscrire' : 'Se connecter'}
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        this.on('#authForm', 'submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            // Simulation d'authentification
            console.log('Auth data:', data);
            
            // Afficher un message de succès
            if (window.NotificationService) {
                window.NotificationService.success(
                    this.mode === 'login' 
                        ? 'Connexion réussie !' 
                        : 'Inscription réussie !'
                );
            }
            
            // Rediriger après un court délai
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        });
    }
}

window.AuthPage = AuthPage;
window.ComponentManager.register('auth-page', AuthPage);