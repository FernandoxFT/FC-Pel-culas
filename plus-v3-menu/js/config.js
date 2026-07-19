// js/config.js - Variables globales, configuración y constantes

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
        showNotification('Tu plan en FC Movies+ ha vencido. ¡Renuévalo para seguir disfrutando! 🍿', 'warning');
    }
    return vigente;
}
let currentMovieId = null;
// currentSlide se declara en ui.js (es el que maneja el banner/carrusel).
let userLoggedIn = false;
let userData = null;
// filtroActual se declara en ui.js (es el que maneja los filtros por género).
let modoRegistro = false;

// ===== ADMINISTRACIÓN =====
const ADMIN_EMAIL = 'lopjosehp20@gmail.com';

// Versión visible en el menú/ajustes. Mantener sincronizada a mano con
// APP_VERSION en service-worker.js cuando se suba una actualización.
const APP_VERSION_DISPLAY = 'v3.0.2';
function isAdmin() {
    return userLoggedIn && userData?.email === ADMIN_EMAIL;
}

// ===== CONFIGURACIÓN DE SEGURIDAD =====
const API_CONFIG = {
    apiKey: 'USAR_VARIABLES_DE_ENTORNO',
    secretKey: 'USAR_VARIABLES_DE_ENTORNO',
    smartFieldsKey: 'USAR_VARIABLES_DE_ENTORNO'
};

// ===== SUPABASE AUTH =====
const SUPABASE_URL = 'https://klcvvlkxtkmeajkaztfr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsY3Z2bGt4dGttZWFqa2F6dGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1Mzg0MjUsImV4cCI6MjA5OTExNDQyNX0.PbrZVc3KqUUFSRtnp5_TVeaqaNxaXJcA9a49MDB4CQQ';

let supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ===== SONIDO RELAJANTE DEL SPLASH =====
// fcAudioCtx y fcSonidoActivo se declaran en ui.js (que es donde se usan).
