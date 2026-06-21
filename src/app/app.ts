import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('mathangular');
  protected readonly isFullscreenRoute = signal(false);

  constructor(router: Router) {
    this.isFullscreenRoute.set(router.url.startsWith('/simulations/satellite-trilateration'));

    router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.isFullscreenRoute.set(event.urlAfterRedirects.startsWith('/simulations/satellite-trilateration'));
      });
  }
}
