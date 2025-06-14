// js/services/api.service.js
// Service centralisé pour la gestion des appels API

class ApiService {
    constructor() {
        this.baseUrl = window.API_CONFIG?.baseUrl || '/api/v1';
        this.timeout = window.API_CONFIG?.timeout || 30000;
        this.headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
        this.interceptors = {
            request: [],
            response: [],
            error: []
        };
    }
    
    // ========================================
    // Configuration
    // ========================================
    
    setBaseUrl(url) {
        this.baseUrl = url.replace(/\/$/, '');
    }
    
    setHeader(key, value) {
        this.headers[key] = value;
    }
    
    removeHeader(key) {
        delete this.headers[key];
    }
    
    setAuthToken(token) {
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.headers['Authorization'];
        }
    }
    
    // ========================================
    // Intercepteurs
    // ========================================
    
    addRequestInterceptor(interceptor) {
        this.interceptors.request.push(interceptor);
        return () => {
            const index = this.interceptors.request.indexOf(interceptor);
            if (index >= 0) this.interceptors.request.splice(index, 1);
        };
    }
    
    addResponseInterceptor(interceptor) {
        this.interceptors.response.push(interceptor);
        return () => {
            const index = this.interceptors.response.indexOf(interceptor);
            if (index >= 0) this.interceptors.response.splice(index, 1);
        };
    }
    
    addErrorInterceptor(interceptor) {
        this.interceptors.error.push(interceptor);
        return () => {
            const index = this.interceptors.error.indexOf(interceptor);
            if (index >= 0) this.interceptors.error.splice(index, 1);
        };
    }
    
    // ========================================
    // Méthodes HTTP
    // ========================================
    
    async get(endpoint, options = {}) {
        return this.request({
            method: 'GET',
            endpoint,
            ...options
        });
    }
    
    async post(endpoint, data, options = {}) {
        return this.request({
            method: 'POST',
            endpoint,
            data,
            ...options
        });
    }
    
    async put(endpoint, data, options = {}) {
        return this.request({
            method: 'PUT',
            endpoint,
            data,
            ...options
        });
    }
    
    async patch(endpoint, data, options = {}) {
        return this.request({
            method: 'PATCH',
            endpoint,
            data,
            ...options
        });
    }
    
    async delete(endpoint, options = {}) {
        return this.request({
            method: 'DELETE',
            endpoint,
            ...options
        });
    }
    
    // ========================================
    // Méthode principale de requête
    // ========================================
    
    async request(config) {
        // Construire la configuration
        const requestConfig = await this.buildRequestConfig(config);
        
        // Appliquer les intercepteurs de requête
        for (const interceptor of this.interceptors.request) {
            await interceptor(requestConfig);
        }
        
        // Créer le contrôleur pour l'annulation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.timeout);
        
        try {
            // Log en mode debug
            if (window.OWEO_APP?.debug) {
                console.log(`🔵 API Request: ${requestConfig.method} ${requestConfig.url}`);
            }
            
            // Effectuer la requête
            const response = await fetch(requestConfig.url, {
                method: requestConfig.method,
                headers: requestConfig.headers,
                body: requestConfig.body,
                signal: controller.signal,
                credentials: config.credentials || 'same-origin',
                mode: config.mode || 'cors'
            });
            
            clearTimeout(timeoutId);
            
            // Parser la réponse
            const result = await this.parseResponse(response);
            
            // Vérifier le statut
            if (!response.ok) {
                throw new ApiError(response.status, result.message || 'Erreur API', result);
            }
            
            // Appliquer les intercepteurs de réponse
            for (const interceptor of this.interceptors.response) {
                await interceptor(result, response);
            }
            
            return result;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Gestion des erreurs
            const apiError = this.handleError(error);
            
            // Appliquer les intercepteurs d'erreur
            for (const interceptor of this.interceptors.error) {
                await interceptor(apiError);
            }
            
            throw apiError;
        }
    }
    
    // ========================================
    // Méthodes utilitaires
    // ========================================
    
    async buildRequestConfig(config) {
        const url = this.buildUrl(config.endpoint, config.params);
        
        const headers = {
            ...this.headers,
            ...config.headers
        };
        
        // Supprimer Content-Type pour FormData
        if (config.data instanceof FormData) {
            delete headers['Content-Type'];
        }
        
        let body = null;
        if (config.data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
            if (config.data instanceof FormData) {
                body = config.data;
            } else if (headers['Content-Type']?.includes('application/json')) {
                body = JSON.stringify(config.data);
            } else {
                body = config.data;
            }
        }
        
        return {
            url,
            method: config.method,
            headers,
            body
        };
    }
    
    buildUrl(endpoint, params) {
        // Construire l'URL complète
        let url = endpoint.startsWith('http') 
            ? endpoint 
            : `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
        
        // Ajouter les paramètres de requête
        if (params && Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams();
            
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    if (Array.isArray(value)) {
                        value.forEach(v => searchParams.append(`${key}[]`, v));
                    } else {
                        searchParams.append(key, value);
                    }
                }
            });
            
            url += `?${searchParams.toString()}`;
        }
        
        return url;
    }
    
    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
            return response.json();
        } else if (contentType?.includes('text/')) {
            return response.text();
        } else if (contentType?.includes('blob')) {
            return response.blob();
        } else {
            return response.text();
        }
    }
    
    handleError(error) {
        if (error instanceof ApiError) {
            return error;
        }
        
        if (error.name === 'AbortError') {
            return new ApiError(0, 'Requête annulée ou timeout dépassé', { timeout: true });
        }
        
        if (!navigator.onLine) {
            return new ApiError(0, 'Pas de connexion internet', { offline: true });
        }
        
        return new ApiError(0, error.message || 'Erreur réseau', { network: true });
    }
    
    // ========================================
    // Méthodes spécialisées
    // ========================================
    
    async upload(endpoint, file, options = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Ajouter d'autres données si nécessaire
        if (options.data) {
            Object.entries(options.data).forEach(([key, value]) => {
                formData.append(key, value);
            });
        }
        
        return this.post(endpoint, formData, {
            ...options,
            onUploadProgress: options.onProgress
        });
    }
    
    async download(endpoint, options = {}) {
        const response = await this.get(endpoint, {
            ...options,
            responseType: 'blob'
        });
        
        // Créer un lien de téléchargement
        const blob = new Blob([response]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = options.filename || 'download';
        document.body.appendChild(link);
        link.click();
        
        // Nettoyer
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        return response;
    }
    
    // ========================================
    // Méthodes de pagination
    // ========================================
    
    async paginate(endpoint, options = {}) {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const params = {
            ...options.params,
            page,
            limit
        };
        
        const response = await this.get(endpoint, { params });
        
        return {
            data: response.data || response.items || [],
            pagination: {
                page: response.page || page,
                limit: response.limit || limit,
                total: response.total || 0,
                totalPages: response.totalPages || Math.ceil(response.total / limit)
            }
        };
    }
    
    // ========================================
    // Cache de requêtes
    // ========================================
    
    async cachedGet(endpoint, options = {}) {
        const cacheKey = this.buildUrl(endpoint, options.params);
        const ttl = options.ttl || 300000; // 5 minutes par défaut
        
        // Vérifier le cache
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < ttl) {
            return cached.data;
        }
        
        // Faire la requête
        const data = await this.get(endpoint, options);
        
        // Mettre en cache
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        
        return data;
    }
    
    clearCache() {
        this.cache = new Map();
    }
}

// ========================================
// Classe d'erreur API personnalisée
// ========================================

class ApiError extends Error {
    constructor(status, message, data = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
        this.timestamp = new Date();
    }
    
    isClientError() {
        return this.status >= 400 && this.status < 500;
    }
    
    isServerError() {
        return this.status >= 500;
    }
    
    isNetworkError() {
        return this.status === 0;
    }
    
    isTimeout() {
        return this.data.timeout === true;
    }
    
    isOffline() {
        return this.data.offline === true;
    }
}

// ========================================
// Instance globale
// ========================================

window.ApiService = new ApiService();
window.ApiError = ApiError;