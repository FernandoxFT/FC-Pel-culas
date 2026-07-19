// js/payments.js - Funciones de pagos y transferencias

function openTransferModal() {
    if (!userLoggedIn) {
        showNotification('Inicia sesión para confirmar tu pedido', 'info');
        openLoginModal();
        return;
    }
    if (carrito.length === 0 && transferContext.type !== 'plan') {
        showNotification('El carrito está vacío', 'warning');
        return;
    }
    
    resetComprobante();
    const total = transferContext.type === 'plan' 
        ? transferContext.monto 
        : carrito.reduce((sum, item) => sum + item.precio, 0);
        
    const totalEl = document.getElementById('transfer-total-amount');
    if (totalEl) totalEl.textContent = `Gs. ${total.toLocaleString()}`;
    
    const modal = document.getElementById('transfer-modal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function resetComprobante() {
    comprobanteFile = null;
    const input = document.getElementById('input-comprobante');
    const label = document.getElementById('comprobante-label');
    const preview = document.getElementById('comprobante-preview');
    if (input) input.value = '';
    if (label) {
        label.innerHTML = '<span>📎 Adjuntar Comprobante</span>';
        label.classList.remove('cargado');
    }
    if (preview) {
        preview.style.display = 'none';
        preview.src = '';
    }
}

async function subirComprobante() {
    if (!comprobanteFile || !supabaseClient) return null;

    const extension = comprobanteFile.name.split('.').pop();
    const nombreArchivo = `comprobantes/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${extension}`;

    try {
        const { error: errorUpload } = await supabaseClient.storage
            .from('comprobantes')
            .upload(nombreArchivo, comprobanteFile);

        if (errorUpload) throw errorUpload;

        const { data } = supabaseClient.storage
            .from('comprobantes')
            .getPublicUrl(nombreArchivo);

        return data.publicUrl;
    } catch (e) {
        console.error('Error subiendo comprobante:', e);
        return null;
    }
}

function closeTransferModal() {
    const modal = document.getElementById('transfer-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function copiarDato(texto, btn) {
    navigator.clipboard.writeText(texto).then(() => {
        const originalText = btn.innerHTML;
        btn.textContent = '¡Copiado!';
        btn.classList.add('copiado');
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('copiado');
        }, 2000);
    });
}

async function confirmarTransferencia() {
    if (!comprobanteFile) {
        showNotification('Adjunta el comprobante para validar tu pago', 'warning');
        return;
    }

    const btn = document.getElementById('btn-confirmar-transferencia');
    const originalText = btn.textContent;
    btn.textContent = 'Validando pago...';
    btn.disabled = true;

    const linkComprobante = await subirComprobante();

    if (!linkComprobante) {
        showNotification('Error al procesar el archivo. Intenta de nuevo.', 'error');
        btn.textContent = originalText;
        btn.disabled = false;
        return;
    }

    const whatsappNum = '595987178916';
    let mensaje = '';

    if (transferContext.type === 'plan') {
        const { plan, dias, monto } = transferContext;
        await activarSuscripcionSupabase(plan, dias);
        mensaje = `Hola FC Movies+! 🎬\nHe realizado el pago del Plan ${plan} (Gs. ${monto.toLocaleString()}).\nComprobante: ${linkComprobante}`;
    } else {
        const total = carrito.reduce((sum, item) => sum + item.precio, 0);
        const peliculasText = carrito.map(item => `• ${item.titulo}`).join('\n');
        mensaje = `Hola FC Movies+! 🎬\nHe realizado el pago de:\n${peliculasText}\nTotal: Gs. ${total.toLocaleString()}\nComprobante: ${linkComprobante}`;
        
        const filas = carrito.map(item => ({
            user_id: userData.id,
            user_email: userData.email,
            pelicula_id: item.id,
            titulo: item.titulo,
            monto: item.precio,
            comprobante_url: linkComprobante,
            estado: 'pendiente'
        }));
        await supabaseClient.from('compras').insert(filas);
        
        carrito = [];
        updateCart();
        saveToLocalStorage();
    }

    window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(mensaje)}`, '_blank');
    
    resetComprobante();
    closeTransferModal();
    closeCart();
    showNotification('¡Pedido enviado! Lo aprobaremos en breve.', 'success');
}
