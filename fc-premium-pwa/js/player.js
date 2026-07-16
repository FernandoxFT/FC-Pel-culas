// js/player.js - Modal de película y reproductor

function generarEstrellas(rating) {
    const estrellas = Math.round(rating / 2);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= estrellas ? '★' : '☆';
    }
    return `<span class="modal-stars">${html}</span><span class="modal-score">${rating}/10</span>`;
}

function openMovieModal(movieId) {
    const pelicula = peliculas.find(p => p.id == movieId);
    if (!pelicula) return;

    currentMovieId = movieId;
    document.getElementById('modal-hero').style.backgroundImage = `url('${pelicula.portada}')`;
    document.getElementById('modal-title').textContent = pelicula.titulo;
    document.getElementById('modal-rating').innerHTML = generarEstrellas(pelicula.rating);
    document.getElementById('modal-description').textContent = pelicula.descripcion;
    document.getElementById('modal-price').textContent = `Gs. ${pelicula.precio.toLocaleString()}`;

    const favBtn = document.getElementById('modal-favorite-btn');
    favBtn.textContent = favoritos.includes(movieId) ? '♥' : '♡';
    favBtn.classList.toggle('active', favoritos.includes(movieId));

    const metaHtml = `
        <div class="modal-meta-item">📅 ${pelicula.año}</div>
        <div class="modal-meta-item">🎬 ${pelicula.genero}</div>
        <div class="modal-meta-item">👤 ${pelicula.director}</div>
        <div class="modal-meta-item">📺 ${pelicula.calidad}</div>
    `;
    document.getElementById('modal-meta').innerHTML = metaHtml;

    const tabCompleta = document.getElementById('tab-completa');
    const incluidaPorPlan = pelicula.gratis || (pelicula.categoria !== 'estreno' && typeof suscripcionVigente === 'function' && suscripcionVigente());
    
    // Verificar compras aprobadas (soporta array de IDs o array de objetos de Supabase)
    const yaComprada = compras.some(c => (c.pelicula_id == movieId || c == movieId) && (c.estado === 'aprobado' || typeof c === 'number')) || incluidaPorPlan;
    
    tabCompleta.textContent = yaComprada ? '▶ Película Completa' : '🔒 Película Completa';

    const btnAgregar = document.getElementById('btn-agregar-modal');
    if (btnAgregar) btnAgregar.style.display = yaComprada ? 'none' : 'inline-flex';

    mostrarTrailer();
    document.getElementById('movie-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function toggleFavoriteFromModal() {
    if (!currentMovieId) return;
    toggleFavorite(currentMovieId);
    const favBtn = document.getElementById('modal-favorite-btn');
    const esFavorito = favoritos.includes(currentMovieId);
    favBtn.textContent = esFavorito ? '♥' : '♡';
    favBtn.classList.toggle('active', esFavorito);
}

function compartirPelicula() {
    const pelicula = peliculas.find(p => p.id == currentMovieId);
    if (!pelicula) return;

    const texto = `Mirá "${pelicula.titulo}" en FC PREMIUM`;

    if (navigator.share) {
        navigator.share({ title: pelicula.titulo, text: texto, url: window.location.href }).catch(() => {});
        return;
    }

    navigator.clipboard.writeText(`${texto} - ${window.location.href}`)
        .then(() => showNotification('Link copiado para compartir', 'success'))
        .catch(() => showNotification('No se pudo copiar el link', 'warning'));
}

function mostrarTrailer() {
    const pelicula = peliculas.find(p => p.id == currentMovieId);
    if (!pelicula) return;

    document.getElementById('tab-trailer').classList.add('active');
    document.getElementById('tab-completa').classList.remove('active');

    document.getElementById('video-player').innerHTML = `
        <iframe src="${pelicula.trailerUrl}" allowfullscreen allow="autoplay"></iframe>
    `;
}

function intentarVerPelicula() {
    const pelicula = peliculas.find(p => p.id == currentMovieId);
    if (!pelicula) return;

    document.getElementById('tab-completa').classList.add('active');
    document.getElementById('tab-trailer').classList.remove('active');

    const incluidaPorPlan = pelicula.gratis || (pelicula.categoria !== 'estreno' && typeof suscripcionVigente === 'function' && suscripcionVigente());
    const yaComprada = compras.some(c => (c.pelicula_id == currentMovieId || c == currentMovieId) && (c.estado === 'aprobado' || typeof c === 'number')) || incluidaPorPlan;

    if (!yaComprada) {
        const mensajePlan = pelicula.categoria === 'estreno'
            ? 'Esta película es un Estreno y se paga aparte, incluso con el plan activo.'
            : 'Esta película todavía no fue alquilada. También la podés ver suscribiéndote a un plan.';

        document.getElementById('video-player').innerHTML = `
            <div class="video-locked">
                <div class="lock-icon">🔒</div>
                <p>${mensajePlan}</p>
                <button class="btn" onclick="addToCartFromModal()">🛒 Alquilar por Gs. ${pelicula.precio.toLocaleString()}</button>
                ${pelicula.categoria !== 'estreno' ? '<button class="btn btn-secondary" onclick="closeMovieModal(); openPlanesModal();">🎫 Ver planes</button>' : ''}
            </div>
        `;
        return;
    }

    if (!pelicula.videoUrl) {
        document.getElementById('video-player').innerHTML = `
            <div class="video-locked">
                <div class="lock-icon">⚠️</div>
                <p>Todavía no cargamos el archivo de esta película.</p>
            </div>
        `;
        return;
    }

    const savedProgress = getVideoProgress(currentMovieId);
    if (savedProgress && savedProgress.currentTime > 10 && savedProgress.percent < 95) {
        const timeStr = formatTime(savedProgress.currentTime);
        document.getElementById('video-player').innerHTML = `
            <div class="resume-prompt">
                <h3>¿Continuar viendo?</h3>
                <p>Te quedaste en el minuto ${timeStr}</p>
                <div class="resume-actions">
                    <button class="btn" onclick="reproducirDesde(${savedProgress.currentTime})">Continuar desde ${timeStr}</button>
                    <button class="btn btn-secondary" onclick="reproducirDesde(0)">Empezar de nuevo</button>
                </div>
            </div>
        `;
    } else {
        reproducirDesde(0);
    }
}

function reproducirDesde(startTime) {
    const pelicula = peliculas.find(p => p.id == currentMovieId);
    const container = document.getElementById('video-player');
    
    container.innerHTML = `
        <video id="main-video" controls autoplay src="${pelicula.videoUrl}" style="width:100%; height:100%; background:#000;">
            Tu navegador no soporta el elemento video.
        </video>
    `;

    const video = document.getElementById('main-video');
    video.currentTime = startTime;

    video.ontimeupdate = () => {
        if (video.currentTime > 0) {
            saveVideoProgress(currentMovieId, video.currentTime, video.duration);
        }
    };

    video.onended = () => {
        saveVideoProgress(currentMovieId, video.duration, video.duration);
        renderHomeSections();
    };
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function closeMovieModal() {
    const videoContainer = document.getElementById('video-player');
    const video = videoContainer.querySelector('video');
    if (video && !video.paused && currentMovieId) {
        saveVideoProgress(currentMovieId, video.currentTime, video.duration);
    }

    document.getElementById('movie-modal').classList.remove('active');
    document.body.style.overflow = 'auto';
    currentMovieId = null;
    
    // Refrescar para mostrar barras de progreso actualizadas
    renderHomeSections();
}

function addToCartFromModal() {
    if (currentMovieId) {
        addToCart(currentMovieId);
        closeMovieModal();
    }
}
