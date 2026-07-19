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
        // Refleja si el usuario actual es admin, igual que el botón de escritorio
        const btnAdminNavbar = document.getElementById('btn-admin-navbar');
        const drawerAdmin = document.getElementById('drawer-admin');
        if (btnAdminNavbar && drawerAdmin) {
            drawerAdmin.style.display = btnAdminNavbar.style.display === 'none' ? 'none' : 'flex';
        }
    }

    function cerrarDrawer() {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
    }

    btnOpen.addEventListener('click', abrirDrawer);
    btnClose.addEventListener('click', cerrarDrawer);
    overlay.addEventListener('click', cerrarDrawer);

    // Los ítems del drawer reusan las mismas funciones globales que ya
    // disparan los botones de escritorio, para no duplicar lógica.
    document.getElementById('drawer-plan').addEventListener('click', () => {
        cerrarDrawer();
        if (typeof openPlanesModal === 'function') openPlanesModal();
    });

    document.getElementById('drawer-login').addEventListener('click', () => {
        cerrarDrawer();
        if (typeof openLoginModal === 'function') openLoginModal();
    });

    document.getElementById('drawer-admin').addEventListener('click', () => {
        cerrarDrawer();
        if (typeof openAdminModal === 'function') openAdminModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarDrawer();
    });
})();
