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
  private earth?: THREE.Mesh;
  private stars?: THREE.Points;

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
    this.renderer?.dispose();
    this.earth?.geometry.dispose();
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

    const earthTexture = new THREE.CanvasTexture(this.createEarthTexture());
    earthTexture.colorSpace = THREE.SRGBColorSpace;

    const earthGeometry = new THREE.SphereGeometry(1.35, 96, 96);
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.9,
      metalness: 0,
    });

    this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
    this.earth.rotation.set(0.18, -0.55, 0);
    this.scene.add(this.earth);

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

    if (this.earth) {
      this.earth.rotation.y += 0.0022;
    }

    if (this.stars) {
      this.stars.rotation.y -= 0.0004;
    }

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

  private createEarthTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;

    const context = canvas.getContext('2d');
    if (!context) {
      return canvas;
    }

    const ocean = context.createLinearGradient(0, 0, 0, canvas.height);
    ocean.addColorStop(0, '#123f7a');
    ocean.addColorStop(0.5, '#0b67a3');
    ocean.addColorStop(1, '#06204c');
    context.fillStyle = ocean;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#2e8b57';
    this.drawContinent(context, [
      [300, 250],
      [430, 180],
      [560, 230],
      [615, 360],
      [520, 470],
      [405, 430],
      [315, 510],
      [230, 410],
    ]);
    this.drawContinent(context, [
      [560, 520],
      [665, 610],
      [620, 810],
      [515, 900],
      [465, 710],
    ]);
    this.drawContinent(context, [
      [900, 250],
      [1100, 185],
      [1290, 285],
      [1210, 440],
      [1030, 455],
      [850, 380],
    ]);
    this.drawContinent(context, [
      [1180, 455],
      [1330, 515],
      [1390, 690],
      [1255, 825],
      [1110, 690],
    ]);
    this.drawContinent(context, [
      [1420, 275],
      [1660, 200],
      [1865, 355],
      [1745, 560],
      [1520, 530],
      [1365, 410],
    ]);
    this.drawContinent(context, [
      [1600, 720],
      [1760, 690],
      [1870, 790],
      [1810, 880],
      [1650, 865],
    ]);

    context.globalAlpha = 0.34;
    context.fillStyle = '#ffffff';
    for (let index = 0; index < 48; index++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const width = 80 + Math.random() * 240;
      const height = 10 + Math.random() * 32;
      context.beginPath();
      context.ellipse(x, y, width, height, Math.random() * Math.PI, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;

    return canvas;
  }

  private drawContinent(context: CanvasRenderingContext2D, points: Array<[number, number]>): void {
    context.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) {
        context.moveTo(x, y);
        return;
      }

      context.lineTo(x, y);
    });
    context.closePath();
    context.fill();

    context.strokeStyle = 'rgba(181, 231, 188, 0.55)';
    context.lineWidth = 7;
    context.stroke();
  }

  private disposeMaterial(material: THREE.Material | THREE.Material[] | undefined): void {
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
      return;
    }

    material?.dispose();
  }
}
