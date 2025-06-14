// ===== js/managers/auth.manager.js =====
// Gestionnaire d'authentification simplifié

class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
    }
    
    async init() {
        console.log('🔐 Initialisation AuthManager');
        
        // Charger les données sauvegardées
        this.token = window.StorageManager?.get('auth_token');
        this.user = window.StorageManager?.get('user');
        
        if (this.token && this.user) {
            this.isAuthenticated = true;
        }
        
        return this;
    }
    
    async login(email, password) {
        // Simulation de login
        console.log('Login attempt:', { email });
        
        // En production, faire un appel API
        const mockUser = {
            id: 1,
            name: 'John Doe',
            email: email,
            role: 'admin'
        };
        
        const mockToken = 'mock_jwt_token_' + Date.now();
        
        this.user = mockUser;
        this.token = mockToken;
        this.isAuthenticated = true;
        
        // Sauvegarder
        window.StorageManager?.set('auth_token', mockToken);
        window.StorageManager?.set('user', mockUser);
        
        window.EventBus?.emit('auth:login', { user: mockUser });
        
        return { success: true, user: mockUser };
    }
    
    async logout() {
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        
        window.StorageManager?.remove('auth_token');
        window.StorageManager?.remove('user');
        
        window.EventBus?.emit('auth:logout');
        
        return { success: true };
    }
    
    getUser() {
        return this.user;
    }
    
    getToken() {
        return this.token;
    }
    
    isLoggedIn() {
        return this.isAuthenticated;
    }
}

window.AuthManager = new AuthManager();