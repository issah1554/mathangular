import { Routes } from '@angular/router';
import { HomePage } from './home.page';
import { SimulationsPage } from './simulations.page';
import { SatelliteTrilaterationPage } from './simulations/satellite-trilateration/satellite-trilateration.page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'simulations',
    component: SimulationsPage,
  },
  {
    path: 'simulations/satellite-trilateration',
    component: SatelliteTrilaterationPage,
  },
  {
    path: 'simulations/satelite-trilatelation',
    redirectTo: 'simulations/satellite-trilateration',
    pathMatch: 'full',
  },
];
