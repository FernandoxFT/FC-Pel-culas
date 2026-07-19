// js/auth.js - Funciones de autenticación y perfil de usuario

function openLoginModal() {
    if (userLoggedIn) {
        openProfileModal();
        return;
    }
    const forgotForm = document.getElementById('forgot-password-form');
    const loginForm = document.getElementById('login-form');
    const authToggle = document.getElementById('auth-toggle-row');
    const loginModal = document.getElementById('login-modal');

    if (forgotForm) forgotForm.style.display = 'none';
    if (loginForm) loginForm.style.display = 'block';
    if (authToggle) authToggle.style.display = 'block';
    if (loginModal) {
        loginModal.classList.add('active');
        loginModal.style.display = 'flex';
    }
    cargarEmailRecordado();
}

function openProfileModal() {
    if (!userLoggedIn || !userData) {
        openLoginModal();
        return;
    }

    const inicial = (userData.name || userData.email || 'U').charAt(0).toUpperCase();
    const avatar = document.getElementById('profile-avatar');
    if (avatar) avatar.textContent = inicial;
    
    const name = document.getElementById('profile-name');
    if (name) name.textContent = userData.name || 'Usuario Premium';
    
    const email = document.getElementById('profile-email');
    if (email) email.textContent = userData.email || '';

    const since = document.getElementById('profile-since');
    if (since) {
        since.textContent = userData.createdAt
            ? `Miembro desde ${new Date(userData.createdAt).toLocaleDateString('es-PY', { year: 'numeric', month: 'long' })}`
            : '';
    }

    const planEl = document.getElementById('profile-plan-estado');
    const btnPlan = document.getElementById('profile-btn-plan');
    if (planEl) {
        if (typeof suscripcionVigente === 'function' && suscripcionVigente()) {
            const fecha = suscripcionVencimiento.toLocaleDateString('es-PY');
            planEl.innerHTML = `<span style="color:var(--success-color)">●</span> Plan ${suscripcionPlan} activo hasta ${fecha}`;
            planEl.classList.add('activo');
            if (btnPlan) btnPlan.textContent = 'Renovar Suscripción';
        } else {
            planEl.textContent = 'Sin plan activo actualmente';
            planEl.classList.remove('activo');
            if (btnPlan) btnPlan.textContent = 'Ver Planes Premium';
        }
    }

    const listEl = document.getElementById('profile-compras-list');
    if (listEl) {
        if (!compras || compras.length === 0) {
            listEl.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">Aún no tienes películas adquiridas.</p>';
        } else {
            listEl.innerHTML = compras.map(c => {
                const movieId = c.pelicula_id || c;
                const pelicula = peliculas.find(p => p.id == movieId);
                if (!pelicula) return '';
                return `
                    <div class="profile-compra-item" onclick="closeProfileModal(); openMovieModal('${pelicula.id}')" style="cursor:pointer">
                        <img src="${pelicula.portada}" alt="${pelicula.titulo}">
                        <div style="flex:1">
                            <div style="font-weight:700; color:white; font-size:0.95rem;">${pelicula.titulo}</div>
                            <div style="font-size:0.8rem; color:var(--text-muted);">${pelicula.genero}</div>
                        </div>
                    </div>`;
            }).join('') || '<p style="color:var(--text-muted); font-size:0.9rem;">Aún no tienes películas adquiridas.</p>';
        }
    }

    const profileModal = document.getElementById('profile-modal');
    if (profileModal) {
        profileModal.classList.add('active');
        profileModal.style.display = 'flex';
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    const errorEl = document.getElementById('login-error');
    if (errorEl) errorEl.textContent = '';
}

function toggleAuthMode(event) {
    if (event) event.preventDefault();
    modoRegistro = !modoRegistro;
    const title = document.getElementById('login-title');
    const btn = document.getElementById('btn-submit-auth');
    const text = document.getElementById('toggle-text');
    const link = document.getElementById('toggle-link');

    if (title) title.textContent = modoRegistro ? 'Crear Cuenta' : 'Bienvenido de nuevo';
    if (btn) btn.textContent = modoRegistro ? 'Registrarme' : 'Entrar';
    if (text) text.textContent = modoRegistro ? '¿Ya eres miembro?' : '¿No tienes cuenta?';
    if (link) link.textContent = modoRegistro ? 'Inicia sesión' : 'Regístrate gratis';
}

async function handleEmailAuth(event) {
    event.preventDefault();
    if (!supabaseClient) {
        showNotification('Error de conexión con el servidor', 'error');
        return;
    }
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    if (errorEl) errorEl.textContent = '';

    if (!email || !password) {
        if (errorEl) errorEl.textContent = 'Por favor, completa todos los campos';
        return;
    }

    let result;
    if (modoRegistro) {
        result = await supabaseClient.auth.signUp({ email, password });
    } else {
        result = await supabaseClient.auth.signInWithPassword({ email, password });
    }

    if (result.error) {
        if (errorEl) errorEl.textContent = traducirErrorAuth(result.error.message);
        return;
    }

    if (modoRegistro && result.data.user && !result.data.session) {
        showNotification('Revisa tu email para confirmar tu cuenta', 'info');
        closeLoginModal();
        return;
    }

    aplicarSesion(result.data.session);
    closeLoginModal();
}

function traducirErrorAuth(msg) {
    if (msg.includes('Invalid login credentials')) return 'Credenciales incorrectas';
    if (msg.includes('already registered')) return 'Este email ya está registrado';
    if (msg.includes('Password should be')) return 'La contraseña es muy corta (mín. 6)';
    return 'Error de autenticación, intenta de nuevo';
}

function aplicarSesion(session, opciones = {}) {
    if (!session) return;
    userLoggedIn = true;
    const user = session.user;
    userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        createdAt: user.created_at
    };
    
    const navBtn = document.getElementById('btn-login-navbar');
    if (navBtn) navBtn.innerHTML = `👤 ${userData.name}`;
    
    const adminBtn = document.getElementById('btn-admin-navbar');
    if (adminBtn) adminBtn.style.display = isAdmin() ? 'inline-flex' : 'none';
    
    if (!opciones.silencioso) {
        showNotification(`Hola, ${userData.name}`, 'success');
    }
    saveToLocalStorage();
    if (typeof cargarSuscripcion === 'function') cargarSuscripcion();
    if (typeof cargarCompras === 'function') cargarCompras();
}

// Restaura la sesión de Supabase al cargar la página (evita que el perfil
// "se cierre" cada vez que el usuario recarga o vuelve a abrir la app).
async function restaurarSesion() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error || !data?.session) {
            // No hay sesión real de Supabase: no confiar en datos viejos
            // que hayan quedado cacheados en localStorage.
            userLoggedIn = false;
            userData = null;
            const navBtn = document.getElementById('btn-login-navbar');
            if (navBtn) navBtn.textContent = '👤 Iniciar';
            return;
        }
        aplicarSesion(data.session, { silencioso: true });
    } catch (e) {
        console.error('Error restaurando sesión:', e);
    }
}

async function cerrarSesion() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    userLoggedIn = false;
    userData = null;
    const navBtn = document.getElementById('btn-login-navbar');
    if (navBtn) navBtn.textContent = '👤 Iniciar';
    const adminBtn = document.getElementById('btn-admin-navbar');
    if (adminBtn) adminBtn.style.display = 'none';
    closeProfileModal();
    showNotification('Sesión finalizada', 'info');
    saveToLocalStorage();
}

function cargarEmailRecordado() {
    const savedEmail = localStorage.getItem('fc_remembered_email');
    const emailInput = document.getElementById('email');
    if (savedEmail && emailInput) emailInput.value = savedEmail;
}
