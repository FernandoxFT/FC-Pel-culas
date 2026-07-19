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
    const modalHero = document.getElementById('modal-hero');
    if (modalHero) modalHero.style.backgroundImage = `url('${pelicula.portada}')`;
    
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.textContent = pelicula.titulo;
    
    const modalRating = document.getElementById('modal-rating');
    if (modalRating) modalRating.innerHTML = generarEstrellas(pelicula.rating);
    
    const modalDesc = document.getElementById('modal-description');
    if (modalDesc) modalDesc.textContent = pelicula.descripcion;
    
    const modalPrice = document.getElementById('modal-price');
    if (modalPrice) modalPrice.textContent = `Gs. ${pelicula.precio.toLocaleString()}`;

    const favBtn = document.getElementById('modal-favorite-btn');
    const isFav = favoritos.some(f => f == movieId || f.id == movieId);
    if (favBtn) {
        favBtn.textContent = isFav ? '❤️' : '🤍';
        favBtn.classList.toggle('active', isFav);
    }

    const anio = pelicula.anio || pelicula.año;
    const metaHtml = `
        <div class="modal-meta-item">📅 ${anio}</div>
        <div class="modal-meta-item">🎬 ${pelicula.genero}</div>
        <div class="modal-meta-item">👤 ${pelicula.director || 'Desconocido'}</div>
        <div class="modal-meta-item">📺 ${pelicula.calidad}</div>
    `;
    const modalMeta = document.getElementById('modal-meta');
    if (modalMeta) modalMeta.innerHTML = metaHtml;

    const tabCompleta = document.getElementById('tab-completa');
    const incluidaPorPlan = pelicula.gratis || (pelicula.categoria !== 'estreno' && typeof suscripcionVigente === 'function' && suscripcionVigente());
    
    const yaComprada = compras.some(c => (c.pelicula_id == movieId || c == movieId) && (c.estado === 'aprobado' || typeof c === 'number')) || incluidaPorPlan;
    
    if (tabCompleta) tabCompleta.textContent = yaComprada ? '▶ Película Completa' : '🔒 Película Completa';

    const btnAgregar = document.getElementById('btn-agregar-modal');
    if (btnAgregar) btnAgregar.style.display = yaComprada ? 'none' : 'inline-flex';

    mostrarTrailer();
    const movieModal = document.getElementById('movie-modal');
    if (movieModal) {
        movieModal.classList.add('active');
        movieModal.style.display = 'flex';
    }
    document.body.style.overflow = 'hidden';
}

function toggleFavoriteFromModal() {
    if (!currentMovieId) return;
    toggleFavorite(currentMovieId);
    const favBtn = document.getElementById('modal-favorite-btn');
    const esFavorito = favoritos.some(f => f == currentMovieId || f.id == currentMovieId);
    if (favBtn) {
        favBtn.textContent = esFavorito ? '❤️' : '🤍';
        favBtn.classList.toggle('active', esFavorito);
    }
}

function compartirPelicula() {
    const pelicula = peliculas.find(p => p.id == currentMovieId);
    if (!pelicula) return;

    const texto = `Mira "${pelicula.titulo}" en FC Movies+`;

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

    const tabTrailer = document.getElementById('tab-trailer');
    const tabCompleta = document.getElementById('tab-completa');
    if (tabTrailer) tabTrailer.classList.add('active');
    if (tabCompleta) tabCompleta.classList.remove('active');

    const player = document.getElementById('video-player');
    if (player) {
        player.innerHTML = `
            <iframe src="${pelicula.trailerUrl}" allowfullscreen allow="autoplay"></iframe>
        `;
    }
}

function intentarVerPelicula() {
    const pelicula = peliculas.find(p => p.id == currentMovieId);
    if (!pelicula) return;

    const tabCompleta = document.getElementById('tab-completa');
    const tabTrailer = document.getElementById('tab-trailer');
    if (tabCompleta) tabCompleta.classList.add('active');
    if (tabTrailer) tabTrailer.classList.remove('active');

    const incluidaPorPlan = pelicula.gratis || (pelicula.categoria !== 'estreno' && typeof suscripcionVigente === 'function' && suscripcionVigente());
    const yaComprada = compras.some(c => (c.pelicula_id == currentMovieId || c == currentMovieId) && (c.estado === 'aprobado' || typeof c === 'number')) || incluidaPorPlan;

    const player = document.getElementById('video-player');
    if (!yaComprada) {
        const mensajePlan = pelicula.categoria === 'estreno'
            ? 'Esta película es un Estreno Exclusivo y se adquiere por separado.'
            : 'Esta película aún no está en tu colección. Suscríbete a un plan para verla.';

        if (player) {
            player.innerHTML = `
                <div class="video-locked" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🔒</div>
                    <p style="margin-bottom: 20px; color: var(--text-muted);">${mensajePlan}</p>
                    <button class="btn" onclick="addToCartFromModal()">🛒 Adquirir por Gs. ${pelicula.precio.toLocaleString()}</button>
                    ${pelicula.categoria !== 'estreno' ? '<button class="btn btn-secondary" style="margin-top: 10px;" onclick="closeMovieModal(); openPlanesModal();">🎫 Ver Planes Premium</button>' : ''}
                </div>
            `;
        }
        return;
    }

    if (!pelicula.videoUrl) {
        if (player) {
            player.innerHTML = `
                <div class="video-locked" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
                    <p>Contenido próximamente disponible.</p>
                </div>
            `;
        }
        return;
    }

    reproducirDesde(0);
}

function reproducirDesde(startTime) {
    const pelicula = peliculas.find(p => p.id == currentMovieId);
    const container = document.getElementById('video-player');
    if (!container) return;

    // Preferencia de calidad/ahorro de datos guardada en Ajustes.
    // Como cada película tiene una sola versión de video (no hay múltiples
    // resoluciones en el catálogo), esta preferencia ajusta cuánto
    // pre-carga el navegador para cuidar los datos móviles.
    const calidad = (typeof getVideoQuality === 'function') ? getVideoQuality() : 'media';
    const preload = calidad === 'baja' ? 'none' : (calidad === 'media' ? 'metadata' : 'auto');

    container.innerHTML = `
        <video id="main-video" controls autoplay preload="${preload}" src="${pelicula.videoUrl}" style="width:100%; height:100%; background:#000;">
            Tu navegador no soporta el elemento video.
        </video>
    `;

    const video = document.getElementById('main-video');
    if (video) {
        video.currentTime = startTime;
    }
}

function closeMovieModal() {
    const movieModal = document.getElementById('movie-modal');
    if (movieModal) {
        movieModal.classList.remove('active');
        movieModal.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
    currentMovieId = null;
    
    const player = document.getElementById('video-player');
    if (player) player.innerHTML = '';
}
