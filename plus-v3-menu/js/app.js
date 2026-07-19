// js/app.js — FC Movies+ v3 | Inicialización optimizada

// ===== INICIALIZAR APLICACIÓN =====
async function initApp() {
    const splash = document.getElementById('splash-screen');

    // Bloquear scroll durante splash
    document.body.style.overflow = 'hidden';

    // Registrar tiempo de inicio para métricas
    const startTime = performance.now();

    try {
        // Cargar datos y restaurar sesión en paralelo cuando sea posible
        const moviesPromise = typeof loadMovies === 'function'
            ? loadMovies()
            : Promise.resolve();

        const sessionPromise = typeof restaurarSesion === 'function'
            ? restaurarSesion()
            : Promise.resolve();

        // Esperar a que ambas operaciones terminen
        await Promise.all([moviesPromise, sessionPromise]);

    } catch (err) {
        console.error('[App] Error en inicialización:', err);
    }

    // Calcular tiempo mínimo del splash (mínimo 1.5s para UX, máximo 4s)
    const elapsed = performance.now() - startTime;
    const minSplashTime = 1500;
    const remainingTime = Math.max(0, minSplashTime - elapsed);

    setTimeout(() => {
        ocultarSplash(splash);
    }, remainingTime);
}

function ocultarSplash(splash) {
    if (!splash) return;

    // Usar requestAnimationFrame para sincronizar con el ciclo de render
    requestAnimationFrame(() => {
        splash.classList.add('hidden');
        document.body.style.overflow = '';

        // Eliminar del DOM después de la transición (mejora rendimiento)
        splash.addEventListener('transitionend', () => {
            if (splash.parentNode) splash.remove();
        }, { once: true });

        // Fallback por si la transición no dispara
        setTimeout(() => {
            if (splash.parentNode) splash.remove();
        }, 800);
    });
}

// ===== EVENT LISTENERS GLOBALES =====
document.addEventListener('DOMContentLoaded', () => {

    // ── Cerrar modales al hacer click fuera (delegación de eventos) ──
    const modalIds = [
        'movie-modal', 'login-modal', 'transfer-modal',
        'planes-modal', 'admin-modal', 'profile-modal',
        'favorites-modal', 'settings-modal', 'rating-modal'
    ];

    // Un solo listener delegado para todos los modales
    document.addEventListener('click', (e) => {
        for (const modalId of modalIds) {
            if (e.target.id === modalId) {
                const modal = document.getElementById(modalId);
                if (!modal) continue;

                // Construir nombre de función de cierre
                const parts = modalId.split('-');
                const fnName = 'close' + parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');

                if (typeof window[fnName] === 'function') {
                    window[fnName]();
                } else {
                    modal.classList.remove('active');
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                }
                break;
            }
        }
    });

    // ── Cerrar modales con tecla Escape ──
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        for (const modalId of modalIds) {
            const modal = document.getElementById(modalId);
            if (modal && (modal.classList.contains('active') || modal.style.display === 'flex')) {
                const parts = modalId.split('-');
                const fnName = 'close' + parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
                if (typeof window[fnName] === 'function') window[fnName]();
                break;
            }
        }
    });

    // ── Manejo de carga de comprobante ──
    const inputComprobante = document.getElementById('input-comprobante');
    if (inputComprobante) {
        inputComprobante.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            comprobanteFile = file;
            const label   = document.getElementById('comprobante-label');
            const preview = document.getElementById('comprobante-preview');

            if (label) {
                label.innerHTML = `<span>✅ ${file.name}</span>`;
                label.classList.add('cargado');
            }
            if (preview) {
                // Revocar URL anterior para liberar memoria
                if (preview.src && preview.src.startsWith('blob:')) {
                    URL.revokeObjectURL(preview.src);
                }
                preview.src = URL.createObjectURL(file);
                preview.style.display = 'block';
            }
        });
    }

    // ── Cerrar carrito al hacer click fuera ──
    const cart       = document.getElementById('cart-sidebar');
    const cartToggle = document.getElementById('cart-toggle');
    if (cart && cartToggle) {
        document.addEventListener('click', (e) => {
            if (
                !cart.contains(e.target) &&
                !cartToggle.contains(e.target) &&
                cart.classList.contains('active')
            ) {
                if (typeof closeCart === 'function') closeCart();
            }
        }, { passive: true });
    }

    // ── Preload de portadas del primer carrusel visible ──
    // Esto mejora el LCP al precargar las primeras imágenes
    function preloadFirstCarouselImages() {
        const firstGrid = document.querySelector('.movies-grid');
        if (!firstGrid) return;

        const cards = firstGrid.querySelectorAll('.movie-poster');
        let count = 0;
        cards.forEach(img => {
            if (count >= 4) return; // Solo las primeras 4
            if (img.src && !img.complete) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = img.src;
                document.head.appendChild(link);
                count++;
            }
        });
    }

    // Ejecutar después de que se rendericen las secciones
    const observer = new MutationObserver((mutations, obs) => {
        const firstGrid = document.querySelector('.movies-grid');
        if (firstGrid) {
            preloadFirstCarouselImages();
            obs.disconnect();
        }
    });
    observer.observe(document.getElementById('home-sections-container') || document.body, {
        childList: true, subtree: true
    });

    // ── Inicializar app ──
    initApp();
});

// ===== UTILIDADES GLOBALES =====

// Formatear precio en guaraníes
function formatPrecio(precio) {
    if (!precio && precio !== 0) return '—';
    return `Gs. ${Number(precio).toLocaleString('es-PY')}`;
}

// Debounce genérico
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Throttle genérico (para scroll/resize)
function throttle(fn, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
