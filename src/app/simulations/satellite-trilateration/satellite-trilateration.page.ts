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
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-satellite-trilateration-page',
  template: `
    <section class="fixed inset-0 overflow-hidden bg-black">
      <h1 class="sr-only">Satellite Trilateration Earth Globe</h1>
      <canvas #globeCanvas class="block size-full"></canvas>
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
    this.controls.autoRotate = true;
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
