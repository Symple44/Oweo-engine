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
        this.dropdownInstance = null;
        
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
        
        // Initialiser les contrôles avec un petit délai pour s'assurer que le DOM est prêt
        setTimeout(() => {
            this.initializeControls();
            this.updateMainButtonIndicator();
        }, 100);
        
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
        
        console.log('📦 Préférences chargées:', { theme: this.currentTheme, mode: this.currentMode });
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
        
        console.log(`🎨 Changement de thème: ${this.currentTheme} → ${themeName}`);
        
        // Sauvegarder l'ancien thème pour la transition
        const oldTheme = this.currentTheme;
        
        // Ajouter une animation au bouton principal
        const mainButton = document.querySelector('.theme-switcher-main');
        if (mainButton) {
            mainButton.classList.add('theme-changing');
            setTimeout(() => {
                mainButton.classList.remove('theme-changing');
            }, 300);
        }
        
        // Mettre à jour le thème courant
        this.currentTheme = themeName;
        
        // Appliquer le nouveau thème
        this.applyTheme(themeName, true);
        
        // Sauvegarder si demandé
        if (save) {
            localStorage.setItem(this.config.storageKey, themeName);
        }
        
        // Mettre à jour l'interface avec un petit délai pour s'assurer que les transitions CSS sont appliquées
        setTimeout(() => {
            this.updateAllUI();
        }, 50);
        
        // Émettre l'événement
        this.emit('themeChanged', {
            oldTheme: oldTheme,
            theme: themeName,
            mode: this.currentMode
        });
    }
    
    setMode(mode, save = true) {
        if (mode !== 'light' && mode !== 'dark') {
            console.warn(`Mode invalide: ${mode}`);
            return;
        }
        
        console.log(`🌓 Changement de mode: ${this.currentMode} → ${mode}`);
        
        const oldMode = this.currentMode;
        this.currentMode = mode;
        this.applyMode(mode, true);
        
        if (save) {
            localStorage.setItem(this.config.modeKey, mode);
        }
        
        // Mettre à jour l'interface
        setTimeout(() => {
            this.updateAllUI();
        }, 50);
        
        this.emit('modeChanged', {
            oldMode: oldMode,
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
        
        // Retirer la transition après l'animation
        if (animate) {
            setTimeout(() => {
                document.documentElement.style.transition = '';
                document.body.style.transition = '';
            }, this.config.transitionDuration);
        }
    }
    
    // ========================================
    // Mise à jour de l'interface
    // ========================================
    
    updateAllUI() {
        this.updateDropdown();
        this.updateMainButtonIndicator();
        this.updateThemeIcons();
    }
    
    updateDropdown() {
        const dropdown = this.dropdownInstance || document.querySelector('.theme-switcher-dropdown');
        if (!dropdown) return;
        
        console.log('🔄 Mise à jour du dropdown pour:', { theme: this.currentTheme, mode: this.currentMode });
        
        // Update mode buttons
        dropdown.querySelectorAll('.theme-mode-btn').forEach(btn => {
            const isActive = btn.dataset.mode === this.currentMode;
            btn.classList.toggle('active', isActive);
            
            // S'assurer que l'état actif est visible
            if (isActive) {
                btn.style.setProperty('background', 'var(--bg-surface)', 'important');
                btn.style.setProperty('color', 'var(--theme-primary)', 'important');
            } else {
                btn.style.removeProperty('background');
                btn.style.removeProperty('color');
            }
        });
        
        // Update theme options
        dropdown.querySelectorAll('.theme-option').forEach(btn => {
            const isActive = btn.dataset.theme === this.currentTheme;
            btn.classList.toggle('active', isActive);
            
            // Mise à jour visuelle explicite
            if (isActive) {
                btn.style.setProperty('background', 'var(--theme-primary-alpha-10)', 'important');
                btn.style.setProperty('border-color', 'var(--theme-primary)', 'important');
                
                // S'assurer que l'icône et le check sont visibles
                const icon = btn.querySelector('.theme-option-icon');
                const check = btn.querySelector('.theme-option-check');
                
                if (icon) {
                    icon.style.setProperty('background', 'var(--theme-primary)', 'important');
                    icon.style.setProperty('color', 'var(--text-on-primary)', 'important');
                }
                
                if (check) {
                    check.style.setProperty('opacity', '1', 'important');
                }
            } else {
                btn.style.removeProperty('background');
                btn.style.removeProperty('border-color');
                
                const icon = btn.querySelector('.theme-option-icon');
                const check = btn.querySelector('.theme-option-check');
                
                if (icon) {
                    icon.style.removeProperty('background');
                    icon.style.removeProperty('color');
                }
                
                if (check) {
                    check.style.removeProperty('opacity');
                }
            }
        });
    }
    
    updateMainButtonIndicator() {
        const mainButton = document.querySelector('.theme-switcher-main');
        if (!mainButton) return;
        
        console.log('🔄 Mise à jour du bouton principal');
        
        // Retirer toutes les classes de thème
        mainButton.classList.remove('theme-oweo', 'theme-modern', 'theme-classic');
        
        // Ajouter la classe du thème actuel
        mainButton.classList.add(`theme-${this.currentTheme}`);
        
        // Ajouter un indicateur si ce n'est pas le thème par défaut
        if (this.currentTheme !== 'oweo') {
            mainButton.classList.add('has-custom-theme');
            
            // Créer ou mettre à jour l'indicateur
            let indicator = mainButton.querySelector('.theme-indicator');
            if (!indicator) {
                indicator = document.createElement('span');
                indicator.className = 'theme-indicator';
                mainButton.appendChild(indicator);
            }
            indicator.style.display = 'block';
        } else {
            mainButton.classList.remove('has-custom-theme');
            const indicator = mainButton.querySelector('.theme-indicator');
            if (indicator) {
                indicator.style.display = 'none';
            }
        }
        
        // Mettre à jour les icônes du mode
        this.updateThemeIcons();
    }
    
    updateThemeIcons() {
        // Gérer l'affichage des icônes selon le mode
        const containers = document.querySelectorAll('.theme-switcher-icon, .theme-switcher-btn');
        
        containers.forEach(container => {
            const sunIcon = container.querySelector('.fa-sun, .theme-icon-sun, .theme-icon-light');
            const moonIcon = container.querySelector('.fa-moon, .theme-icon-moon, .theme-icon-dark');
            
            if (sunIcon && moonIcon) {
                if (this.currentMode === 'light') {
                    sunIcon.style.display = 'block';
                    moonIcon.style.display = 'none';
                } else {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'block';
                }
            }
        });
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
            const dropdown = this.dropdownInstance;
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
        
        // Vérifier si le dropdown existe déjà
        let dropdown = document.querySelector('.theme-switcher-dropdown');
        if (!dropdown) {
            // Créer le dropdown
            dropdown = document.createElement('div');
            dropdown.className = 'theme-switcher-dropdown';
            
            // Ajouter le dropdown après le bouton
            const container = mainButton.parentElement;
            container.appendChild(dropdown);
        }
        
        // Mettre à jour le contenu
        dropdown.innerHTML = this.getDropdownHTML();
        
        // Stocker la référence
        this.dropdownInstance = dropdown;
        
        // Gérer le clic sur le bouton principal
        mainButton.removeEventListener('click', this.handleMainButtonClick); // Éviter les doublons
        this.handleMainButtonClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('active');
            mainButton.classList.toggle('active');
        };
        mainButton.addEventListener('click', this.handleMainButtonClick);
        
        // Gérer les clics dans le dropdown
        this.setupDropdownEvents(dropdown);
        
        // Mettre à jour l'état initial
        this.updateDropdown();
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
                console.log('🔘 Clic sur mode:', mode);
                this.setMode(mode);
            });
        });
        
        // Theme options
        dropdown.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const theme = btn.dataset.theme;
                console.log('🔘 Clic sur thème:', theme);
                this.setTheme(theme);
            });
        });
        
        // Reset button
        const resetBtn = dropdown.querySelector('.theme-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('🔘 Clic sur réinitialiser');
                this.reset();
            });
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
        
        // Mettre à jour l'interface
        setTimeout(() => {
            this.updateAllUI();
        }, 50);
        
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
        console.log(`📢 Event: theme:${event}`, data);
        
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