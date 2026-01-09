import { Component } from '@angular/core';
import {routes} from '../app.routes';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'zh-nav',
  imports: [
    RouterLink
  ],
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
})
export class Nav {
  routes = routes
}
