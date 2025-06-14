// ===== js/components/modal.js =====
// Composant modal réutilisable

class Modal extends BaseComponent {
    constructor(config = {}) {
        super(config);
        this.isOpen = false;
        this.options = {
            title: config.title || '',
            content: config.content || '',
            size: config.size || 'medium', // small, medium, large, fullscreen
            backdrop: config.backdrop !== false,
            closeOnEscape: config.closeOnEscape !== false,
            closeOnBackdropClick: config.closeOnBackdropClick !== false,
            showClose: config.showClose !== false,
            onOpen: config.onOpen || null,
            onClose: config.onClose || null
        };
    }
    
    getTemplate() {
        return `
            <div class="modal-backdrop" style="display: none;"></div>
            <div class="modal modal-${this.options.size}" style="display: none;">
                <div class="modal-content">
                    ${this.options.showClose ? `
                        <button class="modal-close" aria-label="Fermer">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    
                    ${this.options.title ? `
                        <div class="modal-header">
                            <h2 class="modal-title">${this.options.title}</h2>
                        </div>
                    ` : ''}
                    
                    <div class="modal-body">
                        ${this.options.content}
                    </div>
                    
                    <div class="modal-footer"></div>
                </div>
            </div>
        `;
    }
    
    async render() {
        // Créer un container si nécessaire
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'modal-wrapper';
            document.body.appendChild(this.container);
        }
        
        await super.render();
        
        this.backdrop = this.container.querySelector('.modal-backdrop');
        this.modal = this.container.querySelector('.modal');
        
        return this;
    }
    
    setupEventListeners() {
        // Close button
        if (this.options.showClose) {
            this.on('.modal-close', 'click', () => this.close());
        }
        
        // Backdrop click
        if (this.options.closeOnBackdropClick && this.options.backdrop) {
            this.on('.modal-backdrop', 'click', () => this.close());
        }
        
        // Escape key
        if (this.options.closeOnEscape) {
            this.escapeHandler = (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            };
            document.addEventListener('keydown', this.escapeHandler);
        }
    }
    
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        document.body.classList.add('modal-open');
        
        if (this.options.backdrop) {
            this.backdrop.style.display = 'block';
            requestAnimationFrame(() => {
                this.backdrop.classList.add('show');
            });
        }
        
        this.modal.style.display = 'block';
        requestAnimationFrame(() => {
            this.modal.classList.add('show');
        });
        
        if (this.options.onOpen) {
            this.options.onOpen(this);
        }
        
        this.emit('open');
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        
        this.modal.classList.remove('show');
        if (this.backdrop) {
            this.backdrop.classList.remove('show');
        }
        
        setTimeout(() => {
            this.modal.style.display = 'none';
            if (this.backdrop) {
                this.backdrop.style.display = 'none';
            }
            document.body.classList.remove('modal-open');
            
            if (this.options.onClose) {
                this.options.onClose(this);
            }
            
            this.emit('close');
        }, 300);
    }
    
    setContent(content) {
        const body = this.container.querySelector('.modal-body');
        if (body) {
            body.innerHTML = content;
        }
    }
    
    setFooter(content) {
        const footer = this.container.querySelector('.modal-footer');
        if (footer) {
            footer.innerHTML = content;
            footer.style.display = content ? 'block' : 'none';
        }
    }
    
    destroy() {
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
        super.destroy();
    }
    
    // Méthodes statiques pour faciliter l'utilisation
    static async alert(message, title = 'Information') {
        const modal = new Modal({
            title,
            content: `<p>${message}</p>`,
            size: 'small'
        });
        
        await modal.render();
        modal.setFooter(`
            <button class="btn btn-primary" onclick="this.closest('.modal-wrapper').querySelector('.modal-close').click()">
                OK
            </button>
        `);
        modal.open();
        
        return modal;
    }
    
    static async confirm(message, title = 'Confirmation') {
        return new Promise((resolve) => {
            const modal = new Modal({
                title,
                content: `<p>${message}</p>`,
                size: 'small',
                closeOnBackdropClick: false,
                closeOnEscape: false
            });
            
            modal.render().then(() => {
                modal.setFooter(`
                    <button class="btn btn-secondary modal-cancel">Annuler</button>
                    <button class="btn btn-primary modal-confirm">Confirmer</button>
                `);
                
                modal.on('.modal-cancel', 'click', () => {
                    modal.close();
                    resolve(false);
                });
                
                modal.on('.modal-confirm', 'click', () => {
                    modal.close();
                    resolve(true);
                });
                
                modal.open();
            });
        });
    }
}

window.Modal = Modal;
window.ComponentManager.register('modal', Modal);