// js/plans.js - Funciones de suscripciones y planes

async function cargarSuscripcion() {
    if (!supabaseClient || !userData?.id) return;

    const { data, error } = await supabaseClient
        .from('suscripciones')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();

    if (error || !data) {
        suscripcionActiva = false;
        suscripcionVencimiento = null;
        suscripcionPlan = null;
        return;
    }

    suscripcionVencimiento = new Date(data.fecha_vencimiento);
    suscripcionPlan = data.plan;
    suscripcionActiva = suscripcionVencimiento > new Date();
    mostrarAvisoVencimiento();
}

async function cargarCompras() {
    if (!supabaseClient || !userData?.id) return;

    const { data, error } = await supabaseClient
        .from('compras')
        .select('*')
        .eq('user_id', userData.id)
        .eq('estado', 'aprobado');

    if (error) {
        console.error('Error cargando compras:', error);
        return;
    }

    compras = data || [];
    saveToLocalStorage();
    if (typeof renderCartItems === 'function') renderCartItems();
}

function mostrarAvisoVencimiento() {
    if (!suscripcionVencimiento) return;
    const msFaltantes = suscripcionVencimiento - new Date();
    const diasFaltantes = Math.ceil(msFaltantes / (1000 * 60 * 60 * 24));

    if (diasFaltantes <= 0 || diasFaltantes > 3) return;

    const container = document.getElementById('avisos-container');
    if (!container) return;

    const texto = diasFaltantes === 1
        ? 'Tu suscripción vence mañana ⏰'
        : `Tu suscripción vence en ${diasFaltantes} días ⏰`;

    const div = document.createElement('div');
    div.className = 'aviso-banner aviso-vencimiento';
    div.innerHTML = `
        <span>${texto}</span>
        <button class="aviso-accion" onclick="openPlanesModal(); this.closest('.aviso-banner').remove();">Renovar Suscripción</button>
        <button class="aviso-cerrar" onclick="this.closest('.aviso-banner').remove()">✕</button>
    `;
    container.appendChild(div);
}

function openPlanesModal() {
    if (!userLoggedIn) {
        showNotification('Inicia sesión para suscribirte', 'info');
        openLoginModal();
        return;
    }

    const estadoEl = document.getElementById('plan-estado-actual');
    if (estadoEl) {
        if (typeof suscripcionVigente === 'function' && suscripcionVigente()) {
            const fecha = suscripcionVencimiento.toLocaleDateString('es-PY');
            estadoEl.innerHTML = `<span style="color:var(--success-color)">●</span> Plan ${suscripcionPlan} activo hasta ${fecha}`;
        } else {
            estadoEl.textContent = 'No tienes planes activos actualmente';
        }
    }

    const modal = document.getElementById('planes-modal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closePlanesModal() {
    const modal = document.getElementById('planes-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function elegirPlan(plan, dias, monto) {
    transferContext = { type: 'plan', plan, dias, monto };
    openTransferModal();
    closePlanesModal();
}

async function activarSuscripcionSupabase(plan, dias) {
    if (!supabaseClient || !userData?.id) return false;

    const ahora = new Date();
    const vencimiento = new Date(ahora.getTime() + dias * 24 * 60 * 60 * 1000);

    try {
        const { error } = await supabaseClient.from('suscripciones').upsert({
            user_id: userData.id,
            plan,
            fecha_inicio: ahora.toISOString(),
            fecha_vencimiento: vencimiento.toISOString(),
            updated_at: ahora.toISOString()
        });

        if (error) throw error;

        suscripcionActiva = true;
        suscripcionVencimiento = vencimiento;
        suscripcionPlan = plan;
        return true;
    } catch (e) {
        console.error('Error activando suscripción:', e);
        return false;
    }
}
