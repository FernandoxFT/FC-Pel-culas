// js/movies.js - Funciones de carga y renderizado de películas

// ===== CARGAR PELÍCULAS (Supabase primero, JSON como respaldo) =====
async function loadMovies() {
    try {
        if (supabaseClient) {
            const { data, error } = await supabaseClient
                .from('peliculas')
                .select('*')
                .order('id', { ascending: true });

            if (!error && data && data.length > 0) {
                peliculas = data.map(normalizarPeliculaDB);
                console.log(`✅ ${peliculas.length} películas cargadas desde Supabase`);
                return;
            }
        }
        // Respaldo: archivo local (primera carga antes de migrar, o si Supabase falla)
        const response = await fetch('movies.json');
        if (!response.ok) throw new Error('Error al cargar películas');
        peliculas = await response.json();
        console.log(`✅ ${peliculas.length} películas cargadas desde movies.json (respaldo)`);
    } catch (error) {
        console.error('Error cargando películas:', error);
        showNotification('Error al cargar el catálogo', 'error');
    }
}

// Convierte una fila de la tabla `peliculas` (snake_case) al formato que usa el sitio
function normalizarPeliculaDB(row) {
    return {
        id: row.id,
        titulo: row.titulo,
        año: row.anio,
        calidad: row.calidad,
        genero: row.genero,
        precio: row.precio,
        director: row.director,
        rating: row.rating,
        descripcion: row.descripcion,
        portada: row.portada,
        trailerUrl: row.trailer_url,
        videoUrl: row.video_url,
        categoria: row.categoria,
        gratis: row.gratis,
        precioOriginal: row.precio_original
    };
}

// Convierte el formato del sitio a las columnas snake_case de la tabla `peliculas`
function desnormalizarPelicula(p) {
    return {
        titulo: p.titulo,
        anio: p.año,
        calidad: p.calidad,
        genero: p.genero,
        precio: p.precio,
        director: p.director,
        rating: p.rating,
        descripcion: p.descripcion,
        portada: p.portada,
        trailer_url: p.trailerUrl,
        video_url: p.videoUrl,
        categoria: p.categoria,
        gratis: p.gratis,
        precio_original: p.precioOriginal
    };
}

// ===== LOCALSTORAGE =====
function loadFromLocalStorage() {
    try {
        const savedCarrito = localStorage.getItem('fc_carrito');
        const savedFavoritos = localStorage.getItem('fc_favoritos');
        const savedUser = localStorage.getItem('fc_userData');
        const savedCompras = localStorage.getItem('fc_compras');

        if (savedCarrito) carrito = JSON.parse(savedCarrito);
        if (savedFavoritos) favoritos = JSON.parse(savedFavoritos);
        if (savedCompras) compras = JSON.parse(savedCompras);
        if (savedUser) {
            userData = JSON.parse(savedUser);
            userLoggedIn = true;
            document.getElementById('btn-login-navbar').textContent = `👤 ${userData.name}`;
        }
    } catch (e) {
        console.error('Error cargando localStorage:', e);
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('fc_carrito', JSON.stringify(carrito));
        localStorage.setItem('fc_favoritos', JSON.stringify(favoritos));
        localStorage.setItem('fc_compras', JSON.stringify(compras));
        if (userData) localStorage.setItem('fc_userData', JSON.stringify(userData));
    } catch (e) {
        console.error('Error guardando localStorage:', e);
    }
}

// ===== PROGRESO DE REPRODUCCIÓN (NUEVO) =====
function saveVideoProgress(movieId, currentTime, duration) {
    const progress = JSON.parse(localStorage.getItem('fc_video_progress') || '{}');
    progress[movieId] = {
        currentTime,
        duration,
        percent: (currentTime / duration) * 100,
        lastSeen: Date.now()
    };
    localStorage.setItem('fc_video_progress', JSON.stringify(progress));
}

function getVideoProgress(movieId) {
    const progress = JSON.parse(localStorage.getItem('fc_video_progress') || '{}');
    return progress[movieId] || null;
}

function getContinuarViendo() {
    try {
        const progress = JSON.parse(localStorage.getItem('fc_video_progress') || '{}');
        return Object.keys(progress)
            .map(id => ({ ...peliculas.find(p => p.id == id), progress: progress[id] }))
            .filter(p => p.id && p.progress.percent < 95) // No mostrar si ya terminó (95%)
            .sort((a, b) => b.progress.lastSeen - a.progress.lastSeen)
            .slice(0, 10);
    } catch (e) {
        return [];
    }
}

// ===== SECCIONES TIPO NETFLIX =====
function renderMovieCard(pelicula) {
    const progress = pelicula.progress || getVideoProgress(pelicula.id);
    const hasProgress = progress && progress.percent > 0;
    const isProximamente = !pelicula.videoUrl && pelicula.categoria !== 'estreno';

    return `
        <article class="movie-card ${isProximamente ? 'proximamente' : ''}">
            <div class="movie-poster-container" onclick="openMovieModal(${pelicula.id})">
                ${pelicula.categoria === 'estreno' ? '<span class="badge-estreno">🔥 ESTRENO</span>' : ''}
                ${pelicula.gratis ? '<span class="badge-oferta">🎁 GRATIS</span>' : (pelicula.precioOriginal ? '<span class="badge-oferta">💸 OFERTA</span>' : '')}
                ${isProximamente ? '<span class="badge-soon">🕒 PRÓXIMAMENTE</span>' : ''}
                <img src="${pelicula.portada}" alt="Póster de ${pelicula.titulo}" class="movie-poster" loading="lazy">
                <span class="quality-badge">${pelicula.calidad}</span>
                <button class="favorite-btn ${favoritos.includes(pelicula.id) ? 'active' : ''}" data-movie-id="${pelicula.id}" onclick="event.stopPropagation(); toggleFavorite(${pelicula.id})">❤️</button>
                <div class="play-button">${isProximamente ? '🕒' : '▶'}</div>
                ${hasProgress ? `
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progress.percent}%"></div>
                    </div>
                ` : ''}
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${pelicula.titulo}</h3>
                <div class="movie-metadata">
                    <span>${pelicula.año}</span>
                </div>
                <div class="price">
                    ${isProximamente ? 'Disponible pronto' : (
                        pelicula.gratis
                            ? 'GRATIS'
                            : pelicula.precioOriginal
                                ? `<span class="precio-original">Gs. ${pelicula.precioOriginal.toLocaleString()}</span><span class="precio-oferta">Gs. ${pelicula.precio.toLocaleString()}</span>`
                                : `Gs. ${pelicula.precio.toLocaleString()}`
                    )}
                </div>
                ${!isProximamente ? `<button class="btn-add-cart" onclick="addToCart(${pelicula.id})">🛒 Agregar</button>` : ''}
            </div>
        </article>
    `;
}

function renderHomeCarousel(id, titulo, listaPeliculas) {
    if (!listaPeliculas || listaPeliculas.length === 0) return '';
    return `
        <section class="genre-section home-highlight-section" id="${id}">
            <div class="genre-header">
                <h2 class="genre-title">${titulo}</h2>
                <span class="genre-count">${listaPeliculas.length}</span>
            </div>
            <div class="carousel-wrapper">
                <button class="carousel-arrow prev" onclick="scrollCarousel(this, -1)" aria-label="Anterior">‹</button>
                <div class="movies-grid">
                    ${listaPeliculas.map(renderMovieCard).join('')}
                </div>
                <button class="carousel-arrow next" onclick="scrollCarousel(this, 1)" aria-label="Siguiente">›</button>
            </div>
        </section>
    `;
}

function getRecomendadas() {
    const generosPreferidos = {};
    [...favoritos, ...compras.map(c => c.pelicula_id)].forEach(id => {
        const pelicula = peliculas.find(p => p.id == id);
        if (pelicula?.genero) {
            generosPreferidos[pelicula.genero] = (generosPreferidos[pelicula.genero] || 0) + 1;
        }
    });

    const topGenero = Object.entries(generosPreferidos).sort((a, b) => b[1] - a[1])[0]?.[0];
    const yaVistas = new Set([...favoritos, ...compras.map(c => c.pelicula_id)]);

    let candidatas = peliculas.filter(p => !yaVistas.has(p.id));
    if (topGenero) {
        candidatas = candidatas.sort((a, b) => {
            if (a.genero === topGenero && b.genero !== topGenero) return -1;
            if (a.genero !== topGenero && b.genero === topGenero) return 1;
            return (b.rating || 0) - (a.rating || 0);
        });
    } else {
        candidatas = candidatas.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return candidatas.slice(0, 10);
}

function renderHomeSections() {
    const container = document.getElementById('home-sections-container');
    if (!container || peliculas.length === 0) return;

    const continuarViendo = getContinuarViendo();
    const tendencias = [...peliculas].sort((a, b) => (b.vistas || 0) - (a.vistas || 0)).slice(0, 10);
    const recomendadas = getRecomendadas();
    const masVistasHoy = [...peliculas].sort(() => Math.random() - 0.5).slice(0, 5); // Simulado
    const estrenos = peliculas.filter(p => p.categoria === 'estreno');
    const proximamente = peliculas.filter(p => !p.videoUrl && p.categoria !== 'estreno');
    const miLista = favoritos.map(id => peliculas.find(p => p.id == id)).filter(Boolean);

    container.innerHTML = [
        renderHomeCarousel('home-continuar-viendo', '🍿 Continuar viendo', continuarViendo),
        renderHomeCarousel('home-tendencias', '🔥 Tendencias', tendencias),
        renderHomeCarousel('home-recomendadas', '✨ Recomendado para ti', recomendadas),
        renderHomeCarousel('home-mas-vistas-hoy', '📈 Más vistos hoy', masVistasHoy),
        renderHomeCarousel('home-estrenos', '🎬 Nuevos estrenos', estrenos),
        renderHomeCarousel('home-proximamente', '📅 Próximamente', proximamente),
        renderHomeCarousel('home-mi-lista', '❤️ Mi lista', miLista)
    ].join('');

    if (typeof updateMovieCards === 'function') updateMovieCards();
}

// ===== RENDERIZAR PELÍCULAS POR GÉNERO =====
function renderGenreSections() {
    const generos = ['Acción', 'Ciencia Ficción', 'Drama', 'Thriller', 'Animación'];
    const container = document.getElementById('genre-sections-container');
    
    container.innerHTML = generos.map(genero => {
        const peliculasGenero = peliculas.filter(p => p.genero === genero);
        if (peliculasGenero.length === 0) return '';
        
        return `
            <section class="genre-section">
                <div class="genre-header">
                    <h2 class="genre-title">🎬 ${genero}</h2>
                    <span class="genre-count">${peliculasGenero.length}</span>
                </div>
                <div class="carousel-wrapper">
                    <button class="carousel-arrow prev" onclick="scrollCarousel(this, -1)" aria-label="Anterior">‹</button>
                    <div class="movies-grid">
                        ${peliculasGenero.map(renderMovieCard).join('')}
                    </div>
                    <button class="carousel-arrow next" onclick="scrollCarousel(this, 1)" aria-label="Siguiente">›</button>
                </div>
            </section>
        `;
    }).join('');

    if (typeof updateMovieCards === 'function') updateMovieCards();
}

function scrollCarousel(btn, direction) {
    const track = btn.closest('.carousel-wrapper').querySelector('.movies-grid');
    const card = track.querySelector('.movie-card');
    const cardWidth = card ? card.offsetWidth : 200;
    track.scrollBy({ left: direction * (cardWidth + 20) * 3, behavior: 'smooth' });
}
