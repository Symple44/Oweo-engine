// ===== js/services/notification.service.js =====
// Service de notifications toast

class NotificationService {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.init();
    }
    
    init() {
        // Créer le container si nécessaire
        this.container = document.getElementById('notifications-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications-container';
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        }
    }
    
    show(options) {
        const notification = {
            id: Date.now(),
            type: options.type || 'info',
            message: options.message || '',
            duration: options.duration || 5000,
            closable: options.closable !== false
        };
        
        const element = this.createNotificationElement(notification);
        this.container.appendChild(element);
        
        // Animation d'entrée
        requestAnimationFrame(() => {
            element.classList.add('show');
        });
        
        // Auto-fermeture
        if (notification.duration > 0) {
            setTimeout(() => {
                this.close(notification.id);
            }, notification.duration);
        }
        
        this.notifications.set(notification.id, { notification, element });
        
        return notification.id;
    }
    
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        element.dataset.id = notification.id;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        element.innerHTML = `
            <div class="notification-icon">
                <i class="${icons[notification.type] || icons.info}"></i>
            </div>
            <div class="notification-content">
                <p>${notification.message}</p>
            </div>
            ${notification.closable ? `
                <button class="notification-close" aria-label="Fermer">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
        `;
        
        if (notification.closable) {
            element.querySelector('.notification-close').addEventListener('click', () => {
                this.close(notification.id);
            });
        }
        
        return element;
    }
    
    close(id) {
        const item = this.notifications.get(id);
        if (!item) return;
        
        const { element } = item;
        element.classList.remove('show');
        
        setTimeout(() => {
            element.remove();
            this.notifications.delete(id);
        }, 300);
    }
    
    success(message, options = {}) {
        return this.show({ ...options, type: 'success', message });
    }
    
    error(message, options = {}) {
        return this.show({ ...options, type: 'error', message });
    }
    
    warning(message, options = {}) {
        return this.show({ ...options, type: 'warning', message });
    }
    
    info(message, options = {}) {
        return this.show({ ...options, type: 'info', message });
    }
    
    clear() {
        this.notifications.forEach((item, id) => {
            this.close(id);
        });
    }
}

window.NotificationService = new NotificationService();