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
      <canvas #globeCanvas class="block size-full"></canvas>

      <button
        class="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-md border border-white/15 bg-black/45 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/65"
        type="button"
        [attr.aria-label]="controlsHidden ? 'Show controls' : 'Hide controls'"
        (click)="controlsHidden = !controlsHidden"
      >
        {{ controlsHidden ? '+' : '-' }}
      </button>

      @if (!controlsHidden) {
        <div class="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-md border border-white/15 bg-black/45 p-2 text-white backdrop-blur">
          <a
            class="grid size-9 place-items-center rounded-md text-sm font-semibold transition hover:bg-white/15"
            routerLink="/simulations"
            aria-label="Back to simulations"
          >
            ←
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
            class="grid size-9 place-items-center rounded-md text-sm font-semibold transition hover:bg-white/15"
            type="button"
            aria-label="Reset view"
            (click)="resetView()"
          >
            ↺
          </button>
          <button
            class="grid size-9 place-items-center rounded-md text-sm font-semibold transition hover:bg-white/15"
            type="button"
            [attr.aria-label]="autoRotate ? 'Pause rotation' : 'Resume rotation'"
            (click)="toggleAutoRotate()"
          >
            {{ autoRotate ? 'Ⅱ' : '▶' }}
          </button>
        </div>
      }
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
  protected controlsHidden = false;
  protected autoRotate = true;

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
  }

  private createScene(): void {
    const canvas = this.globeCanvas.nativeElement;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 0, 4.2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 0.9;
    this.controls.enablePan = false;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 0.35;
    this.controls.minDistance = 2.1;
    this.controls.maxDistance = 7;
    this.controls.rotateSpeed = 0.65;

    const earthGeometry = new THREE.SphereGeometry(1.35, 96, 96);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0,
    });

    this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
    this.earth.rotation.set(0.18, -0.55, 0);
    this.scene.add(this.earth);

    new THREE.TextureLoader().load('/textures/earth-blue-marble-2048.jpg', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = this.renderer?.capabilities.getMaxAnisotropy() ?? 1;
      this.earthTexture = texture;
      earthMaterial.map = texture;
      earthMaterial.needsUpdate = true;
    });

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.39, 96, 96),
      new THREE.MeshBasicMaterial({
        color: 0x63c6ff,
        transparent: true,
        opacity: 0.13,
        side: THREE.BackSide,
      }),
    );
    this.scene.add(atmosphere);

    this.stars = this.createStars();
    this.scene.add(this.stars);

    this.scene.add(new THREE.AmbientLight(0x9eb7d8, 1.5));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3);
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

    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.renderFrame);
  };

  private readonly resize = (): void => {
    if (!this.renderer || !this.camera) {
      return;
    }

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
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

    this.camera.position.set(0, 0, 4.2);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  protected toggleAutoRotate(): void {
    this.autoRotate = !this.autoRotate;

    if (this.controls) {
      this.controls.autoRotate = this.autoRotate;
    }
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

  private disposeMaterial(material: THREE.Material | THREE.Material[] | undefined): void {
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
      return;
    }

    material?.dispose();
  }
}
