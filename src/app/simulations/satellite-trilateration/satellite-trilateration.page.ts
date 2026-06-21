import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-satellite-trilateration-page',
  imports: [RouterLink],
  template: `
    <section class="fixed inset-0 overflow-hidden bg-black">
      <h1 class="sr-only">Satellite Trilateration Earth Globe</h1>
      <canvas #globeCanvas class="absolute inset-0 h-full w-full"></canvas>

      <div class="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-md border border-white/15 bg-black/45 p-2 text-white backdrop-blur">
        <a
          class="grid h-9 min-w-12 place-items-center rounded-md px-2 text-sm font-semibold transition hover:bg-white/15"
          routerLink="/simulations"
          aria-label="Back to simulations"
        >
          Back
        </a>
        <button
          class="grid size-9 place-items-center rounded-md text-lg font-semibold transition hover:bg-white/15"
          type="button"
          aria-label="Zoom in"
          (click)="zoomIn()"
        >
          +
        </button>
        <button
          class="grid size-9 place-items-center rounded-md text-lg font-semibold transition hover:bg-white/15"
          type="button"
          aria-label="Zoom out"
          (click)="zoomOut()"
        >
          -
        </button>
        <button
          class="grid h-9 min-w-14 place-items-center rounded-md px-2 text-sm font-semibold transition hover:bg-white/15"
          type="button"
          aria-label="Reset view"
          (click)="resetView()"
        >
          Reset
        </button>
        <button
          class="grid h-9 min-w-14 place-items-center rounded-md px-2 text-sm font-semibold transition hover:bg-white/15"
          type="button"
          [attr.aria-label]="autoRotate ? 'Pause rotation' : 'Resume rotation'"
          (click)="toggleAutoRotate()"
        >
          {{ autoRotate ? 'Pause' : 'Play' }}
        </button>
      </div>

      <div
        class="absolute bottom-0 right-0 top-0 z-20 w-[min(360px,100vw)] transition-transform duration-300 ease-out"
        [class.translate-x-full]="drawerCollapsed"
      >
        <button
          class="absolute left-0 top-1/2 z-30 grid h-12 w-8 -translate-x-full -translate-y-1/2 place-items-center rounded-l-md border border-r-0 border-white/15 bg-black/60 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/80"
          type="button"
          [attr.aria-label]="drawerCollapsed ? 'Expand parameters drawer' : 'Collapse parameters drawer'"
          (click)="drawerCollapsed = !drawerCollapsed"
        >
          {{ drawerCollapsed ? '<' : '>' }}
        </button>

        <aside class="h-full overflow-y-auto border-l border-white/15 bg-black/60 p-5 text-white shadow-2xl backdrop-blur-md">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-white/60">Simulation</p>
            <h2 class="mt-1 text-lg font-semibold">Parameters</h2>
          </div>

        <div class="mt-5 space-y-5">
          <label class="block">
            <span class="flex items-center justify-between text-sm font-medium">
              Satellites
              <span class="text-white/60">{{ satelliteCount }}</span>
            </span>
            <div class="relative mt-4 pb-6">
              <div class="absolute left-[6.25%] right-[6.25%] top-2 h-0.5 bg-white/25"></div>
              <div
                class="absolute left-[6.25%] top-2 h-0.5 bg-cyan-400"
                [style.width.%]="satelliteProgress"
              ></div>

              <div class="relative grid grid-cols-8">
                @for (value of satelliteCountLabels; track value) {
                  <button
                    class="group flex flex-col items-center gap-2"
                    type="button"
                    [attr.aria-label]="'Set satellites to ' + value"
                    (click)="setSatelliteCount(value)"
                  >
                    <span
                      class="grid size-4 place-items-center rounded-full border transition"
                      [style.border-color]="value <= satelliteCount ? 'rgb(103 232 249)' : 'rgb(255 255 255 / 0.3)'"
                      [style.background-color]="value <= satelliteCount ? 'rgb(34 211 238)' : 'rgb(255 255 255 / 0.35)'"
                      [class.scale-150]="value === satelliteCount"
                    ></span>
                    <span
                      class="text-[11px] font-semibold transition"
                      [style.color]="value === satelliteCount ? 'rgb(103 232 249)' : 'rgb(255 255 255 / 0.45)'"
                    >
                      {{ value }}
                    </span>
                  </button>
                }
              </div>
            </div>
          </label>

          <label class="block">
            <span class="flex items-center justify-between text-sm font-medium">
              Signal radius
              <span class="text-white/60">{{ signalRadius }}x</span>
            </span>
            <input
              class="mt-2 w-full accent-cyan-400"
              type="range"
              min="1"
              max="5"
              step="0.1"
              [value]="signalRadius"
              (input)="setSignalRadius(inputValue($event))"
            />
          </label>

          <label class="block">
            <span class="flex items-center justify-between text-sm font-medium">
              Measurement noise
              <span class="text-white/60">{{ measurementNoise }} m</span>
            </span>
            <input
              class="mt-2 w-full accent-cyan-400"
              type="range"
              min="0"
              max="50"
              step="1"
              [value]="measurementNoise"
              (input)="measurementNoise = inputValue($event)"
            />
          </label>

          <label class="block">
            <span class="flex items-center justify-between text-sm font-medium">
              Receiver altitude
              <span class="text-white/60">{{ receiverAltitude }} km</span>
            </span>
            <input
              class="mt-2 w-full accent-cyan-400"
              type="range"
              min="0"
              max="500"
              step="10"
              [value]="receiverAltitude"
              (input)="receiverAltitude = inputValue($event)"
            />
          </label>
        </div>

        <div class="mt-6 rounded-md border border-white/10 bg-white/5 p-3">
          <p class="text-sm font-semibold">Current setup</p>
          <p class="mt-2 text-sm leading-6 text-white/70">
            {{ satelliteCount }} satellites, {{ signalRadius }}x signal radius,
            {{ measurementNoise }} m noise, {{ receiverAltitude }} km altitude.
          </p>
        </div>

        <div class="mt-6 border-t border-white/10 pt-5">
          <nav class="flex items-center gap-2 text-sm font-semibold" aria-label="Satellite controls breadcrumb">
            <button
              class="text-cyan-300 transition hover:text-cyan-100"
              type="button"
              (click)="selectedSatelliteId = null"
            >
              Satellites
            </button>
            @if (selectedSatellite) {
              <span class="text-white/35">&gt;</span>
              <span class="text-white">Satellite {{ selectedSatellite.id }}</span>
            }
          </nav>

          @if (!selectedSatellite) {
            <div class="mt-3 space-y-2">
              @for (satellite of visibleSatelliteControls; track satellite.id) {
                <button
                  class="flex w-full items-center justify-between rounded-md border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
                  type="button"
                  [attr.aria-label]="'Open satellite ' + satellite.id + ' parameters'"
                  (click)="selectedSatelliteId = satellite.id"
                >
                  <span class="flex items-center gap-2">
                    <span
                      class="size-3 rounded-full"
                      [style.background-color]="satellite.color"
                    ></span>
                    <span class="text-sm font-semibold">Satellite {{ satellite.id }}</span>
                  </span>
                  <span class="text-xs font-semibold text-white/50">
                    {{ satellite.paused ? 'Paused' : satellite.speed.toFixed(1) + 'x' }}
                  </span>
                </button>
              }
            </div>
          } @else {
            <article class="mt-3 rounded-md border border-white/10 bg-white/5 p-3">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span
                    class="size-3 rounded-full"
                    [style.background-color]="selectedSatellite.color"
                  ></span>
                  <p class="text-sm font-semibold">Satellite {{ selectedSatellite.id }}</p>
                </div>
                <button
                  class="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold transition hover:bg-white/10"
                  type="button"
                  [attr.aria-label]="selectedSatellite.paused ? 'Play satellite ' + selectedSatellite.id : 'Pause satellite ' + selectedSatellite.id"
                  (click)="toggleSatellitePaused(selectedSatellite.id)"
                >
                  {{ selectedSatellite.paused ? 'Play' : 'Pause' }}
                </button>
              </div>

              <dl class="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div class="rounded-md bg-black/25 p-2">
                  <dt class="text-white/45">Orbit radius</dt>
                  <dd class="mt-1 font-semibold">{{ satelliteOrbitRadius(selectedSatellite.id).toFixed(2) }} ER</dd>
                </div>
                <div class="rounded-md bg-black/25 p-2">
                  <dt class="text-white/45">Signal radius</dt>
                  <dd class="mt-1 font-semibold">{{ signalRadius }}x</dd>
                </div>
                <div class="rounded-md bg-black/25 p-2">
                  <dt class="text-white/45">Status</dt>
                  <dd class="mt-1 font-semibold">{{ selectedSatellite.paused ? 'Paused' : 'Moving' }}</dd>
                </div>
                <div class="rounded-md bg-black/25 p-2">
                  <dt class="text-white/45">Speed</dt>
                  <dd class="mt-1 font-semibold">{{ selectedSatellite.speed.toFixed(2) }}x</dd>
                </div>
              </dl>

              <label class="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-white/70">
                Color
                <input
                  class="h-7 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
                  type="color"
                  [value]="selectedSatellite.color"
                  (input)="setSatelliteColor(selectedSatellite.id, colorValue($event))"
                />
              </label>

              <label class="mt-4 block">
                <span class="flex items-center justify-between text-xs font-semibold text-white/70">
                  Speed
                  <span>{{ selectedSatellite.speed.toFixed(2) }}x</span>
                </span>
                <input
                  class="mt-2 w-full accent-cyan-400"
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  [value]="selectedSatellite.speed"
                  (input)="setSatelliteSpeed(selectedSatellite.id, inputValue($event))"
                />
              </label>
            </article>
          }
        </div>
        </aside>
      </div>
    </section>
  `,
})
export class SatelliteTrilaterationPage implements AfterViewInit, OnDestroy {
  @ViewChild('globeCanvas', { static: true })
  private readonly globeCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private animationFrame = 0;
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private controls?: OrbitControls;
  private earth?: THREE.Mesh;
  private stars?: THREE.Points;
  private earthTexture?: THREE.Texture;
  private satelliteSystems: Array<{
    root: THREE.Object3D;
    satellitePivot: THREE.Object3D;
    body: THREE.Object3D;
    orbit: THREE.LineLoop;
    signal: THREE.Mesh;
    bodyMaterials: THREE.MeshStandardMaterial[];
    orbitMaterial: THREE.LineBasicMaterial;
    signalMaterial: THREE.MeshBasicMaterial;
    beacon: THREE.PointLight;
  }> = [];
  protected drawerCollapsed = false;
  protected autoRotate = true;
  protected satelliteCount = 4;
  protected readonly satelliteCountLabels = [1, 2, 3, 4, 5, 6, 7, 8];
  protected readonly satelliteControls = [
    { id: 1, color: '#22d3ee', speed: 1, paused: false },
    { id: 2, color: '#a78bfa', speed: 1.15, paused: false },
    { id: 3, color: '#f59e0b', speed: 0.9, paused: false },
    { id: 4, color: '#34d399', speed: 1.25, paused: false },
    { id: 5, color: '#fb7185', speed: 0.8, paused: false },
    { id: 6, color: '#60a5fa', speed: 1.4, paused: false },
    { id: 7, color: '#f472b6', speed: 1.05, paused: false },
    { id: 8, color: '#c084fc', speed: 1.3, paused: false },
  ];
  protected signalRadius = 2.5;
  protected measurementNoise = 8;
  protected receiverAltitude = 0;
  protected selectedSatelliteId: number | null = null;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.createScene();
      this.renderFrame();
      window.addEventListener('resize', this.resize);
    });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.resize);
    this.controls?.dispose();
    this.renderer?.dispose();
    this.earth?.geometry.dispose();
    this.earthTexture?.dispose();
    this.disposeMaterial(this.earth?.material);
    this.stars?.geometry.dispose();
    this.disposeMaterial(this.stars?.material);
    this.satelliteSystems.forEach(({ root, body, orbit, signal }) => {
      this.scene?.remove(root);
      this.disposeObject(body);
      signal.geometry.dispose();
      this.disposeMaterial(signal.material);
      orbit.geometry.dispose();
      this.disposeMaterial(orbit.material);
    });
  }

  private createScene(): void {
    const canvas = this.globeCanvas.nativeElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020617);
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0, 4.6);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x020617, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.resize();

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 0.9;
    this.controls.enablePan = false;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 0.35;
    this.controls.minDistance = 2.35;
    this.controls.maxDistance = 7;
    this.controls.rotateSpeed = 0.65;

    const earthGeometry = new THREE.SphereGeometry(1.7, 96, 96);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c8ee8,
      emissive: 0x071b33,
      emissiveIntensity: 0.35,
      roughness: 0.72,
      metalness: 0,
    });

    this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
    this.earth.rotation.set(0.18, -0.55, 0);
    this.scene.add(this.earth);

    new THREE.TextureLoader().load('/textures/earth-blue-marble-2048.jpg', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = this.renderer?.capabilities.getMaxAnisotropy() ?? 1;
      this.earthTexture = texture;
      earthMaterial.color.set(0xffffff);
      earthMaterial.map = texture;
      earthMaterial.needsUpdate = true;
    });

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.76, 96, 96),
      new THREE.MeshBasicMaterial({
        color: 0x63c6ff,
        transparent: true,
        opacity: 0.18,
        side: THREE.BackSide,
      }),
    );
    this.scene.add(atmosphere);

    this.stars = this.createStars();
    this.scene.add(this.stars);
    this.satelliteSystems = this.createSatelliteSystems();
    this.updateSatelliteVisibility();

    this.scene.add(new THREE.AmbientLight(0xb7cff5, 2.2));
    this.scene.add(new THREE.HemisphereLight(0xbfe9ff, 0x06111f, 1.3));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.8);
    keyLight.position.set(4, 2, 5);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x3aa7ff, 1.5);
    rimLight.position.set(-4, -1, -2);
    this.scene.add(rimLight);
  }

  private readonly renderFrame = (): void => {
    if (!this.renderer || !this.scene || !this.camera) {
      return;
    }

    if (this.stars) {
      this.stars.rotation.y -= 0.0004;
    }

    this.satelliteSystems.forEach(({ satellitePivot }, index) => {
      const satellite = this.satelliteControls[index];

      if (!satellite.paused) {
        satellitePivot.rotation.y += 0.0038 * satellite.speed;
      }
    });

    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.renderFrame);
  };

  private readonly resize = (): void => {
    if (!this.renderer || !this.camera) {
      return;
    }

    const canvas = this.globeCanvas.nativeElement;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  protected zoomIn(): void {
    this.moveCameraBy(0.82);
  }

  protected zoomOut(): void {
    this.moveCameraBy(1.18);
  }

  protected resetView(): void {
    if (!this.camera || !this.controls) {
      return;
    }

    this.camera.position.set(0, 0, 4.6);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  protected toggleAutoRotate(): void {
    this.autoRotate = !this.autoRotate;

    if (this.controls) {
      this.controls.autoRotate = this.autoRotate;
    }
  }

  protected inputValue(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }

  protected colorValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected get satelliteProgress(): number {
    return ((this.satelliteCount - 1) / (this.satelliteCountLabels.length - 1)) * 87.5;
  }

  protected get visibleSatelliteControls(): typeof this.satelliteControls {
    return this.satelliteControls.slice(0, this.satelliteCount);
  }

  protected get selectedSatellite(): (typeof this.satelliteControls)[number] | null {
    if (!this.selectedSatelliteId || this.selectedSatelliteId > this.satelliteCount) {
      return null;
    }

    return this.satelliteControls[this.selectedSatelliteId - 1] ?? null;
  }

  protected setSatelliteCount(count: number): void {
    this.satelliteCount = count;

    if (this.selectedSatelliteId && this.selectedSatelliteId > count) {
      this.selectedSatelliteId = null;
    }

    this.updateSatelliteVisibility();
  }

  protected satelliteOrbitRadius(id: number): number {
    return 2.35 + ((id - 1) % 3) * 0.18;
  }

  protected setSignalRadius(radius: number): void {
    this.signalRadius = radius;
    this.updateSignalRadius();
  }

  protected setSatelliteSpeed(id: number, speed: number): void {
    const satellite = this.satelliteControls[id - 1];

    if (satellite) {
      satellite.speed = speed;
    }
  }

  protected toggleSatellitePaused(id: number): void {
    const satellite = this.satelliteControls[id - 1];

    if (satellite) {
      satellite.paused = !satellite.paused;
    }
  }

  protected setSatelliteColor(id: number, color: string): void {
    const satellite = this.satelliteControls[id - 1];
    const system = this.satelliteSystems[id - 1];

    if (!satellite) {
      return;
    }

    satellite.color = color;

    if (!system) {
      return;
    }

    const threeColor = new THREE.Color(color);
    system.bodyMaterials.forEach((material) => {
      material.color.copy(threeColor);
      material.emissive.copy(threeColor).multiplyScalar(0.3);
    });
    system.orbitMaterial.color.copy(threeColor);
    system.signalMaterial.color.copy(threeColor);
    system.beacon.color.copy(threeColor);
  }

  private moveCameraBy(multiplier: number): void {
    if (!this.camera || !this.controls) {
      return;
    }

    const direction = this.camera.position.clone().sub(this.controls.target);
    const nextDistance = THREE.MathUtils.clamp(
      direction.length() * multiplier,
      this.controls.minDistance,
      this.controls.maxDistance,
    );

    direction.setLength(nextDistance);
    this.camera.position.copy(this.controls.target).add(direction);
    this.controls.update();
  }

  private createStars(): THREE.Points {
    const starCount = 900;
    const positions = new Float32Array(starCount * 3);

    for (let index = 0; index < starCount; index++) {
      const radius = 8 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const stride = index * 3;

      positions[stride] = radius * Math.sin(phi) * Math.cos(theta);
      positions[stride + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[stride + 2] = radius * Math.cos(phi);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.025,
        transparent: true,
        opacity: 0.78,
      }),
    );
  }

  private createSatelliteSystems(): Array<{
    root: THREE.Object3D;
    satellitePivot: THREE.Object3D;
    body: THREE.Object3D;
    orbit: THREE.LineLoop;
    signal: THREE.Mesh;
    bodyMaterials: THREE.MeshStandardMaterial[];
    orbitMaterial: THREE.LineBasicMaterial;
    signalMaterial: THREE.MeshBasicMaterial;
    beacon: THREE.PointLight;
  }> {
    if (!this.scene) {
      return [];
    }

    const systems = Array.from({ length: 8 }, (_, index) => {
      const radius = 2.35 + (index % 3) * 0.18;
      const inclination = THREE.MathUtils.degToRad(18 + index * 17);
      const phase = (index / 8) * Math.PI * 2;
      const satelliteConfig = this.satelliteControls[index];
      const color = new THREE.Color(satelliteConfig.color);

      const root = new THREE.Object3D();
      root.rotation.z = inclination;
      root.rotation.y = phase;

      const satellitePivot = new THREE.Object3D();
      satellitePivot.rotation.y = phase;

      const satellite = this.createSatelliteBody(color);
      satellite.position.set(radius, 0, 0);
      satellite.scale.setScalar(0.85);
      satellitePivot.add(satellite);

      const signal = this.createSignalSphere(color);
      signal.position.set(radius, 0, 0);
      signal.scale.setScalar(this.signalRadius);
      satellitePivot.add(signal);

      const orbit = this.createOrbitPath(radius, color);

      root.add(orbit);
      root.add(satellitePivot);
      this.scene?.add(root);

      const bodyMaterials = this.collectSatelliteMaterials(satellite);
      const beacon = satellite.children.find((child) => child instanceof THREE.PointLight) as THREE.PointLight;

      return {
        root,
        satellitePivot,
        body: satellite,
        orbit,
        signal,
        bodyMaterials,
        orbitMaterial: orbit.material as THREE.LineBasicMaterial,
        signalMaterial: signal.material as THREE.MeshBasicMaterial,
        beacon,
      };
    });

    return systems;
  }

  private createSatelliteBody(color: THREE.Color): THREE.Object3D {
    const satellite = new THREE.Group();

    const busMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color.clone().multiplyScalar(0.3),
      emissiveIntensity: 0.25,
      metalness: 0.45,
      roughness: 0.35,
    });

    const bus = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.06, 0.06),
      busMaterial,
    );
    satellite.add(bus);

    const panelMaterial = new THREE.MeshStandardMaterial({
      color,
      emissive: color.clone().multiplyScalar(0.35),
      emissiveIntensity: 0.35,
      metalness: 0.25,
      roughness: 0.5,
    });

    const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.01), panelMaterial);
    leftPanel.position.x = -0.13;
    satellite.add(leftPanel);

    const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.01), panelMaterial);
    rightPanel.position.x = 0.13;
    satellite.add(rightPanel);

    const beacon = new THREE.PointLight(color, 0.7, 1.4);
    beacon.position.set(0, 0, 0.06);
    satellite.add(beacon);

    return satellite;
  }

  private createSignalSphere(color: THREE.Color): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 32, 16),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.1,
        wireframe: true,
        depthWrite: false,
      }),
    );
  }

  private createOrbitPath(radius: number, color: THREE.Color): THREE.LineLoop {
    const segments = 192;
    const points: THREE.Vector3[] = [];

    for (let index = 0; index < segments; index++) {
      const angle = (index / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }

    return new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.22,
      }),
    );
  }

  private updateSatelliteVisibility(): void {
    this.satelliteSystems.forEach(({ root }, index) => {
      const visible = index < this.satelliteCount;
      root.visible = visible;
    });
  }

  private updateSignalRadius(): void {
    this.satelliteSystems.forEach(({ signal }) => {
      signal.scale.setScalar(this.signalRadius);
    });
  }

  private collectSatelliteMaterials(object: THREE.Object3D): THREE.MeshStandardMaterial[] {
    const materials: THREE.MeshStandardMaterial[] = [];

    object.traverse((child) => {
      const mesh = child as THREE.Mesh;

      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        materials.push(mesh.material);
      }
    });

    return materials;
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;

      if (mesh.geometry) {
        mesh.geometry.dispose();
      }

      this.disposeMaterial(mesh.material);
    });
  }

  private disposeMaterial(material: THREE.Material | THREE.Material[] | undefined): void {
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
      return;
    }

    material?.dispose();
  }
}
