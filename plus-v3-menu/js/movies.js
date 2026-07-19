// js/movies.js — FC Movies+ v2 | Carga y renderizado de películas

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
            } else {
                const response = await fetch('movies.json');
                peliculas = await response.json();
            }
        } else {
            const response = await fetch('movies.json');
            peliculas = await response.json();
        }

        renderHomeSections();
        renderGenreSections();
        initBannerSlider();
        actualizarFiltrosGeneros();
        loadFromLocalStorage();

    } catch (error) {
        console.error('Error cargando películas:', error);
        showNotification('Error al cargar el catálogo', 'error');
    }
}

function normalizarPeliculaDB(row) {
    return {
        id:             row.id,
        titulo:         row.titulo,
        anio:           row.anio,
        calidad:        row.calidad,
        genero:         row.genero,
        precio:         row.precio,
        director:       row.director,
        rating:         row.rating,
        descripcion:    row.descripcion,
        portada:        row.portada,
        trailerUrl:     row.trailer_url,
        videoUrl:       row.video_url,
        categoria:      row.categoria,
        gratis:         row.gratis,
        precioOriginal: row.precio_original
    };
}

// ===== LOCALSTORAGE =====
function loadFromLocalStorage() {
    try {
        const savedCarrito  = localStorage.getItem('fc_carrito');
        const savedFavoritos = localStorage.getItem('fc_favoritos');
        const savedUser     = localStorage.getItem('fc_userData');
        const savedCompras  = localStorage.getItem('fc_compras');

        if (savedCarrito)   carrito    = JSON.parse(savedCarrito);
        if (savedFavoritos) favoritos  = JSON.parse(savedFavoritos);
        if (savedCompras)   compras    = JSON.parse(savedCompras);

        if (savedUser) {
            userData    = JSON.parse(savedUser);
            userLoggedIn = true;
            const btnLogin = document.getElementById('btn-login-navbar');
            if (btnLogin) btnLogin.textContent = `👤 ${userData.name || 'Mi Perfil'}`;
        }
    } catch (e) {
        console.error('Error cargando localStorage:', e);
    }
}

// ===== RENDERIZADO DE TARJETA v2 =====
function renderMovieCard(movie) {
    const isFavorite  = favoritos.some(f => f === movie.id || f.id === movie.id);
    const precioDisplay = movie.gratis
        ? '<span class="price-free">GRATIS</span>'
        : `<span class="price-tag">Gs. ${movie.precio?.toLocaleString() || '0'}</span>`;
    const anio = movie.anio || movie.año || '';
    const isEstreno = movie.categoria === 'estreno';
    // Generar srcset para soporte de imágenes responsivas
    const portadaSrc = movie.portada || '';

    return `
        <div class="movie-card" onclick="openMovieModal('${movie.id}')" role="article" tabindex="0"
             onkeydown="if(event.key==='Enter'||event.key===' '){openMovieModal('${movie.id}')}"
             aria-label="${movie.titulo}${anio ? ', ' + anio : ''}">
            <div class="movie-poster-container">
                <div class="movie-poster-skeleton" aria-hidden="true"></div>
                <img src="${portadaSrc}"
                     alt="Portada de ${movie.titulo}"
                     class="movie-poster"
                     loading="lazy"
                     decoding="async"
                     width="220" height="330"
                     onload="this.previousElementSibling.style.display='none'; this.classList.add('loaded')"
                     onerror="this.previousElementSibling.style.display='none'; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22300%22><rect fill=%22%231E2740%22 width=%22200%22 height=%22300%22/><text fill=%22%23BFC8DA%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22>Sin imagen</text></svg>'">

                <!-- Overlay con botón Ver ahora -->
                <div class="movie-overlay">
                    <div class="overlay-rating">⭐ ${movie.rating || '—'}</div>
                    <button class="btn-watch-now" onclick="event.stopPropagation(); openMovieModal('${movie.id}')">
                        Ver ahora
                    </button>
                </div>

                <!-- Badges -->
                ${isEstreno ? '<div class="badge-estreno">NUEVO</div>' : ''}
                <div class="quality-badge">${movie.calidad || 'HD'}</div>

                <!-- Favorito -->
                <button class="favorite-btn ${isFavorite ? 'active' : ''}"
                        onclick="event.stopPropagation(); toggleFavorite('${movie.id}')"
                        aria-label="${isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                    ${isFavorite ? '❤️' : '🤍'}
                </button>
            </div>

            <div class="movie-info">
                <h3 class="movie-title" title="${movie.titulo}">${movie.titulo}</h3>
                <div class="movie-metadata">
                    <span class="movie-year-genre">${anio}${anio && movie.genero ? ' · ' : ''}${movie.genero || ''}</span>
                    ${precioDisplay}
                </div>
            </div>
        </div>
    `;
}

// ===== RENDERIZADO DE SECCIONES =====
function renderHomeSections() {
    const container = document.getElementById('home-sections-container');
    if (!container || peliculas.length === 0) return;
    container.innerHTML = '';

    const tendencias = [...peliculas].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 12);
    const estrenos   = peliculas.filter(p => p.categoria === 'estreno');
    const miLista    = favoritos.map(id => peliculas.find(p => p.id == id)).filter(Boolean);
    const gratis     = peliculas.filter(p => p.gratis);

    let html = '';
    if (miLista.length > 0)  html += renderHomeCarousel('home-mi-lista',    '❤️ Mi Lista',          miLista);
    html += renderHomeCarousel('home-tendencias', '🔥 Tendencias Ahora', tendencias);
    if (estrenos.length > 0) html += renderHomeCarousel('home-estrenos',    '🎬 Nuevos Estrenos',   estrenos);
    if (gratis.length > 0)   html += renderHomeCarousel('home-gratis',      '🎁 Gratis Para Ti',    gratis);

    container.innerHTML = html;
}

function renderGenreSections() {
    const container = document.getElementById('genre-sections-container');
    if (!container || peliculas.length === 0) return;

    const generos = [...new Set(peliculas.map(m => m.genero))].filter(Boolean);

    container.innerHTML = generos.map(genero => {
        const peliculasGenero = peliculas.filter(p => p.genero === genero);
        return renderHomeCarousel(
            `genre-${genero.toLowerCase().replace(/\s+/g, '-')}`,
            `🎬 ${genero}`,
            peliculasGenero
        );
    }).join('');
}

function renderHomeCarousel(id, titulo, listaPeliculas) {
    if (!listaPeliculas || listaPeliculas.length === 0) return '';

    // Limpiar emoji del título para el data-genre
    const genreLabel = titulo.replace(/^[^\w\s]+\s/, '').trim();

    return `
        <section class="genre-section" id="${id}" data-genre="${genreLabel}">
            <div class="genre-header">
                <h2 class="genre-title">
                    <span class="genre-title-line"></span>
                    ${titulo}
                </h2>
                <span class="genre-count">${listaPeliculas.length} títulos</span>
            </div>
            <div class="carousel-wrapper">
                <button class="carousel-arrow prev" onclick="scrollCarousel(this, -1)" aria-label="Anterior">❮</button>
                <div class="movies-grid">
                    ${listaPeliculas.map(renderMovieCard).join('')}
                </div>
                <button class="carousel-arrow next" onclick="scrollCarousel(this, 1)" aria-label="Siguiente">❯</button>
            </div>
        </section>
    `;
}

function scrollCarousel(btn, direction) {
    const grid = btn.parentElement.querySelector('.movies-grid');
    const scrollAmount = grid.clientWidth * 0.75;
    grid.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function actualizarFiltrosGeneros() {
    const filterContainer = document.getElementById('filter-genres');
    if (!filterContainer) return;

    const generos = [...new Set(peliculas.map(m => m.genero))].filter(Boolean);
    let html = '<button class="btn-filter active" data-genre="todos" onclick="filterByGenre(event)">Todos</button>';
    generos.forEach(g => {
        html += `<button class="btn-filter" data-genre="${g}" onclick="filterByGenre(event)">${g}</button>`;
    });
    filterContainer.innerHTML = html;
}

// Inicializar
document.addEventListener('DOMContentLoaded', loadMovies);
