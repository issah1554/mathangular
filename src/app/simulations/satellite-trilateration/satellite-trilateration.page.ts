import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-satellite-trilateration-page',
  imports: [RouterLink],
  template: `
    <section class="mx-auto w-full max-w-6xl px-6 py-10 lg:px-8">
      <a class="text-sm font-semibold text-primary transition hover:text-primary-700" routerLink="/simulations">
        Back to simulations
      </a>

      <div class="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-primary">
            Geometry simulation
          </p>
          <h1 class="mt-3 text-3xl font-semibold leading-tight text-main-950 md:text-5xl">
            Satellite Trilateration
          </h1>
          <p class="mt-4 text-base leading-7 text-main-700 md:text-lg">
            Trilateration finds a receiver location by comparing its distance from multiple satellites.
            Each satellite narrows the possible position until the overlap identifies the receiver.
          </p>
        </div>

        <div class="rounded-lg border border-main-200 bg-main-0 p-5 shadow-sm">
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-md bg-primary-50 p-4">
              <p class="text-sm font-semibold text-primary-700">Satellite A</p>
              <p class="mt-2 text-2xl font-semibold text-main-950">5.8 km</p>
            </div>
            <div class="rounded-md bg-accent-50 p-4">
              <p class="text-sm font-semibold text-accent-700">Satellite B</p>
              <p class="mt-2 text-2xl font-semibold text-main-950">7.1 km</p>
            </div>
            <div class="rounded-md bg-warning-50 p-4">
              <p class="text-sm font-semibold text-warning-700">Satellite C</p>
              <p class="mt-2 text-2xl font-semibold text-main-950">4.4 km</p>
            </div>
          </div>

          <div class="mt-5 rounded-md border border-main-200 bg-main-50 p-5">
            <div class="relative mx-auto aspect-square max-w-md rounded-md border border-main-300 bg-main-0">
              <div class="absolute left-[12%] top-[18%] size-4 rounded-full bg-primary"></div>
              <div class="absolute right-[15%] top-[25%] size-4 rounded-full bg-accent-500"></div>
              <div class="absolute bottom-[16%] left-[32%] size-4 rounded-full bg-warning-500"></div>
              <div class="absolute left-[44%] top-[43%] size-6 rounded-full border-4 border-success-500 bg-main-0"></div>
              <div class="absolute left-[8%] top-[14%] size-44 rounded-full border border-primary-300"></div>
              <div class="absolute right-[8%] top-[12%] size-52 rounded-full border border-accent-300"></div>
              <div class="absolute bottom-[7%] left-[20%] size-48 rounded-full border border-warning-300"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 grid gap-4 md:grid-cols-3">
        <article class="rounded-lg border border-main-200 bg-main-0 p-5">
          <h2 class="text-lg font-semibold text-main-950">1. Measure distance</h2>
          <p class="mt-2 text-sm leading-6 text-main-700">
            Each satellite provides a distance from the receiver, shown as a circle in 2D.
          </p>
        </article>
        <article class="rounded-lg border border-main-200 bg-main-0 p-5">
          <h2 class="text-lg font-semibold text-main-950">2. Compare overlaps</h2>
          <p class="mt-2 text-sm leading-6 text-main-700">
            Intersections between circles reduce the possible receiver positions.
          </p>
        </article>
        <article class="rounded-lg border border-main-200 bg-main-0 p-5">
          <h2 class="text-lg font-semibold text-main-950">3. Locate receiver</h2>
          <p class="mt-2 text-sm leading-6 text-main-700">
            The shared intersection marks the estimated location.
          </p>
        </article>
      </div>
    </section>
  `,
})
export class SatelliteTrilaterationPage {}
