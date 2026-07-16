// js/ui.js - Funciones de interfaz de usuario y utilidades

// ===== NOTIFICACIONES =====
function showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3500);
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

// ===== SONIDO RELAJANTE DEL SPLASH (Web Audio API, sin archivos externos) =====
function tocarPadRelajante(ctx, tiempoInicio, duracion, freqBase) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filtro = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freqBase, tiempoInicio);
    osc1.frequency.exponentialRampToValueAtTime(freqBase * 1.005, tiempoInicio + duracion);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freqBase * 0.99, tiempoInicio);
    osc2.frequency.exponentialRampToValueAtTime(freqBase * 1.002, tiempoInicio + duracion);

    filtro.type = 'lowpass';
    filtro.frequency.setValueAtTime(freqBase * 2, tiempoInicio);
    filtro.frequency.exponentialRampToValueAtTime(freqBase * 1.5, tiempoInicio + duracion);

    gain.gain.setValueAtTime(0.001, tiempoInicio);
    gain.gain.exponentialRampToValueAtTime(0.05, tiempoInicio + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, tiempoInicio + duracion);

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
    if (fcSonidoActivo) return;
    fcSonidoActivo = true;

    if (!fcAudioCtx) {
        fcAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const now = fcAudioCtx.currentTime;
    tocarPadRelajante(fcAudioCtx, now, 3, 110); // A2
    tocarPadRelajante(fcAudioCtx, now + 0.5, 3, 164.81); // E3
    tocarPadRelajante(fcAudioCtx, now + 1, 3, 220); // A3
}

document.getElementById('splash-sound-btn')?.addEventListener('click', iniciarSonidoIntro);
