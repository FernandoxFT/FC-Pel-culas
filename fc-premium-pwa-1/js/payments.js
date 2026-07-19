// js/payments.js - Funciones de pagos y transferencias

function openTransferModal() {
    if (!userLoggedIn) {
        showNotification('Iniciá sesión para poder confirmar tu compra', 'warning');
        openLoginModal();
        return;
    }
    if (carrito.length === 0) {
        showNotification('Tu carrito está vacío', 'warning');
        return;
    }
    transferContext = { type: 'carrito' };
    resetComprobante();
    const total = carrito.reduce((sum, item) => sum + item.precio, 0);
    document.getElementById('transfer-total-amount').textContent = `Gs. ${total.toLocaleString()}`;
    document.getElementById('btn-confirmar-transferencia').textContent = '✅ Ya transferí, confirmar pedido';
    document.getElementById('transfer-modal').classList.add('active');
}

function resetComprobante() {
    comprobanteFile = null;
    const input = document.getElementById('input-comprobante');
    const label = document.getElementById('comprobante-label');
    const preview = document.getElementById('comprobante-preview');
    if (input) input.value = '';
    if (label) {
        label.textContent = '📎 Subir foto del comprobante';
        label.classList.remove('cargado');
    }
    if (preview) {
        preview.style.display = 'none';
        preview.src = '';
    }
}

async function subirComprobante() {
    if (!comprobanteFile) return null;
    if (!supabaseClient) {
        showNotification('Error de conexión, no se pudo subir el comprobante', 'warning');
        return null;
    }

    const extension = comprobanteFile.name.split('.').pop();
    const nombreArchivo = `comprobante-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const { error: errorUpload } = await supabaseClient.storage
        .from('comprobante')
        .upload(nombreArchivo, comprobanteFile);

    if (errorUpload) {
        console.error(errorUpload);
        return null;
    }

    const { data, error: errorUrl } = await supabaseClient.storage
        .from('comprobante')
        .createSignedUrl(nombreArchivo, 60 * 60 * 24 * 7); // válido 7 días

    if (errorUrl) {
        console.error(errorUrl);
        return null;
    }

    return data.signedUrl;
}

function closeTransferModal() {
    document.getElementById('transfer-modal').classList.remove('active');
}

function copiarDato(texto, btn) {
    navigator.clipboard.writeText(texto).then(() => {
        const textoOriginal = btn.textContent;
        btn.textContent = '✓ Copiado';
        btn.classList.add('copiado');
        setTimeout(() => {
            btn.textContent = textoOriginal;
            btn.classList.remove('copiado');
        }, 1500);
    }).catch(() => {
        showNotification('No se pudo copiar, copialo manualmente', 'warning');
    });
}

async function confirmarTransferencia() {
    if (!comprobanteFile) {
        showNotification('Subí una foto del comprobante para continuar', 'warning');
        return;
    }

    const btn = document.getElementById('btn-confirmar-transferencia');
    const textoOriginal = btn.textContent;
    btn.textContent = 'Subiendo comprobante...';
    btn.disabled = true;

    const linkComprobante = await subirComprobante();

    btn.textContent = textoOriginal;
    btn.disabled = false;

    if (!linkComprobante) {
        showNotification('No se pudo subir el comprobante, intentá de nuevo', 'warning');
        return;
    }

    if (transferContext.type === 'plan') {
        const { plan, dias, monto } = transferContext;
        const ok = await activarSuscripcionSupabase(plan, dias);

        if (!ok) {
            showNotification('Error al activar el plan, intentá de nuevo', 'warning');
            return;
        }

        const mensaje = encodeURIComponent(
            `Hola FC PREMIUM! 🎬\n\nYa realicé la transferencia del plan ${plan} (Gs. ${monto.toLocaleString()}).\n\nComprobante: ${linkComprobante}`
        );
        window.open(`https://wa.me/595987178916?text=${mensaje}`, '_blank');

        resetComprobante();
        closeTransferModal();
        showNotification(`✅ Plan ${plan} activado`, 'success');
        return;
    }

    if (carrito.length === 0) {
        showNotification('Tu carrito está vacío', 'warning');
        return;
    }

    const total = carrito.reduce((sum, item) => sum + item.precio, 0);
    const peliculasText = carrito.map(item => `${item.titulo} (${item.calidad})`).join(', ');

    const mensaje = encodeURIComponent(
        `Hola FC PREMIUM! 🎬\n\nYa realicé la transferencia bancaria por:\n${peliculasText}\n\nTotal: Gs. ${total.toLocaleString()}\n\nComprobante: ${linkComprobante}`
    );

    window.open(`https://wa.me/595987178916?text=${mensaje}`, '_blank');

    const filasCompras = carrito.map(item => ({
        user_id: userData.id,
        pelicula_id: item.id,
        titulo: item.titulo,
        monto: item.precio,
        comprobante_url: linkComprobante,
        estado: 'pendiente'
    }));

    const { error: errorCompras } = await supabaseClient.from('compras').insert(filasCompras);
    if (errorCompras) console.error('Error guardando compras pendientes:', errorCompras);

    carrito = [];
    updateCart();
    resetComprobante();
    closeTransferModal();
    closeCart();
    saveToLocalStorage();
    showNotification('Pedido enviado. Te avisamos por WhatsApp cuando esté aprobado ⏳', 'success');
}

function procesarWhatsApp() {
    if (carrito.length === 0) {
        showNotification('Tu carrito está vacío', 'warning');
        return;
    }

    const total = carrito.reduce((sum, item) => sum + item.precio, 0);
    const peliculasText = carrito.map(item => `${item.titulo} (${item.calidad})`).join(', ');

    const mensaje = encodeURIComponent(
        `Hola FC PREMIUM! 🎬\n\nMe gustaría alquilar las siguientes películas:\n${peliculasText}\n\nTotal: Gs. ${total.toLocaleString()}`
    );
    
    window.open(`https://wa.me/595987178916?text=${mensaje}`, '_blank');

    closeCart();
    showNotification('Pedido enviado por WhatsApp, coordiná el pago para que te lo aprobemos', 'success');
}
