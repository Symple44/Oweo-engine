// ===== js/utils/dom-utils.js =====
// Utilitaires pour la manipulation du DOM

class DOMUtils {
    // Sélecteurs
    static $(selector, context = document) {
        return context.querySelector(selector);
    }
    
    static $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }
    
    // Création d'éléments
    static createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Attributs
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'class') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on')) {
                const event = key.slice(2).toLowerCase();
                element.addEventListener(event, value);
            } else if (key === 'data' && typeof value === 'object') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Enfants
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    }
    
    // Classes CSS
    static addClass(element, ...classes) {
        element.classList.add(...classes);
    }
    
    static removeClass(element, ...classes) {
        element.classList.remove(...classes);
    }
    
    static toggleClass(element, className, force) {
        return element.classList.toggle(className, force);
    }
    
    static hasClass(element, className) {
        return element.classList.contains(className);
    }
    
    // Manipulation
    static empty(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
    
    static remove(element) {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }
    
    // Événements
    static on(element, event, handler, options) {
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    }
    
    static once(element, event, handler, options) {
        const wrappedHandler = (e) => {
            handler(e);
            element.removeEventListener(event, wrappedHandler, options);
        };
        element.addEventListener(event, wrappedHandler, options);
    }
    
    static delegate(parent, selector, event, handler) {
        parent.addEventListener(event, (e) => {
            const target = e.target.closest(selector);
            if (target && parent.contains(target)) {
                handler.call(target, e);
            }
        });
    }
    
    // Animations
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        element.style.transition = `opacity ${duration}ms`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
        
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }
    
    static fadeOut(element, duration = 300) {
        element.style.transition = `opacity ${duration}ms`;
        element.style.opacity = '0';
        
        return new Promise(resolve => {
            setTimeout(() => {
                element.style.display = 'none';
                resolve();
            }, duration);
        });
    }
    
    // Utilitaires
    static isVisible(element) {
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    }
    
    static scrollTo(target, options = {}) {
        const defaults = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };
        
        if (typeof target === 'string') {
            target = document.querySelector(target);
        }
        
        if (target) {
            target.scrollIntoView({ ...defaults, ...options });
        }
    }
    
    static getScrollPercentage() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        return (scrollTop / scrollHeight) * 100;
    }
}

window.DOMUtils = DOMUtils;
window.$ = DOMUtils.$;
window.$$ = DOMUtils.$$;

