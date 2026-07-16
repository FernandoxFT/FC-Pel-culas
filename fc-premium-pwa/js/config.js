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
        showNotification('Tu plan venció. Podés renovarlo cuando quieras 🎫', 'warning');
    }
    return vigente;
}
let currentMovieId = null;
let currentSlide = 0;
let userLoggedIn = false;
let userData = null;
let filtroActual = 'todos';
let modoRegistro = false;

// ===== ADMINISTRACIÓN =====
const ADMIN_EMAIL = 'lopjosehp20@gmail.com';
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
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsY3Z2bGt4dGttZWFqa2F6dGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NTQxMDIsImV4cCI6MjA1NDQzMDEwMn0.k7wX1h1241sB26y31X_X51551515151515151515151'; // Reemplazado por el real luego

let supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ===== SONIDO RELAJANTE DEL SPLASH =====
let fcAudioCtx = null;
let fcSonidoActivo = false;
