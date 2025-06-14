// ===== js/core/event-bus.js =====
// Système d'événements global pour la communication entre composants

class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
    }
    
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
        
        // Retourner une fonction pour se désabonner
        return () => this.off(event, callback);
    }
    
    once(event, callback) {
        const wrappedCallback = (...args) => {
            callback(...args);
            this.off(event, wrappedCallback);
        };
        return this.on(event, wrappedCallback);
    }
    
    off(event, callback) {
        if (!this.events.has(event)) return;
        
        const callbacks = this.events.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
        
        if (callbacks.length === 0) {
            this.events.delete(event);
        }
    }
    
    emit(event, data) {
        if (this.events.has(event)) {
            const callbacks = [...this.events.get(event)];
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }
    
    clear(event) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }
}

window.EventBus = new EventBus();