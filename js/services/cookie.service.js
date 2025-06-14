// js/services/cookie.service.js
// Service de gestion des cookies avec conformité RGPD

class CookieManager {
    constructor() {
        this.consent = {
            necessary: true, // Toujours activé
            analytics: false,
            marketing: false,
            preferences: false
        };
        
        this.cookies = new Map();
        this.listeners = new Map();
        
        // Configuration
        this.config = {
            consentKey: 'oweo_cookie_consent',
            consentDuration: 365, // jours
            domain: window.location.hostname,
            secure: window.location.protocol === 'https:',
            sameSite: 'Lax'
        };
        
        // Définitions des cookies par catégorie
        this.cookieCategories = {
            necessary: {
                name: 'Essentiels',
                description: 'Ces cookies sont nécessaires au fonctionnement du site',
                required: true,
                cookies: [
                    {
                        name: 'oweo_session',
                        description: 'Maintient la session utilisateur',
                        duration: 'Session'
                    },
                    {
                        name: 'oweo_cookie_consent',
                        description: 'Stocke vos préférences de cookies',
                        duration: '1 an'
                    }
                ]
            },
            analytics: {
                name: 'Analytics',
                description: 'Ces cookies nous aident à comprendre comment vous utilisez notre site',
                required: false,
                cookies: [
                    {
                        name: '_ga',
                        description: 'Google Analytics - Suivi des visiteurs',
                        duration: '2 ans'
                    },
                    {
                        name: '_gid',
                        description: 'Google Analytics - Distinction des utilisateurs',
                        duration: '24 heures'
                    }
                ]
            },
            marketing: {
                name: 'Marketing',
                description: 'Ces cookies sont utilisés pour personnaliser les publicités',
                required: false,
                cookies: [
                    {
                        name: '_fbp',
                        description: 'Facebook Pixel',
                        duration: '3 mois'
                    }
                ]
            },
            preferences: {
                name: 'Préférences',
                description: 'Ces cookies mémorisent vos préférences',
                required: false,
                cookies: [
                    {
                        name: 'oweo_theme',
                        description: 'Vos préférences de thème',
                        duration: '1 an'
                    },
                    {
                        name: 'oweo_lang',
                        description: 'Votre langue préférée',
                        duration: '1 an'
                    }
                ]
            }
        };
    }
    
    // ========================================
    // Initialisation
    // ========================================
    
    async init() {
        console.log('🍪 Initialisation CookieManager');
        
        // Charger le consentement sauvegardé
        this.loadConsent();
        
        // Vérifier si on doit afficher la bannière
        if (!this.hasConsent()) {
            this.showBanner();
        } else {
            // Appliquer les scripts selon le consentement
            this.applyConsent();
        }
        
        // Scanner les cookies existants
        this.scanCookies();
        
        return this;
    }
    
    loadConsent() {
        const saved = this.getCookie(this.config.consentKey);
        if (saved) {
            try {
                const consent = JSON.parse(decodeURIComponent(saved));
                this.consent = { ...this.consent, ...consent };
            } catch (e) {
                console.error('Failed to parse consent:', e);
            }
        }
    }
    
    hasConsent() {
        return this.getCookie(this.config.consentKey) !== null;
    }
    
    // ========================================
    // Gestion du consentement
    // ========================================
    
    acceptAll() {
        Object.keys(this.consent).forEach(category => {
            if (category !== 'necessary') {
                this.consent[category] = true;
            }
        });
        
        this.saveConsent();
        this.hideBanner();
        this.applyConsent();
        
        NotificationService.success('Tous les cookies acceptés');
        this.emit('consentChanged', this.consent);
    }
    
    acceptSelected() {
        this.saveConsent();
        this.hideBanner();
        this.applyConsent();
        
        NotificationService.success('Préférences de cookies sauvegardées');
        this.emit('consentChanged', this.consent);
    }
    
    rejectAll() {
        Object.keys(this.consent).forEach(category => {
            if (category !== 'necessary') {
                this.consent[category] = false;
            }
        });
        
        this.saveConsent();
        this.hideBanner();
        this.removeNonEssentialCookies();
        
        NotificationService.info('Seuls les cookies essentiels sont activés');
        this.emit('consentChanged', this.consent);
    }
    
    saveConsent() {
        const consentData = encodeURIComponent(JSON.stringify(this.consent));
        
        this.setCookie(
            this.config.consentKey,
            consentData,
            this.config.consentDuration
        );
    }
    
    applyConsent() {
        // Analytics
        if (this.consent.analytics) {
            this.loadAnalytics();
        } else {
            this.removeAnalytics();
        }
        
        // Marketing
        if (this.consent.marketing) {
            this.loadMarketing();
        } else {
            this.removeMarketing();
        }
        
        // Préférences
        if (!this.consent.preferences) {
            this.removePreferences();
        }
    }
    
    // ========================================
    // Chargement des scripts tiers
    // ========================================
    
    loadAnalytics() {
        // Google Analytics
        if (window.GA_MEASUREMENT_ID && !window.gtag) {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${window.GA_MEASUREMENT_ID}`;
            document.head.appendChild(script);
            
            window.dataLayer = window.dataLayer || [];
            window.gtag = function() { dataLayer.push(arguments); };
            gtag('js', new Date());
            gtag('config', window.GA_MEASUREMENT_ID);
            
            console.log('📊 Analytics loaded');
        }
    }
    
    removeAnalytics() {
        // Supprimer les cookies Google Analytics
        this.deleteCookie('_ga');
        this.deleteCookie('_gid');
        this.deleteCookie('_gat');
        
        // Désactiver le tracking
        if (window.GA_MEASUREMENT_ID) {
            window[`ga-disable-${window.GA_MEASUREMENT_ID}`] = true;
        }
    }
    
    loadMarketing() {
        // Facebook Pixel, etc.
        console.log('📢 Marketing scripts would be loaded here');
    }
    
    removeMarketing() {
        // Supprimer les cookies marketing
        this.deleteCookie('_fbp');
        this.deleteCookie('_fbc');
    }
    
    removePreferences() {
        // Note: on ne supprime pas forcément les préférences
        // car elles améliorent l'expérience utilisateur
        console.log('Preferences cookies handling');
    }
    
    // ========================================
    // Gestion des cookies
    // ========================================
    
    setCookie(name, value, days = 365) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        
        const options = [
            `${name}=${encodeURIComponent(value)}`,
            `expires=${date.toUTCString()}`,
            'path=/'
        ];
        
        if (this.config.domain !== 'localhost') {
            options.push(`domain=${this.config.domain}`);
        }
        
        if (this.config.secure) {
            options.push('secure');
        }
        
        options.push(`SameSite=${this.config.sameSite}`);
        
        document.cookie = options.join('; ');
        
        // Mettre à jour le cache
        this.cookies.set(name, { value, expires: date });
        
        this.emit('cookieSet', { name, value });
    }
    
    getCookie(name) {
        // Vérifier le cache d'abord
        const cached = this.cookies.get(name);
        if (cached && cached.expires > new Date()) {
            return cached.value;
        }
        
        // Sinon, lire depuis document.cookie
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(nameEQ) === 0) {
                const value = decodeURIComponent(c.substring(nameEQ.length));
                this.cookies.set(name, { value, expires: new Date() });
                return value;
            }
        }
        
        return null;
    }
    
    deleteCookie(name) {
        this.setCookie(name, '', -1);
        this.cookies.delete(name);
        
        // Essayer aussi avec différents domaines
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${this.config.domain};`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${this.config.domain};`;
        
        this.emit('cookieDeleted', { name });
    }
    
    scanCookies() {
        const cookies = document.cookie.split(';');
        this.cookies.clear();
        
        cookies.forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            if (name && value) {
                this.cookies.set(name, {
                    value: decodeURIComponent(value),
                    expires: new Date() // Unknown expiry
                });
            }
        });
        
        return Array.from(this.cookies.keys());
    }
    
    removeNonEssentialCookies() {
        const essentialCookies = [
            this.config.consentKey,
            'oweo_session',
            'oweo_auth_token'
        ];
        
        this.scanCookies().forEach(cookieName => {
            if (!essentialCookies.includes(cookieName)) {
                this.deleteCookie(cookieName);
            }
        });
    }
    
    // ========================================
    // Interface utilisateur
    // ========================================
    
    showBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.style.display = 'block';
            setTimeout(() => banner.classList.add('show'), 100);
        }
    }
    
    hideBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.style.display = 'none', 300);
        }
    }
    
    showSettings() {
        const modal = new Modal({
            title: '🍪 Paramètres des cookies',
            size: 'medium',
            content: this.renderSettings(),
            footer: `
                <button class="btn btn-secondary" onclick="CookieManager.rejectAll()">
                    Tout refuser
                </button>
                <button class="btn btn-primary" onclick="CookieManager.acceptSelected()">
                    Sauvegarder mes choix
                </button>
                <button class="btn btn-primary" onclick="CookieManager.acceptAll()">
                    Tout accepter
                </button>
            `,
            onShow: () => {
                // Bind les switches
                document.querySelectorAll('.cookie-switch').forEach(input => {
                    const category = input.dataset.category;
                    
                    // État initial
                    input.checked = this.consent[category];
                    
                    // Désactiver si nécessaire
                    if (this.cookieCategories[category]?.required) {
                        input.disabled = true;
                    }
                    
                    // Écouter les changements
                    input.addEventListener('change', (e) => {
                        this.consent[category] = e.target.checked;
                    });
                });
            }
        });
        
        modal.show();
    }
    
    renderSettings() {
        return `
            <div class="cookie-settings">
                <p class="mb-4">
                    Nous utilisons des cookies pour améliorer votre expérience. 
                    Vous pouvez personnaliser vos préférences ci-dessous.
                </p>
                
                ${Object.entries(this.cookieCategories).map(([key, category]) => `
                    <div class="cookie-category">
                        <div class="category-header">
                            <div class="category-info">
                                <h4>${category.name}</h4>
                                <p>${category.description}</p>
                            </div>
                            <label class="switch">
                                <input 
                                    type="checkbox" 
                                    class="cookie-switch"
                                    data-category="${key}"
                                    ${category.required ? 'checked disabled' : ''}
                                >
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div class="category-cookies">
                            ${category.cookies.map(cookie => `
                                <div class="cookie-item">
                                    <strong>${cookie.name}</strong>
                                    <span>${cookie.description}</span>
                                    <small>Durée: ${cookie.duration}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
                
                <div class="cookie-info">
                    <p>
                        <strong>Qu'est-ce qu'un cookie ?</strong><br>
                        Un cookie est un petit fichier texte stocké sur votre appareil 
                        qui nous aide à mémoriser vos préférences et à améliorer votre expérience.
                    </p>
                </div>
            </div>
        `;
    }
    
    // ========================================
    // Événements
    // ========================================
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push(callback);
        
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
                    console.error(`Error in cookie event listener:`, error);
                }
            });
        }
    }
    
    // ========================================
    // API publique
    // ========================================
    
    getConsent() {
        return { ...this.consent };
    }
    
    updateConsent(category, value) {
        if (category === 'necessary') return; // Toujours activé
        
        if (this.consent.hasOwnProperty(category)) {
            this.consent[category] = value;
            this.saveConsent();
            this.applyConsent();
        }
    }
    
    getAllCookies() {
        this.scanCookies();
        return Array.from(this.cookies.entries()).map(([name, data]) => ({
            name,
            value: data.value,
            category: this.getCookieCategory(name)
        }));
    }
    
    getCookieCategory(cookieName) {
        for (const [category, config] of Object.entries(this.cookieCategories)) {
            if (config.cookies.some(c => c.name === cookieName)) {
                return category;
            }
        }
        return 'unknown';
    }
}

// ========================================
// Instance globale
// ========================================

window.CookieManager = new CookieManager();