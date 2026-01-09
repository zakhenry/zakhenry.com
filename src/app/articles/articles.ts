import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '', loadComponent: () => import("./article-index/article-index")
  },
  {
    path: 'observable-webworkers-with-angular-intro', loadComponent: () => import("./observable-webworkers/observable-webworkers"),
    title: 'Observable Web Workers with Angular - Introduction'
  },
];
