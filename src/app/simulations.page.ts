import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type Simulation = {
  title: string;
  topic: string;
  description: string;
  level: string;
  status: string;
  route?: string;
};

@Component({
  selector: 'app-simulations-page',
  imports: [RouterLink],
  template: `
    <section class="mx-auto w-full max-w-6xl px-6 py-10 lg:px-8">
      <div class="max-w-3xl">
        <p class="text-sm font-semibold uppercase tracking-wide text-primary">
          Simulations
        </p>
      </div>

      <div class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        @for (simulation of simulations; track simulation.title) {
          <article class="flex min-h-64 flex-col rounded-lg border border-main-200 bg-main-0 p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3">
              <span class="rounded-md bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-700">
                {{ simulation.topic }}
              </span>
              <span class="rounded-md bg-main-100 px-2 py-1 text-xs font-semibold text-main-600">
                {{ simulation.level }}
              </span>
            </div>

            <h2 class="mt-5 text-xl font-semibold text-main-950">
              {{ simulation.title }}
            </h2>
            <p class="mt-3 flex-1 text-sm leading-6 text-main-700">
              {{ simulation.description }}
            </p>

            <div class="mt-5 flex items-center justify-between border-t border-main-200 pt-4">
              <span class="text-xs font-semibold uppercase tracking-wide text-success-700">
                {{ simulation.status }}
              </span>
              <a
                class="text-sm font-semibold text-primary transition hover:text-primary-700"
                [routerLink]="simulation.route ?? '/simulations'"
              >
                Open
              </a>
            </div>
          </article>
        }
      </div>
    </section>
  `,
})
export class SimulationsPage {
  protected readonly simulations: Simulation[] = [
    {
      title: 'Linear Equation Balance',
      topic: 'Algebra',
      description: 'Move terms across a balance model to see why each operation keeps both sides equal.',
      level: 'Beginner',
      status: 'Available',
    },
    {
      title: 'Graph Slope Explorer',
      topic: 'Coordinate Geometry',
      description: 'Adjust rise and run values and watch the line update as the slope changes.',
      level: 'Beginner',
      status: 'Available',
    },
    {
      title: 'Quadratic Curve Lab',
      topic: 'Functions',
      description: 'Change a, b, and c values to inspect vertex movement, roots, and graph direction.',
      level: 'Intermediate',
      status: 'Available',
    },
    {
      title: 'Fraction Visualizer',
      topic: 'Numbers',
      description: 'Compare fractions with area models, number lines, and equivalent fraction views.',
      level: 'Beginner',
      status: 'Available',
    },
    {
      title: 'Trigonometry Unit Circle',
      topic: 'Trigonometry',
      description: 'Rotate an angle around the unit circle and inspect sine, cosine, and tangent values.',
      level: 'Intermediate',
      status: 'Available',
    },
    {
      title: 'Probability Spinner',
      topic: 'Statistics',
      description: 'Run repeated trials and compare experimental probability against expected outcomes.',
      level: 'Beginner',
      status: 'Available',
    },
    {
      title: 'Satellite Trilateration',
      topic: 'Geometry',
      description: 'Use distances from multiple satellites to locate a receiver and see how GPS positioning works.',
      level: 'Intermediate',
      status: 'Available',
      route: '/simulations/satellite-trilateration',
    },
  ];
}
