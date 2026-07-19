// js/menu-extra.js — Funciones para los nuevos ítems del menú móvil:
// Favoritos, Instalar App, Calificar, Contacto y Ajustes.

// ============================================================
// FAVORITOS — vista completa (antes solo mostraba una notificación)
// ============================================================
function openFavoritesModal() {
    const modal = document.getElementById('favorites-modal');
    const grid = document.getElementById('favorites-modal-grid');
    if (!modal || !grid) return;

    const favMovies = (typeof peliculas !== 'undefined' ? peliculas : [])
        .filter(p => favoritos.some(f => f === p.id || f.id === p.id));

    if (favMovies.length === 0) {
        grid.innerHTML = '<p class="profile-empty-text">Todavía no agregaste ninguna película a favoritos. Tocá el corazón 🤍 en cualquier película para guardarla acá.</p>';
    } else if (typeof renderMovieCard === 'function') {
        grid.innerHTML = favMovies.map(renderMovieCard).join('');
    }

    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeFavoritesModal() {
    const modal = document.getElementById('favorites-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ============================================================
// INSTALAR APP — reusa el prompt de instalación de pwa.js.
// Si el navegador ya lo instaló, o es iOS (sin prompt automático),
// avisa cómo hacerlo manualmente.
// ============================================================
function triggerPwaInstall() {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        if (typeof showNotification === 'function') {
            showNotification('¡Ya tenés la app instalada! 🎉', 'info');
        }
        return;
    }

    // deferredInstallPrompt se declara en pwa.js; al ser scripts clásicos
    // en la misma página, comparten el mismo scope léxico de nivel superior.
    if (typeof deferredInstallPrompt !== 'undefined' && deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.finally(() => {
            deferredInstallPrompt = null;
        });
        return;
    }

    const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const mensaje = esIOS
        ? 'Para instalar: tocá el botón Compartir y elegí "Agregar a pantalla de inicio".'
        : 'Para instalar: abrí el menú del navegador (⋮) y elegí "Instalar app" o "Agregar a pantalla de inicio".';

    if (typeof showNotification === 'function') {
        showNotification(mensaje, 'info');
    } else {
        alert(mensaje);
    }
}

// ============================================================
// CALIFICAR — estrellas + comentario opcional.
// Se guarda localmente (localStorage). Si en el futuro hay una
// tabla de Supabase para esto, acá es donde se enviaría.
// ============================================================
let ratingSeleccionado = 0;

function openRatingModal() {
    const modal = document.getElementById('rating-modal');
    if (!modal) return;
    ratingSeleccionado = 0;
    actualizarEstrellas();
    const comment = document.getElementById('rating-comment');
    if (comment) comment.value = '';
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeRatingModal() {
    const modal = document.getElementById('rating-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function actualizarEstrellas() {
    document.querySelectorAll('#rating-stars .rating-star').forEach(btn => {
        const val = parseInt(btn.dataset.value, 10);
        btn.classList.toggle('active', val <= ratingSeleccionado);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#rating-stars .rating-star').forEach(btn => {
        btn.addEventListener('click', () => {
            ratingSeleccionado = parseInt(btn.dataset.value, 10);
            actualizarEstrellas();
        });
    });

    const btnSubmitRating = document.getElementById('btn-submit-rating');
    if (btnSubmitRating) {
        btnSubmitRating.addEventListener('click', () => {
            if (ratingSeleccionado === 0) {
                if (typeof showNotification === 'function') {
                    showNotification('Elegí al menos una estrella ⭐', 'warning');
                }
                return;
            }
            const comentario = document.getElementById('rating-comment')?.value?.trim() || '';

            try {
                const historial = JSON.parse(localStorage.getItem('fc_calificaciones') || '[]');
                historial.push({ estrellas: ratingSeleccionado, comentario, fecha: new Date().toISOString() });
                localStorage.setItem('fc_calificaciones', JSON.stringify(historial));
            } catch (e) {
                console.error('Error guardando calificación:', e);
            }

            closeRatingModal();
            if (typeof showNotification === 'function') {
                showNotification('¡Gracias por tu calificación! 🙌', 'success');
            }
        });
    }
});

// ============================================================
// CONTACTO AL DESARROLLADOR — abre el cliente de correo con
// un asunto prellenado, usando el mismo correo admin del proyecto.
// ============================================================
function contactarDesarrollador() {
    const destino = (typeof ADMIN_EMAIL !== 'undefined' && ADMIN_EMAIL) ? ADMIN_EMAIL : '';
    const asunto = encodeURIComponent('Consulta - FC Movies+');
    const cuerpo = encodeURIComponent('Hola, te escribo desde la app FC Movies+ porque...');
    window.location.href = `mailto:${destino}?subject=${asunto}&body=${cuerpo}`;
}

// ============================================================
// AJUSTES — calidad de reproducción + diagnóstico de conexión
// + botón para borrar caché (útil tras actualizar la app).
// ============================================================
const QUALITY_STORAGE_KEY = 'fc_video_quality';

function getVideoQuality() {
    return localStorage.getItem(QUALITY_STORAGE_KEY) || 'media';
}

function setVideoQuality(quality) {
    localStorage.setItem(QUALITY_STORAGE_KEY, quality);
    actualizarBotonesCalidad();
    if (typeof showNotification === 'function') {
        const nombres = { alta: 'Máxima calidad', media: 'Media', baja: 'Ahorro de datos' };
        showNotification(`Calidad de reproducción: ${nombres[quality] || quality}`, 'success');
    }
}

function actualizarBotonesCalidad() {
    const actual = getVideoQuality();
    document.querySelectorAll('#quality-options .quality-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.quality === actual);
    });
}

function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    actualizarBotonesCalidad();

    const versionEl = document.getElementById('settings-version');
    if (versionEl && typeof APP_VERSION_DISPLAY !== 'undefined') {
        versionEl.textContent = `FC Movies+ — Versión ${APP_VERSION_DISPLAY}`;
    }

    const resultBox = document.getElementById('connection-result');
    if (resultBox) resultBox.style.display = 'none';

    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ── Diagnóstico de conexión ──
async function probarConexion() {
    const resultBox = document.getElementById('connection-result');
    const btn = document.getElementById('btn-test-connection');
    if (!resultBox) return;

    resultBox.style.display = 'block';
    resultBox.className = 'connection-result';
    resultBox.textContent = 'Probando tu conexión...';
    if (btn) btn.disabled = true;

    const resultado = { online: navigator.onLine, tipoRed: null, ping: null };

    if (navigator.connection) {
        resultado.tipoRed = navigator.connection.effectiveType || null;
    }

    if (!navigator.onLine) {
        resultBox.className = 'connection-result error';
        resultBox.innerHTML = '❌ No tenés conexión a internet en este momento. Revisá tu wifi o tus datos móviles.';
        if (btn) btn.disabled = false;
        return;
    }

    try {
        const inicio = performance.now();
        await fetch('./movies.json', { cache: 'no-store' });
        resultado.ping = Math.round(performance.now() - inicio);
    } catch (e) {
        resultado.ping = null;
    }

    let mensaje = '';
    let clase = 'ok';

    if (resultado.ping === null) {
        clase = 'error';
        mensaje = '⚠️ Estás conectado, pero el servidor no responde bien. Puede ser un problema temporal de wifi/datos o del sitio.';
    } else if (resultado.ping < 300) {
        mensaje = `✅ Tu conexión anda bien (${resultado.ping} ms). Podés usar Máxima calidad sin problema.`;
    } else if (resultado.ping < 900) {
        clase = 'warning';
        mensaje = `⚠️ Tu conexión es un poco lenta (${resultado.ping} ms). Te recomendamos calidad Media.`;
    } else {
        clase = 'warning';
        mensaje = `🐢 Tu conexión está lenta (${resultado.ping} ms). Te recomendamos "Ahorro de datos" para que no se trabe el video.`;
    }

    if (resultado.tipoRed) {
        mensaje += ` (red detectada: ${resultado.tipoRed})`;
    }

    resultBox.className = `connection-result ${clase}`;
    resultBox.innerHTML = mensaje;
    if (btn) btn.disabled = false;
}

// ── Borrar caché (útil cuando la app queda "pegada" en una versión vieja) ──
async function borrarCacheApp() {
    try {
        if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(r => r.unregister()));
        }
        if (window.caches) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
        }
        if (typeof showNotification === 'function') {
            showNotification('Caché borrado. Recargando la app...', 'success');
        }
        setTimeout(() => window.location.reload(true), 1200);
    } catch (e) {
        console.error('Error borrando caché:', e);
        if (typeof showNotification === 'function') {
            showNotification('No se pudo borrar el caché. Probá borrar los datos del sitio desde el navegador.', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#quality-options .quality-option').forEach(btn => {
        btn.addEventListener('click', () => setVideoQuality(btn.dataset.quality));
    });

    const btnTestConnection = document.getElementById('btn-test-connection');
    if (btnTestConnection) btnTestConnection.addEventListener('click', probarConexion);

    const btnClearCache = document.getElementById('btn-clear-cache');
    if (btnClearCache) btnClearCache.addEventListener('click', borrarCacheApp);
});
