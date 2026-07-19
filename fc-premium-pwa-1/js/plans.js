// js/plans.js - Funciones de suscripciones y planes

// ===== SUSCRIPCIONES =====
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

// ===== COMPRAS (solo cuenta lo que Supabase diga que está aprobado) =====
async function cargarCompras() {
    if (!supabaseClient || !userData?.id) return;

    const { data, error } = await supabaseClient
        .from('compras')
        .select('pelicula_id')
        .eq('user_id', userData.id)
        .eq('estado', 'aprobado');

    if (error) {
        console.error('Error cargando compras:', error);
        return;
    }

    compras = (data || []).map(row => row.pelicula_id);
    saveToLocalStorage();
    renderCartItems();
}

function mostrarAvisoVencimiento() {
    if (!suscripcionVencimiento) return;
    const msFaltantes = suscripcionVencimiento - new Date();
    const diasFaltantes = Math.ceil(msFaltantes / (1000 * 60 * 60 * 24));

    if (diasFaltantes <= 0 || diasFaltantes > 3) return;

    const texto = diasFaltantes === 1
        ? 'Tu plan vence mañana ⏰'
        : `Tu plan vence en ${diasFaltantes} días ⏰`;

    const div = document.createElement('div');
    div.className = 'aviso-banner aviso-vencimiento';
    div.innerHTML = `
        <span>${texto}</span>
        <button class="aviso-accion" onclick="openPlanesModal(); this.closest('.aviso-banner').remove();">Renovar ahora</button>
        <button class="aviso-cerrar" onclick="this.closest('.aviso-banner').remove()">✕</button>
    `;
    document.getElementById('avisos-container').appendChild(div);
}

function mostrarAvisoOfertas() {
    const gratis = peliculas.filter(p => p.gratis);
    const conDescuento = peliculas.filter(p => !p.gratis && p.precioOriginal);

    if (gratis.length === 0 && conDescuento.length === 0) return;

    let texto = '🎉 ';
    if (gratis.length > 0) texto += `${gratis.length} película${gratis.length > 1 ? 's' : ''} gratis`;
    if (gratis.length > 0 && conDescuento.length > 0) texto += ' y ';
    if (conDescuento.length > 0) texto += `${conDescuento.length} con descuento`;
    texto += ' esta semana';

    const div = document.createElement('div');
    div.className = 'aviso-banner aviso-oferta';
    div.innerHTML = `
        <span>${texto}</span>
        <button class="aviso-cerrar" onclick="this.closest('.aviso-banner').remove()">✕</button>
    `;
    document.getElementById('avisos-container').appendChild(div);
}

function openPlanesModal() {
    if (!userLoggedIn) {
        showNotification('Iniciá sesión para elegir un plan', 'warning');
        closePlanesModal();
        openLoginModal();
        return;
    }

    const estadoEl = document.getElementById('plan-estado-actual');
    if (suscripcionVigente()) {
        const fecha = suscripcionVencimiento.toLocaleDateString('es-PY');
        estadoEl.textContent = `✅ Tenés el plan ${suscripcionPlan} activo hasta el ${fecha}`;
        estadoEl.classList.add('activo');
    } else {
        estadoEl.textContent = 'No tenés ningún plan activo todavía';
        estadoEl.classList.remove('activo');
    }

    document.getElementById('planes-modal').classList.add('active');
}

function closePlanesModal() {
    document.getElementById('planes-modal').classList.remove('active');
}

function elegirPlan(plan, dias, monto) {
    transferContext = { type: 'plan', plan, dias, monto };
    resetComprobante();
    document.getElementById('transfer-total-amount').textContent = `Gs. ${monto.toLocaleString()}`;
    document.getElementById('btn-confirmar-transferencia').textContent = `✅ Ya transferí, activar plan ${plan}`;
    closePlanesModal();
    document.getElementById('transfer-modal').classList.add('active');
}

async function activarSuscripcionSupabase(plan, dias) {
    if (!supabaseClient || !userData?.id) return false;

    const ahora = new Date();
    const vencimiento = new Date(ahora.getTime() + dias * 24 * 60 * 60 * 1000);

    const { error } = await supabaseClient.from('suscripciones').upsert({
        user_id: userData.id,
        plan,
        fecha_inicio: ahora.toISOString(),
        fecha_vencimiento: vencimiento.toISOString(),
        updated_at: ahora.toISOString()
    });

    if (error) {
        console.error(error);
        return false;
    }

    suscripcionActiva = true;
    suscripcionVencimiento = vencimiento;
    suscripcionPlan = plan;
    return true;
}
