import { Routes } from '@angular/router';
import { HomePage } from './home.page';
import { SimulationsPage } from './simulations.page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'simulations',
    component: SimulationsPage,
  },
];
