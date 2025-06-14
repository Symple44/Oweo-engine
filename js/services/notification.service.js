// js/services/notification.service.js
// Service de notifications toast avec file d'attente

class NotificationService {
    constructor() {
        this.notifications = new Map();
        this.queue = [];
        this.container = null;
        this.maxVisible = 3;
        this.defaultDuration = 5000;
        this.position = 'top-right';
        
        this.icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        this.init();
    }
    
    // ========================================
    // Initialisation
    // ========================================
    
    init() {
        // Créer ou récupérer le conteneur
        this.container = document.getElementById('notifications');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications';
            this.container.className = 'notifications-container';
            this.container.setAttribute('aria-live', 'polite');
            document.body.appendChild(this.container);
        }
        
        // Appliquer la configuration
        if (window.APP_CONFIG?.ui?.toasts) {
            this.position = window.APP_CONFIG.ui.toasts.position || this.position;
            this.defaultDuration = window.APP_CONFIG.ui.toasts.duration || this.defaultDuration;
            this.maxVisible = window.APP_CONFIG.ui.toasts.maxVisible || this.maxVisible;
        }
        
        this.updateContainerPosition();
    }
    
    updateContainerPosition() {
        this.container.className = `notifications-container notifications-${this.position}`;
    }
    
    // ========================================
    // Méthodes publiques
    // ========================================
    
    success(message, options = {}) {
        return this.show({
            type: 'success',
            message,
            ...options
        });
    }
    
    error(message, options = {}) {
        return this.show({
            type: 'error',
            message,
            duration: options.duration || 8000, // Plus long pour les erreurs
            ...options
        });
    }
    
    warning(message, options = {}) {
        return this.show({
            type: 'warning',
            message,
            ...options
        });
    }
    
    info(message, options = {}) {
        return this.show({
            type: 'info',
            message,
            ...options
        });
    }
    
    show(options) {
        const notification = this.createNotification(options);
        
        // Vérifier si on dépasse la limite
        const visibleCount = this.container.querySelectorAll('.notification:not(.hiding)').length;
        
        if (visibleCount >= this.maxVisible) {
            // Ajouter à la file d'attente
            this.queue.push(notification);
            return notification;
        }
        
        // Afficher immédiatement
        this.displayNotification(notification);
        
        return notification;
    }
    
    // ========================================
    // Création et gestion des notifications
    // ========================================
    
    createNotification(options) {
        const id = this.generateId();
        
        const notification = {
            id,
            type: options.type || 'info',
            title: options.title || null,
            message: options.message || '',
            icon: options.icon || this.icons[options.type] || this.icons.info,
            duration: options.duration ?? this.defaultDuration,
            closable: options.closable !== false,
            actions: options.actions || [],
            onClick: options.onClick || null,
            onClose: options.onClose || null,
            className: options.className || '',
            progress: options.progress !== false && options.duration > 0,
            persistent: options.persistent || false,
            timestamp: Date.now()
        };
        
        this.notifications.set(id, notification);
        
        return notification;
    }
    
    displayNotification(notification) {
        const element = this.createElement(notification);
        notification.element = element;
        
        // Ajouter au conteneur
        this.container.appendChild(element);
        
        // Animer l'entrée
        requestAnimationFrame(() => {
            element.classList.add('show');
        });
        
        // Gérer la durée
        if (notification.duration > 0 && !notification.persistent) {
            notification.timer = setTimeout(() => {
                this.hide(notification.id);
            }, notification.duration);
            
            // Pause sur hover
            element.addEventListener('mouseenter', () => this.pauseTimer(notification));
            element.addEventListener('mouseleave', () => this.resumeTimer(notification));
        }
    }
    
    createElement(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type} ${notification.className}`;
        element.setAttribute('role', 'alert');
        element.setAttribute('data-notification-id', notification.id);
        
        // Structure HTML
        element.innerHTML = `
            <div class="notification-icon">
                <i class="${notification.icon}"></i>
            </div>
            
            <div class="notification-content">
                ${notification.title ? `
                    <div class="notification-title">${this.escapeHtml(notification.title)}</div>
                ` : ''}
                <div class="notification-message">${this.escapeHtml(notification.message)}</div>
                
                ${notification.actions.length > 0 ? `
                    <div class="notification-actions">
                        ${notification.actions.map(action => `
                            <button class="notification-action" data-action="${action.id}">
                                ${action.icon ? `<i class="${action.icon}"></i>` : ''}
                                <span>${this.escapeHtml(action.label)}</span>
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            
            ${notification.closable ? `
                <button class="notification-close" aria-label="Fermer">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
            
            ${notification.progress ? `
                <div class="notification-progress" style="animation-duration: ${notification.duration}ms"></div>
            ` : ''}
        `;
        
        // Événements
        this.bindEvents(element, notification);
        
        return element;
    }
    
    bindEvents(element, notification) {
        // Bouton fermer
        const closeBtn = element.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide(notification.id);
            });
        }
        
        // Actions personnalisées
        element.querySelectorAll('.notification-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const actionId = btn.dataset.action;
                const action = notification.actions.find(a => a.id === actionId);
                
                if (action && action.handler) {
                    const shouldClose = action.handler(notification);
                    if (shouldClose !== false) {
                        this.hide(notification.id);
                    }
                }
            });
        });
        
        // Clic sur la notification
        if (notification.onClick) {
            element.style.cursor = 'pointer';
            element.addEventListener('click', () => {
                notification.onClick(notification);
            });
        }
    }
    
    // ========================================
    // Gestion du cycle de vie
    // ========================================
    
    hide(notificationId) {
        const notification = this.notifications.get(notificationId);
        if (!notification || !notification.element) return;
        
        // Annuler le timer
        if (notification.timer) {
            clearTimeout(notification.timer);
            notification.timer = null;
        }
        
        // Callback avant fermeture
        if (notification.onClose) {
            notification.onClose(notification);
        }
        
        // Animation de sortie
        notification.element.classList.remove('show');
        notification.element.classList.add('hiding');
        
        // Suppression après animation
        setTimeout(() => {
            if (notification.element && notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            
            this.notifications.delete(notificationId);
            
            // Traiter la file d'attente
            this.processQueue();
        }, 300);
    }
    
    hideAll() {
        for (const [id] of this.notifications) {
            this.hide(id);
        }
    }
    
    pauseTimer(notification) {
        if (!notification.timer || !notification.duration) return;
        
        clearTimeout(notification.timer);
        notification.pausedAt = Date.now();
        notification.remainingTime = notification.duration - (notification.pausedAt - notification.timestamp);
        
        // Pause l'animation de progress
        const progress = notification.element.querySelector('.notification-progress');
        if (progress) {
            progress.style.animationPlayState = 'paused';
        }
    }
    
    resumeTimer(notification) {
        if (!notification.remainingTime || notification.persistent) return;
        
        notification.timer = setTimeout(() => {
            this.hide(notification.id);
        }, notification.remainingTime);
        
        // Reprendre l'animation
        const progress = notification.element.querySelector('.notification-progress');
        if (progress) {
            progress.style.animationPlayState = 'running';
        }
        
        delete notification.pausedAt;
        delete notification.remainingTime;
    }
    
    processQueue() {
        if (this.queue.length === 0) return;
        
        const visibleCount = this.container.querySelectorAll('.notification:not(.hiding)').length;
        
        if (visibleCount < this.maxVisible) {
            const notification = this.queue.shift();
            this.displayNotification(notification);
        }
    }
    
    // ========================================
    // Méthodes utilitaires
    // ========================================
    
    generateId() {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ========================================
    // API publique avancée
    // ========================================
    
    async confirm(options) {
        return new Promise((resolve) => {
            const notification = this.show({
                type: options.type || 'warning',
                title: options.title || 'Confirmation',
                message: options.message || 'Êtes-vous sûr ?',
                duration: 0, // Pas de fermeture automatique
                closable: false,
                actions: [
                    {
                        id: 'cancel',
                        label: options.cancelText || 'Annuler',
                        handler: () => {
                            resolve(false);
                            return true; // Fermer la notification
                        }
                    },
                    {
                        id: 'confirm',
                        label: options.confirmText || 'Confirmer',
                        handler: () => {
                            resolve(true);
                            return true;
                        }
                    }
                ]
            });
        });
    }
    
    loading(message = 'Chargement...', options = {}) {
        return this.show({
            type: 'info',
            message,
            icon: 'fas fa-spinner fa-spin',
            duration: 0,
            closable: false,
            persistent: true,
            ...options
        });
    }
    
    updateLoading(notificationId, message, type = 'info') {
        const notification = this.notifications.get(notificationId);
        if (!notification || !notification.element) return;
        
        // Mettre à jour le message
        const messageEl = notification.element.querySelector('.notification-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        // Mettre à jour le type et l'icône
        if (type !== notification.type) {
            notification.element.classList.remove(`notification-${notification.type}`);
            notification.element.classList.add(`notification-${type}`);
            
            const iconEl = notification.element.querySelector('.notification-icon i');
            if (iconEl) {
                iconEl.className = this.icons[type] || this.icons.info;
            }
            
            notification.type = type;
        }
    }
    
    // ========================================
    // Configuration
    // ========================================
    
    setPosition(position) {
        this.position = position;
        this.updateContainerPosition();
    }
    
    setMaxVisible(max) {
        this.maxVisible = max;
    }
    
    setDefaultDuration(duration) {
        this.defaultDuration = duration;
    }
    
    // ========================================
    // Statistiques
    // ========================================
    
    getStats() {
        return {
            visible: this.notifications.size,
            queued: this.queue.length,
            total: this.notifications.size + this.queue.length,
            byType: this.getCountByType()
        };
    }
    
    getCountByType() {
        const counts = {};
        
        for (const notification of this.notifications.values()) {
            counts[notification.type] = (counts[notification.type] || 0) + 1;
        }
        
        return counts;
    }
}

// ========================================
// Instance globale
// ========================================

window.NotificationService = new NotificationService();