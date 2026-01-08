import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import("./home/home"),
  },
  {
    path: 'articles',
    loadChildren: () => import("./articles/articles").then(m => m.routes),
  }
];
