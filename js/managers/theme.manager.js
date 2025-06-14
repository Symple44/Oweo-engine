// js/managers/theme.manager.js
// Gestionnaire de thèmes adapté à la structure CSS existante

class ThemeManager {
    constructor() {
        this.currentTheme = 'oweo';
        this.currentMode = 'light';
        this.listeners = new Map();
        
        // Configuration
        this.config = {
            storageKey: 'oweo_theme',
            modeKey: 'oweo_mode',
            autoDetect: true,
            transitionDuration: 300
        };
    }
    
    // ========================================
    // Initialisation
    // ========================================
    
    async init() {
        console.log('🎨 Initialisation ThemeManager');
        
        // Charger les préférences sauvegardées
        this.loadSavedPreferences();
        
        // Détecter les préférences système si nécessaire
        if (this.config.autoDetect && !this.getSavedMode()) {
            this.detectSystemPreference();
        }
        
        // Appliquer le thème et le mode
        this.applyTheme(this.currentTheme, false);
        this.applyMode(this.currentMode, false);
        
        // Écouter les changements système
        this.watchSystemPreference();
        
        // Initialiser les contrôles
        this.initializeControls();
        
        return this;
    }
    
    loadSavedPreferences() {
        // Charger le thème
        const savedTheme = localStorage.getItem(this.config.storageKey);
        if (savedTheme) {
            this.currentTheme = savedTheme;
        }
        
        // Charger le mode
        const savedMode = localStorage.getItem(this.config.modeKey);
        if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
            this.currentMode = savedMode;
        }
    }
    
    getSavedMode() {
        return localStorage.getItem(this.config.modeKey);
    }
    
    detectSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.currentMode = 'dark';
        } else {
            this.currentMode = 'light';
        }
    }
    
    watchSystemPreference() {
        if (!window.matchMedia) return;
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            if (this.config.autoDetect && !this.getSavedMode()) {
                const mode = e.matches ? 'dark' : 'light';
                this.setMode(mode, false);
            }
        });
    }
    
    // ========================================
    // Application des thèmes et modes
    // ========================================
    
    setTheme(themeName, save = true) {
        this.currentTheme = themeName;
        this.applyTheme(themeName, true);
        
        if (save) {
            localStorage.setItem(this.config.storageKey, themeName);
        }
        
        this.emit('themeChanged', {
            theme: themeName,
            mode: this.currentMode
        });
    }
    
    setMode(mode, save = true) {
        if (mode !== 'light' && mode !== 'dark') {
            console.warn(`Mode invalide: ${mode}`);
            return;
        }
        
        this.currentMode = mode;
        this.applyMode(mode, true);
        
        if (save) {
            localStorage.setItem(this.config.modeKey, mode);
        }
        
        this.emit('modeChanged', {
            theme: this.currentTheme,
            mode: mode
        });
    }
    
    applyTheme(themeName, animate = true) {
        const root = document.documentElement;
        const body = document.body;
        
        // Ajouter la transition si animation
        if (animate) {
            root.style.transition = `all ${this.config.transitionDuration}ms ease-in-out`;
            body.style.transition = `all ${this.config.transitionDuration}ms ease-in-out`;
        }
        
        // Appliquer les attributs
        root.setAttribute('data-theme', themeName);
        body.setAttribute('data-theme', themeName);
        
        // Appliquer les classes
        body.className = body.className.replace(/\btheme-\S+/g, '');
        body.classList.add(`theme-${themeName}`);
        
        // Retirer la transition après l'animation
        if (animate) {
            setTimeout(() => {
                root.style.transition = '';
                body.style.transition = '';
            }, this.config.transitionDuration);
        }
    }
    
    applyMode(mode, animate = true) {
        const root = document.documentElement;
        const body = document.body;
        
        // Ajouter la transition si animation
        if (animate) {
            const elements = [root, body];
            elements.forEach(el => {
                el.style.transition = `background-color ${this.config.transitionDuration}ms ease-in-out, color ${this.config.transitionDuration}ms ease-in-out`;
            });
        }
        
        // Appliquer les attributs
        root.setAttribute('data-mode', mode);
        body.setAttribute('data-mode', mode);
        
        // Appliquer les classes
        body.classList.remove('mode-light', 'mode-dark');
        body.classList.add(`mode-${mode}`);
        
        // Mettre à jour les icônes
        this.updateThemeIcons();
        
        // Retirer la transition après l'animation
        if (animate) {
            setTimeout(() => {
                document.documentElement.style.transition = '';
                document.body.style.transition = '';
            }, this.config.transitionDuration);
        }
    }
    
    // ========================================
    // Méthodes utilitaires
    // ========================================
    
    toggleMode() {
        const newMode = this.currentMode === 'light' ? 'dark' : 'light';
        this.setMode(newMode);
    }
    
    toggleTheme() {
        this.toggleMode(); // Pour l'instant, on toggle juste le mode
    }
    
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    getCurrentMode() {
        return this.currentMode;
    }
    
    isDarkMode() {
        return this.currentMode === 'dark';
    }
    
    isLightMode() {
        return this.currentMode === 'light';
    }
    
    // ========================================
    // Contrôles UI
    // ========================================
    
    initializeControls() {
        // Boutons de thème
        const themeButtons = document.querySelectorAll(
            '.theme-switcher-btn, #theme-toggle, [data-theme-toggle]'
        );
        
        themeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMode();
            });
        });
        
        // Options de thème spécifiques
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                if (theme) {
                    this.setTheme(theme);
                }
            });
        });
        
        // Options de mode spécifiques
        document.querySelectorAll('[data-mode-switch]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.modeSwitch;
                if (mode) {
                    this.setMode(mode);
                }
            });
        });
    }
    
    updateThemeIcons() {
        // Gérer l'affichage des icônes selon le mode
        const sunIcons = document.querySelectorAll('.theme-icon-sun, .theme-icon-light, .fa-sun');
        const moonIcons = document.querySelectorAll('.theme-icon-moon, .theme-icon-dark, .fa-moon');
        
        if (this.currentMode === 'light') {
            sunIcons.forEach(icon => {
                icon.style.opacity = '1';
                icon.style.transform = 'rotate(0deg) scale(1)';
            });
            moonIcons.forEach(icon => {
                icon.style.opacity = '0';
                icon.style.transform = 'rotate(180deg) scale(0)';
            });
        } else {
            sunIcons.forEach(icon => {
                icon.style.opacity = '0';
                icon.style.transform = 'rotate(-180deg) scale(0)';
            });
            moonIcons.forEach(icon => {
                icon.style.opacity = '1';
                icon.style.transform = 'rotate(0deg) scale(1)';
            });
        }
        
        // Mettre à jour l'attribut aria-label
        const buttons = document.querySelectorAll('.theme-switcher-btn, #theme-toggle');
        buttons.forEach(btn => {
            btn.setAttribute('aria-label', 
                this.currentMode === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'
            );
        });
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
                    console.error(`Error in theme event listener:`, error);
                }
            });
        }
        
        // Émettre aussi via l'EventBus global si disponible
        if (window.EventBus) {
            window.EventBus.emit(`theme:${event}`, data);
        }
    }
}

// ========================================
// Instance globale
// ========================================

window.ThemeManager = new ThemeManager();