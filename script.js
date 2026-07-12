// ===== CONFIGURACIÓN GLOBAL =====
let peliculas = [];
let carrito = [];
let favoritos = [];
let compras = [];
let suscripcionActiva = false;
let suscripcionVencimiento = null;
let suscripcionPlan = null;
let transferContext = { type: 'carrito' };
let comprobanteFile = null;

function suscripcionVigente() {
    if (!suscripcionVencimiento) return false;
    const vigente = suscripcionVencimiento > new Date();
    if (!vigente && suscripcionActiva) {
        // Acaba de vencer mientras navegaba
        suscripcionActiva = false;
        showNotification('Tu plan venció. Podés renovarlo cuando quieras 🎫', 'warning');
    }
    return vigente;
}
let currentMovieId = null;
let currentSlide = 0;
let userLoggedIn = false;
let userData = null;
let filtroActual = 'todos';

// ===== CONFIGURACIÓN DE SEGURIDAD =====
// Las API Keys NO deben estar en el cliente. Esto es solo para demostración.
// En producción, estas deberían estar en un servidor backend.
const API_CONFIG = {
    // Las credenciales reales deben estar en variables de entorno del servidor
    apiKey: 'USAR_VARIABLES_DE_ENTORNO',
    secretKey: 'USAR_VARIABLES_DE_ENTORNO',
    smartFieldsKey: 'USAR_VARIABLES_DE_ENTORNO'
};

// ===== CARGAR PELÍCULAS DESDE JSON =====
async function loadMovies() {
    try {
        const response = await fetch('movies.json');
        if (!response.ok) throw new Error('Error al cargar películas');
        peliculas = await response.json();
        console.log(`✅ ${peliculas.length} películas cargadas exitosamente`);
    } catch (error) {
        console.error('Error cargando películas:', error);
        showNotification('Error al cargar el catálogo', 'error');
    }
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

// ===== BANNER DINÁMICO =====
function initBannerSlider() {
    const slider = document.getElementById('banner-slider');
    const topMovies = peliculas.slice(0, 5);

    slider.innerHTML = topMovies.map((movie, index) => `
        <div class="slide ${index === 0 ? 'active' : ''}">
            <div class="slide-bg" style="background-image: url('${movie.portada}')"></div>
            <div class="slide-overlay"></div>
            <div class="slide-content">
                <span class="slide-badge">🌟 DESTACADO</span>
                <h1 class="slide-title">${movie.titulo}</h1>
                <p class="slide-description">${movie.descripcion}</p>
                <div class="slide-meta">
                    <div class="slide-meta-item">📅 ${movie.año}</div>
                    <div class="slide-meta-item">🎬 ${movie.genero}</div>
                    <div class="slide-meta-item">⭐ ${movie.rating}/10</div>
                    <div class="slide-meta-item">📺 ${movie.calidad}</div>
                </div>
                <div class="slide-price">Gs. ${movie.precio.toLocaleString()}</div>
                <button class="btn" onclick="openMovieModal(${movie.id})">▶ Ver Trailer</button>
                <button class="btn btn-secondary" onclick="addToCart(${movie.id})">🛒 Alquilar</button>
            </div>
        </div>
    `).join('');

    const controls = document.createElement('div');
    controls.className = 'slider-controls';
    controls.innerHTML = topMovies.map((_, index) => 
        `<div class="slider-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>`
    ).join('');
    slider.appendChild(controls);

    setInterval(nextSlide, 5000);
}

function nextSlide() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    slides[currentSlide].classList.remove('active');
    document.querySelectorAll('.slider-dot')[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
    document.querySelectorAll('.slider-dot')[currentSlide].classList.add('active');
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.slide');
    slides[currentSlide].classList.remove('active');
    document.querySelectorAll('.slider-dot')[currentSlide].classList.remove('active');
    currentSlide = index;
    slides[currentSlide].classList.add('active');
    document.querySelectorAll('.slider-dot')[currentSlide].classList.add('active');
}

// ===== FILTROS POR GÉNERO =====
function filterByGenre(event) {
    filtroActual = event.target.dataset.genre;
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    document.querySelectorAll('.genre-section').forEach(section => {
        if (filtroActual === 'todos') {
            section.classList.remove('hidden');
        } else {
            const sectionGenre = section.querySelector('.genre-title').textContent.replace('🎬 ', '').trim();
            if (sectionGenre.includes(filtroActual)) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        }
    });
}

// ===== CARRITO =====
function addToCart(movieId) {
    const pelicula = peliculas.find(p => p.id === movieId);
    if (!pelicula) return;

    if (pelicula.gratis) {
        if (!compras.includes(movieId)) compras.push(movieId);
        saveToLocalStorage();
        showNotification(`🎁 ${pelicula.titulo} desbloqueada gratis`, 'success');
        return;
    }

    carrito.push({...pelicula, cartId: Date.now()});
    updateCart();
    saveToLocalStorage();
    showNotification(`${pelicula.titulo} agregada al carrito`, 'success');
}

function removeFromCart(cartId) {
    carrito = carrito.filter(item => item.cartId !== cartId);
    updateCart();
    saveToLocalStorage();
}

function updateCart() {
    const count = carrito.length;
    document.getElementById('cart-count').textContent = count;
    renderCartItems();
}

function renderCartItems() {
    const cartList = document.getElementById('cart-items-list');
    const total = carrito.reduce((sum, item) => sum + item.precio, 0);
    
    if (carrito.length === 0) {
        cartList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px 20px;">Tu carrito está vacío</p>';
        document.getElementById('cart-total').textContent = 'Gs. 0';
        return;
    }

    cartList.innerHTML = carrito.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.titulo}</div>
                <div class="cart-item-price">Gs. ${item.precio.toLocaleString()}</div>
            </div>
            <button class="btn-remove" onclick="removeFromCart(${item.cartId})">×</button>
        </div>
    `).join('');

    document.getElementById('cart-total').textContent = `Gs. ${total.toLocaleString()}`;
}

function openCart() {
    document.getElementById('cart-sidebar').classList.add('active');
}

function closeCart() {
    document.getElementById('cart-sidebar').classList.remove('active');
}

document.getElementById('cart-toggle').addEventListener('click', openCart);

// ===== FAVORITOS =====
function toggleFavorite(movieId) {
    const index = favoritos.indexOf(movieId);
    if (index > -1) {
        favoritos.splice(index, 1);
    } else {
        favoritos.push(movieId);
    }
    updateFavoritesCount();
    updateMovieCards();
    saveToLocalStorage();
}

function updateFavoritesCount() {
    document.getElementById('favorites-count').textContent = favoritos.length;
}

function updateMovieCards() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const movieId = parseInt(btn.dataset.movieId);
        if (favoritos.includes(movieId)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

document.getElementById('favorites-toggle').addEventListener('click', () => {
    showNotification(`Tienes ${favoritos.length} película(s) en favoritos`, 'info');
});

// ===== BÚSQUEDA PREDICTIVA =====
document.getElementById('search-input').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const suggestions = document.getElementById('search-suggestions');

    if (query.length === 0) {
        suggestions.classList.remove('active');
        return;
    }

    const results = peliculas.filter(p => 
        p.titulo.toLowerCase().includes(query) ||
        p.director.toLowerCase().includes(query) ||
        p.genero.toLowerCase().includes(query)
    ).slice(0, 5);

    if (results.length === 0) {
        suggestions.classList.remove('active');
        return;
    }

    suggestions.innerHTML = results.map(movie => `
        <div class="suggestion-item" onclick="openMovieModal(${movie.id})">
            <img src="${movie.portada}" alt="${movie.titulo}" loading="lazy">
            <div style="flex: 1;">
                <div style="font-weight: 700; color: var(--text-main);">${movie.titulo}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${movie.genero} • ${movie.año}</div>
            </div>
        </div>
    `).join('');

    suggestions.classList.add('active');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
        document.getElementById('search-suggestions').classList.remove('active');
    }
});

// ===== MODAL DE PELÍCULA =====
function generarEstrellas(rating) {
    const estrellas = Math.round(rating / 2);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= estrellas ? '★' : '☆';
    }
    return `<span class="modal-stars">${html}</span><span class="modal-score">${rating}/10</span>`;
}

function openMovieModal(movieId) {
    const pelicula = peliculas.find(p => p.id === movieId);
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
    const incluidaPorPlan = pelicula.gratis || (pelicula.categoria !== 'estreno' && suscripcionVigente());
    const yaComprada = compras.includes(movieId) || incluidaPorPlan;
    tabCompleta.textContent = yaComprada ? '▶ Película Completa' : '🔒 Película Completa';

    const btnAgregar = document.getElementById('btn-agregar-modal');
    btnAgregar.style.display = yaComprada ? 'none' : 'inline-flex';

    mostrarTrailer();
    document.getElementById('movie-modal').classList.add('active');
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
    const pelicula = peliculas.find(p => p.id === currentMovieId);
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
    const pelicula = peliculas.find(p => p.id === currentMovieId);
    if (!pelicula) return;

    document.getElementById('tab-trailer').classList.add('active');
    document.getElementById('tab-completa').classList.remove('active');

    document.getElementById('video-player').innerHTML = `
        <iframe src="${pelicula.trailerUrl}" allowfullscreen allow="autoplay"></iframe>
    `;
}

function intentarVerPelicula() {
    const pelicula = peliculas.find(p => p.id === currentMovieId);
    if (!pelicula) return;

    document.getElementById('tab-completa').classList.add('active');
    document.getElementById('tab-trailer').classList.remove('active');

    const incluidaPorPlan = pelicula.gratis || (pelicula.categoria !== 'estreno' && suscripcionVigente());
    const yaComprada = compras.includes(currentMovieId) || incluidaPorPlan;

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

    document.getElementById('video-player').innerHTML = `
        <video controls autoplay src="${pelicula.videoUrl}"></video>
    `;
}

function closeMovieModal() {
    document.getElementById('movie-modal').classList.remove('active');
    currentMovieId = null;
}

function addToCartFromModal() {
    if (currentMovieId) {
        addToCart(currentMovieId);
        closeMovieModal();
    }
}

// ===== SECCIONES DESTACADAS DEL HOME =====
function trackContinuarViendo(movieId) {
    try {
        let historial = JSON.parse(localStorage.getItem('fc_continuar_viendo') || '[]');
        historial = historial.filter(id => id !== movieId);
        historial.unshift(movieId);
        historial = historial.slice(0, 10);
        localStorage.setItem('fc_continuar_viendo', JSON.stringify(historial));
    } catch (e) {
        console.error('Error guardando historial de vistos:', e);
    }
}

function getContinuarViendo() {
    try {
        const historial = JSON.parse(localStorage.getItem('fc_continuar_viendo') || '[]');
        return historial
            .map(id => peliculas.find(p => p.id === id))
            .filter(Boolean);
    } catch (e) {
        return [];
    }
}

function renderMovieCard(pelicula) {
    return `
        <article class="movie-card">
            <div class="movie-poster-container" onclick="openMovieModal(${pelicula.id})">
                ${pelicula.categoria === 'estreno' ? '<span class="badge-estreno">🔥 ESTRENO</span>' : ''}
                ${pelicula.gratis ? '<span class="badge-oferta">🎁 GRATIS</span>' : (pelicula.precioOriginal ? '<span class="badge-oferta">💸 OFERTA</span>' : '')}
                <img src="${pelicula.portada}" alt="Póster de ${pelicula.titulo}" class="movie-poster" loading="lazy">
                <span class="quality-badge">${pelicula.calidad}</span>
                <button class="favorite-btn" data-movie-id="${pelicula.id}" onclick="event.stopPropagation(); toggleFavorite(${pelicula.id})">❤️</button>
                <div class="play-button">▶</div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${pelicula.titulo}</h3>
                <div class="movie-metadata">
                    <span>${pelicula.año}</span>
                </div>
                <div class="price">
                    ${pelicula.gratis
                        ? 'GRATIS'
                        : pelicula.precioOriginal
                            ? `<span class="precio-original">Gs. ${pelicula.precioOriginal.toLocaleString()}</span><span class="precio-oferta">Gs. ${pelicula.precio.toLocaleString()}</span>`
                            : `Gs. ${pelicula.precio.toLocaleString()}`}
                </div>
                <button class="btn-add-cart" onclick="addToCart(${pelicula.id})">🛒 Agregar</button>
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
    const generosPreferidos = new Set();
    [...favoritos, ...compras].forEach(id => {
        const pelicula = peliculas.find(p => p.id === id);
        if (pelicula?.genero) generosPreferidos.add(pelicula.genero);
    });

    const yaVistas = new Set([...favoritos, ...compras]);

    let candidatas;
    if (generosPreferidos.size > 0) {
        candidatas = peliculas.filter(p => generosPreferidos.has(p.genero) && !yaVistas.has(p.id));
    } else {
        candidatas = peliculas.filter(p => !yaVistas.has(p.id));
    }

    return candidatas
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 8);
}

function renderHomeSections() {
    const container = document.getElementById('home-sections-container');
    if (!container || peliculas.length === 0) return;

    const continuarViendo = userLoggedIn ? getContinuarViendo() : [];

    const estrenos = peliculas.filter(p => p.categoria === 'estreno');

    const tendencias = peliculas.filter(p => p.gratis || p.precioOriginal);

    const recienAgregadas = [...peliculas].sort((a, b) => b.id - a.id).slice(0, 8);

    const masValoradas = [...peliculas]
        .filter(p => typeof p.rating === 'number')
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 8);

    const recomendadas = getRecomendadas();

    container.innerHTML = [
        renderHomeCarousel('home-continuar-viendo', '❤️ Continuar viendo', continuarViendo),
        renderHomeCarousel('home-tendencias', '🔥 Tendencias', tendencias),
        renderHomeCarousel('home-mas-valoradas', '⭐ Más vistas', masValoradas),
        renderHomeCarousel('home-recien-agregadas', '🆕 Recién agregadas', recienAgregadas),
        renderHomeCarousel('home-estrenos', '🎬 Estrenos', estrenos),
        renderHomeCarousel('home-recomendadas', '🏆 Recomendadas para vos', recomendadas)
    ].join('');

    updateMovieCards();
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
                        ${peliculasGenero.map(pelicula => `
                            <article class="movie-card">
                                <div class="movie-poster-container" onclick="openMovieModal(${pelicula.id})">
                                    ${pelicula.categoria === 'estreno' ? '<span class="badge-estreno">🔥 ESTRENO</span>' : ''}
                                    ${pelicula.gratis ? '<span class="badge-oferta">🎁 GRATIS</span>' : (pelicula.precioOriginal ? '<span class="badge-oferta">💸 OFERTA</span>' : '')}
                                    <img src="${pelicula.portada}" alt="Póster de ${pelicula.titulo}" class="movie-poster" loading="lazy">
                                    <span class="quality-badge">${pelicula.calidad}</span>
                                    <button class="favorite-btn" data-movie-id="${pelicula.id}" onclick="event.stopPropagation(); toggleFavorite(${pelicula.id})">❤️</button>
                                    <div class="play-button">▶</div>
                                </div>
                                <div class="movie-info">
                                    <h3 class="movie-title">${pelicula.titulo}</h3>
                                    <div class="movie-metadata">
                                        <span>${pelicula.año}</span>
                                    </div>
                                    <div class="price">
                                        ${pelicula.gratis
                                            ? 'GRATIS'
                                            : pelicula.precioOriginal
                                                ? `<span class="precio-original">Gs. ${pelicula.precioOriginal.toLocaleString()}</span><span class="precio-oferta">Gs. ${pelicula.precio.toLocaleString()}</span>`
                                                : `Gs. ${pelicula.precio.toLocaleString()}`}
                                    </div>
                                    <button class="btn-add-cart" onclick="addToCart(${pelicula.id})">🛒 Agregar</button>
                                </div>
                            </article>
                        `).join('')}
                    </div>
                    <button class="carousel-arrow next" onclick="scrollCarousel(this, 1)" aria-label="Siguiente">›</button>
                </div>
            </section>
        `;
    }).join('');

    updateMovieCards();
}

function scrollCarousel(btn, direction) {
    const track = btn.closest('.carousel-wrapper').querySelector('.movies-grid');
    const card = track.querySelector('.movie-card');
    const cardWidth = card ? card.offsetWidth : 200;
    track.scrollBy({ left: direction * (cardWidth + 20) * 3, behavior: 'smooth' });
}

// ===== PROCESAMIENTO DE PAGOS =====
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

// ===== SUPABASE AUTH =====
// Pegá acá la URL y la anon key de tu proyecto (Supabase → Settings → API)
const SUPABASE_URL = 'https://klcvvlkxtkmeajkaztfr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsY3Z2bGt4dGttZWFqa2F6dGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1Mzg0MjUsImV4cCI6MjA5OTExNDQyNX0.PbrZVc3KqUUFSRtnp5_TVeaqaNxaXJcA9a49MDB4CQQ';

const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

if (!supabaseClient) {
    console.error('Supabase no se cargó. Revisá tu conexión a internet o el script del CDN en index.html.');
}

let modoRegistro = false;

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
    showNotification(`¡Bienvenido ${userData.name}!`, 'success');
    saveToLocalStorage();
    cargarSuscripcion();
    cargarCompras();
}

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

async function cerrarSesion() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    userLoggedIn = false;
    userData = null;
    document.getElementById('btn-login-navbar').textContent = '👤 Iniciar';
    showNotification('Sesión cerrada', 'success');
    saveToLocalStorage();
}

// Restaurar sesión al cargar la página + escuchar cambios (incluye vuelta de Google)
if (supabaseClient) {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            aplicarSesion(session);
        } else if (userLoggedIn) {
            // Había datos viejos del login de mentira en localStorage; los limpiamos
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

// ===== NOTIFICACIONES =====
function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3500);
}

// ===== CERRAR MODALES AL HACER CLICK FUERA =====
document.addEventListener('DOMContentLoaded', () => {
    const movieModal = document.getElementById('movie-modal');
    const loginModal = document.getElementById('login-modal');
    const cart = document.getElementById('cart-sidebar');
    const cartToggle = document.getElementById('cart-toggle');

    movieModal.addEventListener('click', (e) => {
        if (e.target.id === 'movie-modal') closeMovieModal();
    });

    loginModal.addEventListener('click', (e) => {
        if (e.target.id === 'login-modal') closeLoginModal();
    });

    const transferModal = document.getElementById('transfer-modal');
    transferModal.addEventListener('click', (e) => {
        if (e.target.id === 'transfer-modal') closeTransferModal();
    });

    const planesModal = document.getElementById('planes-modal');
    planesModal.addEventListener('click', (e) => {
        if (e.target.id === 'planes-modal') closePlanesModal();
    });

    document.getElementById('input-comprobante').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        comprobanteFile = file;
        const label = document.getElementById('comprobante-label');
        const preview = document.getElementById('comprobante-preview');

        label.textContent = `✅ ${file.name}`;
        label.classList.add('cargado');
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
        if (!cart.contains(e.target) && !cartToggle.contains(e.target) && cart.classList.contains('active')) {
            closeCart();
        }
    });
});

// ===== INICIALIZAR APLICACIÓN =====
async function initApp() {
    // Bloquear scroll durante splash
    document.body.style.overflow = 'hidden';

    await loadMovies();
    loadFromLocalStorage();
    initBannerSlider();
    renderHomeSections();
    renderGenreSections();
    mostrarAvisoOfertas();
    renderCartItems();

    // Crear botones de filtro dinámicamente
    const generos = ['Acción', 'Ciencia Ficción', 'Drama', 'Thriller', 'Animación'];
    const filterContainer = document.getElementById('filter-genres');
    generos.forEach(genero => {
        const btn = document.createElement('button');
        btn.className = 'btn-filter';
        btn.dataset.genre = genero;
        btn.textContent = genero;
        btn.onclick = filterByGenre;
        filterContainer.appendChild(btn);
    });

    // Ocultar Splash Screen
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }, 3400);
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', initApp);

// ===== SONIDO RELAJANTE DEL SPLASH (Web Audio API, sin archivos externos) =====
// Los navegadores bloquean el autoplay de audio, por eso se activa con un botón.
let fcAudioCtx = null;
let fcSonidoActivo = false;

function tocarPadRelajante(ctx, tiempoInicio, duracion, freqBase) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filtro = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freqBase, tiempoInicio);
    osc2.frequency.setValueAtTime(freqBase * 1.5, tiempoInicio); // quinta justa, suena consonante

    filtro.type = 'lowpass';
    filtro.frequency.setValueAtTime(1200, tiempoInicio);

    gain.gain.setValueAtTime(0, tiempoInicio);
    gain.gain.linearRampToValueAtTime(0.12, tiempoInicio + duracion * 0.35);
    gain.gain.linearRampToValueAtTime(0, tiempoInicio + duracion);

    osc1.connect(filtro);
    osc2.connect(filtro);
    filtro.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(tiempoInicio);
    osc2.start(tiempoInicio);
    osc1.stop(tiempoInicio + duracion);
    osc2.stop(tiempoInicio + duracion);
}

function iniciarSonidoIntro() {
    if (!fcAudioCtx) {
        fcAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (fcAudioCtx.state === 'suspended') {
        fcAudioCtx.resume();
    }
    const ahora = fcAudioCtx.currentTime;
    // Acorde suave escalonado, sensación de calma tipo "respiración"
    tocarPadRelajante(fcAudioCtx, ahora, 3.2, 196);          // Sol
    tocarPadRelajante(fcAudioCtx, ahora + 0.4, 3.0, 246.94); // Si
    tocarPadRelajante(fcAudioCtx, ahora + 0.9, 2.8, 293.66); // Re
}

document.addEventListener('DOMContentLoaded', () => {
    const splashSoundBtn = document.getElementById('splash-sound-btn');
    if (!splashSoundBtn) return;

    splashSoundBtn.addEventListener('click', () => {
        fcSonidoActivo = !fcSonidoActivo;
        splashSoundBtn.classList.toggle('on', fcSonidoActivo);
        splashSoundBtn.textContent = fcSonidoActivo ? '🔊 Sonido' : '🔈 Sonido';
        if (fcSonidoActivo) {
            iniciarSonidoIntro();
        } else if (fcAudioCtx) {
            fcAudioCtx.suspend();
        }
    });
});
