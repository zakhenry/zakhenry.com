import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';
import {routes} from '../articles';

@Component({
  imports: [
    RouterLink
  ],
  templateUrl: './article-index.html',
  styleUrl: './article-index.scss',
})
export default class ArticleIndex {
  routes = routes.filter(r => !!r.title)
}
