import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import("./home/home"),
    title: 'Hello',
  },
  {
    path: 'articles',
    loadChildren: () => import("./articles/articles").then(m => m.routes),
    title: 'Articles',
  },
  {
    path: 'resume',
    loadComponent: () => import("./resume/resume"),
    title: 'Resume',
  }
];
