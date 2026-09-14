import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

// All images verified 200 OK
const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85&auto=format&fit=crop',
    tag: 'OPERACIONES EN VIVO',
    title: 'Centro de Control\nde Vuelos',
    subtitle: 'Monitorea el estado de cada vuelo, cambios de puerta y embarque en tiempo real desde un único panel inteligente.',
    cta: 'VER OPERACIONES',
  },
  {
    image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1200&q=85&auto=format&fit=crop',
    tag: 'EXPERIENCIA PREMIUM',
    title: 'Vuela con\nEstilo Propio',
    subtitle: 'Gestiona el acceso al salón VIP, embarque prioritario y menús gourmet directamente desde tu portal de pasajero.',
    cta: 'VER MIS RESERVAS',
  },
  {
    image: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=1200&q=85&auto=format&fit=crop',
    tag: 'PORTAL DEL PASAJERO',
    title: 'Tu Viaje,\nEn Tus Manos',
    subtitle: 'Haz tu check-in en línea, rastrea tu vuelo en tiempo real y contacta soporte cuando lo necesites.',
    cta: 'ACCEDER A MI PORTAL',
  },
];

const QUICK_LINKS = [
  { label: 'Estado de Vuelos', icon: 'plane',   desc: 'Información en tiempo real' },
  { label: 'Mis Reservas',     icon: 'ticket',  desc: 'Ver mis vuelos' },
  { label: 'Check-In Online',  icon: 'checkin', desc: 'Factura tu equipaje' },
  { label: 'Soporte',          icon: 'chat',    desc: 'Asistencia 24/7' },
  { label: 'Destinos',         icon: 'globe',   desc: 'Explora nuestras rutas' },
  { label: 'Club de Millas',   icon: 'star',    desc: 'Puntos y beneficios' },
];

@Component({
  selector: 'app-portal-selector',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="portal-root">

      <!-- ══ PANEL IZQUIERDO ══════════════════════════════════════════════ -->
      <div class="left-panel">

        <!-- Fondo desenfocado del aeropuerto -->
        <div class="left-bg">
          <img
            src="https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&q=70&auto=format&fit=crop"
            alt=""
            (error)="onImgError($event)"
          />
          <div class="left-bg-overlay"></div>
        </div>

        <!-- Contenido -->
        <div class="left-content">

          <!-- Logo -->
          <div class="logo-area">
            <div class="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/>
              </svg>
            </div>
            <div class="logo-text">
              <span class="logo-name"><span class="logo-aero">Aero</span>CRM</span>
              <span class="logo-sub">PLATAFORMA DE OPERACIONES</span>
            </div>
          </div>

          <!-- Sección de acceso -->
          <div class="cta-section">
            <p class="cta-label">INGRESA A TU PORTAL</p>

            <a routerLink="/client/login" class="btn-main">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8Z"/>
              </svg>
              Pasajero | Cliente
            </a>

            <a routerLink="/staff/login" class="btn-staff">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M208,40H48A16,16,0,0,0,32,56V200a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V56A16,16,0,0,0,208,40ZM112,168a8,8,0,0,1-8,8H72a8,8,0,0,1,0-16h32A8,8,0,0,1,112,168Zm0-32a8,8,0,0,1-8,8H72a8,8,0,0,1,0-16h32A8,8,0,0,1,112,136Zm80,32H160a8,8,0,0,1,0-16h32a8,8,0,0,1,0,16Zm0-32H160a8,8,0,0,1,0-16h32a8,8,0,0,1,0,16Zm0-40H64V72H192Z"/>
              </svg>
              Personal Administrativo
            </a>

            <div class="register-link">
              ¿Eres pasajero nuevo?
              <a routerLink="/client/register">Crear cuenta gratis &rarr;</a>
            </div>
          </div>

          <!-- Accesos rápidos -->
          <div class="quick-links-label">ACCEDE A</div>
          <div class="quick-links-grid">
            <div *ngFor="let link of quickLinks" class="quick-link">
              <div class="quick-icon">
                <span [innerHTML]="getIcon(link.icon)"></span>
              </div>
              <span class="quick-label">{{ link.label }}</span>
              <span class="quick-desc">{{ link.desc }}</span>
            </div>
          </div>

        </div>
      </div>

      <!-- ══ PANEL DERECHO — Carrusel ══════════════════════════════════════ -->
      <div class="right-panel">

        <!-- Slides -->
        <div class="slides-container">
          <div
            *ngFor="let slide of slides; let i = index"
            class="slide"
            [class.slide-active]="activeSlide() === i"
          >
            <img
              [src]="slide.image"
              [alt]="slide.title"
              class="slide-img"
              (error)="onImgError($event)"
            />
            <div class="slide-overlay"></div>
            <div class="slide-content" [class.slide-content-active]="activeSlide() === i">
              <span class="slide-tag">{{ slide.tag }}</span>
              <h2 class="slide-title">{{ slide.title }}</h2>
              <p class="slide-subtitle">{{ slide.subtitle }}</p>
              <a routerLink="/client/login" class="slide-cta">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
                </svg>
                {{ slide.cta }}
              </a>
            </div>
          </div>
        </div>

        <!-- Dots de navegación -->
        <div class="dots">
          <button
            *ngFor="let slide of slides; let i = index"
            (click)="goTo(i)"
            class="dot"
            [class.dot-active]="activeSlide() === i"
          ></button>
        </div>

        <!-- Barra de información inferior -->
        <div class="info-bar">
          <div class="info-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v52h48A8,8,0,0,1,192,128Z"/>
            </svg>
            <span>{{ currentDateTime }}</span>
          </div>
          <div class="info-sep"></div>
          <div class="info-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/>
            </svg>
            <span>+150 Vuelos Diarios</span>
          </div>
          <div class="info-sep"></div>
          <div class="info-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.43a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92Z"/>
            </svg>
            <span>+50.000 Pasajeros</span>
          </div>
          <div class="info-sep"></div>
          <div class="info-item status-ok">
            <span class="status-dot"></span>
            <span>Todos los sistemas operativos</span>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .portal-root {
      display: flex;
      min-height: 100vh;
      background: #050d1a;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* ─── PANEL IZQUIERDO ─────────────────────────────────────────────────── */
    .left-panel {
      position: relative;
      width: 390px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Fondo desenfocado */
    .left-bg {
      position: absolute; inset: 0; z-index: 0;
    }
    .left-bg img {
      width: 100%; height: 100%;
      object-fit: cover;
      filter: blur(3px) brightness(0.25) saturate(0.8);
    }
    .left-bg-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg,
        rgba(5,13,26,0.6)   0%,
        rgba(5,13,26,0.82)  40%,
        rgba(5,13,26,0.97) 100%
      );
    }

    /* Contenido izquierdo */
    .left-content {
      position: relative; z-index: 1;
      display: flex; flex-direction: column;
      height: 100%;
      padding: 2rem 1.75rem 1.5rem;
      overflow-y: auto;
    }

    /* Logo */
    .logo-area {
      display: flex; align-items: center; gap: .875rem;
      margin-bottom: 2.5rem;
    }
    .logo-icon {
      width: 50px; height: 50px; flex-shrink: 0;
      background: rgba(201,168,76,.12);
      border: 1.5px solid rgba(201,168,76,.45);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .logo-icon svg { width: 26px; height: 26px; color: #c9a84c; }
    .logo-text { display: flex; flex-direction: column; }
    .logo-name {
      font-size: 1.5rem; font-weight: 800; color: white;
      letter-spacing: -.025em; line-height: 1;
    }
    .logo-aero { color: #c9a84c; }
    .logo-sub {
      font-size: .54rem; color: rgba(201,168,76,.55);
      letter-spacing: .2em; text-transform: uppercase;
      margin-top: .2rem;
    }

    /* CTA section */
    .cta-section { margin-bottom: 2rem; }

    .cta-label {
      font-size: .62rem; letter-spacing: .2em; text-transform: uppercase;
      color: #3366c2; font-weight: 700; margin-bottom: 1.25rem;
      display: flex; align-items: center; gap: .5rem;
    }
    .cta-label::before {
      content: ''; display: block;
      width: 22px; height: 2px; background: #3366c2; flex-shrink: 0;
    }

    .btn-main {
      display: flex; align-items: center; gap: .625rem;
      width: 100%; padding: .9rem 1.25rem;
      background: #c9a84c; color: #050d1a;
      font-weight: 700; font-size: .9rem; letter-spacing: .02em;
      border-radius: .625rem; border: none; cursor: pointer;
      text-decoration: none; transition: all .2s;
      margin-bottom: .75rem;
    }
    .btn-main:hover {
      background: #d4b96a;
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(201,168,76,.4);
    }
    .btn-main svg { width: 18px; height: 18px; flex-shrink: 0; }

    .btn-staff {
      display: flex; align-items: center; gap: .625rem;
      width: 100%; padding: .9rem 1.25rem;
      background: transparent;
      border: 1.5px solid rgba(51,102,194,.45);
      color: #8aaae0;
      font-weight: 600; font-size: .875rem; letter-spacing: .02em;
      border-radius: .625rem; cursor: pointer;
      text-decoration: none; transition: all .2s;
    }
    .btn-staff:hover {
      border-color: rgba(51,102,194,.9);
      color: white;
      background: rgba(36,82,160,.12);
    }
    .btn-staff svg { width: 17px; height: 17px; flex-shrink: 0; }

    .register-link {
      text-align: center; font-size: .78rem;
      color: #2452a0; margin-top: .9rem;
    }
    .register-link a {
      color: #c9a84c; text-decoration: none; font-weight: 600; margin-left: .25rem;
    }
    .register-link a:hover { text-decoration: underline; text-underline-offset: 3px; }

    /* Quick links */
    .quick-links-label {
      font-size: .6rem; letter-spacing: .2em; text-transform: uppercase;
      color: #2452a0; font-weight: 700; margin-bottom: 1rem;
      display: flex; align-items: center; gap: .5rem;
    }
    .quick-links-label::before {
      content: ''; display: block;
      width: 16px; height: 1.5px; background: #2452a0; flex-shrink: 0;
    }

    .quick-links-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem;
    }

    .quick-link {
      display: flex; flex-direction: column; align-items: center; gap: .35rem;
      padding: .75rem .5rem;
      background: rgba(15,32,64,.55);
      border: 1px solid rgba(22,45,88,.85);
      border-radius: .625rem; cursor: pointer; transition: all .2s;
      text-align: center; text-decoration: none;
    }
    .quick-link:hover {
      background: rgba(36,82,160,.16);
      border-color: rgba(51,102,194,.5);
      transform: translateY(-2px);
    }

    .quick-icon {
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(22,45,88,.9);
      border: 1px solid rgba(36,82,160,.4);
      display: flex; align-items: center; justify-content: center;
    }
    .quick-icon svg { width: 16px; height: 16px; color: #c9a84c; }

    .quick-label {
      font-size: .68rem; font-weight: 700; color: white;
      letter-spacing: .01em; line-height: 1.2;
    }
    .quick-desc { font-size: .58rem; color: #2452a0; line-height: 1.2; }

    /* ─── PANEL DERECHO — CARRUSEL ────────────────────────────────────────── */
    .right-panel {
      flex: 1; position: relative;
      display: flex; flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }

    .slides-container {
      flex: 1; position: relative; overflow: hidden;
    }

    .slide {
      position: absolute; inset: 0;
      opacity: 0; transition: opacity .8s ease;
      pointer-events: none;
    }
    .slide-active {
      opacity: 1; pointer-events: all;
    }

    .slide-img {
      width: 100%; height: 100%;
      object-fit: cover;
      object-position: center center;
      display: block;
    }

    .slide-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(
        120deg,
        rgba(5,13,26,.82) 0%,
        rgba(5,13,26,.45) 55%,
        rgba(5,13,26,.15) 100%
      );
    }

    .slide-content {
      position: absolute; bottom: 6rem; left: 3.5rem;
      max-width: 500px;
      opacity: 0; transform: translateY(28px);
      transition: opacity .6s ease .3s, transform .6s ease .3s;
    }
    .slide-content-active {
      opacity: 1; transform: translateY(0);
    }

    .slide-tag {
      display: inline-block;
      background: #c9a84c; color: #050d1a;
      font-size: .62rem; font-weight: 800; letter-spacing: .2em;
      text-transform: uppercase; padding: .3rem .9rem;
      border-radius: 999px; margin-bottom: 1rem;
    }

    .slide-title {
      font-size: clamp(1.8rem, 3.2vw, 2.75rem);
      font-weight: 800; color: white;
      line-height: 1.12; letter-spacing: -.03em;
      white-space: pre-line; margin-bottom: .875rem;
      text-shadow: 0 2px 24px rgba(0,0,0,.55);
    }

    .slide-subtitle {
      font-size: .95rem; color: rgba(255,255,255,.78);
      line-height: 1.65; max-width: 420px; margin-bottom: 1.75rem;
    }

    .slide-cta {
      display: inline-flex; align-items: center; gap: .625rem;
      background: white; color: #050d1a;
      font-size: .72rem; font-weight: 800;
      letter-spacing: .14em; text-transform: uppercase;
      padding: .8rem 1.6rem; border-radius: .5rem;
      text-decoration: none; transition: all .2s;
    }
    .slide-cta:hover {
      background: #c9a84c;
      transform: translateX(5px);
      box-shadow: 0 4px 20px rgba(201,168,76,.4);
    }
    .slide-cta svg { width: 14px; height: 14px; flex-shrink: 0; }

    /* Dots */
    .dots {
      position: absolute; bottom: 1.75rem; left: 3.5rem;
      display: flex; align-items: center; gap: .5rem; z-index: 10;
    }
    .dot {
      height: 4px; border-radius: 2px; border: none; cursor: pointer;
      background: rgba(255,255,255,.25); transition: all .35s ease;
      width: 24px;
    }
    .dot-active { background: #c9a84c; width: 44px; }

    /* Barra inferior */
    .info-bar {
      position: absolute; bottom: 0; left: 0; right: 0;
      background: rgba(5,13,26,.92);
      backdrop-filter: blur(14px);
      border-top: 1px solid rgba(22,45,88,.65);
      display: flex; align-items: center;
      gap: 1.25rem; padding: .875rem 2rem;
      flex-wrap: wrap;
    }

    .info-item {
      display: flex; align-items: center; gap: .45rem;
      font-size: .75rem; color: #5580d0;
    }
    .info-item svg { width: 13px; height: 13px; flex-shrink: 0; }

    .info-sep {
      width: 1px; height: 16px;
      background: rgba(22,45,88,.9); flex-shrink: 0;
    }

    .status-ok { color: #10b981; }
    .status-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #10b981; flex-shrink: 0;
      animation: pulsedot 2s infinite;
    }

    @keyframes pulsedot {
      0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,.5); }
      50%      { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
    }

    /* ─── RESPONSIVE ──────────────────────────────────────────────────────── */
    @media (max-width: 820px) {
      .portal-root { flex-direction: column; }
      .left-panel { width: 100%; }
      .left-content { padding: 1.5rem; }
      .right-panel { min-height: 60vh; }
      .slide-content { left: 1.5rem; bottom: 5rem; max-width: calc(100vw - 3rem); }
      .slide-title { font-size: 1.5rem; }
      .info-bar { padding: .6rem 1rem; gap: .75rem; }
      .info-sep { display: none; }
    }

    @media (min-width: 1440px) {
      .left-panel { width: 430px; }
    }
  `],
})
export class PortalSelectorComponent implements OnInit, OnDestroy {
  slides   = SLIDES;
  quickLinks = QUICK_LINKS;

  activeSlide  = signal(0);
  currentDateTime = '';

  private slideInterval: any;
  private clockInterval: any;

  ngOnInit() {
    this.updateClock();
    this.clockInterval  = setInterval(() => this.updateClock(), 1000);
    this.slideInterval  = setInterval(() => this.advance(), 6000);
  }

  ngOnDestroy() {
    clearInterval(this.slideInterval);
    clearInterval(this.clockInterval);
  }

  advance() {
    this.activeSlide.set((this.activeSlide() + 1) % this.slides.length);
  }

  goTo(i: number) {
    clearInterval(this.slideInterval);
    this.activeSlide.set(i);
    this.slideInterval = setInterval(() => this.advance(), 6000);
  }

  updateClock() {
    const now = new Date();
    this.currentDateTime = now.toLocaleString('es-ES', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  }

  onImgError(event: Event) {
    const el = event.target as HTMLImageElement;
    // Fallback: gradient background si la imagen no carga
    if (el) {
      el.style.display = 'none';
    }
  }

  getIcon(name: string): string {
    const icons: Record<string, string> = {
      plane:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M235.58,128.84l-36-20.84V72a8,8,0,0,0-8-8H160V48a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8V64H64a8,8,0,0,0-8,8v35.87l-36,20.84A8,8,0,0,0,16,136v16a8,8,0,0,0,9.42,7.86L56,153.4V184a8,8,0,0,0,8,8H80v16a8,8,0,0,0,16,0V192h64v16a8,8,0,0,0,16,0V192h16a8,8,0,0,0,8-8V153.4l30.58,6.46A8,8,0,0,0,240,152V136A8,8,0,0,0,235.58,128.84Z"/></svg>`,
      ticket:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M227.19,104.48A16,16,0,0,0,240,88.81V64a16,16,0,0,0-16-16H32A16,16,0,0,0,16,64V88.81a16,16,0,0,0,12.81,15.67,24,24,0,0,1,0,47A16,16,0,0,0,16,167.19V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V167.19a16,16,0,0,0-12.81-15.67,24,24,0,0,1,0-47Z"/></svg>`,
      checkin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Z"/></svg>`,
      chat:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Z"/></svg>`,
      globe:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,175.21V176a8,8,0,0,1,16,0v23.21A88.38,88.38,0,0,0,216,128H192a8,8,0,0,1,0-16h24a88.38,88.38,0,0,0-80-71.21V64a8,8,0,0,1-16,0V40.79A88.38,88.38,0,0,0,40,112H64a8,8,0,0,1,0,16H40A88.38,88.38,0,0,0,120,199.21Z"/></svg>`,
      star:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M234.29,114.85l-45,38.83L203,211a16,16,0,0,1-23.84,17.71L128,198.62,76.84,228.7A16,16,0,0,1,53,211l13.76-57.32-45-38.83A16,16,0,0,1,31,86.17l58.67-5.43,22.7-54.71a15.92,15.92,0,0,1,29.28,0l22.7,54.71L222.89,86.17a16,16,0,0,1,11.4,28.68Z"/></svg>`,
    };
    return icons[name] || icons['plane'];
  }
}
