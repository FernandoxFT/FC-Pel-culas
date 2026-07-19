// js/pwa.js — FC Movies+ v3 | PWA Optimizada
// Registro del SW + instalación + actualización automática + shortcuts

/* ─── Registro del Service Worker ─── */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('service-worker.js', {
                scope: './',
                updateViaCache: 'none' // Siempre verificar actualizaciones
            });

            console.log('[PWA] Service Worker registrado:', reg.scope);

            // Verificar actualizaciones periódicamente (cada 30 minutos)
            setInterval(() => reg.update(), 30 * 60 * 1000);

            // Detectar nueva versión disponible
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Nueva versión disponible — mostrar banner de actualización
                        mostrarBannerActualizacion(newWorker);
                    }
                });
            });

            // Escuchar mensajes del Service Worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data?.type === 'SW_UPDATED') {
                    console.log('[PWA] Nueva versión activa:', event.data.version);
                }
            });

        } catch (err) {
            console.warn('[PWA] Error registrando Service Worker:', err);
        }
    });

    // Detectar cuando el SW toma control (recarga automática si es necesario)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            // Solo recargar si el usuario lo aceptó o si es la primera carga
            if (sessionStorage.getItem('fc_sw_reload_accepted')) {
                sessionStorage.removeItem('fc_sw_reload_accepted');
                window.location.reload();
            }
        }
    });
}

/* ─── Banner de actualización disponible ─── */
function mostrarBannerActualizacion(newWorker) {
    // No mostrar si ya hay uno visible
    if (document.getElementById('pwa-update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
        <div class="pwa-update-content">
            <span>🔄 Nueva versión disponible</span>
            <div class="pwa-update-actions">
                <button id="pwa-update-btn" type="button">Actualizar ahora</button>
                <button id="pwa-update-dismiss" type="button" aria-label="Cerrar">✕</button>
            </div>
        </div>
    `;

    // Estilos del banner
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10001;
        background: linear-gradient(135deg, #5B8CFF, #7C4DFF);
        color: white;
        padding: 0;
        animation: slideInDown 0.4s ease;
        box-shadow: 0 4px 20px rgba(91, 140, 255, 0.5);
    `;

    const style = document.createElement('style');
    style.textContent = `
        .pwa-update-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 12px 20px;
            font-family: var(--font-main, sans-serif);
            font-size: 0.9rem;
            font-weight: 600;
            flex-wrap: wrap;
        }
        .pwa-update-actions {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        #pwa-update-btn {
            background: white;
            color: #5B8CFF;
            border: none;
            padding: 6px 18px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        #pwa-update-btn:hover { transform: scale(1.05); }
        #pwa-update-dismiss {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `;
    document.head.appendChild(style);
    document.body.prepend(banner);

    // Botón actualizar
    document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
        sessionStorage.setItem('fc_sw_reload_accepted', '1');
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        banner.remove();
    });

    // Botón descartar
    document.getElementById('pwa-update-dismiss')?.addEventListener('click', () => {
        banner.style.animation = 'slideInDown 0.3s ease reverse';
        setTimeout(() => banner.remove(), 300);
    });

    // Auto-descartar después de 15 segundos
    setTimeout(() => {
        if (document.getElementById('pwa-update-banner')) {
            banner.remove();
        }
    }, 15000);
}

/* ─── Botón de instalación (Android/Chrome) ─── */
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    // Mostrar botón después de 3 segundos para no interrumpir la carga
    setTimeout(mostrarBotonInstalar, 3000);
});

function mostrarBotonInstalar() {
    if (document.getElementById('pwa-install-btn')) return;
    if (corriendoComoApp()) return; // Ya está instalada

    const btn = document.createElement('button');
    btn.id = 'pwa-install-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Instalar FC Movies+ en tu dispositivo');
    btn.innerHTML = '📲 Instalar FC Movies+';

    btn.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        z-index: 9999;
        padding: 14px 28px;
        border-radius: 30px;
        border: none;
        background: linear-gradient(135deg, #5B8CFF, #7C4DFF);
        color: #fff;
        font-weight: 800;
        font-size: 15px;
        cursor: pointer;
        box-shadow: 0 10px 30px rgba(91, 140, 255, 0.5);
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
        opacity: 0;
        white-space: nowrap;
        font-family: var(--font-main, sans-serif);
    `;

    document.body.appendChild(btn);

    // Animación de entrada
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            btn.style.opacity = '1';
            btn.style.transform = 'translateX(-50%) translateY(0)';
        });
    });

    btn.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        btn.style.opacity = '0';
        btn.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => btn.remove(), 400);

        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        console.log('[PWA] Resultado de instalación:', outcome);
        deferredInstallPrompt = null;
    });

    // Auto-ocultar después de 8 segundos
    setTimeout(() => {
        if (document.getElementById('pwa-install-btn')) {
            btn.style.opacity = '0';
            btn.style.transform = 'translateX(-50%) translateY(100px)';
            setTimeout(() => btn.remove(), 400);
        }
    }, 8000);
}

// Confirmar instalación exitosa
window.addEventListener('appinstalled', () => {
    console.log('[PWA] App instalada exitosamente');
    deferredInstallPrompt = null;
    // Mostrar notificación de éxito si la función está disponible
    if (typeof showNotification === 'function') {
        showNotification('¡FC Movies+ instalada correctamente! 🎉', 'success');
    }
});

/* ─── Aviso de instalación para iOS ─── */
function esIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function corriendoComoApp() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
}

window.addEventListener('load', () => {
    if (esIOS() && !corriendoComoApp() && !localStorage.getItem('fc_ios_install_hint_shown')) {
        setTimeout(() => {
            const aviso = document.createElement('div');
            aviso.setAttribute('role', 'dialog');
            aviso.setAttribute('aria-label', 'Instrucciones para instalar FC Movies+');
            aviso.innerHTML = `
                <div style="
                    background: rgba(21, 27, 45, 0.97);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    padding: 20px 24px;
                    border-radius: 20px;
                    border: 1px solid rgba(91, 140, 255, 0.3);
                    color: white;
                    text-align: center;
                    max-width: 340px;
                    margin: 0 auto;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
                ">
                    <div style="font-size: 2rem; margin-bottom: 8px;">📲</div>
                    <p style="margin: 0 0 8px 0; font-weight: 800; font-size: 1rem;">Instalar FC Movies+</p>
                    <p style="margin: 0; font-size: 0.85rem; color: #BFC8DA; line-height: 1.5;">
                        Toca <span style="font-size: 1.2rem;">⎋</span> <strong>Compartir</strong>
                        y luego <strong>"Agregar a inicio"</strong>
                    </p>
                    <button onclick="this.closest('[role=dialog]').remove()" type="button"
                        style="
                            margin-top: 16px;
                            background: rgba(91, 140, 255, 0.2);
                            border: 1px solid rgba(91, 140, 255, 0.4);
                            color: white;
                            padding: 8px 20px;
                            border-radius: 20px;
                            cursor: pointer;
                            font-size: 0.85rem;
                            font-weight: 600;
                        ">Entendido</button>
                </div>
            `;

            aviso.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 16px;
                right: 16px;
                z-index: 9999;
                animation: slideInUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            `;

            document.body.appendChild(aviso);
            setTimeout(() => {
                if (aviso.parentNode) {
                    aviso.style.animation = 'fadeIn 0.3s ease reverse';
                    setTimeout(() => aviso.remove(), 300);
                }
            }, 12000);

            localStorage.setItem('fc_ios_install_hint_shown', '1');
        }, 5000);
    }
});

/* ─── Manejar shortcuts de la PWA ─── */
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');

    if (section) {
        // Esperar a que las películas se carguen antes de hacer scroll
        const waitForMovies = setInterval(() => {
            const sectionEl = document.getElementById(`home-${section}`) ||
                              document.querySelector(`[data-genre="${section}"]`);
            if (sectionEl) {
                clearInterval(waitForMovies);
                setTimeout(() => {
                    sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 500);
            }
        }, 200);

        // Timeout de seguridad
        setTimeout(() => clearInterval(waitForMovies), 5000);
    }
});
