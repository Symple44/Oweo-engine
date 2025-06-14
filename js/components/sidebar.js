// ===== js/components/sidebar.js =====
// Composant barre latérale (optionnel)

class Sidebar extends BaseComponent {
    constructor(config = {}) {
        super(config);
        this.menuItems = [
            { icon: 'fas fa-home', label: 'Accueil', href: '/' },
            { icon: 'fas fa-tachometer-alt', label: 'Tableau de bord', href: '/dashboard' },
            { icon: 'fas fa-calculator', label: 'Chiffrage', href: '/chiffrage' },
            { icon: 'fas fa-cube', label: 'DSTV', href: '/dstv' },
            { icon: 'fas fa-project-diagram', label: 'Projets', href: '/projects' }
        ];
    }
    
    getTemplate() {
        return `
            <div class="sidebar-content">
                <div class="sidebar-header">
                    <h3>Menu</h3>
                    <button class="sidebar-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <nav class="sidebar-nav">
                    ${this.menuItems.map(item => `
                        <a href="${item.href}" class="sidebar-link">
                            <i class="${item.icon}"></i>
                            <span>${item.label}</span>
                        </a>
                    `).join('')}
                </nav>
            </div>
        `;
    }
    
    setupEventListeners() {
        this.on('.sidebar-close', 'click', () => {
            window.LayoutManager?.toggleSidebar();
        });
    }
}

window.Sidebar = Sidebar;
window.ComponentManager?.register('sidebar', Sidebar);