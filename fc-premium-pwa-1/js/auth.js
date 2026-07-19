// js/auth.js - Funciones de autenticación y perfil de usuario

function openLoginModal() {
    if (userLoggedIn) {
        openProfileModal();
        return;
    }
    document.getElementById('forgot-password-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('auth-toggle-row').style.display = 'block';
    document.getElementById('login-modal').classList.add('active');
    cargarEmailRecordado();
}

function openProfileModal() {
    if (!userLoggedIn || !userData) return;

    const inicial = (userData.name || userData.email || 'U').charAt(0).toUpperCase();
    document.getElementById('profile-avatar').textContent = inicial;
    document.getElementById('profile-name').textContent = userData.name || 'Usuario';
    document.getElementById('profile-email').textContent = userData.email || '';
    document.getElementById('profile-since').textContent = userData.createdAt
        ? `Miembro desde ${new Date(userData.createdAt).toLocaleDateString('es-PY', { year: 'numeric', month: 'long' })}`
        : '';

    const planEl = document.getElementById('profile-plan-estado');
    const btnPlan = document.getElementById('profile-btn-plan');
    if (suscripcionVigente()) {
        const fecha = suscripcionVencimiento.toLocaleDateString('es-PY');
        planEl.textContent = `✅ Plan ${suscripcionPlan} activo hasta el ${fecha}`;
        planEl.classList.add('activo');
        btnPlan.textContent = 'Renovar plan';
    } else {
        planEl.textContent = 'No tenés ningún plan activo todavía';
        planEl.classList.remove('activo');
        btnPlan.textContent = 'Ver planes';
    }

    const listEl = document.getElementById('profile-compras-list');
    if (!compras || compras.length === 0) {
        listEl.innerHTML = '<p class="profile-empty-text">Todavía no compraste ninguna película.</p>';
    } else {
        listEl.innerHTML = compras.map(id => {
            const pelicula = peliculas.find(p => p.id === id);
            if (!pelicula) return '';
            return `
                <div class="profile-compra-item">
                    <img src="${pelicula.portada || ''}" alt="${pelicula.titulo || ''}">
                    <span>${pelicula.titulo || 'Película'}</span>
                </div>`;
        }).join('') || '<p class="profile-empty-text">Todavía no compraste ninguna película.</p>';
    }

    document.getElementById('profile-modal').classList.add('active');
}

function closeProfileModal() {
    document.getElementById('profile-modal').classList.remove('active');
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.remove('active');
    document.getElementById('login-error').textContent = '';
    const passwordInput = document.getElementById('password');
    const passwordBtn = document.getElementById('password-toggle-btn');
    if (passwordInput) passwordInput.type = 'password';
    if (passwordBtn) passwordBtn.textContent = '👁';
}

function toggleAuthMode(event) {
    event.preventDefault();
    modoRegistro = !modoRegistro;
    document.getElementById('login-title').textContent = modoRegistro ? 'Crear Cuenta' : 'Iniciar Sesión';
    document.getElementById('btn-submit-auth').textContent = modoRegistro ? 'Registrarme' : 'Iniciar Sesión';
    document.getElementById('toggle-text').textContent = modoRegistro ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?';
    document.getElementById('toggle-link').textContent = modoRegistro ? 'Iniciar sesión' : 'Registrate';
    document.getElementById('login-error').textContent = '';
}

async function loginConGoogle() {
    if (!supabaseClient) {
        showNotification('Error de conexión, recargá la página', 'warning');
        return;
    }
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
    });
    if (error) {
        showNotification('Error al conectar con Google', 'warning');
        console.error(error);
    }
}

async function loginConFacebook() {
    if (!supabaseClient) {
        showNotification('Error de conexión, recargá la página', 'warning');
        return;
    }
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo: window.location.href }
    });
    if (error) {
        showNotification('Error al conectar con Facebook', 'warning');
        console.error(error);
    }
}

async function loginConApple() {
    if (!supabaseClient) {
        showNotification('Error de conexión, recargá la página', 'warning');
        return;
    }
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: window.location.href }
    });
    if (error) {
        showNotification('Error al conectar con Apple', 'warning');
        console.error(error);
    }
}

function togglePasswordVisibility() {
    const input = document.getElementById('password');
    const btn = document.getElementById('password-toggle-btn');
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.textContent = isHidden ? '🙈' : '👁';
    btn.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
}

function openForgotPassword(event) {
    event.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('auth-toggle-row').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'block';
    document.getElementById('login-title').textContent = 'Recuperar Contraseña';
    document.getElementById('forgot-password-msg').textContent = '';
}

function closeForgotPassword(event) {
    event.preventDefault();
    document.getElementById('forgot-password-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('auth-toggle-row').style.display = 'block';
    document.getElementById('login-title').textContent = modoRegistro ? 'Crear Cuenta' : 'Iniciar Sesión';
}

async function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById('forgot-email').value;
    const msgEl = document.getElementById('forgot-password-msg');
    if (!supabaseClient) {
        msgEl.style.color = 'var(--accent-color)';
        msgEl.textContent = 'Error de conexión, recargá la página';
        return;
    }
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.href
    });
    if (error) {
        msgEl.style.color = 'var(--accent-color)';
        msgEl.textContent = 'No pudimos enviar el email. Revisá que sea correcto.';
        return;
    }
    msgEl.style.color = 'var(--gold-light)';
    msgEl.textContent = 'Listo, revisá tu email para restablecer tu contraseña.';
    document.getElementById('forgot-password-form').reset();
}

function aplicarRecordarme(email) {
    const checkbox = document.getElementById('remember-me');
    if (checkbox && checkbox.checked) {
        localStorage.setItem('fc_remembered_email', email);
    } else {
        localStorage.removeItem('fc_remembered_email');
    }
}

function cargarEmailRecordado() {
    const savedEmail = localStorage.getItem('fc_remembered_email');
    const emailInput = document.getElementById('email');
    const checkbox = document.getElementById('remember-me');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (checkbox) checkbox.checked = true;
    }
}

async function handleEmailAuth(event) {
    event.preventDefault();
    if (!supabaseClient) {
        document.getElementById('login-error').textContent = 'Error de conexión, recargá la página';
        return;
    }
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';

    if (!email || !password) {
        errorEl.textContent = 'Completá todos los campos';
        return;
    }

    let result;
    if (modoRegistro) {
        result = await supabaseClient.auth.signUp({ email, password });
    } else {
        result = await supabaseClient.auth.signInWithPassword({ email, password });
    }

    if (result.error) {
        errorEl.textContent = traducirErrorAuth(result.error.message);
        return;
    }

    if (modoRegistro && result.data.user && !result.data.session) {
        showNotification('Te enviamos un email para confirmar tu cuenta', 'success');
        closeLoginModal();
        document.getElementById('login-form').reset();
        return;
    }

    aplicarRecordarme(email);
    aplicarSesion(result.data.session);
    closeLoginModal();
    document.getElementById('login-form').reset();
}

function traducirErrorAuth(msg) {
    if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos';
    if (msg.includes('already registered')) return 'Ese email ya tiene una cuenta';
    if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres';
    return 'Ocurrió un error, intentá de nuevo';
}

function aplicarSesion(session) {
    if (!session) return;
    userLoggedIn = true;
    const user = session.user;
    userData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email.split('@')[0],
        createdAt: user.created_at
    };
    document.getElementById('btn-login-navbar').textContent = `👤 ${userData.name}`;
    document.getElementById('btn-admin-navbar').style.display = isAdmin() ? 'inline-flex' : 'none';
    showNotification(`¡Bienvenido ${userData.name}!`, 'success');
    saveToLocalStorage();
    cargarSuscripcion();
    cargarCompras();
}

async function cerrarSesion() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    userLoggedIn = false;
    userData = null;
    document.getElementById('btn-login-navbar').textContent = '👤 Iniciar';
    document.getElementById('btn-admin-navbar').style.display = 'none';
    showNotification('Sesión cerrada', 'success');
    saveToLocalStorage();
}

// Restaurar sesión al cargar la página + escuchar cambios (incluye vuelta de Google)
if (supabaseClient) {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            aplicarSesion(session);
        } else if (userLoggedIn) {
            userLoggedIn = false;
            userData = null;
            document.getElementById('btn-login-navbar').textContent = '👤 Iniciar';
            localStorage.removeItem('fc_userData');
        }
    });

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            aplicarSesion(session);
        } else if (event === 'SIGNED_OUT') {
            userLoggedIn = false;
            userData = null;
            document.getElementById('btn-login-navbar').textContent = '👤 Iniciar';
        }
    });
}
