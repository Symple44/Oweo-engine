// js/managers/theme.manager.js
// Gestionnaire de thèmes amélioré avec support multi-thèmes

class ThemeManager {
    constructor() {
        // Configuration des thèmes disponibles
        this.themes = {
            oweo: {
                name: 'Oweo Signature',
                description: 'Thème moderne avec gradients cyan et orange',
                icon: 'fas fa-palette',
                modes: ['light', 'dark']
            },
            modern: {
                name: 'Modern',
                description: 'Design épuré et minimaliste',
                icon: 'fas fa-square',
                modes: ['light', 'dark']
            },
            classic: {
                name: 'Classic',
                description: 'Interface traditionnelle',
                icon: 'fas fa-th-large',
                modes: ['light', 'dark']
            }
        };
        
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
        console.log('🎨 Initialisation ThemeManager avec support multi-thèmes');
        
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
        
        // Mettre à jour l'indicateur du bouton principal
        this.updateMainButtonIndicator();
        
        return this;
    }
    
    loadSavedPreferences() {
        // Charger le thème
        const savedTheme = localStorage.getItem(this.config.storageKey);
        if (savedTheme && this.themes[savedTheme]) {
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
        if (!this.themes[themeName]) {
            console.warn(`Thème invalide: ${themeName}`);
            return;
        }
        
        // Ajouter une animation au bouton principal
        const mainButton = document.querySelector('.theme-switcher-main');
        if (mainButton) {
            mainButton.classList.add('theme-changing');
            setTimeout(() => {
                mainButton.classList.remove('theme-changing');
            }, 300);
        }
        
        this.currentTheme = themeName;
        this.applyTheme(themeName, true);
        
        if (save) {
            localStorage.setItem(this.config.storageKey, themeName);
        }
        
        this.updateDropdown();
        
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
        
        // Retirer toutes les classes de thème existantes
        Object.keys(this.themes).forEach(theme => {
            root.classList.remove(`theme-${theme}`);
            body.classList.remove(`theme-${theme}`);
        });
        
        // Appliquer les attributs et classes
        root.setAttribute('data-theme', themeName);
        body.setAttribute('data-theme', themeName);
        root.classList.add(`theme-${themeName}`);
        body.classList.add(`theme-${themeName}`);
        
        // Retirer la transition après l'animation
        if (animate) {
            setTimeout(() => {
                root.style.transition = '';
                body.style.transition = '';
            }, this.config.transitionDuration);
        }
        
        // Mettre à jour l'indicateur du bouton principal
        this.updateMainButtonIndicator();
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
        // Cycler à travers les thèmes
        const themeNames = Object.keys(this.themes);
        const currentIndex = themeNames.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        this.setTheme(themeNames[nextIndex]);
    }
    
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    getCurrentMode() {
        return this.currentMode;
    }
    
    getThemes() {
        return this.themes;
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
        // Créer le dropdown de sélection de thème
        this.createThemeDropdown();
        
        // Boutons de thème simples (toggle mode)
        const themeButtons = document.querySelectorAll(
            '.theme-switcher-btn:not(.theme-switcher-main), #theme-toggle:not(.theme-switcher-main), [data-theme-toggle]'
        );
        
        themeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMode();
            });
        });
        
        // Gérer le clic en dehors du dropdown
        document.addEventListener('click', (e) => {
            const dropdown = document.querySelector('.theme-switcher-dropdown');
            const button = document.querySelector('.theme-switcher-main');
            
            if (dropdown && button && !dropdown.contains(e.target) && !button.contains(e.target)) {
                dropdown.classList.remove('active');
                button.classList.remove('active');
            }
        });
    }
    
    createThemeDropdown() {
        // Trouver le bouton principal
        const mainButton = document.querySelector('.theme-switcher-floating .theme-switcher-btn');
        if (!mainButton) return;
        
        mainButton.classList.add('theme-switcher-main');
        
        // Créer le dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'theme-switcher-dropdown';
        dropdown.innerHTML = this.getDropdownHTML();
        
        // Ajouter le dropdown après le bouton
        const container = mainButton.parentElement;
        container.appendChild(dropdown);
        
        // Gérer le clic sur le bouton principal
        mainButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('active');
            mainButton.classList.toggle('active');
        });
        
        // Gérer les clics dans le dropdown
        this.setupDropdownEvents(dropdown);
    }
    
    getDropdownHTML() {
        return `
            <div class="theme-dropdown-header">
                <h4>Apparence</h4>
            </div>
            
            <div class="theme-dropdown-section">
                <h5>Mode</h5>
                <div class="theme-mode-selector">
                    <button class="theme-mode-btn ${this.currentMode === 'light' ? 'active' : ''}" data-mode="light">
                        <i class="fas fa-sun"></i>
                        <span>Clair</span>
                    </button>
                    <button class="theme-mode-btn ${this.currentMode === 'dark' ? 'active' : ''}" data-mode="dark">
                        <i class="fas fa-moon"></i>
                        <span>Sombre</span>
                    </button>
                </div>
            </div>
            
            <div class="theme-dropdown-section">
                <h5>Thème</h5>
                <div class="theme-options">
                    ${Object.entries(this.themes).map(([key, theme]) => `
                        <button class="theme-option ${this.currentTheme === key ? 'active' : ''}" data-theme="${key}">
                            <div class="theme-option-icon">
                                <i class="${theme.icon}"></i>
                            </div>
                            <div class="theme-option-content">
                                <div class="theme-option-name">${theme.name}</div>
                                <div class="theme-option-description">${theme.description}</div>
                            </div>
                            <div class="theme-option-check">
                                <i class="fas fa-check"></i>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <div class="theme-dropdown-footer">
                <button class="theme-reset-btn" data-action="reset">
                    <i class="fas fa-undo"></i>
                    <span>Réinitialiser</span>
                </button>
            </div>
        `;
    }
    
    setupDropdownEvents(dropdown) {
        // Mode buttons
        dropdown.querySelectorAll('.theme-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = btn.dataset.mode;
                this.setMode(mode);
                this.updateDropdown();
            });
        });
        
        // Theme options
        dropdown.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const theme = btn.dataset.theme;
                this.setTheme(theme);
            });
        });
        
        // Reset button
        const resetBtn = dropdown.querySelector('.theme-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.reset();
            });
        }
    }
    
    updateDropdown() {
        const dropdown = document.querySelector('.theme-switcher-dropdown');
        if (!dropdown) return;
        
        // Update mode buttons
        dropdown.querySelectorAll('.theme-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.currentMode);
        });
        
        // Update theme options
        dropdown.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.currentTheme);
        });
    }
    
    updateThemeIcons() {
        // Gérer l'affichage des icônes selon le mode
        const sunIcons = document.querySelectorAll('.theme-icon-sun, .theme-icon-light, .fa-sun:not(.theme-mode-btn .fa-sun)');
        const moonIcons = document.querySelectorAll('.theme-icon-moon, .theme-icon-dark, .fa-moon:not(.theme-mode-btn .fa-moon)');
        
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
        
        // Mettre à jour l'indicateur de thème sur le bouton principal
        this.updateMainButtonIndicator();
        
        // Mettre à jour l'attribut aria-label
        const buttons = document.querySelectorAll('.theme-switcher-btn, #theme-toggle');
        buttons.forEach(btn => {
            btn.setAttribute('aria-label', 'Changer l\'apparence');
        });
    }
    
    updateMainButtonIndicator() {
        const mainButton = document.querySelector('.theme-switcher-main');
        if (!mainButton) return;
        
        // Retirer toutes les classes de thème
        mainButton.classList.remove('theme-oweo', 'theme-modern', 'theme-classic');
        
        // Ajouter la classe du thème actuel
        mainButton.classList.add(`theme-${this.currentTheme}`);
        
        // Ajouter un indicateur si ce n'est pas le thème par défaut
        if (this.currentTheme !== 'oweo') {
            mainButton.classList.add('has-custom-theme');
        } else {
            mainButton.classList.remove('has-custom-theme');
        }
        
        // Mettre à jour le nom du thème pour le tooltip
        const themeName = this.themes[this.currentTheme]?.name || this.currentTheme;
        mainButton.setAttribute('data-theme-name', themeName);
        
        // Mettre à jour la couleur du bouton selon le thème
        const themeColors = {
            oweo: 'var(--theme-primary)',
            modern: '#6366f1',
            classic: '#2563eb'
        };
        
        // Appliquer un style inline pour la couleur d'accent
        if (this.currentTheme !== 'oweo') {
            mainButton.style.setProperty('--button-accent', themeColors[this.currentTheme]);
        } else {
            mainButton.style.removeProperty('--button-accent');
        }
        
        // Changer l'icône du bouton selon le thème (optionnel)
        const iconContainer = mainButton.querySelector('.theme-switcher-icon');
        if (iconContainer && this.currentTheme !== 'oweo') {
            // Ajouter une petite icône de thème à côté des icônes soleil/lune
            const themeIcon = mainButton.querySelector('.theme-custom-icon');
            if (themeIcon) {
                themeIcon.remove();
            }
            
            const newIcon = document.createElement('i');
            newIcon.className = `${this.themes[this.currentTheme].icon} theme-custom-icon`;
            newIcon.style.cssText = `
                position: absolute;
                bottom: -2px;
                right: -2px;
                font-size: 10px;
                background: var(--bg-surface);
                padding: 2px;
                border-radius: var(--radius-full);
                color: ${themeColors[this.currentTheme]};
            `;
            iconContainer.appendChild(newIcon);
        } else {
            // Supprimer l'icône personnalisée si on revient au thème par défaut
            const customIcon = mainButton.querySelector('.theme-custom-icon');
            if (customIcon) {
                customIcon.remove();
            }
        }
    }
    
    reset() {
        // Effacer les préférences sauvegardées
        localStorage.removeItem(this.config.storageKey);
        localStorage.removeItem(this.config.modeKey);
        
        // Réinitialiser aux valeurs par défaut
        this.currentTheme = 'oweo';
        this.currentMode = 'light';
        
        // Détecter les préférences système
        if (this.config.autoDetect) {
            this.detectSystemPreference();
        }
        
        // Appliquer
        this.applyTheme(this.currentTheme, true);
        this.applyMode(this.currentMode, true);
        this.updateDropdown();
        
        this.emit('reset', {
            theme: this.currentTheme,
            mode: this.currentMode
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