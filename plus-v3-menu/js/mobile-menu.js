// js/mobile-menu.js — Menú lateral (drawer) para móviles

(function () {
    const btnOpen = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('mobile-drawer-overlay');
    const drawer = document.getElementById('mobile-drawer');
    const btnClose = document.getElementById('mobile-drawer-close');

    if (!btnOpen || !drawer || !overlay) return;

    function abrirDrawer() {
        drawer.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Sincronizar estado de admin
        const drawerAdmin = document.getElementById('drawer-admin');
        if (drawerAdmin) {
            drawerAdmin.style.display = (typeof isAdmin === 'function' && isAdmin()) ? 'flex' : 'none';
        }

        // Sincronizar estado de login
        const drawerLogin = document.getElementById('drawer-login');
        if (drawerLogin) {
            drawerLogin.innerHTML = (typeof userData !== 'undefined' && userData) 
                ? '<span>👤 Mi Perfil</span>' 
                : '<span>🔑 Iniciar Sesión</span>';
        }

        // Mostrar versión de la app
        const versionEl = document.getElementById('drawer-version');
        if (versionEl && typeof APP_VERSION_DISPLAY !== 'undefined') {
            versionEl.textContent = `FC Movies+ — ${APP_VERSION_DISPLAY}`;
        }
    }

    function cerrarDrawer() {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    btnOpen.addEventListener('click', abrirDrawer);
    if (btnClose) btnClose.addEventListener('click', cerrarDrawer);
    overlay.addEventListener('click', cerrarDrawer);

    // Navegación del drawer
    const menuItems = [
        { id: 'drawer-plan', fn: 'openPlanesModal' },
        { id: 'drawer-login', fn: 'openLoginModal' },
        { id: 'drawer-admin', fn: 'openAdminModal' },
        { id: 'drawer-favoritos', fn: 'openFavoritesModal' },
        { id: 'drawer-install', fn: 'triggerPwaInstall' },
        { id: 'drawer-rate', fn: 'openRatingModal' },
        { id: 'drawer-contact', fn: 'contactarDesarrollador' },
        { id: 'drawer-settings', fn: 'openSettingsModal' }
    ];

    menuItems.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
            el.addEventListener('click', () => {
                cerrarDrawer();
                if (typeof window[item.fn] === 'function') {
                    window[item.fn]();
                }
            });
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarDrawer();
    });
})();
