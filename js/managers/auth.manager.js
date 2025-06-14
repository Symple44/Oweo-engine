// js/managers/auth.manager.js
// Gestionnaire complet d'authentification

class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.refreshToken = null;
        this.isAuthenticated = false;
        this.permissions = new Set();
        this.listeners = new Map();
        
        // Configuration
        this.config = {
            tokenKey: 'oweo_auth_token',
            refreshTokenKey: 'oweo_refresh_token',
            userKey: 'oweo_user',
            rememberMeKey: 'oweo_remember_me',
            tokenRefreshInterval: 15 * 60 * 1000, // 15 minutes
            sessionTimeout: 30 * 60 * 1000 // 30 minutes
        };
        
        this.refreshTimer = null;
        this.sessionTimer = null;
    }
    
    // ========================================
    // Initialisation
    // ========================================
    
    async init() {
        console.log('🔐 Initialisation AuthManager');
        
        // Charger les données sauvegardées
        this.loadStoredAuth();
        
        // Configurer les intercepteurs API
        this.setupApiInterceptors();
        
        // Écouter les événements
        this.setupEventListeners();
        
        // Vérifier l'état de l'authentification
        await this.checkAuth();
        
        return this;
    }
    
    loadStoredAuth() {
        const token = StorageManager.get(this.config.tokenKey);
        const refreshToken = StorageManager.get(this.config.refreshTokenKey);
        const user = StorageManager.get(this.config.userKey);
        
        if (token && user) {
            this.token = token;
            this.refreshToken = refreshToken;
            this.user = user;
            this.isAuthenticated = true;
            
            // Configurer le token dans l'API
            ApiService.setAuthToken(token);
            
            // Extraire les permissions
            this.extractPermissions(token);
        }
    }
    
    setupApiInterceptors() {
        // Intercepteur de requête pour ajouter le token
        ApiService.addRequestInterceptor(async (config) => {
            if (this.token && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${this.token}`;
            }
            return config;
        });
        
        // Intercepteur d'erreur pour gérer les 401
        ApiService.addErrorInterceptor(async (error) => {
            if (error.status === 401) {
                // Token expiré, essayer de le rafraîchir
                if (this.refreshToken) {
                    try {
                        await this.refreshAccessToken();
                        // Réessayer la requête originale
                        return ApiService.request(error.config);
                    } catch (refreshError) {
                        // Échec du refresh, déconnecter
                        await this.logout();
                    }
                } else {
                    await this.logout();
                }
            }
            throw error;
        });
    }
    
    setupEventListeners() {
        // Écouter les changements de fenêtre/onglet
        window.addEventListener('storage', (e) => {
            if (e.key === this.config.tokenKey) {
                if (!e.newValue) {
                    // Token supprimé dans un autre onglet
                    this.handleLogout();
                } else if (e.newValue !== this.token) {
                    // Token modifié dans un autre onglet
                    this.loadStoredAuth();
                    this.emit('auth:changed', this.user);
                }
            }
        });
        
        // Gérer l'activité utilisateur
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => this.resetSessionTimer(), { passive: true });
        });
    }
    
    // ========================================
    // Méthodes d'authentification
    // ========================================
    
    async login(credentials) {
        try {
            this.emit('auth:loading', true);
            
            const response = await ApiService.post('/auth/login', {
                email: credentials.email,
                password: credentials.password,
                rememberMe: credentials.rememberMe || false
            });
            
            // Stocker les données d'authentification
            this.setAuthData(response);
            
            // Démarrer les timers
            this.startTokenRefreshTimer();
            this.resetSessionTimer();
            
            this.emit('auth:success', this.user);
            
            // Notifier l'interface
            NotificationService.success(`Bienvenue ${this.user.name} !`);
            
            return {
                success: true,
                user: this.user
            };
            
        } catch (error) {
            this.emit('auth:error', error);
            
            let message = 'Erreur de connexion';
            if (error.status === 401) {
                message = 'Email ou mot de passe incorrect';
            } else if (error.status === 429) {
                message = 'Trop de tentatives. Réessayez plus tard.';
            }
            
            NotificationService.error(message);
            
            return {
                success: false,
                error: message
            };
            
        } finally {
            this.emit('auth:loading', false);
        }
    }
    
    async register(userData) {
        try {
            this.emit('auth:loading', true);
            
            const response = await ApiService.post('/auth/register', userData);
            
            // Auto-connexion après inscription
            if (response.token) {
                this.setAuthData(response);
                NotificationService.success('Inscription réussie !');
                
                return {
                    success: true,
                    user: this.user
                };
            }
            
            return {
                success: true,
                requireVerification: true
            };
            
        } catch (error) {
            this.emit('auth:error', error);
            
            let message = 'Erreur lors de l\'inscription';
            if (error.status === 409) {
                message = 'Cet email est déjà utilisé';
            } else if (error.status === 422) {
                message = 'Données invalides';
            }
            
            NotificationService.error(message);
            
            return {
                success: false,
                error: message,
                details: error.data
            };
            
        } finally {
            this.emit('auth:loading', false);
        }
    }
    
    async logout() {
        try {
            // Appel API de déconnexion
            if (this.token) {
                await ApiService.post('/auth/logout').catch(() => {});
            }
        } finally {
            this.handleLogout();
        }
    }
    
    handleLogout() {
        // Nettoyer les données
        this.user = null;
        this.token = null;
        this.refreshToken = null;
        this.isAuthenticated = false;
        this.permissions.clear();
        
        // Nettoyer le stockage
        StorageManager.remove(this.config.tokenKey);
        StorageManager.remove(this.config.refreshTokenKey);
        StorageManager.remove(this.config.userKey);
        StorageManager.remove(this.config.rememberMeKey);
        
        // Nettoyer l'API
        ApiService.setAuthToken(null);
        
        // Arrêter les timers
        this.stopTokenRefreshTimer();
        this.stopSessionTimer();
        
        // Émettre l'événement
        this.emit('auth:logout');
        
        // Rediriger
        Router.navigate('/login');
        
        NotificationService.info('Vous êtes déconnecté');
    }
    
    // ========================================
    // Gestion des tokens
    // ========================================
    
    async checkAuth() {
        if (!this.token) {
            return false;
        }
        
        try {
            const response = await ApiService.get('/auth/me');
            
            this.user = response.user;
            this.isAuthenticated = true;
            
            // Mettre à jour les permissions
            this.extractPermissions(this.token);
            
            // Démarrer les timers
            this.startTokenRefreshTimer();
            this.resetSessionTimer();
            
            this.emit('auth:verified', this.user);
            
            return true;
            
        } catch (error) {
            if (error.status === 401) {
                await this.logout();
            }
            return false;
        }
    }
    
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }
        
        try {
            const response = await ApiService.post('/auth/refresh', {
                refreshToken: this.refreshToken
            });
            
            // Mettre à jour les tokens
            this.token = response.token;
            this.refreshToken = response.refreshToken;
            
            // Sauvegarder
            StorageManager.set(this.config.tokenKey, this.token);
            StorageManager.set(this.config.refreshTokenKey, this.refreshToken);
            
            // Mettre à jour l'API
            ApiService.setAuthToken(this.token);
            
            // Mettre à jour les permissions
            this.extractPermissions(this.token);
            
            this.emit('auth:refreshed');
            
            return this.token;
            
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw error;
        }
    }
    
    startTokenRefreshTimer() {
        this.stopTokenRefreshTimer();
        
        this.refreshTimer = setInterval(async () => {
            try {
                await this.refreshAccessToken();
            } catch (error) {
                console.error('Auto refresh failed:', error);
            }
        }, this.config.tokenRefreshInterval);
    }
    
    stopTokenRefreshTimer() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
    
    resetSessionTimer() {
        this.stopSessionTimer();
        
        this.sessionTimer = setTimeout(() => {
            NotificationService.warning('Session expirée. Veuillez vous reconnecter.');
            this.logout();
        }, this.config.sessionTimeout);
    }
    
    stopSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }
    
    // ========================================
    // Permissions et rôles
    // ========================================
    
    extractPermissions(token) {
        try {
            // Décoder le JWT pour extraire les permissions
            const payload = this.decodeToken(token);
            
            this.permissions.clear();
            
            if (payload.permissions) {
                payload.permissions.forEach(perm => this.permissions.add(perm));
            }
            
            if (payload.roles) {
                payload.roles.forEach(role => this.permissions.add(`role:${role}`));
            }
            
        } catch (error) {
            console.error('Failed to extract permissions:', error);
        }
    }
    
    hasPermission(permission) {
        return this.permissions.has(permission);
    }
    
    hasRole(role) {
        return this.permissions.has(`role:${role}`);
    }
    
    hasAnyPermission(permissions) {
        return permissions.some(perm => this.hasPermission(perm));
    }
    
    hasAllPermissions(permissions) {
        return permissions.every(perm => this.hasPermission(perm));
    }
    
    // ========================================
    // Méthodes utilitaires
    // ========================================
    
    setAuthData(response) {
        this.token = response.token;
        this.refreshToken = response.refreshToken;
        this.user = response.user;
        this.isAuthenticated = true;
        
        // Sauvegarder selon rememberMe
        const storage = response.rememberMe ? 'local' : 'session';
        StorageManager.set(this.config.tokenKey, this.token, storage);
        StorageManager.set(this.config.refreshTokenKey, this.refreshToken, storage);
        StorageManager.set(this.config.userKey, this.user, storage);
        
        // Configurer l'API
        ApiService.setAuthToken(this.token);
        
        // Extraire les permissions
        this.extractPermissions(this.token);
    }
    
    decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(c => 
                    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                ).join('')
            );
            
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Invalid token:', error);
            return {};
        }
    }
    
    isTokenExpired(token = this.token) {
        if (!token) return true;
        
        try {
            const payload = this.decodeToken(token);
            const exp = payload.exp * 1000; // Convertir en millisecondes
            return Date.now() >= exp;
        } catch (error) {
            return true;
        }
    }
    
    // ========================================
    // Événements
    // ========================================
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push(callback);
        
        // Retourner une fonction de désinscription
        return () => this.off(event, callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index >= 0) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in auth event listener:`, error);
                }
            });
        }
        
        // Émettre aussi via l'EventBus global si disponible
        if (window.EventBus) {
            window.EventBus.emit(`auth:${event}`, data);
        }
    }
    
    // ========================================
    // Interface modale
    // ========================================
    
    showLoginModal() {
        const modal = new Modal({
            title: 'Connexion',
            size: 'small',
            content: `
                <form id="login-form" class="auth-form">
                    <div class="form-group">
                        <label for="login-email">Email</label>
                        <input 
                            type="email" 
                            id="login-email" 
                            class="form-control" 
                            required
                            placeholder="votre@email.com"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="login-password">Mot de passe</label>
                        <input 
                            type="password" 
                            id="login-password" 
                            class="form-control" 
                            required
                            placeholder="••••••••"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="login-remember">
                            <span>Se souvenir de moi</span>
                        </label>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">
                        Se connecter
                    </button>
                    
                    <div class="auth-links">
                        <a href="#" onclick="AuthManager.showForgotPasswordModal()">
                            Mot de passe oublié ?
                        </a>
                        <a href="#" onclick="AuthManager.showRegisterModal()">
                            Créer un compte
                        </a>
                    </div>
                </form>
            `,
            onShow: () => {
                const form = document.getElementById('login-form');
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const credentials = {
                        email: document.getElementById('login-email').value,
                        password: document.getElementById('login-password').value,
                        rememberMe: document.getElementById('login-remember').checked
                    };
                    
                    const result = await this.login(credentials);
                    
                    if (result.success) {
                        modal.close();
                    }
                });
            }
        });
        
        modal.show();
    }
    
    showRegisterModal() {
        // Implémentation similaire pour l'inscription
        console.log('TODO: Implement register modal');
    }
    
    showForgotPasswordModal() {
        // Implémentation pour la récupération de mot de passe
        console.log('TODO: Implement forgot password modal');
    }
}

// ========================================
// Instance globale
// ========================================

window.AuthManager = new AuthManager();