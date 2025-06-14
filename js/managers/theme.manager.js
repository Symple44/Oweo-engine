// js/managers/theme.manager.js
// Gestionnaire avancé de thèmes avec personnalisation en temps réel

class ThemeManager {
    constructor() {
        this.themes = {
            light: {
                name: 'Clair',
                icon: 'fas fa-sun',
                colors: {
                    primary: '#00d4ff',
                    secondary: '#7c3aed',
                    accent: '#ff6b35',
                    success: '#10b981',
                    warning: '#f59e0b',
                    error: '#ef4444',
                    info: '#3b82f6',
                    
                    background: '#ffffff',
                    surface: '#f8fafc',
                    card: '#ffffff',
                    
                    text: '#1e293b',
                    textSecondary: '#475569',
                    textMuted: '#94a3b8',
                    
                    border: '#e2e8f0',
                    borderLight: '#f1f5f9',
                    
                    shadow: 'rgba(0, 0, 0, 0.1)'
                }
            },
            
            dark: {
                name: 'Sombre',
                icon: 'fas fa-moon',
                colors: {
                    primary: '#00d4ff',
                    secondary: '#a78bfa',
                    accent: '#ff8c5a',
                    success: '#34d399',
                    warning: '#fbbf24',
                    error: '#f87171',
                    info: '#60a5fa',
                    
                    background: '#0f0f23',
                    surface: '#16213e',
                    card: '#1a1a2e',
                    
                    text: '#ffffff',
                    textSecondary: 'rgba(255, 255, 255, 0.8)',
                    textMuted: 'rgba(255, 255, 255, 0.6)',
                    
                    border: 'rgba(255, 255, 255, 0.1)',
                    borderLight: 'rgba(255, 255, 255, 0.05)',
                    
                    shadow: 'rgba(0, 0, 0, 0.3)'
                }
            },
            
            oweo: {
                name: 'Oweo',
                icon: 'fas fa-star',
                colors: {
                    primary: '#00d4ff',
                    secondary: '#7c3aed',
                    accent: '#ff6b35',
                    success: '#10b981',
                    warning: '#f59e0b',
                    error: '#ef4444',
                    info: '#3b82f6',
                    
                    background: '#0a0e27',
                    surface: '#151937',
                    card: '#1e2445',
                    
                    text: '#ffffff',
                    textSecondary: 'rgba(255, 255, 255, 0.85)',
                    textMuted: 'rgba(255, 255, 255, 0.65)',
                    
                    border: 'rgba(0, 212, 255, 0.2)',
                    borderLight: 'rgba(0, 212, 255, 0.1)',
                    
                    shadow: 'rgba(0, 212, 255, 0.1)'
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
        const saved = StorageManager.get(this.config.storageKey);
        if (saved) {
            this.currentTheme = saved;
        }
        
        const customColors = StorageManager.get(this.config.customColorsKey);
        if (customColors) {
            this.customColors = customColors;
        }
    }
    
    getSavedTheme() {
        return StorageManager.get(this.config.storageKey);
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
            StorageManager.set(this.config.storageKey, themeName);
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
        
        // Appliquer les couleurs
        Object.entries(theme.colors).forEach(([key, value]) => {
            // Utiliser les couleurs personnalisées si disponibles
            const customValue = this.customColors[key];
            const finalValue = customValue || value;
            
            root.style.setProperty(`--color-${this.kebabCase(key)}`, finalValue);
        });
        
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
        document.documentElement.style.setProperty(
            `--color-${this.kebabCase(colorName)}`, 
            value
        );
        
        // Sauvegarder
        StorageManager.set(this.config.customColorsKey, this.customColors);
        
        this.emit('colorChanged', { color: colorName, value });
    }
    
    resetColor(colorName) {
        delete this.customColors[colorName];
        
        // Restaurer la couleur du thème
        const themeColor = this.themes[this.currentTheme]?.colors[colorName];
        if (themeColor) {
            document.documentElement.style.setProperty(
                `--color-${this.kebabCase(colorName)}`, 
                themeColor
            );
        }
        
        // Sauvegarder
        StorageManager.set(this.config.customColorsKey, this.customColors);
        
        this.emit('colorReset', { color: colorName });
    }
    
    resetAllColors() {
        this.customColors = {};
        StorageManager.remove(this.config.customColorsKey);
        
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
    
    exportTheme() {
        return {
            theme: this.currentTheme,
            customColors: this.customColors,
            timestamp: new Date().toISOString()
        };
    }
    
    importTheme(data) {
        if (data.theme && this.themes[data.theme]) {
            this.setTheme(data.theme);
        }
        
        if (data.customColors) {
            Object.entries(data.customColors).forEach(([key, value]) => {
                this.setColor(key, value);
            });
        }
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
        
        // Options de thème dans le customizer
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.setTheme(theme);
            });
        });
        
        // Sélecteurs de couleur
        document.querySelectorAll('input[type="color"]').forEach(input => {
            const colorName = input.id.replace('color-', '');
            
            // Définir la valeur initiale
            input.value = this.getCurrentColors()[colorName] || '#000000';
            
            // Écouter les changements
            input.addEventListener('input', (e) => {
                this.setColor(colorName, e.target.value);
            });
        });
        
        // Layout switcher
        document.querySelectorAll('input[name="layout"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                LayoutManager.setLayout(e.target.value);
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
    // Customizer Panel
    // ========================================
    
    showCustomizer() {
        const customizer = document.getElementById('theme-customizer');
        if (customizer) {
            customizer.classList.add('active');
        }
    }
    
    hideCustomizer() {
        const customizer = document.getElementById('theme-customizer');
        if (customizer) {
            customizer.classList.remove('active');
        }
    }
    
    toggleCustomizer() {
        const customizer = document.getElementById('theme-customizer');
        if (customizer) {
            customizer.classList.toggle('active');
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
        
        // Émettre aussi via l'EventBus global
        if (window.EventBus) {
            window.EventBus.emit(`theme:${event}`, data);
        }
    }
    
    // ========================================
    // Helpers
    // ========================================
    
    kebabCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/\s+/g, '-')
            .toLowerCase();
    }
    
    reset() {
        this.resetAllColors();
        this.setTheme('light');
        StorageManager.remove(this.config.storageKey);
        StorageManager.remove(this.config.customColorsKey);
    }
    
    save() {
        const theme = this.exportTheme();
        console.log('Theme saved:', theme);
        NotificationService.success('Thème sauvegardé avec succès');
    }
}

// ========================================
// Instance globale
// ========================================

window.ThemeManager = new ThemeManager();