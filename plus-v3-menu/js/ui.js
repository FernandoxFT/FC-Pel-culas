// js/ui.js — FC Movies+ v2 | UI Optimizada

/* ─────────────────────────────────────────────
   NAVBAR SCROLL EFFECT
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initScrollNavbar();
    initScrollReveal();
    initRippleEffect();
});

function initScrollNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                navbar.classList.toggle('scrolled', window.scrollY > 60);
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

/* ─────────────────────────────────────────────
   SCROLL REVEAL — 60 FPS con IntersectionObserver
───────────────────────────────────────────── */
function initScrollReveal() {
    const options = {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, options);

    // Observar secciones de género al renderizarse
    function observeNewSections() {
        document.querySelectorAll('.genre-section:not(.observed)').forEach((el, i) => {
            el.classList.add('reveal', 'observed');
            el.style.transitionDelay = `${Math.min(i * 0.06, 0.3)}s`;
            observer.observe(el);
        });
    }

    // Observar elementos estáticos
    document.querySelectorAll('.search-filter-container').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });

    // Observar dinámicamente cuando se rendericen secciones
    const mutationObs = new MutationObserver(observeNewSections);
    const container = document.getElementById('home-sections-container');
    const genreContainer = document.getElementById('genre-sections-container');

    if (container)      mutationObs.observe(container,      { childList: true });
    if (genreContainer) mutationObs.observe(genreContainer, { childList: true });
}

/* ─────────────────────────────────────────────
   RIPPLE EFFECT EN BOTONES
───────────────────────────────────────────── */
function initRippleEffect() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn, .btn-checkout, .btn-filter, .btn-login, .btn-plan');
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top  - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple-wave';
        ripple.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
        `;

        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.appendChild(ripple);

        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });
}

/* ─────────────────────────────────────────────
   NOTIFICACIONES TOAST
───────────────────────────────────────────── */
function showNotification(message, type = 'success') {
    const icons = {
        success: '✓',
        error:   '✕',
        warning: '⚠',
        info:    'ℹ'
    };

    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.setAttribute('role', 'alert');
    notif.setAttribute('aria-live', 'assertive');
    notif.innerHTML = `<span style="font-size:1.1rem;font-weight:900;" aria-hidden="true">${icons[type] || '•'}</span><span>${message}</span>`;
    document.body.appendChild(notif);

    // Apilado vertical si hay múltiples
    const existing = document.querySelectorAll('.notification');
    const offset = (existing.length - 1) * 68;
    notif.style.top = `${90 + offset}px`;

    setTimeout(() => {
        notif.classList.add('hide');
        setTimeout(() => notif.remove(), 400);
    }, 3200);
}

/* ─────────────────────────────────────────────
   HERO BANNER DINÁMICO v3 — OPTIMIZADO
   • Transiciones GPU (opacity + transform)
   • Soporte táctil completo (swipe)
   • Pausa cuando la pestaña no está activa (Page Visibility API)
   • Pausa al hacer hover (desktop)
   • Precarga de imágenes de los siguientes slides
   • Reproducción automática inteligente
   • Indicadores modernos con progreso
───────────────────────────────────────────── */
let currentSlide    = 0;
let sliderRAF       = null;
let sliderStartTime = null;
let sliderPaused    = false;
let sliderElapsed   = 0;
const SLIDE_DURATION = 7000; // ms

// Variables de estado del slider
let fcAudioCtx  = null;
let fcSonidoActivo = false;
let filtroActual = 'todos';

function initBannerSlider() {
    const bannerContainer = document.getElementById('banner-slider');
    if (!bannerContainer) return;

    const destacadas = peliculas
        .filter(m => m.estreno || (m.rating && m.rating >= 8.0))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);

    if (destacadas.length === 0) {
        bannerContainer.style.display = 'none';
        return;
    }

    // Precargar imágenes de todos los slides
    destacadas.forEach((movie, index) => {
        if (movie.portada) {
            const img = new Image();
            img.src = movie.portada;
            // Priorizar la primera imagen
            if (index === 0) img.fetchPriority = 'high';
        }
    });

    let bannerHTML = '';
    let dotsHTML = '<div class="slider-controls" role="tablist" aria-label="Navegación del carrusel">';

    destacadas.forEach((movie, index) => {
        const isActive = index === 0 ? 'active' : '';
        const precioText = movie.gratis ? 'GRATIS' : `Gs. ${movie.precio?.toLocaleString() || '0'}`;
        const anio = movie.anio || movie.año || '';
        const badgeText = movie.estreno
            ? '🔥 Estreno Exclusivo'
            : movie.gratis
                ? '🎁 Gratis'
                : '⭐ Destacada';

        bannerHTML += `
            <div class="slide ${isActive}" data-index="${index}"
                 role="tabpanel" aria-label="Slide ${index + 1}: ${movie.titulo}"
                 aria-hidden="${index !== 0}">
                <div class="slide-bg" style="background-image: url('${movie.portada}')"
                     aria-hidden="true"></div>
                <div class="slide-overlay" aria-hidden="true"></div>
                <div class="slide-content">
                    <div class="slide-badge" aria-hidden="true">${badgeText}</div>
                    <h2 class="slide-title">${movie.titulo}</h2>
                    <div class="slide-meta" aria-label="Información de la película">
                        ${anio ? `<span class="slide-meta-item">📅 ${anio}</span>` : ''}
                        ${movie.rating ? `<span class="slide-meta-item">⭐ ${movie.rating}</span>` : ''}
                        ${movie.genero ? `<span class="slide-meta-item">🎬 ${movie.genero}</span>` : ''}
                        <span class="slide-price">${precioText}</span>
                    </div>
                    ${movie.descripcion ? `<p class="slide-description">${movie.descripcion}</p>` : ''}
                    <div class="slide-actions">
                        <button class="btn" onclick="openMovieModal('${movie.id}')" type="button">
                            ▶ Ver Ahora
                        </button>
                        <button class="btn btn-secondary" onclick="toggleFavorite('${movie.id}')" type="button">
                            ♡ Mi Lista
                        </button>
                    </div>
                </div>
            </div>
        `;
        dotsHTML += `
            <button class="slider-dot ${isActive}"
                    onclick="goToSlide(${index})"
                    aria-label="Ir a slide ${index + 1}: ${movie.titulo}"
                    role="tab"
                    aria-selected="${index === 0}"
                    type="button">
            </button>`;
    });

    dotsHTML += '</div>';

    // Barra de progreso + botón pausa
    const controls = `
        <div class="slide-progress-wrap" aria-hidden="true">
            <div class="slide-progress" id="slide-progress"></div>
        </div>
        <button class="slider-pause-btn" id="slider-pause-btn"
                aria-label="Pausar reproducción automática"
                title="Pausar/Reanudar"
                type="button">⏸</button>
    `;

    bannerContainer.innerHTML = bannerHTML + dotsHTML + controls;

    // Iniciar auto-slide con RAF (más suave que setInterval)
    startSliderRAF();

    // Soporte táctil (swipe)
    initSliderTouch(bannerContainer);

    // Soporte teclado (accesibilidad)
    initSliderKeyboard(bannerContainer);

    // Pausa al hacer hover (desktop)
    bannerContainer.addEventListener('mouseenter', () => pauseSlider(), { passive: true });
    bannerContainer.addEventListener('mouseleave', () => resumeSlider(), { passive: true });

    // Pausa cuando la pestaña no está activa (Page Visibility API)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            pauseSlider();
        } else {
            resumeSlider();
        }
    });

    // Botón de pausa manual
    const pauseBtn = document.getElementById('slider-pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (sliderPaused) {
                resumeSlider();
                pauseBtn.textContent = '⏸';
                pauseBtn.setAttribute('aria-label', 'Pausar reproducción automática');
            } else {
                pauseSlider();
                pauseBtn.textContent = '▶';
                pauseBtn.setAttribute('aria-label', 'Reanudar reproducción automática');
            }
        });
    }
}

/* ── Animación del progreso con requestAnimationFrame ── */
function startSliderRAF() {
    cancelAnimationFrame(sliderRAF);
    sliderStartTime = performance.now() - sliderElapsed;

    function tick(now) {
        if (sliderPaused) return;

        const elapsed = now - sliderStartTime;
        const progress = Math.min((elapsed / SLIDE_DURATION) * 100, 100);

        const progressEl = document.getElementById('slide-progress');
        if (progressEl) {
            // Usar transform para evitar repaints (GPU)
            progressEl.style.transform = `scaleX(${progress / 100})`;
        }

        if (elapsed >= SLIDE_DURATION) {
            nextSlide();
            sliderElapsed = 0;
            sliderStartTime = performance.now();
        }

        sliderRAF = requestAnimationFrame(tick);
    }

    sliderRAF = requestAnimationFrame(tick);
}

function pauseSlider() {
    if (sliderPaused) return;
    sliderPaused = true;
    sliderElapsed = performance.now() - sliderStartTime;
    cancelAnimationFrame(sliderRAF);
}

function resumeSlider() {
    if (!sliderPaused) return;
    sliderPaused = false;
    startSliderRAF();
}

function nextSlide() {
    const slides = document.querySelectorAll('.slide');
    const dots   = document.querySelectorAll('.slider-dot');
    if (slides.length <= 1) return;

    slides[currentSlide].classList.remove('active');
    slides[currentSlide].setAttribute('aria-hidden', 'true');
    dots[currentSlide].classList.remove('active');
    dots[currentSlide].setAttribute('aria-selected', 'false');

    currentSlide = (currentSlide + 1) % slides.length;

    slides[currentSlide].classList.add('active');
    slides[currentSlide].setAttribute('aria-hidden', 'false');
    dots[currentSlide].classList.add('active');
    dots[currentSlide].setAttribute('aria-selected', 'true');

    // Precargar el siguiente slide
    preloadNextSlide();
}

function prevSlide() {
    const slides = document.querySelectorAll('.slide');
    const dots   = document.querySelectorAll('.slider-dot');
    if (slides.length <= 1) return;

    slides[currentSlide].classList.remove('active');
    slides[currentSlide].setAttribute('aria-hidden', 'true');
    dots[currentSlide].classList.remove('active');
    dots[currentSlide].setAttribute('aria-selected', 'false');

    currentSlide = (currentSlide - 1 + slides.length) % slides.length;

    slides[currentSlide].classList.add('active');
    slides[currentSlide].setAttribute('aria-hidden', 'false');
    dots[currentSlide].classList.add('active');
    dots[currentSlide].setAttribute('aria-selected', 'true');
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots   = document.querySelectorAll('.slider-dot');
    if (index === currentSlide) return;

    slides[currentSlide].classList.remove('active');
    slides[currentSlide].setAttribute('aria-hidden', 'true');
    dots[currentSlide].classList.remove('active');
    dots[currentSlide].setAttribute('aria-selected', 'false');

    currentSlide = index;

    slides[currentSlide].classList.add('active');
    slides[currentSlide].setAttribute('aria-hidden', 'false');
    dots[currentSlide].classList.add('active');
    dots[currentSlide].setAttribute('aria-selected', 'true');

    // Reiniciar progreso
    sliderElapsed = 0;
    if (!sliderPaused) {
        cancelAnimationFrame(sliderRAF);
        startSliderRAF();
    }
    const progressEl = document.getElementById('slide-progress');
    if (progressEl) progressEl.style.transform = 'scaleX(0)';
}

function preloadNextSlide() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length <= 1) return;
    const nextIndex = (currentSlide + 1) % slides.length;
    const nextBg = slides[nextIndex]?.querySelector('.slide-bg');
    if (nextBg) {
        const bgUrl = nextBg.style.backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/, '$1');
        if (bgUrl) {
            const img = new Image();
            img.src = bgUrl;
        }
    }
}

/* ── Soporte táctil mejorado ── */
function initSliderTouch(container) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isDragging = false;

    container.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        isDragging = false;
        pauseSlider();
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (!touchStartX) return;
        const dx = Math.abs(e.touches[0].clientX - touchStartX);
        const dy = Math.abs(e.touches[0].clientY - touchStartY);
        if (dx > dy && dx > 10) {
            isDragging = true;
        }
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const elapsed = Date.now() - touchStartTime;

        // Swipe horizontal: mínimo 50px, máximo 300ms, más horizontal que vertical
        if (
            isDragging &&
            Math.abs(deltaX) > 50 &&
            Math.abs(deltaX) > Math.abs(deltaY) * 1.5 &&
            elapsed < 300
        ) {
            if (deltaX < 0) {
                nextSlide();
            } else {
                prevSlide();
            }
            sliderElapsed = 0;
        }

        touchStartX = 0;
        touchStartY = 0;
        isDragging = false;
        resumeSlider();
    }, { passive: true });
}

/* ── Soporte teclado ── */
function initSliderKeyboard(container) {
    container.setAttribute('tabindex', '0');
    container.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            sliderElapsed = 0;
            if (!sliderPaused) { cancelAnimationFrame(sliderRAF); startSliderRAF(); }
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            sliderElapsed = 0;
            if (!sliderPaused) { cancelAnimationFrame(sliderRAF); startSliderRAF(); }
        }
    });
}

/* ─────────────────────────────────────────────
   BUSCADOR MODERNO v2
───────────────────────────────────────────── */
const searchInput   = document.getElementById('search-input');
const suggestionsBox = document.getElementById('search-suggestions');

if (searchInput) {
    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.toLowerCase().trim();

            if (query.length < 2) {
                suggestionsBox.classList.remove('active');
                suggestionsBox.innerHTML = '';
                return;
            }

            const filtered = peliculas.filter(m =>
                m.titulo.toLowerCase().includes(query) ||
                m.genero.toLowerCase().includes(query) ||
                (m.director && m.director.toLowerCase().includes(query))
            ).slice(0, 7);

            if (filtered.length > 0) {
                suggestionsBox.innerHTML = filtered.map(m => `
                    <div class="suggestion-item" role="option"
                         onclick="openMovieModal('${m.id}'); suggestionsBox.classList.remove('active');"
                         tabindex="0"
                         onkeydown="if(event.key==='Enter'){openMovieModal('${m.id}'); suggestionsBox.classList.remove('active');}">
                        <img src="${m.portada}" alt="Portada de ${m.titulo}"
                             style="width:42px;height:58px;object-fit:cover;border-radius:6px;flex-shrink:0;"
                             loading="lazy" decoding="async" width="42" height="58">
                        <div style="min-width:0;">
                            <div style="font-weight:700;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.titulo}</div>
                            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:3px;">${m.genero} • ${m.anio || m.año || ''}</div>
                        </div>
                    </div>
                `).join('');
                suggestionsBox.classList.add('active');
            } else {
                suggestionsBox.innerHTML = `<div class="suggestion-item" style="color:var(--text-muted);justify-content:center;">Sin resultados para "${query}"</div>`;
                suggestionsBox.classList.add('active');
            }
        }, 220);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            suggestionsBox.classList.remove('active');
            searchInput.blur();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            suggestionsBox.classList.remove('active');
        }
    });
}

/* ─────────────────────────────────────────────
   FILTROS DE GÉNERO
───────────────────────────────────────────── */
function filterByGenre(e) {
    const genre = e.target.dataset.genre;
    filtroActual = genre;

    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    e.target.classList.add('active');
    e.target.setAttribute('aria-pressed', 'true');

    const sections = document.querySelectorAll('.genre-section');
    sections.forEach(sec => {
        const show = genre === 'todos' || sec.dataset.genre === genre;
        sec.style.display = show ? 'block' : 'none';
        if (show) {
            sec.style.animation = 'fadeInUp 0.4s ease both';
        }
    });
}

/* ─────────────────────────────────────────────
   SONIDO RELAJANTE DEL SPLASH
───────────────────────────────────────────── */
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
    tocarPadRelajante(fcAudioCtx, now,       3, 110);
    tocarPadRelajante(fcAudioCtx, now + 0.5, 3, 164.81);
    tocarPadRelajante(fcAudioCtx, now + 1,   3, 220);
}

document.getElementById('splash-sound-btn')?.addEventListener('click', iniciarSonidoIntro);
