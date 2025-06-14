// ===== js/utils/animation-utils.js =====
// Utilitaires pour les animations

class AnimationUtils {
    // Easing functions
    static easing = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeInQuart: t => t * t * t * t,
        easeOutQuart: t => 1 - (--t) * t * t * t,
        easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
        easeOutElastic: t => {
            const p = 0.3;
            return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
        }
    };
    
    // Animation principale
    static animate(options) {
        const {
            duration = 300,
            easing = 'easeOutQuad',
            onProgress,
            onComplete
        } = options;
        
        const startTime = performance.now();
        const easingFunc = typeof easing === 'function' ? easing : this.easing[easing] || this.easing.linear;
        
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easingFunc(progress);
            
            if (onProgress) {
                onProgress(easedProgress, progress);
            }
            
            if (progress < 1) {
                requestAnimationFrame(step);
            } else if (onComplete) {
                onComplete();
            }
        };
        
        requestAnimationFrame(step);
    }
    
    // Animations spécifiques
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        this.animate({
            duration,
            onProgress: (progress) => {
                element.style.opacity = progress;
            }
        });
    }
    
    static fadeOut(element, duration = 300) {
        this.animate({
            duration,
            onProgress: (progress) => {
                element.style.opacity = 1 - progress;
            },
            onComplete: () => {
                element.style.display = 'none';
            }
        });
    }
    
    static slideDown(element, duration = 300) {
        element.style.overflow = 'hidden';
        const height = element.scrollHeight;
        element.style.height = '0';
        element.style.display = 'block';
        
        this.animate({
            duration,
            onProgress: (progress) => {
                element.style.height = `${height * progress}px`;
            },
            onComplete: () => {
                element.style.height = '';
                element.style.overflow = '';
            }
        });
    }
    
    static slideUp(element, duration = 300) {
        element.style.overflow = 'hidden';
        const height = element.scrollHeight;
        
        this.animate({
            duration,
            onProgress: (progress) => {
                element.style.height = `${height * (1 - progress)}px`;
            },
            onComplete: () => {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
            }
        });
    }
    
    // Parallax
    static parallax(element, speed = 0.5) {
        const update = () => {
            const scrolled = window.pageYOffset;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        };
        
        window.addEventListener('scroll', update);
        update();
        
        return () => window.removeEventListener('scroll', update);
    }
    
    // Intersection Observer pour animations au scroll
    static observeAnimation(elements, animationClass = 'animate', options = {}) {
        const defaultOptions = {
            threshold: 0.1,
            rootMargin: '0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(animationClass);
                    if (options.once !== false) {
                        observer.unobserve(entry.target);
                    }
                } else if (options.once === false) {
                    entry.target.classList.remove(animationClass);
                }
            });
        }, { ...defaultOptions, ...options });
        
        const elementsArray = typeof elements === 'string' 
            ? document.querySelectorAll(elements) 
            : elements;
        
        elementsArray.forEach(el => observer.observe(el));
        
        return observer;
    }
    
    // Ripple effect
    static ripple(element, event) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        element.appendChild(ripple);
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        setTimeout(() => ripple.remove(), 600);
    }
}

window.AnimationUtils = AnimationUtils;