// js/pwa.js — Registro del Service Worker + botón "Instalar app"

// 1) Registrar el service worker (habilita instalación + funcionamiento offline)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then((reg) => console.log('[PWA] Service worker registrado:', reg.scope))
            .catch((err) => console.warn('[PWA] Error registrando service worker:', err));
    });
}

// 2) Capturar el evento de instalación (Android/desktop Chrome/Edge) y
//    mostrar un botón propio en vez del prompt genérico del navegador.
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    mostrarBotonInstalar();
});

function mostrarBotonInstalar() {
    if (document.getElementById('pwa-install-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'pwa-install-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Instalar FC Premium');
    btn.innerHTML = '⬇️ Instalar app';
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '9999',
        padding: '12px 18px',
        borderRadius: '30px',
        border: '1px solid #6366F1',
        background: '#0F172A',
        color: '#6366F1',
        fontWeight: '700',
        fontSize: '14px',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(0,0,0,.4)'
    });

    btn.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        btn.remove();
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
    });

    document.body.appendChild(btn);
}

// En iOS Safari no existe beforeinstallprompt: el usuario instala manualmente
// con "Compartir" -> "Agregar a pantalla de inicio". Le mostramos un aviso
// una sola vez si detectamos que es iOS y todavía no está instalado.
function esIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function corriendoComoApp() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
}

window.addEventListener('load', () => {
    if (esIOS() && !corriendoComoApp() && !localStorage.getItem('fc_ios_install_hint_shown')) {
        setTimeout(() => {
            const aviso = document.createElement('div');
            aviso.textContent = '📲 Para instalar FC Premium: toca Compartir y luego "Agregar a pantalla de inicio"';
            Object.assign(aviso.style, {
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                right: '20px',
                zIndex: '9999',
                padding: '14px 16px',
                borderRadius: '12px',
                background: '#141829',
                color: '#fff',
                fontSize: '13px',
                textAlign: 'center',
                border: '1px solid #6366F1',
                boxShadow: '0 4px 14px rgba(0,0,0,.4)'
            });
            document.body.appendChild(aviso);
            setTimeout(() => aviso.remove(), 8000);
            localStorage.setItem('fc_ios_install_hint_shown', '1');
        }, 3000);
    }
});
