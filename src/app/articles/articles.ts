import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '', loadComponent: () => import("./article-index/article-index")
  },
  {
    path: 'observable-webworkers', loadComponent: () => import("./observable-webworkers/observable-webworkers")
  },
];
