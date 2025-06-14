// js/managers/theme.manager.js
// Gestionnaire de thèmes corrigé avec mapping des variables CSS

class ThemeManager {
    constructor() {
        this.themes = {
            light: {
                name: 'Clair',
                icon: 'fas fa-sun',
                colors: {
                    // Couleurs primaires
                    primary: '#00d4ff',
                    'primary-light': '#33ddff',
                    'primary-dark': '#00a8cc',
                    secondary: '#7c3aed',
                    accent: '#ff6b35',
                    success: '#10b981',
                    warning: '#f59e0b',
                    error: '#ef4444',
                    info: '#3b82f6',
                    
                    // Arrière-plans
                    'bg-primary': '#ffffff',
                    'bg-secondary': '#f9fafb',
                    'bg-tertiary': '#f3f4f6',
                    'bg-surface': '#ffffff',
                    'bg-card': '#ffffff',
                    'bg-input': '#ffffff',
                    'bg-hover': '#f9fafb',
                    
                    // Textes
                    'text-primary': '#111827',
                    'text-secondary': '#4b5563',
                    'text-tertiary': '#6b7280',
                    'text-muted': '#9ca3af',
                    'text-on-primary': '#ffffff',
                    'text-on-accent': '#ffffff',
                    
                    // Bordures
                    'border-default': '#e5e7eb',
                    'border-subtle': '#f3f4f6',
                    'border-strong': '#d1d5db',
                    'border-focus': '#00d4ff',
                    
                    // Ombres
                    'shadow': 'rgba(0, 0, 0, 0.1)',
                    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    'shadow-base': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }
            },
            
            dark: {
                name: 'Sombre',
                icon: 'fas fa-moon',
                colors: {
                    // Couleurs primaires
                    primary: '#00d4ff',
                    'primary-light': '#66e2ff',
                    'primary-dark': '#0099cc',
                    secondary: '#a78bfa',
                    accent: '#ff8c5a',
                    success: '#34d399',
                    warning: '#fbbf24',
                    error: '#f87171',
                    info: '#60a5fa',
                    
                    // Arrière-plans
                    'bg-primary': '#0f0f23',
                    'bg-secondary': '#16213e',
                    'bg-tertiary': '#1a1a2e',
                    'bg-surface': '#16213e',
                    'bg-card': '#1a1a2e',
                    'bg-input': '#1f2937',
                    'bg-hover': '#374151',
                    
                    // Textes
                    'text-primary': '#ffffff',
                    'text-secondary': '#e5e7eb',
                    'text-tertiary': '#d1d5db',
                    'text-muted': '#9ca3af',
                    'text-on-primary': '#111827',
                    'text-on-accent': '#ffffff',
                    
                    // Bordures
                    'border-default': '#374151',
                    'border-subtle': '#1f2937',
                    'border-strong': '#4b5563',
                    'border-focus': '#00d4ff',
                    
                    // Ombres
                    'shadow': 'rgba(0, 0, 0, 0.3)',
                    'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
                    'shadow-base': '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
                    'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }
            }
        };
        
        this.currentTheme = 'light';
        this.customColors = {};
        this.listeners = new Map();
        
        // Configuration
        this.config = {
            storageKey: 'oweo_theme',
            customColorsKey: 'oweo_custom_colors',
            transitionDuration: 300,
            autoDetect: true
        };
        
        // Simple storage fallback si StorageManager n'existe pas
        this.storage = {
            get: (key) => {
                try {
                    return localStorage.getItem(key);
                } catch (e) {
                    return null;
                }
            },
            set: (key, value) => {
                try {
                    localStorage.setItem(key, value);
                } catch (e) {
                    console.warn('Impossible de sauvegarder dans localStorage');
                }
            },
            remove: (key) => {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.warn('Impossible de supprimer de localStorage');
                }
            }
        };
    }
    
    // ========================================
    // Initialisation
    // ========================================
    
    async init() {
        console.log('🎨 Initialisation ThemeManager');
        
        // Charger le thème sauvegardé
        this.loadSavedTheme();
        
        // Détecter les préférences système
        if (this.config.autoDetect && !this.getSavedTheme()) {
            this.detectSystemTheme();
        }
        
        // Appliquer le thème initial
        this.applyTheme(this.currentTheme, false);
        
        // Écouter les changements système
        this.watchSystemTheme();
        
        // Initialiser les contrôles
        this.initializeControls();
        
        return this;
    }
    
    loadSavedTheme() {
        const saved = this.storage.get(this.config.storageKey);
        if (saved && this.themes[saved]) {
            this.currentTheme = saved;
        }
        
        const customColors = this.storage.get(this.config.customColorsKey);
        if (customColors) {
            try {
                this.customColors = JSON.parse(customColors);
            } catch (e) {
                console.error('Erreur lors du chargement des couleurs personnalisées');
            }
        }
    }
    
    getSavedTheme() {
        return this.storage.get(this.config.storageKey);
    }
    
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.currentTheme = 'dark';
        } else {
            this.currentTheme = 'light';
        }
    }
    
    watchSystemTheme() {
        if (!window.matchMedia) return;
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            if (this.config.autoDetect && !this.getSavedTheme()) {
                const theme = e.matches ? 'dark' : 'light';
                this.setTheme(theme);
            }
        });
    }
    
    // ========================================
    // Application des thèmes
    // ========================================
    
    setTheme(themeName, save = true) {
        if (!this.themes[themeName]) {
            console.warn(`Theme "${themeName}" not found`);
            return;
        }
        
        this.currentTheme = themeName;
        this.applyTheme(themeName, true);
        
        if (save) {
            this.storage.set(this.config.storageKey, themeName);
        }
        
        this.emit('themeChanged', {
            theme: themeName,
            colors: this.getCurrentColors()
        });
    }
    
    applyTheme(themeName, animate = true) {
        const theme = this.themes[themeName];
        if (!theme) return;
        
        const root = document.documentElement;
        const body = document.body;
        
        // Ajouter la transition si animation
        if (animate) {
            root.style.transition = `all ${this.config.transitionDuration}ms ease-in-out`;
            body.style.transition = `all ${this.config.transitionDuration}ms ease-in-out`;
        }
        
        // Appliquer les couleurs avec le bon préfixe
        Object.entries(theme.colors).forEach(([key, value]) => {
            // Utiliser les couleurs personnalisées si disponibles
            const customValue = this.customColors[key];
            const finalValue = customValue || value;
            
            // Garder le nom de la variable tel quel
            root.style.setProperty(`--${key}`, finalValue);
            
            // Pour la compatibilité avec l'ancien système
            if (key.includes('-')) {
                root.style.setProperty(`--color-${key}`, finalValue);
            }
        });
        
        // Appliquer des variables spéciales pour les couleurs principales
        root.style.setProperty('--theme-primary', theme.colors.primary);
        root.style.setProperty('--theme-primary-light', theme.colors['primary-light']);
        root.style.setProperty('--theme-primary-dark', theme.colors['primary-dark']);
        root.style.setProperty('--theme-accent', theme.colors.accent);
        
        // Appliquer les classes
        body.className = body.className.replace(/\btheme-\S+/g, '');
        body.classList.add(`theme-${themeName}`);
        body.classList.add(`mode-${this.getMode(themeName)}`);
        
        // Mettre à jour les attributs
        root.setAttribute('data-theme', themeName);
        root.setAttribute('data-mode', this.getMode(themeName));
        
        // Retirer la transition après l'animation
        if (animate) {
            setTimeout(() => {
                root.style.transition = '';
                body.style.transition = '';
            }, this.config.transitionDuration);
        }
        
        // Mettre à jour l'icône du thème
        this.updateThemeIcon(themeName);
    }
    
    getMode(themeName) {
        return themeName === 'light' ? 'light' : 'dark';
    }
    
    // ========================================
    // Personnalisation des couleurs
    // ========================================
    
    setColor(colorName, value) {
        this.customColors[colorName] = value;
        
        // Appliquer immédiatement
        document.documentElement.style.setProperty(`--${colorName}`, value);
        
        // Sauvegarder
        this.storage.set(this.config.customColorsKey, JSON.stringify(this.customColors));
        
        this.emit('colorChanged', { color: colorName, value });
    }
    
    resetColor(colorName) {
        delete this.customColors[colorName];
        
        // Restaurer la couleur du thème
        const themeColor = this.themes[this.currentTheme]?.colors[colorName];
        if (themeColor) {
            document.documentElement.style.setProperty(`--${colorName}`, themeColor);
        }
        
        // Sauvegarder
        this.storage.set(this.config.customColorsKey, JSON.stringify(this.customColors));
        
        this.emit('colorReset', { color: colorName });
    }
    
    resetAllColors() {
        this.customColors = {};
        this.storage.remove(this.config.customColorsKey);
        
        // Réappliquer le thème
        this.applyTheme(this.currentTheme, true);
        
        this.emit('allColorsReset');
    }
    
    // ========================================
    // Méthodes utilitaires
    // ========================================
    
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    getCurrentColors() {
        const themeColors = this.themes[this.currentTheme]?.colors || {};
        return {
            ...themeColors,
            ...this.customColors
        };
    }
    
    getAvailableThemes() {
        return Object.entries(this.themes).map(([key, theme]) => ({
            id: key,
            name: theme.name,
            icon: theme.icon,
            active: key === this.currentTheme
        }));
    }
    
    // ========================================
    // Contrôles UI
    // ========================================
    
    initializeControls() {
        // Bouton de bascule du thème
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleTheme());
        }
        
        // Bouton dans le theme switcher
        const switcherBtn = document.querySelector('.theme-switcher-btn');
        if (switcherBtn) {
            switcherBtn.addEventListener('click', () => this.toggleTheme());
        }
        
        // Options de thème dans le customizer
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.setTheme(theme);
            });
        });
    }
    
    updateThemeIcon(themeName) {
        const icon = document.querySelector('[data-theme-icon]');
        if (icon) {
            const theme = this.themes[themeName];
            icon.className = theme?.icon || 'fas fa-palette';
        }
    }
    
    toggleTheme() {
        const themes = Object.keys(this.themes);
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        
        this.setTheme(nextTheme);
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